const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET
const REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN

const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token"
const NOW_PLAYING_ENDPOINT =
  "https://api.spotify.com/v1/me/player/currently-playing"

async function getAccessToken(): Promise<string | null> {
  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) return null

  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: REFRESH_TOKEN,
    }),
  })

  if (!response.ok) return null

  const data = await response.json()
  return data.access_token ?? null
}

export interface NowPlayingData {
  isPlaying: boolean
  title?: string
  artist?: string
  albumArt?: string
  songUrl?: string
  album?: string
}

export async function getNowPlaying(): Promise<NowPlayingData> {
  const accessToken = await getAccessToken()
  if (!accessToken) return { isPlaying: false }

  const response = await fetch(NOW_PLAYING_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  })

  if (response.status === 204 || response.status > 400) {
    return { isPlaying: false }
  }

  const data = await response.json()

  if (!data.item || !data.is_playing) {
    return { isPlaying: false }
  }

  return {
    isPlaying: true,
    title: data.item.name,
    artist: data.item.artists?.map((a: { name: string }) => a.name).join(", "),
    albumArt: data.item.album?.images?.[0]?.url,
    songUrl: data.item.external_urls?.spotify,
    album: data.item.album?.name,
  }
}
