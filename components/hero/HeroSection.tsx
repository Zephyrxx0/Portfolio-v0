"use client"

import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { useTheme } from "@/lib/theme"

const IsometricTerrain = dynamic(() => import("./IsometricTerrain"), { ssr: false })

export default function HeroSection() {
  const nameRef = useRef<HTMLHeadingElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [zephyrWalking, setZephyrWalking] = useState(false)
  const keyBuffer = useRef<string[]>([])
  const { theme } = useTheme()

  // Letter animation on load
  useEffect(() => {
    setLoaded(true)
  }, [])

  // ZEPHYR easter egg
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      keyBuffer.current.push(e.key.toUpperCase())
      if (keyBuffer.current.length > 6) keyBuffer.current.shift()
      if (keyBuffer.current.join("") === "ZEPHYR") {
        setZephyrWalking(true)
        setTimeout(() => setZephyrWalking(false), 3500)
        keyBuffer.current = []
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  const name = "AYUSH MAHAJAN"

  return (
    <section id="hero" className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background layers */}
      <IsometricTerrain key={theme} />

      {/* Content layer */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center">
        {/* Pixel label */}
        <p
          className="font-pixel text-[10px] tracking-widest"
          style={{ color: "var(--muted)", fontFamily: "var(--font-press-start)" }}
        >
          {'> HELLO, WORLD_'}
        </p>

        {/* Name with letter animation */}
        <h1
          ref={nameRef}
          className="font-sans text-[clamp(2.5rem,10vw,8rem)] font-black uppercase leading-none tracking-tight"
          style={{ color: "var(--text)" }}
        >
          {name.split("").map((letter, i) => (
            <span
              key={i}
              className="inline-block transition-all"
              style={{
                opacity: loaded ? 1 : 0,
                transform: loaded ? "translateY(0)" : "translateY(-60px)",
                transitionDelay: `${i * 60}ms`,
                transitionDuration: "600ms",
                transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            >
              {letter === " " ? "\u00A0" : letter}
            </span>
          ))}
        </h1>

        {/* Underline */}
        <div
          className="h-1 w-full max-w-lg"
          style={{
            backgroundColor: "var(--accent)",
            opacity: loaded ? 1 : 0,
            transition: "opacity 600ms 800ms",
          }}
        />

        {/* Subtitle */}
        <p
          className="max-w-md text-lg italic"
          style={{
            fontFamily: "var(--font-playfair)",
            color: "var(--muted)",
            opacity: loaded ? 1 : 0,
            transition: "opacity 600ms 1000ms",
          }}
        >
          Software Engineer. Builder. Pixel Enthusiast.
        </p>

        {/* Buttons */}
        <div
          className="flex flex-wrap items-center justify-center gap-4"
          style={{
            opacity: loaded ? 1 : 0,
            transition: "opacity 600ms 1200ms",
          }}
        >
          <a
            href="#projects"
            onClick={(e) => {
              e.preventDefault()
              document.querySelector("#projects")?.scrollIntoView({ behavior: "smooth" })
            }}
            className="inline-flex items-center gap-2 px-6 py-3 font-sans text-sm font-bold uppercase tracking-wide transition-all duration-150"
            style={{
              border: "3px solid var(--text)",
              color: "var(--text)",
              background: "var(--bg2)",
              boxShadow: "4px 4px 0 var(--shadow)",
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
            VIEW WORK <span aria-hidden="true">&#8595;</span>
          </a>
          <a
            href="https://github.com/Zephyrxx0"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 font-sans text-sm font-bold uppercase tracking-wide transition-all duration-150"
            style={{
              border: "3px solid var(--text)",
              color: "var(--text)",
              background: "transparent",
              boxShadow: "4px 4px 0 var(--shadow)",
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
            GITHUB <span aria-hidden="true">&#8599;</span>
          </a>
        </div>
      </div>

      {/* ZEPHYR easter egg sprite */}
      {zephyrWalking && (
        <div
          className="fixed bottom-[10vh] z-50 pointer-events-none"
          style={{
            animation: "zephyrWalk 6s linear forwards",
          }}
        >
          <KnightSprite />
        </div>
      )}

      <style>{`
        @keyframes zephyrWalk {
          from { left: -50px; }
          to { left: 110vw; }
        }
      `}</style>
    </section>
  )
}

function KnightSprite() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const size = 3
    let frame = 0

    // Pixel Knight frames
    const frames = [
      // Frame 0: walking left leg
      [
        [0, 0, 0, 1, 1, 1, 1, 0, 0],
        [0, 0, 1, 2, 2, 2, 1, 1, 0],
        [0, 1, 2, 3, 2, 1, 4, 1, 0],
        [0, 1, 2, 2, 2, 1, 1, 1, 1],
        [0, 0, 1, 1, 1, 1, 1, 4, 1],
        [0, 0, 1, 5, 5, 1, 1, 1, 0],
        [0, 1, 5, 5, 5, 5, 1, 0, 0],
        [1, 5, 5, 1, 1, 5, 5, 1, 0],
        [1, 5, 1, 0, 0, 1, 5, 1, 0],
        [0, 1, 1, 0, 0, 1, 1, 0, 0],
        [0, 0, 0, 0, 0, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 1, 1, 0, 0],
      ],
      // Frame 1: walking right leg
      [
        [0, 0, 0, 1, 1, 1, 1, 0, 0],
        [0, 0, 1, 2, 2, 2, 1, 1, 0],
        [0, 1, 2, 3, 2, 1, 4, 1, 0],
        [0, 1, 2, 2, 2, 1, 1, 1, 1],
        [0, 0, 1, 1, 1, 1, 1, 4, 1],
        [0, 0, 1, 5, 5, 1, 1, 1, 0],
        [0, 1, 5, 5, 5, 5, 1, 0, 0],
        [1, 5, 5, 1, 1, 5, 5, 1, 0],
        [1, 5, 1, 0, 0, 1, 5, 1, 0],
        [0, 1, 1, 0, 0, 1, 1, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 0, 0, 0, 0, 0, 0],
      ],
    ]

    const colors = ["#000000", "#1a1c2c", "#5d275d", "#b13e53", "#ef7d57", "#ffcd75"]
    // 1: outline, 2: helm, 3: visor, 4: sword/shield trim, 5: body armor

    const drawFrame = () => {
      ctx.clearRect(0, 0, 32, 36)
      const f = frames[frame % 2]
      for (let y = 0; y < 12; y++) {
        for (let x = 0; x < 9; x++) {
          const val = f[y][x]
          if (val > 0) {
            ctx.fillStyle = colors[val] || "#fff"
            ctx.fillRect(x * size, y * size, size, size)
          }
        }
      }
    }

    drawFrame()
    const interval = setInterval(() => {
      frame++
      drawFrame()
    }, 250)

    return () => clearInterval(interval)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={27}
      height={36}
      style={{ width: 81, height: 108, imageRendering: "pixelated" }}
    />
  )
}
