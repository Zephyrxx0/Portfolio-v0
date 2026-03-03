"use client"

import { useRef, useEffect } from "react"
import { useTheme } from "@/lib/theme"

interface Particle {
  x: number
  y: number
  speed: number
  phase: number
  size: number
}

export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()
  const themeRef = useRef(theme)

  useEffect(() => {
    themeRef.current = theme
  }, [theme])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animId: number
    let w = window.innerWidth
    let h = window.innerHeight
    canvas.width = w
    canvas.height = h

    const particles: Particle[] = Array.from({ length: 35 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      speed: 0.3 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
      size: 3,
    }))

    const update = () => {
      ctx.clearRect(0, 0, w, h)

      const color = themeRef.current === "dark" ? "0,255,157" : "200,75,0"

      for (const p of particles) {
        p.y -= p.speed
        p.phase += 0.02
        p.x += Math.sin(p.phase) * 0.5

        if (p.y < -10) {
          p.y = h + 10
          p.x = Math.random() * w
        }

        ctx.fillStyle = `rgba(${color},0.15)`
        ctx.fillRect(p.x, p.y, p.size, p.size)
      }

      animId = requestAnimationFrame(update)
    }

    update()

    const onResize = () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w
      canvas.height = h
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
      style={{ zIndex: 2, pointerEvents: "none" }}
    />
  )
}
