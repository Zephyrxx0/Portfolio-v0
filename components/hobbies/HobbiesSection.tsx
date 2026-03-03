"use client"

import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import BrutalistCard from "../shared/BrutalistCard"
import { useTheme } from "@/lib/theme"

const SpaceInvadersGame = dynamic(() => import("./SpaceInvadersGame"), { ssr: false })

export default function HobbiesSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  const accent = theme === "dark" ? "#00ff9d" : "#c84b00"

  return (
    <section
      id="hobbies"
      ref={sectionRef}
      className="relative px-6 py-24 md:py-32"
      style={{ background: "var(--bg)" }}
    >
      {/* Divider */}
      <div
        className="mx-auto mb-12 max-w-6xl"
        style={{ borderTop: "4px solid var(--text)" }}
      />

      <div className="mx-auto max-w-6xl">
        <h2
          className="mb-12 font-sans text-4xl font-black uppercase tracking-tight md:text-5xl"
          style={{
            color: "var(--text)",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(40px)",
            transition: "all 700ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          HOBBIES
        </h2>

        {/* 2x2 grid */}
        <div className="grid gap-6 md:grid-cols-2">
          <CodingCard visible={visible} delay={0} />
          <GamingCard visible={visible} delay={100} accent={accent} />
          <MusicCard visible={visible} delay={200} />
          <ArtCard visible={visible} delay={300} />
        </div>
      </div>
    </section>
  )
}

function CodingCard({ visible, delay }: { visible: boolean; delay: number }) {
  const [typedText, setTypedText] = useState("")
  const commands = ["npm run dev", "git push origin main", "console.log('hello')", "mkdir awesome-project"]
  const cmdIdxRef = useRef(0)

  useEffect(() => {
    if (!visible) return
    let charIdx = 0
    let currentCmd = commands[0]

    const type = () => {
      if (charIdx <= currentCmd.length) {
        setTypedText(currentCmd.slice(0, charIdx))
        charIdx++
      } else {
        charIdx = 0
        cmdIdxRef.current = (cmdIdxRef.current + 1) % commands.length
        currentCmd = commands[cmdIdxRef.current]
        setTypedText("")
      }
    }

    const interval = setInterval(type, 100)
    return () => clearInterval(interval)
  }, [visible])

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(40px)",
        transition: `all 600ms cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`,
      }}
    >
      <BrutalistCard className="h-full">
        <div className="flex items-center gap-3 mb-4">
          <PixelTerminalIcon />
          <h3 className="font-sans text-lg font-bold" style={{ color: "var(--text)" }}>
            CODING / BUILDING
          </h3>
        </div>
        <div
          className="mb-4 p-3"
          style={{
            background: "#0a0a0a",
            border: "2px solid #2a2a2a",
            fontFamily: "var(--font-jetbrains)",
            fontSize: "0.75rem",
            color: "#00ff9d",
          }}
        >
          <span style={{ color: "#555" }}>$ </span>
          {typedText}
          <span className="animate-blink">_</span>
        </div>
        <p
          className="italic"
          style={{ fontFamily: "var(--font-playfair)", color: "var(--muted)" }}
        >
          {"\"I build for fun, not just for work.\""}
        </p>
      </BrutalistCard>
    </div>
  )
}

function GamingCard({ visible, delay, accent }: { visible: boolean; delay: number; accent: string }) {
  const [clicks, setClicks] = useState(0)
  const [showGame, setShowGame] = useState(false)

  const handleClick = () => {
    const next = clicks + 1
    setClicks(next)
    if (next >= 5) {
      setShowGame(true)
      setClicks(0)
    }
  }

  return (
    <>
      <div
        className="hover-speed"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(40px)",
          transition: `all 600ms cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`,
        }}
      >
        <BrutalistCard className="relative h-full overflow-hidden" onClick={handleClick}>
          <div className="flex items-center gap-3 mb-4">
            <PixelControllerIcon />
            <h3 className="font-sans text-lg font-bold" style={{ color: "var(--text)" }}>
              GAMING
            </h3>
          </div>

          {/* Space invaders marching in background */}
          <div className="relative mb-4 h-8 overflow-hidden">
            <div className="animate-march flex gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <svg key={i} width="8" height="8" viewBox="0 0 8 8">
                  <rect x="1" y="0" width="2" height="2" fill={accent} />
                  <rect x="5" y="0" width="2" height="2" fill={accent} />
                  <rect x="0" y="2" width="8" height="2" fill={accent} />
                  <rect x="1" y="4" width="6" height="2" fill={accent} />
                  <rect x="0" y="6" width="2" height="2" fill={accent} />
                  <rect x="6" y="6" width="2" height="2" fill={accent} />
                </svg>
              ))}
            </div>
          </div>

          <p
            className="italic"
            style={{ fontFamily: "var(--font-playfair)", color: "var(--muted)" }}
          >
            {"\"From retro to modern — gaming is life.\""}
          </p>
          <p
            className="mt-2 text-[8px]"
            style={{ fontFamily: "var(--font-press-start)", color: "var(--muted)" }}
          >
            {"CLICK 5x FOR A SURPRISE"}
          </p>
        </BrutalistCard>
      </div>

      {showGame && (
        <SpaceInvadersGame
          onClose={() => setShowGame(false)}
          accentColor={accent}
        />
      )}
    </>
  )
}

function MusicCard({ visible, delay }: { visible: boolean; delay: number }) {
  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(40px)",
        transition: `all 600ms cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`,
      }}
    >
      <BrutalistCard className="h-full">
        <div className="flex items-center gap-3 mb-4">
          <PixelNoteIcon />
          <h3 className="font-sans text-lg font-bold" style={{ color: "var(--text)" }}>
            MUSIC
          </h3>
        </div>

        {/* Equalizer bars */}
        <div className="mb-4 flex items-end gap-2 h-12">
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
      </BrutalistCard>
    </div>
  )
}

function ArtCard({ visible, delay }: { visible: boolean; delay: number }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(40px)",
        transition: `all 600ms cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <BrutalistCard className="relative h-full overflow-hidden">
        <div className="flex items-center gap-3 mb-4">
          <PixelPaletteIcon />
          <h3 className="font-sans text-lg font-bold" style={{ color: "var(--text)" }}>
            ART / DRAWING
          </h3>
        </div>

        {/* Pixel art grid that reveals on hover */}
        <div className="relative mb-4">
          <div className="grid grid-cols-8 gap-0.5">
            {Array.from({ length: 64 }).map((_, i) => {
              const row = Math.floor(i / 8)
              const col = i % 8
              // Simple pixel art pattern - heart
              const isHeart = (
                (row === 1 && (col === 1 || col === 2 || col === 5 || col === 6)) ||
                (row === 2 && col >= 0 && col <= 7) ||
                (row === 3 && col >= 0 && col <= 7) ||
                (row === 4 && col >= 1 && col <= 6) ||
                (row === 5 && col >= 2 && col <= 5) ||
                (row === 6 && col >= 3 && col <= 4)
              )

              return (
                <div
                  key={i}
                  className="aspect-square"
                  style={{
                    background: isHeart
                      ? hovered
                        ? "var(--accent)"
                        : "var(--border)"
                      : "transparent",
                    transition: `background ${hovered ? Math.random() * 300 + 100 : 300}ms`,
                    transitionDelay: hovered ? `${Math.random() * 400}ms` : "0ms",
                  }}
                />
              )
            })}
          </div>
        </div>

        <p
          className="italic"
          style={{ fontFamily: "var(--font-playfair)", color: "var(--muted)" }}
        >
          {"\"Pixels tell stories that words can't.\""}
        </p>
      </BrutalistCard>
    </div>
  )
}

// Pixel icons
function PixelTerminalIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <rect width="16" height="16" fill="var(--accent)" rx="0" />
      <rect x="2" y="2" width="12" height="12" fill="var(--bg2)" />
      <rect x="3" y="5" width="2" height="2" fill="var(--accent)" />
      <rect x="5" y="7" width="2" height="2" fill="var(--accent)" />
      <rect x="8" y="9" width="4" height="2" fill="var(--accent)" />
    </svg>
  )
}

function PixelControllerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <rect x="2" y="4" width="12" height="8" fill="var(--accent)" />
      <rect x="4" y="6" width="2" height="4" fill="var(--bg2)" />
      <rect x="3" y="7" width="4" height="2" fill="var(--bg2)" />
      <rect x="10" y="6" width="2" height="2" fill="var(--bg2)" />
      <rect x="12" y="8" width="2" height="2" fill="var(--bg2)" />
    </svg>
  )
}

function PixelNoteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <rect x="6" y="2" width="2" height="10" fill="var(--accent)" />
      <rect x="8" y="2" width="4" height="3" fill="var(--accent)" />
      <rect x="3" y="10" width="5" height="4" fill="var(--accent)" rx="0" />
    </svg>
  )
}

function PixelPaletteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <rect x="3" y="3" width="10" height="10" fill="var(--accent)" rx="0" />
      <rect x="5" y="5" width="3" height="3" fill="var(--bg2)" />
      <rect x="9" y="5" width="2" height="2" fill="#ff6b9d" />
      <rect x="5" y="9" width="2" height="2" fill="#00cfff" />
      <rect x="9" y="9" width="2" height="2" fill="#ffcf00" />
    </svg>
  )
}
