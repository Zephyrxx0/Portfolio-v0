"use client"

import { useRef, useEffect } from "react"
import { useTheme } from "@/lib/theme"

interface Ghost {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  phase: number
  frightened: boolean
  frightenedTimer: number
}

interface Dot {
  x: number
  y: number
  alpha: number
}

export default function PacManCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()
  const themeRef = useRef(theme)
  const ghostsRef = useRef<Ghost[]>([])

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

    const darkColors = ["#00cfff", "#ff6b9d", "#00ff9d", "#ffcf00"]
    const earthyColors = ["#c84b00", "#8b6914", "#a0522d", "#cd853f"]

    // Initialize ghosts
    const ghosts: Ghost[] = Array.from({ length: 4 }, (_, i) => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      color: darkColors[i],
      phase: Math.random() * Math.PI * 2,
      frightened: false,
      frightenedTimer: 0,
    }))
    ghostsRef.current = ghosts

    const dots: Dot[] = []

    const drawGhost = (g: Ghost) => {
      const size = 16 * 3 // 16px scaled 3x
      const colors = themeRef.current === "dark" ? darkColors : earthyColors
      const fillColor = g.frightened ? "#2121de" : colors[ghosts.indexOf(g) % colors.length]

      ctx.fillStyle = fillColor
      // Body (rounded top, wavy bottom)
      ctx.beginPath()
      ctx.arc(g.x + size / 2, g.y + size / 2, size / 2, Math.PI, 0, false)
      ctx.lineTo(g.x + size, g.y + size)
      // Wavy bottom
      const segments = 3
      const segW = size / segments
      for (let i = segments; i > 0; i--) {
        const sx = g.x + i * segW
        const cy = g.y + size + (i % 2 === 0 ? -6 : 0)
        ctx.lineTo(sx, cy)
      }
      ctx.lineTo(g.x, g.y + size / 2)
      ctx.fill()

      // Eyes
      ctx.fillStyle = "#fff"
      ctx.fillRect(g.x + size * 0.25, g.y + size * 0.3, 8, 8)
      ctx.fillRect(g.x + size * 0.55, g.y + size * 0.3, 8, 8)
      ctx.fillStyle = g.frightened ? "#fff" : "#111"
      ctx.fillRect(g.x + size * 0.3, g.y + size * 0.35, 4, 4)
      ctx.fillRect(g.x + size * 0.6, g.y + size * 0.35, 4, 4)
    }

    const update = () => {
      ctx.clearRect(0, 0, w, h)

      // Update and draw dots
      for (let i = dots.length - 1; i >= 0; i--) {
        dots[i].alpha -= 0.005
        if (dots[i].alpha <= 0) {
          dots.splice(i, 1)
          continue
        }
        ctx.fillStyle = themeRef.current === "dark"
          ? `rgba(0,255,157,${dots[i].alpha})`
          : `rgba(200,75,0,${dots[i].alpha})`
        ctx.fillRect(dots[i].x, dots[i].y, 4, 4)
      }

      // Update and draw ghosts
      for (const g of ghosts) {
        g.phase += 0.02
        g.x += g.vx + Math.sin(g.phase) * 0.5
        g.y += g.vy + Math.cos(g.phase * 0.7) * 0.3

        // Bounce off edges
        if (g.x < -48) g.x = w + 48
        if (g.x > w + 48) g.x = -48
        if (g.y < -48) g.y = h + 48
        if (g.y > h + 48) g.y = -48

        // Leave dot trail
        if (Math.random() < 0.05) {
          dots.push({ x: g.x + 24, y: g.y + 24, alpha: 0.4 })
        }

        // Frightened timer
        if (g.frightened) {
          g.frightenedTimer--
          if (g.frightenedTimer <= 0) {
            g.frightened = false
            g.vx = (Math.random() - 0.5) * 1.5
            g.vy = (Math.random() - 0.5) * 1.5
          }
        }

        drawGhost(g)
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

    // Click handler: frighten nearest ghost
    const onClick = (e: MouseEvent) => {
      let nearest: Ghost | null = null
      let minDist = Infinity
      for (const g of ghosts) {
        const dx = e.clientX - g.x
        const dy = e.clientY - g.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < minDist && dist < 150) {
          minDist = dist
          nearest = g
        }
      }
      if (nearest) {
        nearest.frightened = true
        nearest.frightenedTimer = 60
        // Dart off screen
        const angle = Math.atan2(nearest.y - e.clientY, nearest.x - e.clientX)
        nearest.vx = Math.cos(angle) * 5
        nearest.vy = Math.sin(angle) * 5
      }
    }
    canvas.addEventListener("click", onClick)

    const onVisChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animId)
      } else {
        update()
      }
    }
    document.addEventListener("visibilitychange", onVisChange)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("resize", onResize)
      canvas.removeEventListener("click", onClick)
      document.removeEventListener("visibilitychange", onVisChange)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0"
      style={{ zIndex: 1, pointerEvents: "auto" }}
    />
  )
}
