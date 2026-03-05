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

  return <NowPlayingCard data={data} />
}

function NowPlayingCard({ data }: { data: NowPlayingData }) {
  const isPlaying = data.isPlaying

  return (
    <BrutalistCard
      className="relative h-full overflow-hidden flex flex-col"
      style={{ padding: 0, minHeight: "280px" }}
      hoverable={false}
    >
      {/* ── Main area: album art (left) + info column (right) ── */}
      <div className="flex flex-1 min-h-0" style={{ borderBottom: "3px solid var(--border)" }}>

        {/* Left: Album art */}
        <div
          className="flex-1 p-3 flex items-center justify-center"
          style={{ borderRight: "3px solid var(--border)" }}
        >
          {data.albumArt ? (
            <img
              src={data.albumArt}
              alt={data.album ?? "Album Art"}
              className="w-full h-full object-cover"
              style={{ border: "3px solid var(--border)", borderRadius: "6px" }}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ border: "3px solid var(--border)", borderRadius: "6px", background: "var(--bg)" }}
            >
              <PixelNoteIcon color="var(--muted)" />
            </div>
          )}
        </div>

        {/* Right column: visualization + song info */}
        <div className="flex flex-col" style={{ width: "120px", minWidth: "120px" }}>

          {/* Top: Equalizer visualization */}
          <div
            className="flex items-end gap-[3px] px-3 pb-2 pt-3"
            style={{ borderBottom: "3px solid var(--border)", height: "70px" }}
          >
            {[4, 8, 3, 6, 2, 7, 5].map((n, i) => (
              <div
                key={i}
                className={`w-[6px] ${isPlaying ? `eq-bar-${n}` : ""}`}
                style={{
                  background: "var(--accent)",
                  height: isPlaying ? undefined : `${n * 3}px`,
                  opacity: isPlaying ? 1 : 0.35,
                }}
              />
            ))}
          </div>

          {/* Bottom: Song name (vertical) + album + artist */}
          <div className="flex-1 flex flex-col overflow-hidden p-3 gap-2">
            {/* Song name — rotated so it reads bottom-to-top */}
            <div className="flex-1 overflow-hidden flex items-end">
              <span
                className="font-pixel text-[10px] font-black uppercase leading-none"
                style={{
                  color: "var(--accent)",
                  writingMode: "vertical-rl",
                  transform: "rotate(180deg)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxHeight: "100%",
                  display: "block",
                }}
                title={data.title}
              >
                {data.title}
              </span>
            </div>

            {/* Album */}
            <p
              className="font-pixel text-[7px] font-bold uppercase"
              style={{ color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              title={data.album}
            >
              {data.album}
            </p>

            {/* Artist */}
            <p
              className="font-pixel text-[7px] uppercase"
              style={{ color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              title={data.artist}
            >
              {data.artist}
            </p>
          </div>
        </div>
      </div>

      {/* ── Bottom strip: status + track summary ── */}
      <div
        className="flex items-center justify-between px-4 shrink-0"
        style={{ height: "44px" }}
      >
        <div className="flex items-center gap-2">
          <SpotifyIcon color="var(--accent)" />
          <span
            className="font-pixel text-[7px] tracking-widest"
            style={{ color: isPlaying ? "var(--accent)" : "var(--muted)" }}
          >
            {isPlaying ? "NOW PLAYING" : "LAST PLAYED"}
          </span>
        </div>
        {data.title && (
          <span
            className="font-pixel text-[7px] truncate max-w-[52%]"
            style={{ color: "var(--muted)" }}
          >
            {data.title}
            {data.artist ? ` — ${data.artist}` : ""}
          </span>
        )}
      </div>
    </BrutalistCard>
  )
}

function FallbackContent() {
  return (
    <BrutalistCard className="h-full flex flex-col justify-between" style={{ minHeight: "280px" }}>
      <div className="flex items-center gap-3 mb-4">
        <PixelNoteIcon color="var(--accent)" />
        <h3 className="font-sans text-lg font-bold" style={{ color: "var(--text)" }}>
          MUSIC
        </h3>
      </div>
      <div className="flex flex-col gap-3 mt-auto">
        <div className="flex items-end gap-[3px] h-10">
          {[4, 8, 3, 6, 2, 7, 5].map((n, i) => (
            <div
              key={i}
              className={`w-[6px] eq-bar-${n}`}
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
    <BrutalistCard className="h-full flex flex-col justify-between" style={{ minHeight: "280px" }}>
      <div className="flex items-center gap-3 mb-4">
        <PixelNoteIcon color="var(--muted)" />
        <h3 className="font-sans text-lg font-bold" style={{ color: "var(--muted)" }}>
          MUSIC
        </h3>
      </div>
      <div className="flex flex-col gap-3 mt-auto">
        <div className="flex items-end gap-[3px] h-8">
          {[4, 8, 3, 6, 2, 7, 5].map((n, i) => (
            <div
              key={i}
              className="w-[6px]"
              style={{ height: `${n * 3}px`, background: "var(--muted)", opacity: 0.35 }}
            />
          ))}
        </div>
        <p className="font-pixel text-[8px] tracking-wider" style={{ color: "var(--muted)" }}>
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

function SpotifyIcon({ color = "var(--accent)" }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill={color} />
      <path
        d="M17 10.4c-3-.9-7.9-1-9.6-.5-.2.1-.4 0-.5-.2-.1-.2 0-.4.2-.5 2-.6 7-.5 10 .5.2.1.3.3.2.5s-.2.3-.3.2zM16.3 12.8c-2.6-1.6-6.5-1.8-8.4-1-.2.1-.4 0-.5-.2-.1-.2 0-.4.2-.5 1.9-.8 6.2-.6 9 1.1.2.1.3.3.2.5-.1.2-.3.2-.5.1zM15.6 15.1c-2.1-1.3-5.5-1.4-7.2-.8-.2.1-.3 0-.4-.2s0-.3.2-.4c1.8-.7 5.4-.6 7.7.9.2.1.2.3.1.4-.1.2-.3.2-.4.1z"
        fill="var(--bg)"
      />
    </svg>
  )
}
