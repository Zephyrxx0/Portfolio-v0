"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "@/lib/theme"

export default function ContactSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)
  const [credits, setCredits] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [flashScreen, setFlashScreen] = useState(false)
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

  const handleInsertCoin = () => {
    const next = credits + 1
    setCredits(next)

    // Flash effect
    setFlashScreen(true)
    setTimeout(() => setFlashScreen(false), 150)

    if (next >= 3) {
      setShowConfetti(true)
    }
  }

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="relative px-6 py-24 md:py-32"
      style={{ background: "var(--bg)" }}
    >
      {/* Flash overlay */}
      {flashScreen && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: "var(--accent)", opacity: 0.3 }}
        />
      )}

      {/* Divider */}
      <div
        className="mx-auto mb-12 max-w-6xl"
        style={{ borderTop: "4px solid var(--text)" }}
      />

      <div className="mx-auto max-w-6xl">
        {/* Giant heading */}
        <h2
          className="mb-8 font-sans font-black uppercase leading-none tracking-tight"
          style={{
            color: "var(--text)",
            fontSize: "clamp(3rem, 8vw, 6rem)",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(60px)",
            transition: "all 800ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {"LET'S TALK"}
        </h2>

        {/* Horizontal rule */}
        <div className="mb-12" style={{ borderTop: "4px solid var(--text)" }} />

        {/* Links grid */}
        <div className="mb-16 flex flex-col gap-8 md:flex-row md:justify-between">
          <div>
            <p
              className="mb-2 font-sans text-xl font-bold md:text-2xl"
              style={{ color: "var(--text)" }}
            >
              AYUSH@ZEPHYRXX0
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {[
              { label: "GITHUB", href: "https://github.com/Zephyrxx0" },
              { label: "LINKEDIN", href: "https://linkedin.com/in/zephyrxx0" },
              { label: "EMAIL", href: "mailto:ayush@zephyrxx0.dev" },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-lg font-bold transition-colors duration-150"
                style={{ color: "var(--text)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text)")}
              >
                {"\u2197 " + link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Arcade CTA */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleInsertCoin}
            className="flex items-center gap-3 px-6 py-3 transition-all duration-150"
            style={{
              fontFamily: "var(--font-press-start)",
              fontSize: "12px",
              color: "var(--accent)",
              border: "3px solid var(--text)",
              boxShadow: "4px 4px 0 var(--shadow)",
              background: "var(--bg2)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "6px 6px 0 var(--accent)"
              e.currentTarget.style.transform = "translate(-2px, -2px)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "4px 4px 0 var(--shadow)"
              e.currentTarget.style.transform = "translate(0, 0)"
            }}
          >
            {/* Spinning coin */}
            <span className="animate-coin inline-block">
              <svg width="16" height="16" viewBox="0 0 16 16">
                <rect x="4" y="0" width="8" height="2" fill="var(--accent)" />
                <rect x="2" y="2" width="12" height="2" fill="var(--accent)" />
                <rect x="2" y="4" width="12" height="2" fill="var(--accent)" />
                <rect x="2" y="6" width="12" height="2" fill="var(--accent)" />
                <rect x="2" y="8" width="12" height="2" fill="var(--accent)" />
                <rect x="2" y="10" width="12" height="2" fill="var(--accent)" />
                <rect x="2" y="12" width="12" height="2" fill="var(--accent)" />
                <rect x="4" y="14" width="8" height="2" fill="var(--accent)" />
                {/* Dollar sign */}
                <rect x="7" y="3" width="2" height="10" fill="var(--bg)" />
                <rect x="5" y="5" width="6" height="2" fill="var(--bg)" />
                <rect x="5" y="9" width="6" height="2" fill="var(--bg)" />
              </svg>
            </span>
            INSERT COIN TO CONTINUE
          </button>

          {credits > 0 && credits < 3 && (
            <p
              className="text-[10px]"
              style={{ fontFamily: "var(--font-press-start)", color: "var(--accent)" }}
            >
              CREDITS: {credits}
            </p>
          )}
        </div>

        {/* Confetti / final message */}
        {showConfetti && (
          <div className="mt-12">
            <ConfettiCanvas />
            <div
              className="mx-auto mt-8 max-w-md p-6 text-center"
              style={{
                border: "3px solid var(--text)",
                boxShadow: "4px 4px 0 var(--accent)",
                background: "var(--bg2)",
              }}
            >
              <p
                className="mb-2 text-[10px] leading-relaxed"
                style={{ fontFamily: "var(--font-press-start)", color: "var(--accent)" }}
              >
                THANK YOU FOR PLAYING.
              </p>
              <p
                className="mb-4 text-[10px] leading-relaxed"
                style={{ fontFamily: "var(--font-press-start)", color: "var(--text)" }}
              >
                {"LET'S BUILD SOMETHING."}
              </p>
              <p
                className="text-[8px]"
                style={{ fontFamily: "var(--font-press-start)", color: "var(--muted)" }}
              >
                {">"} ayush@zephyrxx0.dev
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mx-auto mt-24 max-w-6xl text-center">
        <p
          className="text-[8px]"
          style={{ fontFamily: "var(--font-press-start)", color: "var(--muted)" }}
        >
          BUILT WITH PIXELS AND CAFFEINE. 2026.
        </p>
      </div>
    </section>
  )
}

function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = canvas.parentElement?.clientWidth || 400
    canvas.height = 200

    const colors = ["#00ff9d", "#00cfff", "#ff6b9d", "#ffcf00", "#f0f0f0"]
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: -10,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 3 + 1,
      size: 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
    }))

    let animId: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.05
        p.rotation += 0.05

        ctx.fillStyle = p.color
        ctx.fillRect(p.x, p.y, p.size, p.size)
      }

      const allDone = particles.every((p) => p.y > canvas.height)
      if (!allDone) {
        animId = requestAnimationFrame(animate)
      }
    }
    animate()

    return () => cancelAnimationFrame(animId)
  }, [])

  return <canvas ref={canvasRef} className="w-full" style={{ height: 200 }} />
}
