"use client"
import { useEffect, useState } from "react"
import BrutalistCard from "../shared/BrutalistCard"

interface NowPlayingData {
  isPlaying: boolean
  title?: string
  artist?: string
  albumArt?: string
  songUrl?: string
  album?: string
}

export default function SpotifyNowPlaying() {
  const [data, setData] = useState<NowPlayingData | null>(null)
  const [hasCredentials, setHasCredentials] = useState(true)

  useEffect(() => {
    const fetchNowPlaying = async () => {
      try {
        const res = await fetch("/api/now-playing")
        const json: NowPlayingData = await res.json()
        setData(json)
      } catch {
        setHasCredentials(false)
      }
    }

    fetchNowPlaying()
    const interval = setInterval(fetchNowPlaying, 30000)
    return () => clearInterval(interval)
  }, [])

  if (!hasCredentials || !data) return <FallbackContent />
  if (!data.isPlaying && !data.title) return <NotPlayingContent />

  // Either currently playing or has recently-played track data
  const statusLabel = data.isPlaying ? "LISTENING ON SPOTIFY" : "LAST PLAYED"

  return (
    <BrutalistCard className="relative h-full overflow-hidden flex flex-col justify-between" style={{ padding: 0 }} hoverable={false}>
      {/* Huge background album art with dark overlay */}
      {data.albumArt && (
        <div
          className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-[30s] ease-linear hover:scale-125"
          style={{ backgroundImage: `url(${data.albumArt})`, opacity: 0.3 }}
        />
      )}

      {/* Gradient overlay to ensure text is always readable */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black/80 to-transparent" />

      {/* Content wrapper */}
      <div className="relative z-10 p-6 flex flex-col h-full justify-between">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <PixelNoteIcon color="#00ff9d" />
          <div className="bg-[#00ff9d] px-2 py-1">
            <span className="font-pixel text-[10px] text-black font-black tracking-widest block transform translate-y-[1px]">MUSIC</span>
          </div>
        </div>

        {/* Info Area */}
        <div className="flex flex-col gap-2 mt-auto mb-6 max-w-[85%]">
          <div className="bg-[#00ff9d] self-start px-2 py-1">
            <h4
              className="font-pixel text-xs text-black font-bold uppercase truncate max-w-full"
              title={data.title}
            >
              {data.title}
            </h4>
          </div>
          <div className="bg-[#00ff9d] self-start px-2 py-1">
            <p
              className="font-pixel text-[8px] text-black font-bold uppercase truncate max-w-full"
              title={data.artist}
            >
              {data.artist}
            </p>
          </div>
        </div>

        {/* Visualizer & Footer combined */}
        <div className="flex flex-col gap-3">
          <div className="flex items-end gap-1.5 h-8">
            {[4, 8, 3, 6, 2, 7, 5].map((n, i) => (
              <div
                key={i}
                className={`w-3 eq-bar-${n}`}
                style={{ background: "#00ff9d" }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <SpotifyIcon color="#00ff9d" />
            <div className="bg-[#00ff9d] px-2 py-[2px]">
              <span className="font-pixel text-[7px] tracking-widest text-black font-black block transform translate-y-[1px]">
                {statusLabel}
              </span>
            </div>
          </div>
        </div>
      </div>
    </BrutalistCard>
  )
}

function FallbackContent() {
  return (
    <BrutalistCard className="h-full flex flex-col justify-between">
      <div className="flex items-center gap-3 mb-4">
        <PixelNoteIcon color="var(--accent)" />
        <h3 className="font-sans text-lg font-bold" style={{ color: "var(--text)" }}>
          MUSIC
        </h3>
      </div>
      <div className="flex flex-col gap-3 mt-auto">
        <div className="flex items-end gap-2 h-12">
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className={`w-3 eq-bar-${n}`}
              style={{ background: "var(--accent)" }}
            />
          ))}
        </div>
        <p className="italic text-sm" style={{ fontFamily: "var(--font-playfair)", color: "var(--muted)" }}>
          {"\"Lo-fi, OSTs, and anything with a good beat.\""}
        </p>
      </div>
    </BrutalistCard>
  )
}

function NotPlayingContent() {
  return (
    <BrutalistCard className="h-full flex flex-col justify-between">
      <div className="flex items-center gap-3 mb-4">
        <PixelNoteIcon color="var(--muted)" />
        <h3 className="font-sans text-lg font-bold" style={{ color: "var(--muted)" }}>
          MUSIC
        </h3>
      </div>
      <div className="flex flex-col gap-3 mt-auto">
        <div className="flex items-end gap-1.5 h-8">
          {[6, 10, 4, 8, 5].map((h, i) => (
            <div
              key={i}
              className="w-2"
              style={{ height: h, background: "var(--muted)", opacity: 0.4 }}
            />
          ))}
        </div>
        <p className="text-[8px] tracking-wider" style={{ fontFamily: "var(--font-press-start)", color: "var(--muted)" }}>
          NOT PLAYING
        </p>
        <p className="italic text-sm" style={{ fontFamily: "var(--font-playfair)", color: "var(--muted)" }}>
          {"\"Lo-fi, OSTs, and anything with a good beat.\""}
        </p>
      </div>
    </BrutalistCard>
  )
}

function PixelNoteIcon({ color = "var(--text)" }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ imageRendering: "pixelated" }}>
      <path
        d="M10 4V20M10 4H20V8H14V20M10 20H6V16H10V20ZM14 20H18V16H14V20Z"
        fill={color}
      />
    </svg>
  )
}

function SpotifyIcon({ color = "var(--bg)" }: { color?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="6" r="6" fill={color} />
      <path
        d="M8.5 5.2c-1.5-.9-3.9-1-4.8-.5-.1.1-.2 0-.3-.1-.1-.1 0-.2.1-.3 1-.5 3.5-.4 5 .5.1.1.1.2.1.3-.1.1-.2.1-.1.1zM8.1 6.4c-1.3-.8-3.3-.9-4.2-.5-.1 0-.2 0-.2-.1-.1-.1 0-.2.1-.3.9-.4 3.1-.3 4.5.6.1.1.1.2.1.3-.1 0-.2.1-.3 0zM7.7 7.5c-1.1-.7-2.8-.7-3.6-.4-.1 0-.2 0-.2-.1s0-.2.1-.2c.9-.4 2.7-.3 3.9.4.1.1.1.2 0 .3h-.2z"
        fill="black"
      />
    </svg>
  )
}
