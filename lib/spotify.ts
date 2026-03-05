// Spotify Web API integration
// Docs: https://developer.spotify.com/documentation/web-api

import { readFileSync } from "fs"
import { resolve } from "path"

const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token"

// GET /v1/me/player/currently-playing — scope: user-read-currently-playing
// Returns 200 with track data, 204 when nothing is in the player
const CURRENTLY_PLAYING_ENDPOINT =
  "https://api.spotify.com/v1/me/player/currently-playing"

// GET /v1/me/player — scope: user-read-playback-state
// Returns full playback state including device info; more reliable fallback
const PLAYER_STATE_ENDPOINT = "https://api.spotify.com/v1/me/player"

// GET /v1/me/player/recently-played — scope: user-read-recently-played
const RECENTLY_PLAYED_ENDPOINT =
  "https://api.spotify.com/v1/me/player/recently-played?limit=1"

// ── Token management ──
// Cache the access token in memory (valid for ~1 hour per Spotify docs)
let cachedAccessToken: string | null = null
let tokenExpiresAt = 0
// Spotify may rotate refresh tokens — store the latest one in memory
let rotatedRefreshToken: string | undefined

/**
 * Read credentials directly from the .env file on disk, bypassing process.env.
 * This prevents stale env vars set in the shell from overriding .env values.
 */
function readEnvFile(): Record<string, string> {
  try {
    const envPath = resolve(process.cwd(), ".env")
    const content = readFileSync(envPath, "utf-8")
    return Object.fromEntries(
      content
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith("#") && l.includes("="))
        .map((l) => {
          const i = l.indexOf("=")
          return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
        })
    )
  } catch {
    return {}
  }
}

async function getAccessToken(): Promise<string | null> {
  // Return cached token if still valid (with 2-min safety buffer)
  if (cachedAccessToken && Date.now() < tokenExpiresAt - 120_000) {
    return cachedAccessToken
  }

  // Read directly from .env file — process.env may contain stale/wrong values
  // if the user has SPOTIFY_* vars set in their shell environment
  const envFile = readEnvFile()
  const clientId = envFile.SPOTIFY_CLIENT_ID
  const clientSecret = envFile.SPOTIFY_CLIENT_SECRET
  const envRefreshToken = envFile.SPOTIFY_REFRESH_TOKEN

  const refreshToken = rotatedRefreshToken ?? envRefreshToken

  if (!clientId || !clientSecret || !refreshToken) {
    console.error(
      "[Spotify] Missing credentials — set SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN"
    )
    return null
  }

  // Authorization Code flow token refresh
  // Docs: https://developer.spotify.com/documentation/web-api/tutorials/refreshing-tokens
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    cache: "no-store",
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    console.error(`[Spotify] Token refresh failed (${res.status}): ${body}`)

    // If rotated token failed, retry once with the original env token
    if (rotatedRefreshToken) {
      console.warn("[Spotify] Rotated token failed — retrying with env token")
      rotatedRefreshToken = undefined
      cachedAccessToken = null
      tokenExpiresAt = 0
      return getAccessToken()
    }
    return null
  }

  const data = await res.json()

  // Handle refresh token rotation per Spotify docs:
  // "When a refresh token is not returned, continue using the existing token"
  if (data.refresh_token) {
    rotatedRefreshToken = data.refresh_token
  }

  cachedAccessToken = data.access_token ?? null
  tokenExpiresAt = Date.now() + (data.expires_in ?? 3600) * 1000

  return cachedAccessToken
}

export interface NowPlayingData {
  isPlaying: boolean
  title?: string
  artist?: string
  albumArt?: string
  songUrl?: string
  album?: string
}

// Extract track fields from a Spotify player response object
function extractTrack(data: Record<string, unknown>): NowPlayingData | null {
  const item = data.item as Record<string, unknown> | undefined
  if (!item) return null

  // currently_playing_type can be "track", "episode", or "ad"
  // We only render tracks — skip episodes/ads
  const type = data.currently_playing_type as string | undefined
  if (type && type !== "track") return null

  const artists = item.artists as Array<{ name: string }> | undefined
  const album = item.album as Record<string, unknown> | undefined
  const images = album?.images as Array<{ url: string }> | undefined
  const externalUrls = item.external_urls as Record<string, string> | undefined

  return {
    isPlaying: data.is_playing === true,
    title: item.name as string,
    artist: artists?.map((a) => a.name).join(", "),
    albumArt: images?.[0]?.url,
    songUrl: externalUrls?.spotify,
    album: album?.name as string,
  }
}

export async function getNowPlaying(): Promise<NowPlayingData> {
  const accessToken = await getAccessToken()
  if (!accessToken) return { isPlaying: false }

  // ── 1. GET /v1/me/player/currently-playing ──
  // Primary endpoint — lightweight, returns current track
  // Scope: user-read-currently-playing
  // 200 = data available (playing or paused), 204 = nothing in player
  const cpRes = await fetch(CURRENTLY_PLAYING_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  })

  if (cpRes.status === 200) {
    const cpData = await cpRes.json()
    const track = extractTrack(cpData)
    if (track) return track
  } else if (cpRes.status === 401) {
    console.error("[Spotify] 401 Unauthorized — access token expired or invalid")
    cachedAccessToken = null
    tokenExpiresAt = 0
    return { isPlaying: false }
  } else if (cpRes.status === 403) {
    console.error(
      "[Spotify] 403 Forbidden on /currently-playing — your refresh token is missing the " +
        "user-read-currently-playing scope. Re-authorize at: " +
        "https://accounts.spotify.com/authorize?response_type=code&scope=user-read-currently-playing+user-read-playback-state+user-read-recently-played"
    )
  } else if (cpRes.status === 429) {
    console.warn("[Spotify] 429 Rate Limited — try again later")
    return { isPlaying: false }
  }
  // 204 = nothing in player, fall through to next step

  // ── 2. GET /v1/me/player (playback state) ──
  // Broader endpoint — includes device info, may return data when currently-playing gives 204
  // Scope: user-read-playback-state
  const psRes = await fetch(PLAYER_STATE_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  })

  if (psRes.status === 200) {
    const psData = await psRes.json()
    const track = extractTrack(psData)
    if (track) return track
  }
  // 204 or 403 (missing scope) — fall through

  // ── 3. GET /v1/me/player/recently-played (fallback) ──
  // Scope: user-read-recently-played
  const rpRes = await fetch(RECENTLY_PLAYED_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  })

  if (rpRes.ok) {
    const rpData = await rpRes.json()
    const item = rpData.items?.[0]?.track
    if (item) {
      return {
        isPlaying: false,
        title: item.name,
        artist: item.artists
          ?.map((a: { name: string }) => a.name)
          .join(", "),
        albumArt: item.album?.images?.[0]?.url,
        songUrl: item.external_urls?.spotify,
        album: item.album?.name,
      }
    }
  }

  return { isPlaying: false }
}
