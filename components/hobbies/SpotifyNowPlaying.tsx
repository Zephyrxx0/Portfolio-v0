"use client"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import BrutalistCard from "../shared/BrutalistCard"

// ── Types ──────────────────────────────────────────────────────────────
// Shape of the data we get back from the /api/now-playing endpoint
interface NowPlayingData {
  isPlaying: boolean
  title?: string
  artist?: string
  albumArt?: string
  songUrl?: string
  album?: string
  // prev = the track played just before this one (populated by the API)
  prev?: {
    title?: string
    album?: string
    albumArt?: string
  }
}

// The three visualization styles the user can cycle through by clicking
type VizMode = "bars" | "waveform" | "sphere"

// ── Root component ─────────────────────────────────────────────────────
// Fetches Spotify data every 30 seconds and picks which view to show
export default function SpotifyNowPlaying() {
  const [data, setData] = useState<NowPlayingData | null>(null)
  const [hasCredentials, setHasCredentials] = useState(true)

  useEffect(() => {
    const fetchNowPlaying = async () => {
      try {
        const res = await fetch("/api/now-playing", { cache: "no-store" })
        const json: NowPlayingData = await res.json()
        setData(json)
      } catch {
        // If the API call fails entirely, hide the card
        setHasCredentials(false)
      }
    }

    fetchNowPlaying()
    const interval = setInterval(fetchNowPlaying, 30000) // refresh every 30s
    return () => clearInterval(interval)
  }, [])

  if (!hasCredentials || !data) return <FallbackContent />
  if (!data.isPlaying && !data.title) return <NotPlayingContent />

  return <NowPlayingCard data={data} />
}

// ── Main card layout ───────────────────────────────────────────────────
// Shows album art on the left, viz + text on the right, and last-played bar at the bottom.
// The album art takes up most of the space — the right column is intentionally narrow.
function NowPlayingCard({ data }: { data: NowPlayingData }) {
  const [vizMode, setVizMode] = useState<VizMode>("bars")
  const isPlaying = data.isPlaying

  // Click the viz box to cycle through styles: bars → waveform → sphere → bars
  const cycleViz = () =>
    setVizMode((m) => ({ bars: "waveform", waveform: "sphere", sphere: "bars" } as const)[m])

  return (
    <div
      className="relative h-full flex flex-col overflow-hidden"
      style={{
        border: "3px solid var(--text)",
        boxShadow: "4px 4px 0 var(--shadow)",
        background: "var(--bg)",
      }}
    >
      {/* ── Top section: intrinsic-ratio container so height is ALWAYS tied to width ── */}
      {/* padding-bottom: 76% means height = 76% of width = same as album art square.      */}
      {/* Both columns are absolutely positioned inside, so text can NEVER push the height. */}
      <div className="relative" style={{ paddingBottom: "76%", borderBottom: "3px solid var(--text)" }}>

        {/* ── LEFT: Album art — absolute, fills left 76% ── */}
        <div
          className="absolute top-0 left-0 bottom-0 overflow-hidden"
          style={{
            width: "76%",
            borderRight: "3px solid var(--text)",
          }}
        >
          {data.albumArt ? (
            <img
              src={data.albumArt}
              alt={data.album ?? "Album art"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: "var(--bg2)" }}>
              <PixelNoteIcon color="#333" />
            </div>
          )}
        </div>

        {/* ── RIGHT: narrow column — absolute, fills right 24% ── */}
        <div className="absolute top-0 right-0 bottom-0 flex flex-col overflow-hidden" style={{ width: "24%" }}>

          {/* Visualization panel */}
          <button
            onClick={cycleViz}
            className="flex items-center justify-center cursor-pointer transition-colors hover:bg-black/5"
            style={{
              width: "100%",
              aspectRatio: "1 / 1",
              flexShrink: 0,
              borderBottom: "3px solid var(--text)",
              padding: 0,
            }}
            title="Click to switch visualization"
          >
            <AnimatePresence mode="wait">
              {vizMode === "bars" && <BrutalistBarsViz key="bars" isPlaying={isPlaying} />}
              {vizMode === "waveform" && <BrutalistBlockViz key="block" isPlaying={isPlaying} />}
              {vizMode === "sphere" && <BrutalistGridViz key="grid" isPlaying={isPlaying} />}
            </AnimatePresence>
          </button>

          {/* texts anchored to bottom of the remaining space */}
          <div className="flex flex-1 items-end overflow-hidden min-h-0" style={{ padding: 0, gap: 0 }}>

            {/* SONG NAME — 50% of section width */}
            <span
              className="font-sans uppercase leading-none"
              style={{
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
                fontSize: "clamp(22px, 2.8vw, 40px)",
                fontWeight: 900,
                color: "var(--text)",
                overflow: "hidden",
                whiteSpace: "nowrap",
                maxHeight: "100%",
                textOverflow: "ellipsis",
                letterSpacing: "0.04em",
                flexShrink: 0,
              }}
              title={data.title}
            >
              {data.title}
            </span>

            {/* ALBUM — 35% of section width */}
            <span
              className="font-sans leading-none"
              style={{
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
                fontSize: "clamp(17px, 2.2vw, 20px)",
                fontWeight: 800,
                color: "var(--text)",
                overflow: "hidden",
                whiteSpace: "nowrap",
                maxHeight: "100%",
                textOverflow: "ellipsis",
                letterSpacing: "0.03em",
                opacity: 0.7,
                flexShrink: 0,
              }}
              title={data.album}
            >
              {data.album}
            </span>

            {/* ARTIST — 15% of section width */}
            <span
              className="font-sans leading-none"
              style={{
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
                fontSize: "clamp(12px, 1.5vw, 15px)",
                fontWeight: 700,
                color: "var(--muted)",
                overflow: "hidden",
                whiteSpace: "nowrap",
                maxHeight: "100%",
                textOverflow: "ellipsis",
                letterSpacing: "0.03em",
                flexShrink: 0,
              }}
              title={data.artist}
            >
              {data.artist}
            </span>
          </div>
        </div>
      </div>

      {/* ── Bottom bar: shows the PREVIOUS track ── */}
      {/*
        Left side: prev album art — fills the full bar height
        Right side: label + song title + album name
        If there's no prev data yet, falls back to the NOW PLAYING / LAST PLAYED strip
      */}
      <div
        className="flex shrink-0 overflow-hidden"
        style={{
          borderTop: "0px",
          padding: "6px",
        }}
      >
        {data.prev ? (
          // ── Has prev track data ──
          <div
            className="flex w-full overflow-hidden"
            style={{
              borderRadius: "14px",
            }}
          >
            {data.prev.albumArt && (
              <img
                src={data.prev.albumArt}
                alt=""
                className="shrink-0 object-cover"
                style={{
                  width: "80px",
                  height: "80px",
                  margin: "6px",
                  borderRadius: "10px",
                  flexShrink: 0,
                  alignSelf: "center",
                }}
              />
            )}
            <div className="flex flex-col justify-center min-w-0 overflow-hidden px-3 py-2 gap-0.5">
              <span
                className="font-sans truncate uppercase leading-none"
                style={{ fontSize: "20px", fontWeight: 900, color: "var(--text)", letterSpacing: "0.02em" }}
                title={data.prev.title}
              >
                {data.prev.title}
              </span>
              {data.prev.album && (
                <span
                  className="font-sans truncate leading-snug"
                  style={{ fontSize: "13px", fontWeight: 600, fontStyle: "italic", color: "var(--text)", opacity: 0.75 }}
                  title={data.prev.album}
                >
                  {data.prev.album}
                </span>
              )}
              {data.prev.artist && (
                <span
                  className="font-sans truncate leading-snug"
                  style={{ fontSize: "10px", fontWeight: 400, color: "var(--muted)" }}
                  title={data.prev.artist}
                >
                  {data.prev.artist}
                </span>
              )}
            </div>
          </div>
        ) : (
          // ── No prev track: show current track ──
          <a
            href={data.songUrl ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full overflow-hidden transition-colors hover:bg-black/5"
            style={{
              cursor: data.songUrl ? "pointer" : "default",
              borderRadius: "14px",
            }}
          >
            {data.albumArt && (
              <img
                src={data.albumArt}
                alt=""
                className="shrink-0 object-cover"
                style={{
                  width: "80px",
                  height: "80px",
                  margin: "6px",
                  borderRadius: "10px",
                  flexShrink: 0,
                  alignSelf: "center",
                }}
              />
            )}
            <div className="flex flex-col justify-center min-w-0 overflow-hidden px-3 py-2 gap-0.5">
              <span
                className="font-sans truncate uppercase leading-none"
                style={{ fontSize: "20px", fontWeight: 900, color: "var(--text)", letterSpacing: "0.02em" }}
                title={data.title}
              >
                {data.title}
              </span>
              {data.album && (
                <span
                  className="font-sans truncate leading-snug"
                  style={{ fontSize: "13px", fontWeight: 600, fontStyle: "italic", color: "var(--text)", opacity: 0.75 }}
                  title={data.album}
                >
                  {data.album}
                </span>
              )}
              {data.artist && (
                <span
                  className="font-sans truncate leading-snug"
                  style={{ fontSize: "10px", fontWeight: 400, color: "var(--muted)" }}
                  title={data.artist}
                >
                  {data.artist}
                </span>
              )}
            </div>
          </a>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// VISUALIZATION COMPONENTS (Brutalist style)
// Click the top-right corner box to cycle between these three.
// Each one responds to isPlaying — static when paused, animated when playing.
// ══════════════════════════════════════════════════════════════════════

// ── Viz 1: BRUTALIST BARS ─────────────────────────────────────────────
// Thick, sharp-edged rectangular bars. No rounded corners. High contrast.
// They slam up and down hard, not smooth — that's the brutalist feel.
const BRUTAL_BAR_CONFIG = [
  { min: 6, max: 28, dur: 0.40 },  // each entry: min height, max height, animation speed
  { min: 14, max: 44, dur: 0.28 },
  { min: 8, max: 36, dur: 0.50 },
  { min: 20, max: 48, dur: 0.32 },
  { min: 6, max: 30, dur: 0.44 },
  { min: 16, max: 42, dur: 0.26 },
]

function BrutalistBarsViz({ isPlaying }: { isPlaying: boolean }) {
  return (
    <motion.div
      className="flex items-end justify-center gap-[2px] w-full h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      {BRUTAL_BAR_CONFIG.map((bar, i) => (
        <motion.div
          key={i}
          style={{
            width: "6px",             /* wide bar, no rounded corners */
            background: "var(--accent)",
            borderRadius: "0px",      /* brutalist = no rounding */
            transformOrigin: "bottom",
          }}
          animate={
            isPlaying
              ? {
                /* fast, snappy up-down — "easeOut" makes it look like it slams */
                height: [`${bar.min}px`, `${bar.max}px`, `${bar.min}px`],
                opacity: [0.6, 1, 0.6],
              }
              : { height: `${bar.min}px`, opacity: 0.3 } // flat + dim when paused
          }
          transition={{
            duration: bar.dur,
            repeat: Infinity,
            ease: "easeOut",      // sharp hit at top, fast drop
            delay: i * 0.06,
          }}
        />
      ))}
    </motion.div>
  )
}

// ── Viz 2: BRUTALIST BLOCKS ───────────────────────────────────────────
// A single row of square blocks that blink and flash —
// imagine an old LED level meter slamming on and off.
function BrutalistBlockViz({ isPlaying }: { isPlaying: boolean }) {
  // 3 rows × 4 cols = 12 LED "pixels"
  const rows = 3
  const cols = 4
  const cells = Array.from({ length: rows * cols })

  return (
    <motion.div
      className="flex flex-col-reverse gap-[2px] items-center justify-center w-full h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex gap-[2px]">
          {Array.from({ length: cols }).map((_, col) => {
            const idx = row * cols + col
            return (
              <motion.div
                key={col}
                style={{
                  width: "5px",
                  height: "5px",
                  background: "var(--accent)",
                  borderRadius: "0px", // sharp squares — no rounding
                }}
                animate={
                  isPlaying
                    ? {
                      // each block flashes at a slightly different offset
                      opacity: [0.15, 1, 0.15],
                      scaleY: [0.4, 1, 0.4],
                    }
                    : { opacity: 0.1, scaleY: 0.4 }
                }
                transition={{
                  duration: 0.5 + (idx % 3) * 0.15,
                  repeat: Infinity,
                  ease: "linear",
                  delay: idx * 0.04,
                }}
              />
            )
          })}
        </div>
      ))}
    </motion.div>
  )
}

// ── Viz 3: BRUTALIST GRID PULSE ───────────────────────────────────────
// A tight grid of squares that ripple outward from the center.
// Harsh, geometric — no circles, no smooth curves.
function BrutalistGridViz({ isPlaying }: { isPlaying: boolean }) {
  const size = 4       // 4×4 grid
  const cx = (size - 1) / 2  // centre x
  const cy = (size - 1) / 2  // centre y

  return (
    <motion.div
      className="flex items-center justify-center w-full h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${size}, 5px)`,
          gap: "2px",
        }}
      >
        {Array.from({ length: size * size }).map((_, i) => {
          const row = Math.floor(i / size)
          const col = i % size
          // distance from centre — used to stagger the ripple delay
          const dist = Math.abs(row - cy) + Math.abs(col - cx)

          return (
            <motion.div
              key={i}
              style={{
                width: "5px",
                height: "5px",
                background: "var(--accent)",
                borderRadius: "0px",
              }}
              animate={
                isPlaying
                  ? {
                    opacity: [0.1, 1, 0.1],
                    scale: [0.5, 1, 0.5],
                  }
                  : { opacity: 0.1, scale: 0.5 }
              }
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: dist * 0.12, // cells further from centre pulse later
              }}
            />
          )
        })}
      </div>
    </motion.div>
  )
}

// ── Fallback: shown when Spotify credentials are missing ───────────────
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

// ── Not-playing state ──────────────────────────────────────────────────
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

// ── Small icon components ──────────────────────────────────────────────
// Pixel-art music note used in fallback / not-playing states
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

// Spotify logo used in the bottom bar
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
