"use client"

import { useState, useEffect } from "react"
import { useTheme } from "@/lib/theme"
import SpotifyWidget from "./SpotifyWidget"

const NAV_LINKS = [
  { label: "ABOUT", href: "#about" },
  { label: "PROJECTS", href: "#projects" },
  { label: "SKILLS", href: "#skills" },
  { label: "HOBBIES", href: "#hobbies" },
  { label: "CONTACT", href: "#contact" },
]

export default function Nav() {
  const { theme, toggleTheme } = useTheme()
  const [scrollProgress, setScrollProgress] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = document.documentElement.scrollTop
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      setScrollProgress(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const scrollTo = (href: string) => {
    setMobileOpen(false)
    const el = document.querySelector(href)
    el?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <>
      {/* Scroll progress bar */}
      <div
        id="scroll-progress"
        style={{ width: `${scrollProgress}%` }}
      />

      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{
          backgroundColor: theme === "dark" ? "rgba(10,10,10,0.85)" : "rgba(245,240,232,0.85)",
          backdropFilter: "blur(8px)",
          borderBottom: `2px solid var(--border)`,
        }}
      >
        {/* Wordmark */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="font-sans text-xl font-black tracking-wider"
          style={{ color: "var(--text)" }}
        >
          ZEPHYRXX0
        </button>

        {/* Desktop links */}
        <div className="hidden items-center gap-6 md:flex">
          <SpotifyWidget />
          {NAV_LINKS.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollTo(link.href)}
              className="font-sans text-sm font-bold tracking-wide transition-colors duration-150 hover:opacity-80"
              style={{ color: "var(--muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
            >
              {link.label}
            </button>
          ))}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-1 font-mono text-xs font-bold transition-all duration-150"
            style={{
              border: "2px solid var(--text)",
              color: "var(--text)",
              background: "var(--bg2)",
              boxShadow: "3px 3px 0 var(--shadow)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "5px 5px 0 var(--accent)"
              e.currentTarget.style.transform = "translate(-1px, -1px)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "3px 3px 0 var(--shadow)"
              e.currentTarget.style.transform = "translate(0, 0)"
            }}
          >
            <PixelIcon type={theme === "dark" ? "moon" : "sun"} />
            {theme === "dark" ? "EARTHY" : "DARK"}
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="flex flex-col gap-1.5 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          <span
            className="block h-0.5 w-6 transition-all duration-200"
            style={{
              backgroundColor: "var(--text)",
              transform: mobileOpen ? "rotate(45deg) translateY(8px)" : "none",
            }}
          />
          <span
            className="block h-0.5 w-6 transition-all duration-200"
            style={{
              backgroundColor: "var(--text)",
              opacity: mobileOpen ? 0 : 1,
            }}
          />
          <span
            className="block h-0.5 w-6 transition-all duration-200"
            style={{
              backgroundColor: "var(--text)",
              transform: mobileOpen ? "rotate(-45deg) translateY(-8px)" : "none",
            }}
          />
        </button>
      </nav>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8"
          style={{ backgroundColor: "#0a0a0a" }}
        >
          <SpotifyWidget />
          {NAV_LINKS.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollTo(link.href)}
              className="font-sans text-3xl font-bold"
              style={{ color: "#f0f0f0" }}
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => {
              toggleTheme()
              setMobileOpen(false)
            }}
            className="mt-4 px-4 py-2 font-mono text-sm font-bold"
            style={{
              border: "2px solid #f0f0f0",
              color: "#f0f0f0",
              background: "transparent",
            }}
          >
            TOGGLE THEME
          </button>
        </div>
      )}
    </>
  )
}

function PixelIcon({ type }: { type: "sun" | "moon" }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      {type === "moon" ? (
        <path d="M10 2C6 2 3 5 3 9s3 3 7 1c-4 0-5-3-5-5s3-4 5-3z" fill="currentColor" />
      ) : (
        <>
          <circle cx="7" cy="7" r="3" fill="currentColor" />
          <rect x="6" y="0" width="2" height="2" fill="currentColor" />
          <rect x="6" y="12" width="2" height="2" fill="currentColor" />
          <rect x="0" y="6" width="2" height="2" fill="currentColor" />
          <rect x="12" y="6" width="2" height="2" fill="currentColor" />
        </>
      )}
    </svg>
  )
}
