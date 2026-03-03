"use client"

import { useEffect, useState, useRef } from "react"

interface NowPlayingData {
  isPlaying: boolean
  title?: string
  artist?: string
  albumArt?: string
  songUrl?: string
  album?: string
  progressMs?: number
  durationMs?: number
}

// 12-bar animated waveform
function Waveform({ active }: { active: boolean }) {
  // Heights for 12 bars, staggered phases
  const phases = [0, 0.6, 1.1, 1.8, 2.4, 0.3, 1.5, 0.9, 2.1, 0.5, 1.7, 0.2]
  const speeds = [1.4, 1.1, 1.7, 1.3, 1.0, 1.6, 1.2, 1.5, 0.9, 1.3, 1.1, 1.4]
  const [tick, setTick] = useState(0)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number>(Date.now())

  useEffect(() => {
    if (!active) return
    const animate = () => {
      setTick(Date.now() - startRef.current)
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [active])

  const t = tick / 1000

  return (
    <div className="flex items-end gap-0.5" style={{ height: 36 }}>
      {phases.map((phase, i) => {
        const height = active
          ? 8 + Math.abs(Math.sin(t * speeds[i] * Math.PI + phase)) * 22
          : 4 + (i % 3) * 3
        return (
          <div
            key={i}
            style={{
              width: 3,
              height: Math.round(height),
              background: "var(--accent)",
              opacity: active ? 0.85 + Math.sin(t * speeds[i] + phase) * 0.15 : 0.3,
              borderRadius: 1,
              transition: active ? "none" : "height 600ms ease, opacity 600ms ease",
            }}
          />
        )
      })}
    </div>
  )
}

// Progress bar that ticks forward locally between API polls
function ProgressBar({ progressMs, durationMs }: { progressMs: number; durationMs: number }) {
  const [elapsed, setElapsed] = useState(progressMs)
  const startRef = useRef(Date.now())
  const baseRef = useRef(progressMs)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    baseRef.current = progressMs
    startRef.current = Date.now()
    setElapsed(progressMs)
  }, [progressMs])

  useEffect(() => {
    if (!durationMs) return
    const tick = () => {
      const now = Date.now()
      const delta = now - startRef.current
      setElapsed(Math.min(baseRef.current + delta, durationMs))
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [durationMs])

  const pct = durationMs ? Math.min((elapsed / durationMs) * 100, 100) : 0
  const fmt = (ms: number) => {
    const s = Math.floor(ms / 1000)
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      {/* Bar track */}
      <div
        className="w-full h-1 relative overflow-hidden"
        style={{ background: "var(--muted)", opacity: 0.3 }}
      >
        <div
          className="absolute inset-y-0 left-0"
          style={{
            width: `${pct}%`,
            background: "var(--accent)",
            transition: "none",
          }}
        />
      </div>
      {/* Timestamps */}
      <div className="flex justify-between">
        <span
          className="text-[7px]"
          style={{ fontFamily: "var(--font-jetbrains)", color: "var(--muted)" }}
        >
          {fmt(elapsed)}
        </span>
        <span
          className="text-[7px]"
          style={{ fontFamily: "var(--font-jetbrains)", color: "var(--muted)" }}
        >
          {fmt(durationMs)}
        </span>
      </div>
    </div>
  )
}

// Pulsing "NOW PLAYING" badge
function NowPlayingBadge() {
  return (
    <div className="flex items-center gap-1.5">
      {/* Pulsing dot */}
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{
          background: "var(--accent)",
          boxShadow: "0 0 6px var(--accent)",
          animation: "nowPlayingPulse 1.2s ease-in-out infinite",
        }}
      />
      <span
        className="text-[7px] tracking-widest"
        style={{ fontFamily: "var(--font-press-start)", color: "var(--accent)" }}
      >
        NOW PLAYING
      </span>
      <style>{`
        @keyframes nowPlayingPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.75); }
        }
      `}</style>
    </div>
  )
}

export default function SpotifyNowPlaying() {
  const [data, setData] = useState<NowPlayingData | null>(null)
  const [hasCredentials, setHasCredentials] = useState(true)

  useEffect(() => {
    const fetchNowPlaying = async () => {
      try {
        const res = await fetch("/api/now-playing")
        if (!res.ok) {
          setHasCredentials(false)
          return
        }
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

  if (!hasCredentials || !data) {
    return <FallbackContent />
  }

  if (!data.isPlaying) {
    return (
      <div className="flex flex-col gap-3">
        <Waveform active={false} />
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

  return (
    <div className="flex flex-col gap-3">
      <NowPlayingBadge />

      <div className="flex items-center gap-3">
        {/* Album art with pixel border */}
        {data.albumArt && (
          <a
            href={data.songUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.albumArt}
              alt={`Album art for ${data.album || data.title}`}
              width={60}
              height={60}
              className="block transition-transform duration-200 group-hover:scale-105"
              style={{
                border: "3px solid var(--text)",
                boxShadow: "3px 3px 0 var(--accent)",
                imageRendering: "auto",
              }}
            />
          </a>
        )}

        {/* Track info */}
        <div className="flex flex-col gap-1 overflow-hidden min-w-0">
          <a
            href={data.songUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-xs font-bold hover:underline"
            style={{ fontFamily: "var(--font-jetbrains)", color: "var(--text)" }}
          >
            {data.title}
          </a>
          <p
            className="truncate text-[10px]"
            style={{ fontFamily: "var(--font-jetbrains)", color: "var(--muted)" }}
          >
            {data.artist}
          </p>
          {data.album && (
            <p
              className="truncate text-[9px] italic"
              style={{ fontFamily: "var(--font-playfair)", color: "var(--muted)" }}
            >
              {data.album}
            </p>
          )}
        </div>
      </div>

      {/* Animated 12-bar waveform */}
      <Waveform active={true} />

      {/* Progress bar */}
      {data.durationMs ? (
        <ProgressBar
          progressMs={data.progressMs ?? 0}
          durationMs={data.durationMs}
        />
      ) : null}

      {/* Spotify label */}
      <div className="flex items-center gap-2">
        <SpotifyIcon />
        <span
          className="text-[7px] tracking-widest"
          style={{ fontFamily: "var(--font-press-start)", color: "var(--muted)" }}
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
      <Waveform active={true} />
      <p
        className="italic"
        style={{ fontFamily: "var(--font-playfair)", color: "var(--muted)" }}
      >
        {"\"Lo-fi, OSTs, and anything with a good beat.\""}
      </p>
      <p
        className="text-[7px] tracking-wider"
        style={{ fontFamily: "var(--font-press-start)", color: "var(--muted)" }}
      >
        ADD SPOTIFY CREDENTIALS TO ENABLE LIVE DATA
      </p>
    </div>
  )
}

function SpotifyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-label="Spotify">
      <circle cx="6" cy="6" r="6" fill="var(--accent)" />
      <path
        d="M8.5 5.2c-1.5-.9-3.9-1-4.8-.5-.1.1-.2 0-.3-.1-.1-.1 0-.2.1-.3 1-.5 3.5-.4 5 .5.1.1.1.2.1.3-.1.1-.2.1-.1.1zM8.1 6.4c-1.3-.8-3.3-.9-4.2-.5-.1 0-.2 0-.2-.1-.1-.1 0-.2.1-.3.9-.4 3.1-.3 4.5.6.1.1.1.2.1.3-.1 0-.2.1-.3 0zM7.7 7.5c-1.1-.7-2.8-.7-3.6-.4-.1 0-.2 0-.2-.1s0-.2.1-.2c.9-.4 2.7-.3 3.9.4.1.1.1.2 0 .3h-.2z"
        fill="var(--bg)"
      />
    </svg>
  )
}
