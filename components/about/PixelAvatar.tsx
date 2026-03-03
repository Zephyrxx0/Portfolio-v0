"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { useTheme } from "@/lib/theme"

// 16x16 developer sprite
const AVATAR_DEV = [
  [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,0,1,1,2,2,1,1,2,2,1,1,0,0,0],
  [0,0,0,1,1,2,3,1,1,2,3,1,1,0,0,0],
  [0,0,0,1,1,1,1,4,4,1,1,1,1,0,0,0],
  [0,0,0,1,1,1,4,4,4,4,1,1,1,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
  [0,0,5,5,5,5,5,5,5,5,5,5,5,0,0,0],
  [0,0,5,5,5,5,5,5,5,5,5,5,5,0,0,0],
  [0,0,5,5,5,5,5,5,5,5,5,5,5,0,0,0],
  [0,0,5,5,5,5,5,5,5,5,5,5,5,0,0,0],
  [0,0,0,0,0,5,5,0,0,5,5,0,0,0,0,0],
  [0,0,0,0,0,6,6,0,0,6,6,0,0,0,0,0],
  [0,0,0,0,6,6,6,0,0,6,6,6,0,0,0,0],
]

// 16x16 cozy medieval knight — redrawn for better proportions
// Color indices: 0=transparent 7=steel 8=visor/glow 9=armor 10=shield 11=sword 12=boots 13=plume 14=skin 15=highlight
const AVATAR_KNIGHT = [
  [0,0,0,0,0,13,13,13,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,13,7,13,0,0,0,0,0,0,0,0],
  [0,0,0,0,7,7,7,7,7,7,0,0,0,0,0,0],
  [0,0,0,0,7,7,7,7,7,7,7,0,0,0,0,0],
  [0,0,0,0,7,8,8,7,8,8,7,0,0,0,0,0],
  [0,0,0,0,7,7,15,7,15,7,7,0,0,0,0,0],
  [0,0,0,0,0,7,7,14,7,7,0,0,0,0,0,0],
  [0,0,0,0,0,0,14,14,14,0,0,0,0,0,0],
  [0,0,10,10,9,9,9,9,9,9,11,0,0,0,0,0],
  [0,0,10,10,9,9,15,9,9,9,11,11,0,0,0,0],
  [0,0,10,15,9,9,9,9,9,9,0,11,0,0,0,0],
  [0,0,0,0,9,9,9,9,9,9,0,0,0,0,0,0],
  [0,0,0,0,9,9,9,9,9,9,0,0,0,0,0,0],
  [0,0,0,0,12,12,0,0,12,12,0,0,0,0,0,0],
  [0,0,0,12,12,12,0,0,12,12,12,0,0,0,0,0],
  [0,0,0,12,15,12,0,0,12,15,12,0,0,0,0,0],
]

const DEV_DARK: Record<number, string> = {
  0: "transparent", 1: "#1a1a2e", 2: "#f0f0f0", 3: "#00ff9d", 4: "#ff6b9d",
  5: "#00cfff", 6: "#0a0a0a",
}
const DEV_EARTHY: Record<number, string> = {
  0: "transparent", 1: "#3a2a1a", 2: "#f5f0e8", 3: "#c84b00", 4: "#cd853f",
  5: "#8b6914", 6: "#1a1208",
}
const KNIGHT_DARK: Record<number, string> = {
  0: "transparent", 7: "#5a6a7a", 8: "#00ff9d", 9: "#7a8a9a", 10: "#2a4a7a",
  11: "#d0d8e0", 12: "#2a1a0a", 13: "#ff6b9d", 14: "#d4a574", 15: "#aabbc8",
}
const KNIGHT_EARTHY: Record<number, string> = {
  0: "transparent", 7: "#9a7a3a", 8: "#e06820", 9: "#b08050", 10: "#5a3020",
  11: "#d4a840", 12: "#2a1a0a", 13: "#cd853f", 14: "#d4a574", 15: "#c49840",
}

type SpriteMode = "dev" | "knight"

interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string }

export default function PixelAvatar() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particleCanvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()
  const [hovering, setHovering] = useState(false)
  const [spriteMode, setSpriteMode] = useState<SpriteMode>("dev")
  const [transitioning, setTransitioning] = useState(false)
  const [showLabel, setShowLabel] = useState(false)
  const particlesRef = useRef<Particle[]>([])
  const animRef = useRef<number>(0)

  // Spawn burst particles on toggle
  const spawnBurst = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const cx = rect.width / 2
    const cy = rect.height / 2
    const accentColor = theme === "dark" ? "#00ff9d" : "#c84b00"
    const secondColor = theme === "dark" ? "#ff6b9d" : "#cd853f"
    const colors = [accentColor, secondColor, "#f0f0f0"]

    for (let i = 0; i < 22; i++) {
      const angle = (i / 22) * Math.PI * 2 + Math.random() * 0.3
      const speed = 1.5 + Math.random() * 3
      particlesRef.current.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }
  }, [theme])

  const handleToggle = useCallback(() => {
    if (transitioning) return
    spawnBurst()
    setTransitioning(true)
    setShowLabel(true)
    setTimeout(() => {
      setSpriteMode((prev) => (prev === "dev" ? "knight" : "dev"))
      setTransitioning(false)
    }, 280)
    setTimeout(() => setShowLabel(false), 1800)
  }, [transitioning, spawnBurst])

  // Sprite canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const scale = 11
    canvas.width = 16 * scale
    canvas.height = 16 * scale

    let animFrame: number
    let breathPhase = 0
    let blinkTimer = 0
    let isBlinking = false
    let waveFrame = 0

    const grid = spriteMode === "dev" ? AVATAR_DEV : AVATAR_KNIGHT
    const palette =
      spriteMode === "dev"
        ? theme === "dark" ? DEV_DARK : DEV_EARTHY
        : theme === "dark" ? KNIGHT_DARK : KNIGHT_EARTHY

    const accent = theme === "dark" ? "#00ff9d" : "#c84b00"

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      breathPhase += 0.025
      blinkTimer++
      if (blinkTimer > 200 && !isBlinking) {
        isBlinking = true
        blinkTimer = 0
        setTimeout(() => { isBlinking = false }, 110)
      }

      const breathOffset = Math.sin(breathPhase) * 0.6

      ctx.save()
      ctx.translate(0, breathOffset)

      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const idx = grid[y][x]

          // Blink logic
          if (spriteMode === "dev") {
            if (isBlinking && (idx === 2 || idx === 3) && y >= 3 && y <= 4) continue
          } else {
            if (isBlinking && idx === 8) {
              ctx.fillStyle = palette[7]
              ctx.fillRect(x * scale, y * scale, scale, scale)
              continue
            }
          }

          // Sword hover bob
          if (hovering && spriteMode === "knight" && idx === 11) {
            waveFrame += 0.12
            const yOff = Math.sin(waveFrame) * 0.9
            const c = palette[idx]
            if (c && c !== "transparent") {
              ctx.fillStyle = c
              ctx.fillRect(x * scale, (y + yOff) * scale, scale, scale)
            }
            continue
          }

          const color = palette[idx]
          if (!color || color === "transparent") continue
          ctx.fillStyle = color
          ctx.fillRect(x * scale, y * scale, scale, scale)
        }
      }

      // Hover glow ring
      if (hovering) {
        ctx.strokeStyle = accent
        ctx.lineWidth = 2
        ctx.globalAlpha = 0.4 + Math.sin(breathPhase * 3) * 0.15
        ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4)
        ctx.globalAlpha = 1
      }

      ctx.restore()

      animFrame = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animFrame)
  }, [theme, hovering, spriteMode])

  // Particle canvas
  useEffect(() => {
    const canvas = particleCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animId: number

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particlesRef.current = particlesRef.current.filter((p) => p.life > 0)
      for (const p of particlesRef.current) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.08
        p.life -= 0.032
        ctx.globalAlpha = Math.max(0, p.life)
        ctx.fillStyle = p.color
        ctx.fillRect(Math.round(p.x) - 2, Math.round(p.y) - 2, 4, 4)
      }
      ctx.globalAlpha = 1
      animId = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(animId)
  }, [])

  const label = spriteMode === "dev" ? "[ DEVELOPER ]" : "[ KNIGHT MODE ]"
  const accent = theme === "dark" ? "#00ff9d" : "#c84b00"

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {/* Particle canvas overlay */}
        <canvas
          ref={particleCanvasRef}
          width={176}
          height={176}
          className="pointer-events-none absolute inset-0"
          style={{ width: 176, height: 176, zIndex: 10 }}
          aria-hidden="true"
        />

        {/* Sprite canvas */}
        <canvas
          ref={canvasRef}
          width={176}
          height={176}
          className="mx-auto cursor-pointer"
          style={{
            width: 176,
            height: 176,
            imageRendering: "pixelated",
            opacity: transitioning ? 0 : 1,
            transform: transitioning
              ? "scale(0.75) rotateY(90deg)"
              : "scale(1) rotateY(0deg)",
            transition: "opacity 280ms ease, transform 280ms cubic-bezier(0.34,1.56,0.64,1)",
          }}
          onClick={handleToggle}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          aria-label={`Pixel avatar in ${spriteMode === "dev" ? "developer" : "medieval knight"} mode. Click to toggle.`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleToggle()
          }}
        />
      </div>

      {/* Label */}
      <div className="flex flex-col items-center gap-1">
        <p
          className="text-[8px] tracking-widest transition-all duration-300 cursor-pointer select-none"
          style={{
            fontFamily: "var(--font-press-start)",
            color: showLabel ? accent : "var(--muted)",
            textShadow: showLabel ? `0 0 8px ${accent}` : "none",
          }}
          onClick={handleToggle}
          aria-hidden="true"
        >
          {label}
        </p>
        <p
          className="text-[6px] tracking-widest"
          style={{
            fontFamily: "var(--font-press-start)",
            color: "var(--muted)",
            opacity: 0.6,
          }}
        >
          CLICK TO TOGGLE
        </p>
      </div>
    </div>
  )
}
