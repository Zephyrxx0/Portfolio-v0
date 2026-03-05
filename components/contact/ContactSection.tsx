"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useTheme } from "@/lib/theme"

export default function ContactSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)
  const [credits, setCredits] = useState(0)
  const [flashScreen, setFlashScreen] = useState(false)
  const [shakeScreen, setShakeScreen] = useState(false)
  const [coinText, setCoinText] = useState("")
  const [phase, setPhase] = useState<"idle" | "blackout" | "gamestart" | "reveal">("idle")
  const [typedGameStart, setTypedGameStart] = useState("")
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

  const handleInsertCoin = useCallback(() => {
    if (phase !== "idle") return
    const next = credits + 1
    setCredits(next)

    // Flash effect
    setFlashScreen(true)
    setTimeout(() => setFlashScreen(false), 150)

    if (next === 1) {
      setCoinText("KA-CHING!")
      setTimeout(() => setCoinText(""), 1200)
    } else if (next === 2) {
      setCoinText("KA-CHING!!")
      setShakeScreen(true)
      setTimeout(() => {
        setShakeScreen(false)
        setCoinText("")
      }, 800)
    } else if (next >= 3) {
      // Credit 3: full arcade event
      setCoinText("")
      setTimeout(() => {
        setPhase("blackout")
      }, 200)

      // Typewriter "GAME OVER" after blackout
      setTimeout(() => {
        setPhase("gamestart")
        const text = "GAME OVER"
        let i = 0
        const interval = setInterval(() => {
          if (i <= text.length) {
            setTypedGameStart(text.slice(0, i))
            i++
          } else {
            clearInterval(interval)
            setTimeout(() => {
              window.scrollTo({ top: 0, behavior: "smooth" })
              setPhase("idle")
              setCredits(0)
              setTypedGameStart("")
            }, 600)
          }
        }, 120)
      }, 500)
    }
  }, [credits, phase])

  const handleReset = () => {
    setPhase("idle")
    setCredits(0)
    setTypedGameStart("")
  }

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="relative px-6 py-24 md:py-32"
      style={{
        background: "var(--bg)",
        transform: shakeScreen ? "translateX(3px)" : "translateX(0)",
        transition: shakeScreen ? "none" : "transform 100ms ease",
        animation: shakeScreen ? "screenShake 100ms linear 3" : "none",
      }}
    >
      {/* Flash overlay */}
      {flashScreen && (
        <div
          className="fixed inset-0 z-40 pointer-events-none"
          style={{ background: "var(--accent)", opacity: 0.3 }}
        />
      )}

      {/* Coin text popup */}
      {coinText && phase === "idle" && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
        >
          <p
            className="animate-coin-text"
            style={{
              fontFamily: "var(--font-press-start)",
              fontSize: "clamp(1.5rem, 5vw, 3rem)",
              color: "var(--accent)",
              textShadow: `0 0 20px var(--accent)`,
            }}
          >
            {coinText}
          </p>
        </div>
      )}

      {/* BLACKOUT + GAME START overlay */}
      {(phase === "blackout" || phase === "gamestart") && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "#000" }}
        >
          {phase === "gamestart" && (
            <p
              style={{
                fontFamily: "var(--font-press-start)",
                fontSize: "clamp(1rem, 4vw, 2.5rem)",
                color: theme === "dark" ? "#00ff9d" : "#c84b00",
                textShadow: `0 0 30px ${theme === "dark" ? "#00ff9d" : "#c84b00"}`,
              }}
            >
              {typedGameStart}
              <span className="animate-blink">_</span>
            </p>
          )}
        </div>
      )}

      {/* REVEAL overlay with CRT scanlines + confetti + card */}
      {phase === "reveal" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "#000" }}
        >
          {/* CRT scanline overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)",
              zIndex: 2,
            }}
          />

          {/* Continuous confetti canvas */}
          <ContinuousConfetti />

          {/* Reveal card */}
          <div
            className="relative z-10 animate-reveal-card mx-4"
          >
            <div
              className="max-w-md p-8 text-center"
              style={{
                border: `3px solid ${theme === "dark" ? "#f0f0f0" : "#f5f0e8"}`,
                boxShadow: `6px 6px 0 ${theme === "dark" ? "#00ff9d" : "#c84b00"}`,
                background: theme === "dark" ? "#0a0a0a" : "#1a1208",
              }}
            >
              {/* Pixel trophy */}
              <div className="mb-4 flex justify-center">
                <PixelTrophy accent={theme === "dark" ? "#00ff9d" : "#c84b00"} />
              </div>

              <p
                className="mb-3 text-[10px] leading-relaxed"
                style={{
                  fontFamily: "var(--font-press-start)",
                  color: theme === "dark" ? "#00ff9d" : "#c84b00",
                }}
              >
                THANK YOU FOR PLAYING.
              </p>

              <p
                className="mb-6 text-[12px] leading-relaxed"
                style={{
                  fontFamily: "var(--font-press-start)",
                  color: theme === "dark" ? "#f0f0f0" : "#f5f0e8",
                }}
              >
                {"LET'S BUILD SOMETHING."}
              </p>

              <a
                href="mailto:mahajan.ayush.official@gmail.com"
                className="mb-6 inline-block text-[9px] underline"
                style={{
                  fontFamily: "var(--font-press-start)",
                  color: theme === "dark" ? "#00ff9d" : "#c84b00",
                }}
              >
                {">"} mahajan.ayush.official@gmail.com
              </a>

              <div className="mt-6">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-[8px] transition-all duration-150"
                  style={{
                    fontFamily: "var(--font-press-start)",
                    color: theme === "dark" ? "#0a0a0a" : "#1a1208",
                    background: theme === "dark" ? "#00ff9d" : "#c84b00",
                    border: `2px solid ${theme === "dark" ? "#f0f0f0" : "#f5f0e8"}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.05)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)"
                  }}
                >
                  PRESS START TO RESET
                </button>
              </div>
            </div>
          </div>
        </div>
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
              { label: "EMAIL", href: "mailto:mahajan.ayush.official@gmail.com" },
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
              opacity: phase !== "idle" ? 0.5 : 1,
              pointerEvents: phase !== "idle" ? "none" : "auto",
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
                <rect x="7" y="3" width="2" height="10" fill="var(--bg)" />
                <rect x="5" y="5" width="6" height="2" fill="var(--bg)" />
                <rect x="5" y="9" width="6" height="2" fill="var(--bg)" />
              </svg>
            </span>
            INSERT COIN TO CONTINUE
          </button>

          {credits > 0 && credits < 3 && phase === "idle" && (
            <p
              className="text-[10px]"
              style={{ fontFamily: "var(--font-press-start)", color: "var(--accent)" }}
            >
              CREDITS: {credits}/3
            </p>
          )}
        </div>
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

      <style>{`
        @keyframes screenShake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-4px) translateY(2px); }
          50% { transform: translateX(4px) translateY(-2px); }
          75% { transform: translateX(-2px) translateY(1px); }
          100% { transform: translateX(0); }
        }
        @keyframes coinTextPop {
          0% { opacity: 0; transform: scale(0.5) translateY(20px); }
          30% { opacity: 1; transform: scale(1.2) translateY(-10px); }
          60% { transform: scale(1) translateY(0); }
          100% { opacity: 0; transform: scale(0.8) translateY(-30px); }
        }
        .animate-coin-text {
          animation: coinTextPop 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes revealCard {
          0% { opacity: 0; transform: translateY(80px) scale(0.9); }
          60% { opacity: 1; transform: translateY(-10px) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-reveal-card {
          animation: revealCard 800ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </section>
  )
}

function ContinuousConfetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const colors = ["#00ff9d", "#00cfff", "#ff6b9d", "#ffcf00", "#f0f0f0", "#c84b00", "#cd853f"]

    interface Particle {
      x: number
      y: number
      vx: number
      vy: number
      size: number
      color: string
      rotation: number
      rotationSpeed: number
      shape: "square" | "diamond"
    }

    const particles: Particle[] = []

    const spawnParticle = (): Particle => ({
      x: Math.random() * canvas.width,
      y: -10 - Math.random() * 40,
      vx: (Math.random() - 0.5) * 3,
      vy: Math.random() * 2 + 1.5,
      size: Math.random() * 4 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.15,
      shape: Math.random() > 0.5 ? "square" : "diamond",
    })

    // Initial batch
    for (let i = 0; i < 120; i++) {
      const p = spawnParticle()
      p.y = Math.random() * canvas.height
      particles.push(p)
    }

    let animId: number
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      if (elapsed > 6000) {
        // After 6s, let remaining particles fall off
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        for (const p of particles) {
          p.x += p.vx
          p.y += p.vy
          p.vy += 0.04
          p.rotation += p.rotationSpeed
          drawParticle(ctx, p)
        }
        const remaining = particles.filter((p) => p.y < canvas.height + 20)
        if (remaining.length > 0) {
          animId = requestAnimationFrame(animate)
        }
        return
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.03
        p.rotation += p.rotationSpeed

        drawParticle(ctx, p)

        // Respawn at top if fallen off
        if (p.y > canvas.height + 20) {
          particles[i] = spawnParticle()
        }
      }

      animId = requestAnimationFrame(animate)
    }

    animate()

    const onResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener("resize", onResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("resize", onResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0"
      style={{ zIndex: 1 }}
    />
  )
}

function drawParticle(ctx: CanvasRenderingContext2D, p: { x: number; y: number; size: number; color: string; rotation: number; shape: "square" | "diamond" }) {
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.rotate(p.rotation)
  ctx.fillStyle = p.color

  if (p.shape === "diamond") {
    ctx.beginPath()
    ctx.moveTo(0, -p.size)
    ctx.lineTo(p.size, 0)
    ctx.lineTo(0, p.size)
    ctx.lineTo(-p.size, 0)
    ctx.closePath()
    ctx.fill()
  } else {
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
  }

  ctx.restore()
}

function PixelTrophy({ accent }: { accent: string }) {
  return (
    <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: "pixelated" }}>
      {/* Cup */}
      <rect x="4" y="2" width="8" height="2" fill={accent} />
      <rect x="3" y="4" width="10" height="2" fill={accent} />
      <rect x="2" y="4" width="2" height="4" fill={accent} />
      <rect x="12" y="4" width="2" height="4" fill={accent} />
      <rect x="4" y="6" width="8" height="2" fill={accent} />
      <rect x="5" y="8" width="6" height="2" fill={accent} />
      {/* Stem */}
      <rect x="7" y="10" width="2" height="2" fill={accent} />
      {/* Base */}
      <rect x="5" y="12" width="6" height="2" fill={accent} />
      {/* Star */}
      <rect x="7" y="4" width="2" height="2" fill="#ffcf00" />
    </svg>
  )
}
