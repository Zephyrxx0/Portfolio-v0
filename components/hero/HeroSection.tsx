"use client"

import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import PacManCanvas from "./PacManCanvas"
import ParticleField from "./ParticleField"

const ThreeBackground = dynamic(() => import("./ThreeBackground"), { ssr: false })

export default function HeroSection() {
  const nameRef = useRef<HTMLHeadingElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [zephyrWalking, setZephyrWalking] = useState(false)
  const keyBuffer = useRef<string[]>([])

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
      <ThreeBackground />
      <PacManCanvas />
      <ParticleField />

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
          className="fixed bottom-[10vh] z-50"
          style={{
            animation: "zephyrWalk 3s linear forwards",
          }}
        >
          <ZephyrSprite />
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

function ZephyrSprite() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const size = 4
    let frame = 0

    // Simple pixel character frames
    const frames = [
      // Frame 0: standing left leg
      [
        [0,0,1,1,1,1,0,0],
        [0,1,1,1,1,1,1,0],
        [0,1,0,1,1,0,1,0],
        [0,1,1,1,1,1,1,0],
        [0,0,1,1,1,1,0,0],
        [0,0,0,1,1,0,0,0],
        [0,0,1,0,0,1,0,0],
        [0,1,0,0,0,0,1,0],
      ],
      // Frame 1: standing right leg
      [
        [0,0,1,1,1,1,0,0],
        [0,1,1,1,1,1,1,0],
        [0,1,0,1,1,0,1,0],
        [0,1,1,1,1,1,1,0],
        [0,0,1,1,1,1,0,0],
        [0,0,0,1,1,0,0,0],
        [0,0,0,1,1,0,0,0],
        [0,0,1,0,0,1,0,0],
      ],
    ]

    const drawFrame = () => {
      ctx.clearRect(0, 0, 32, 32)
      const f = frames[frame % 2]
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          if (f[y][x]) {
            ctx.fillStyle = "#00ff9d"
            ctx.fillRect(x * size, y * size, size, size)
          }
        }
      }
    }

    drawFrame()
    const interval = setInterval(() => {
      frame++
      drawFrame()
    }, 200)

    return () => clearInterval(interval)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={32}
      height={32}
      style={{ width: 48, height: 48, imageRendering: "pixelated" }}
    />
  )
}
