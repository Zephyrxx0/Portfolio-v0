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
// limit=5: gives enough history to find a track different from the current one
const RECENTLY_PLAYED_ENDPOINT =
  "https://api.spotify.com/v1/me/player/recently-played?limit=5"

// ── Token management ──
// Cache the access token in memory (valid for ~1 hour per Spotify docs)
let cachedAccessToken: string | null = null
let tokenExpiresAt = 0
// Spotify may rotate refresh tokens — store the latest one in memory
let rotatedRefreshToken: string | undefined

/**
 * Read credentials from .env file first, falling back to process.env.
 * The .env file takes priority locally to prevent stale shell env vars
 * from overriding .env values. On Vercel, no .env file exists so
 * process.env (populated from the Vercel dashboard) is used instead.
 */
function getCredentials(key: string): string | undefined {
  try {
    const envPath = resolve(process.cwd(), ".env")
    const content = readFileSync(envPath, "utf-8")
    for (const line of content.split("\n")) {
      const trimmed = line.trim()
      if (trimmed.startsWith("#") || !trimmed.startsWith(key + "=")) continue
      return trimmed.slice(key.length + 1).trim()
    }
  } catch {
    // .env not found (e.g. Vercel) — fall through to process.env
  }
  return process.env[key]
}

async function getAccessToken(): Promise<string | null> {
  // Return cached token if still valid (with 2-min safety buffer)
  if (cachedAccessToken && Date.now() < tokenExpiresAt - 120_000) {
    return cachedAccessToken
  }

  const clientId = getCredentials("SPOTIFY_CLIENT_ID")
  const clientSecret = getCredentials("SPOTIFY_CLIENT_SECRET")
  const envRefreshToken = getCredentials("SPOTIFY_REFRESH_TOKEN")

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
  // prev = the track played just before the current one (shown in the bottom bar)
  prev?: {
    title?: string
    album?: string
    albumArt?: string
  }
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

// Helper to shape a recently-played track item into our prev format
function extractPrevTrack(item: Record<string, unknown> | undefined) {
  if (!item) return undefined
  const album = item.album as Record<string, unknown> | undefined
  const images = album?.images as Array<{ url: string }> | undefined
  return {
    title: item.name as string | undefined,
    album: album?.name as string | undefined,
    albumArt: images?.[0]?.url,
  }
}

// Find the first recently-played track that is different from the current song
function findPrevTrack(
  rpData: Record<string, unknown> | null,
  currentTitle: string | undefined
) {
  const items = rpData?.items as Array<{ track: Record<string, unknown> }> | undefined
  if (!items) return undefined
  const other = items.find((i) => i.track?.name !== currentTitle)
  return extractPrevTrack(other?.track)
}

// Cache recently-played for 5 minutes to avoid rate limits.
// On failure (429 etc.), back off for 60 seconds before retrying.
let cachedRecentlyPlayed: Record<string, unknown> | null = null
let rpCacheExpiresAt = 0

async function getRecentlyPlayed(accessToken: string) {
  if (Date.now() < rpCacheExpiresAt) {
    return cachedRecentlyPlayed
  }
  const r = await fetch(RECENTLY_PLAYED_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  })
  if (!r.ok) {
    // Back off: don't retry for 60s on error, 5 min on success
    rpCacheExpiresAt = Date.now() + 60_000
    cachedRecentlyPlayed = null
    console.error(`[Spotify] recently-played ${r.status} — backing off 60s`)
    return null
  }
  const data = await r.json()
  cachedRecentlyPlayed = data
  rpCacheExpiresAt = Date.now() + 5 * 60 * 1000
  return data
}

export async function getNowPlaying(): Promise<NowPlayingData> {
  const accessToken = await getAccessToken()
  if (!accessToken) return { isPlaying: false }

  // Fetch recently-played in parallel with the current-playing check.
  // We always want this so we can populate the "prev" field in the bottom bar.
  // Cached for 5 min to avoid Spotify rate limits.
  const rpPromise = getRecentlyPlayed(accessToken)

  // ── 1. GET /v1/me/player/currently-playing ──
  // Primary endpoint — lightweight, returns current track
  // 200 = data available (playing or paused), 204 = nothing in player
  const cpRes = await fetch(CURRENTLY_PLAYING_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  })

  if (cpRes.status === 200) {
    const cpData = await cpRes.json()
    const track = extractTrack(cpData)
    if (track) {
      // Currently playing: prev = first recently-played track different from current
      const rpData = await rpPromise
      track.prev = findPrevTrack(rpData, track.title)
      return track
    }
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
  // Broader endpoint — may return data when currently-playing gives 204
  const psRes = await fetch(PLAYER_STATE_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  })

  if (psRes.status === 200) {
    const psData = await psRes.json()
    const track = extractTrack(psData)
    if (track) {
      const rpData = await rpPromise
      track.prev = findPrevTrack(rpData, track.title)
      return track
    }
  }

  // ── 3. GET /v1/me/player/recently-played (fallback) ──
  // Nothing playing at all — show items[0] as current, items[1] as prev
  const rpData = await rpPromise
  const item = rpData?.items?.[0]?.track
  if (item) {
    return {
      isPlaying: false,
      title: item.name,
      artist: item.artists?.map((a: { name: string }) => a.name).join(", "),
      albumArt: item.album?.images?.[0]?.url,
      songUrl: item.external_urls?.spotify,
      album: item.album?.name,
      // prev = the track before items[0]
      prev: extractPrevTrack(rpData?.items?.[1]?.track),
    }
  }

  return { isPlaying: false }
}
