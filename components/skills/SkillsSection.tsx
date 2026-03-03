"use client"

import { useEffect, useRef, useState, useMemo, useCallback } from "react"
import { useTheme } from "@/lib/theme"

interface Skill {
  name: string
  level: number
  category: string
}

const SKILLS: Skill[] = [
  { category: "LANGUAGES", name: "python", level: 80 },
  { category: "LANGUAGES", name: "javascript", level: 70 },
  { category: "LANGUAGES", name: "html/css", level: 90 },
  { category: "FRAMEWORKS", name: "react", level: 78 },
  { category: "FRAMEWORKS", name: "next.js", level: 70 },
  { category: "FRAMEWORKS", name: "tailwind", level: 80 },
  { category: "TOOLS", name: "git", level: 85 },
  { category: "TOOLS", name: "jupyter", level: 65 },
  { category: "VIBES", name: "pixel art", level: 100 },
  { category: "VIBES", name: "lo-fi coding", level: 100 },
  { category: "VIBES", name: "3am debugging", level: 95 },
]

const JOKE_LINES = [
  "> installing: procrastination... CRITICAL",
  "> loading: coffee_reserves... 2% remaining",
  "> scanning: bugs... they're features now",
  "> compiling: motivation... please wait...",
  "> sudo rm -rf sleep/",
  "> git commit -m 'idk it works'",
]

function useTerminalColors() {
  const { theme } = useTheme()
  return useMemo(() => {
    if (theme === "dark") {
      return {
        bg: "#0a0a0a",
        titlebar: "#1a1a1a",
        titleBorder: "#2a2a2a",
        border: "#f0f0f0",
        shadow: "#00ff9d",
        accent: "#00ff9d",
        text: "#f0f0f0",
        muted: "#555",
        vibes: "#ff6b9d",
        cursor: "#00ff9d",
        titleText: "#555",
        glitch1: "#00ff9d",
        glitch2: "#ff6b9d",
      }
    }
    return {
      bg: "#1a1208",
      titlebar: "#2a1f10",
      titleBorder: "#3a2f18",
      border: "#f5f0e8",
      shadow: "#c84b00",
      accent: "#c84b00",
      text: "#f5f0e8",
      muted: "#7a6a55",
      vibes: "#cd853f",
      cursor: "#c84b00",
      titleText: "#7a6a55",
      glitch1: "#c84b00",
      glitch2: "#cd853f",
    }
  }, [theme])
}

export default function SkillsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const glitchCanvasRef = useRef<HTMLCanvasElement>(null)
  const [visible, setVisible] = useState(false)
  const [jokeIdx, setJokeIdx] = useState(0)
  const [typingJoke, setTypingJoke] = useState("")
  const [typingComplete, setTypingComplete] = useState(false)
  const [glitching, setGlitching] = useState(false)
  const colors = useTerminalColors()
  const { theme } = useTheme()
  const prevThemeRef = useRef(theme)

  // Detect theme change → trigger glitch
  useEffect(() => {
    if (prevThemeRef.current !== theme) {
      prevThemeRef.current = theme
      triggerGlitch()
    }
  }, [theme])

  const triggerGlitch = useCallback(() => {
    setGlitching(true)
    setTimeout(() => setGlitching(false), 700)
  }, [])

  // Glitch canvas animation
  useEffect(() => {
    if (!glitching) return
    const canvas = glitchCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    let animId: number
    let frame = 0
    const totalFrames = 40

    const animate = () => {
      if (frame >= totalFrames) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        return
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Scanline sweep
      const sweepY = (frame / totalFrames) * canvas.height
      ctx.fillStyle = colors.glitch1
      ctx.globalAlpha = 0.12
      ctx.fillRect(0, sweepY - 4, canvas.width, 8)
      ctx.globalAlpha = 1

      // Random horizontal slices
      const sliceCount = 4 + Math.floor(Math.random() * 5)
      for (let i = 0; i < sliceCount; i++) {
        if (Math.random() < 0.4) {
          const sliceY = Math.random() * canvas.height
          const sliceH = 2 + Math.random() * 6
          const xOffset = (Math.random() - 0.5) * 24
          ctx.fillStyle = i % 2 === 0 ? colors.glitch1 : colors.glitch2
          ctx.globalAlpha = 0.15 + Math.random() * 0.15
          ctx.fillRect(xOffset, sliceY, canvas.width, sliceH)
        }
      }
      ctx.globalAlpha = 1

      // Scanlines overlay
      for (let y = 0; y < canvas.height; y += 4) {
        ctx.fillStyle = "rgba(0,0,0,0.08)"
        ctx.fillRect(0, y, canvas.width, 2)
      }

      frame++
      animId = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(animId)
  }, [glitching, colors])

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

  useEffect(() => {
    if (!visible) return

    const typeJoke = () => {
      const joke = JOKE_LINES[jokeIdx % JOKE_LINES.length]
      let i = 0
      setTypingJoke("")
      setTypingComplete(false)

      const interval = setInterval(() => {
        if (i < joke.length) {
          setTypingJoke(joke.slice(0, i + 1))
          i++
        } else {
          setTypingComplete(true)
          clearInterval(interval)
        }
      }, 50)
    }

    typeJoke()
    const timer = setInterval(() => {
      setJokeIdx((prev) => prev + 1)
    }, 12000)

    return () => clearInterval(timer)
  }, [visible, jokeIdx])

  const categories = Array.from(new Set(SKILLS.map((s) => s.category)))

  return (
    <section
      id="skills"
      ref={sectionRef}
      className="relative px-6 py-24 md:py-32"
      style={{
        background: colors.bg,
        transition: "background-color 600ms ease",
      }}
    >
      <div className="mx-auto max-w-4xl">
        {/* Terminal chrome */}
        <div
          className="relative overflow-hidden"
          style={{
            border: `3px solid ${colors.border}`,
            boxShadow: `4px 4px 0 ${colors.shadow}`,
            transition: "border-color 600ms ease, box-shadow 600ms ease",
          }}
        >
          {/* Glitch overlay canvas */}
          <canvas
            ref={glitchCanvasRef}
            className="pointer-events-none absolute inset-0 z-20"
            style={{
              width: "100%",
              height: "100%",
              opacity: glitching ? 1 : 0,
              transition: "opacity 80ms ease",
            }}
            aria-hidden="true"
          />

          {/* Title bar */}
          <div
            className="flex items-center gap-3 px-4 py-2"
            style={{
              background: colors.titlebar,
              borderBottom: `2px solid ${colors.titleBorder}`,
              transition: "background-color 600ms ease, border-color 600ms ease",
            }}
          >
            <span className="inline-block h-3 w-3 rounded-full" style={{ background: "#ff5f57" }} />
            <span className="inline-block h-3 w-3 rounded-full" style={{ background: "#febc2e" }} />
            <span className="inline-block h-3 w-3 rounded-full" style={{ background: "#28c840" }} />
            <span
              className="ml-4 text-xs"
              style={{
                fontFamily: "var(--font-jetbrains)",
                color: colors.titleText,
                transition: "color 600ms ease",
              }}
            >
              zephyrxx0@terminal ~ skills
            </span>
            {/* Theme indicator badge */}
            <span
              className="ml-auto text-[7px] tracking-widest px-2 py-0.5"
              style={{
                fontFamily: "var(--font-press-start)",
                color: colors.bg,
                background: colors.accent,
                transition: "background-color 600ms ease, color 600ms ease",
              }}
            >
              {theme === "dark" ? "DARK" : "EARTHY"}
            </span>
          </div>

          {/* Terminal content */}
          <div
            className="p-6"
            style={{
              background: colors.bg,
              fontFamily: "var(--font-jetbrains)",
              color: colors.accent,
              fontSize: "0.85rem",
              lineHeight: 1.8,
              transition: "background-color 600ms ease, color 600ms ease",
            }}
          >
            <p style={{ color: colors.text, transition: "color 600ms ease" }}>
              {"~/zephyrxx0 $ "}
              <span style={{ color: colors.accent, transition: "color 600ms ease" }}>
                skills --list --verbose
              </span>
            </p>
            <br />

            {categories.map((cat) => (
              <div key={cat} className="mb-4">
                <p style={{ color: colors.muted, transition: "color 600ms ease" }}>[{cat}]</p>
                {SKILLS.filter((s) => s.category === cat).map((skill, i) => (
                  <div
                    key={skill.name}
                    className="flex items-center gap-4"
                    style={{
                      opacity: visible ? 1 : 0,
                      transition: `opacity 800ms ${i * 80}ms cubic-bezier(0.16, 1, 0.3, 1)`,
                    }}
                  >
                    <span
                      className="w-32 text-right"
                      style={{ color: colors.text, transition: "color 600ms ease" }}
                    >
                      {skill.name}
                    </span>
                    <span
                      className="flex-shrink-0"
                      style={{
                        color: cat === "VIBES" ? colors.vibes : colors.accent,
                        transition: "color 600ms ease",
                      }}
                    >
                      {/* key={theme} forces SkillBar to re-mount and re-animate on theme change */}
                      <SkillBar
                        key={`${theme}-${skill.name}`}
                        level={skill.level}
                        visible={visible}
                        delay={i * 80}
                        accentColor={cat === "VIBES" ? colors.vibes : colors.accent}
                      />
                    </span>
                    <span style={{ color: colors.muted, transition: "color 600ms ease" }}>
                      {skill.level}%
                    </span>
                  </div>
                ))}
              </div>
            ))}

            {/* Joke line */}
            <div className="mt-4">
              <span style={{ color: colors.muted, transition: "color 600ms ease" }}>
                {typingJoke}
              </span>
              {!typingComplete && (
                <span className="animate-blink" style={{ color: colors.cursor }}>
                  _
                </span>
              )}
            </div>

            {/* Blinking cursor */}
            <p className="mt-2">
              <span style={{ color: colors.text, transition: "color 600ms ease" }}>{">"}</span>{" "}
              <span className="animate-blink" style={{ color: colors.cursor }}>
                _
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function SkillBar({
  level,
  visible,
  delay,
  accentColor,
}: {
  level: number
  visible: boolean
  delay: number
  accentColor: string
}) {
  const [filled, setFilled] = useState(0)

  // Re-runs whenever key changes (theme switch) or visibility changes
  useEffect(() => {
    if (!visible) return
    setFilled(0)
    const timer = setTimeout(() => {
      setFilled(Math.round(level / 10))
    }, delay + 200)
    return () => clearTimeout(timer)
  }, [visible, level, delay])

  const empty = 10 - filled

  return (
    <span>
      <span style={{ color: accentColor, transition: "color 600ms ease" }}>
        {"\u2588".repeat(filled)}
      </span>
      <span style={{ color: accentColor, opacity: 0.2, transition: "color 600ms ease" }}>
        {"\u2591".repeat(empty)}
      </span>
    </span>
  )
}
