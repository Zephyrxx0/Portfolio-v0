"use client"

import { useEffect, useRef, useState, useMemo } from "react"
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

// Theme-aware color palette
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
        prompt: "#f0f0f0",
        cursor: "#00ff9d",
        titleText: "#555",
      }
    }
    // Earthy parchment/manuscript theme
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
      prompt: "#f5f0e8",
      cursor: "#c84b00",
      titleText: "#7a6a55",
    }
  }, [theme])
}

export default function SkillsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)
  const [jokeIdx, setJokeIdx] = useState(0)
  const [typingJoke, setTypingJoke] = useState("")
  const [typingComplete, setTypingComplete] = useState(false)
  const colors = useTerminalColors()

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

  // Periodic joke line
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
        transition: "background-color 500ms ease",
      }}
    >
      <div className="mx-auto max-w-4xl">
        {/* Terminal chrome */}
        <div
          className="overflow-hidden"
          style={{
            border: `3px solid ${colors.border}`,
            boxShadow: `4px 4px 0 ${colors.shadow}`,
            transition: "border-color 500ms ease, box-shadow 500ms ease",
          }}
        >
          {/* Title bar */}
          <div
            className="flex items-center gap-3 px-4 py-2"
            style={{
              background: colors.titlebar,
              borderBottom: `2px solid ${colors.titleBorder}`,
              transition: "background-color 500ms ease, border-color 500ms ease",
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
                transition: "color 500ms ease",
              }}
            >
              zephyrxx0@terminal ~ skills
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
              transition: "background-color 500ms ease, color 500ms ease",
            }}
          >
            <p style={{ color: colors.text, transition: "color 500ms ease" }}>
              {"~/zephyrxx0 $ "}
              <span style={{ color: colors.accent, transition: "color 500ms ease" }}>
                skills --list --verbose
              </span>
            </p>
            <br />

            {categories.map((cat) => (
              <div key={cat} className="mb-4">
                <p style={{ color: colors.muted, transition: "color 500ms ease" }}>[{cat}]</p>
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
                      style={{ color: colors.text, transition: "color 500ms ease" }}
                    >
                      {skill.name}
                    </span>
                    <span
                      className="flex-shrink-0"
                      style={{
                        color: cat === "VIBES" ? colors.vibes : colors.accent,
                        transition: "color 500ms ease",
                      }}
                    >
                      <SkillBar level={skill.level} visible={visible} delay={i * 80} />
                    </span>
                    <span style={{ color: colors.muted, transition: "color 500ms ease" }}>
                      {skill.level}%
                    </span>
                  </div>
                ))}
              </div>
            ))}

            {/* Joke line */}
            <div className="mt-4">
              <span style={{ color: colors.muted, transition: "color 500ms ease" }}>
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
              <span style={{ color: colors.text, transition: "color 500ms ease" }}>{">"}</span>{" "}
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

function SkillBar({ level, visible, delay }: { level: number; visible: boolean; delay: number }) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => setWidth(level), delay + 200)
    return () => clearTimeout(timer)
  }, [visible, level, delay])

  const filled = Math.round(width / 10)
  const empty = 10 - filled

  return (
    <span style={{ transition: "all 800ms cubic-bezier(0.16, 1, 0.3, 1)" }}>
      {"\u2588".repeat(filled)}
      <span style={{ opacity: 0.2 }}>{"\u2591".repeat(empty)}</span>
    </span>
  )
}
