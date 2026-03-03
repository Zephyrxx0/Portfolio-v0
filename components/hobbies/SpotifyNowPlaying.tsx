"use client"

import { useEffect, useState } from "react"

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

  // No credentials or no data yet — show fallback
  if (!hasCredentials || !data) {
    return <FallbackContent />
  }

  // Not currently playing
  if (!data.isPlaying) {
    return (
      <div className="flex flex-col gap-3">
        {/* Static equalizer */}
        <div className="flex items-end gap-1.5 h-8">
          {[6, 10, 4, 8, 5].map((h, i) => (
            <div
              key={i}
              className="w-2"
              style={{
                height: h,
                background: "var(--muted)",
                opacity: 0.4,
              }}
            />
          ))}
        </div>
        <p
          className="text-[8px] tracking-wider"
          style={{ fontFamily: "var(--font-press-start)", color: "var(--muted)" }}
        >
          NOT PLAYING
        </p>
        <p
          className="italic text-sm"
          style={{ fontFamily: "var(--font-playfair)", color: "var(--muted)" }}
        >
          {"\"Lo-fi, OSTs, and anything with a good beat.\""}
        </p>
      </div>
    )
  }

  // Currently playing
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {/* Album art */}
        {data.albumArt && (
          <a
            href={data.songUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.albumArt}
              alt={`Album art for ${data.album || data.title}`}
              width={56}
              height={56}
              className="block"
              style={{
                border: "2px solid var(--text)",
                imageRendering: "auto",
              }}
            />
          </a>
        )}

        {/* Track info */}
        <div className="flex flex-col gap-1 overflow-hidden">
          <p
            className="truncate text-xs font-bold"
            style={{
              fontFamily: "var(--font-jetbrains)",
              color: "var(--text)",
            }}
          >
            {data.title}
          </p>
          <p
            className="truncate text-[10px]"
            style={{
              fontFamily: "var(--font-jetbrains)",
              color: "var(--muted)",
            }}
          >
            {data.artist}
          </p>
        </div>
      </div>

      {/* Animated equalizer */}
      <div className="flex items-end gap-1.5 h-8">
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            className={`w-2 eq-bar-${n}`}
            style={{ background: "var(--accent)" }}
          />
        ))}
      </div>

      {/* Spotify label */}
      <div className="flex items-center gap-2">
        <SpotifyIcon />
        <span
          className="text-[7px] tracking-widest"
          style={{ fontFamily: "var(--font-press-start)", color: "var(--accent)" }}
        >
          LISTENING ON SPOTIFY
        </span>
      </div>
    </div>
  )
}

function FallbackContent() {
  return (
    <div className="flex flex-col gap-3">
      {/* Equalizer bars */}
      <div className="flex items-end gap-2 h-12">
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            className={`w-3 eq-bar-${n}`}
            style={{ background: "var(--accent)" }}
          />
        ))}
      </div>
      <p
        className="italic"
        style={{ fontFamily: "var(--font-playfair)", color: "var(--muted)" }}
      >
        {"\"Lo-fi, OSTs, and anything with a good beat.\""}
      </p>
    </div>
  )
}

function SpotifyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="6" r="6" fill="var(--accent)" />
      <path
        d="M8.5 5.2c-1.5-.9-3.9-1-4.8-.5-.1.1-.2 0-.3-.1-.1-.1 0-.2.1-.3 1-.5 3.5-.4 5 .5.1.1.1.2.1.3-.1.1-.2.1-.1.1zM8.1 6.4c-1.3-.8-3.3-.9-4.2-.5-.1 0-.2 0-.2-.1-.1-.1 0-.2.1-.3.9-.4 3.1-.3 4.5.6.1.1.1.2.1.3-.1 0-.2.1-.3 0zM7.7 7.5c-1.1-.7-2.8-.7-3.6-.4-.1 0-.2 0-.2-.1s0-.2.1-.2c.9-.4 2.7-.3 3.9.4.1.1.1.2 0 .3h-.2z"
        fill="var(--bg)"
      />
    </svg>
  )
}
