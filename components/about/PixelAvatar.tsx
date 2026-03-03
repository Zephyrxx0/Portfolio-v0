"use client"

import { useRef, useEffect, useState } from "react"
import { useTheme } from "@/lib/theme"

// 16x16 pixel art avatar data
const AVATAR_IDLE = [
  [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,0,1,1,2,2,1,1,2,2,1,1,0,0,0],
  [0,0,0,1,1,2,3,1,1,2,3,1,1,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,0,1,1,1,4,4,4,1,1,1,1,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
  [0,0,5,5,5,5,5,5,5,5,5,5,5,0,0,0],
  [0,0,5,5,5,5,5,5,5,5,5,5,5,0,0,0],
  [0,0,5,5,5,5,5,5,5,5,5,5,5,0,0,0],
  [0,0,5,5,5,5,5,5,5,5,5,5,5,0,0,0],
  [0,0,0,0,0,5,5,0,5,5,0,0,0,0,0,0],
  [0,0,0,0,0,6,6,0,6,6,0,0,0,0,0,0],
  [0,0,0,0,6,6,6,0,6,6,6,0,0,0,0,0],
]

const DARK_PALETTE: Record<number, string> = {
  0: "transparent",
  1: "#1a1a2e", // skin dark
  2: "#f0f0f0", // eye white
  3: "#00ff9d", // pupil
  4: "#ff6b9d", // mouth
  5: "#00cfff", // body
  6: "#0a0a0a", // shoes
}

const EARTHY_PALETTE: Record<number, string> = {
  0: "transparent",
  1: "#3a2a1a", // skin dark
  2: "#f5f0e8", // eye white
  3: "#c84b00", // pupil
  4: "#cd853f", // mouth
  5: "#8b6914", // body
  6: "#1a1208", // shoes
}

export default function PixelAvatar() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const scale = 12 // Display at 192x192 (16x12)
    canvas.width = 16 * scale
    canvas.height = 16 * scale

    let animFrame: number
    let breathPhase = 0
    let blinkTimer = 0
    let isBlinking = false
    let waveFrame = 0

    const palette = theme === "dark" ? DARK_PALETTE : EARTHY_PALETTE

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      breathPhase += 0.03
      blinkTimer++

      // Blink every ~3s (180 frames at 60fps)
      if (blinkTimer > 180 && !isBlinking) {
        isBlinking = true
        setTimeout(() => { isBlinking = false }, 100)
        blinkTimer = 0
      }

      const breathScale = 1 + Math.sin(breathPhase) * 0.01

      ctx.save()
      ctx.translate(canvas.width / 2, canvas.height)
      ctx.scale(1, breathScale)
      ctx.translate(-canvas.width / 2, -canvas.height)

      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          let colorIdx = AVATAR_IDLE[y][x]

          // Blink: close eyes
          if (isBlinking && colorIdx === 2 && y === 4) {
            colorIdx = 1
          }
          if (isBlinking && colorIdx === 3) {
            colorIdx = 1
          }

          // Hover wave: shift right arm
          if (hovering && x >= 12 && y >= 9 && y <= 12) {
            waveFrame++
            const waveOffset = Math.sin(waveFrame * 0.1) > 0 ? -1 : 0
            if (colorIdx === 5) {
              ctx.fillStyle = palette[5]
              ctx.fillRect((x + waveOffset) * scale, (y - 1) * scale, scale, scale)
              continue
            }
          }

          const color = palette[colorIdx]
          if (color === "transparent") continue

          ctx.fillStyle = color
          ctx.fillRect(x * scale, y * scale, scale, scale)
        }
      }

      // Accent outline glow
      ctx.strokeStyle = palette[3]
      ctx.lineWidth = 2
      ctx.strokeRect(0, 0, canvas.width, canvas.height)

      ctx.restore()

      animFrame = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animFrame)
  }, [theme, hovering])

  return (
    <canvas
      ref={canvasRef}
      width={192}
      height={192}
      className="mx-auto"
      style={{
        width: 192,
        height: 192,
        imageRendering: "pixelated",
      }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    />
  )
}
