"use client"

import { useRef, useEffect, useState } from "react"
import { useTheme } from "@/lib/theme"

// 16x16 pixel art avatar data — developer sprite
const AVATAR_DEV = [
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

// 16x16 pixel art — medieval knight (cozy/whimsical)
// 0=transparent, 7=helmet, 8=visor/eyes, 9=armor, 10=shield, 11=sword, 12=boots, 13=plume, 14=skin
const AVATAR_KNIGHT = [
  [0,0,0,0,0,0,13,13,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,7,7,7,7,7,0,0,0,0,0,0],
  [0,0,0,0,7,7,7,7,7,7,7,0,0,0,0,0],
  [0,0,0,0,7,7,7,7,7,7,7,0,0,0,0,0],
  [0,0,0,0,7,8,8,7,8,8,7,0,0,0,0,0],
  [0,0,0,0,7,7,7,14,7,7,7,0,0,0,0,0],
  [0,0,0,0,0,7,7,7,7,7,0,0,0,0,0,0],
  [0,0,0,0,0,0,14,14,14,0,0,0,0,0,0],
  [0,0,0,10,10,9,9,9,9,9,11,0,0,0,0,0],
  [0,0,0,10,10,9,9,9,9,9,11,11,0,0,0,0],
  [0,0,0,10,10,9,9,9,9,9,0,11,0,0,0,0],
  [0,0,0,0,0,9,9,9,9,9,0,11,0,0,0,0],
  [0,0,0,0,0,9,9,0,9,9,0,0,0,0,0,0],
  [0,0,0,0,0,12,12,0,12,12,0,0,0,0,0,0],
  [0,0,0,0,12,12,12,0,12,12,12,0,0,0,0,0],
  [0,0,0,0,12,12,12,0,12,12,12,0,0,0,0,0],
]

const DEV_DARK_PALETTE: Record<number, string> = {
  0: "transparent",
  1: "#1a1a2e",  // skin dark
  2: "#f0f0f0",  // eye white
  3: "#00ff9d",  // pupil
  4: "#ff6b9d",  // mouth
  5: "#00cfff",  // body
  6: "#0a0a0a",  // shoes
}

const DEV_EARTHY_PALETTE: Record<number, string> = {
  0: "transparent",
  1: "#3a2a1a",
  2: "#f5f0e8",
  3: "#c84b00",
  4: "#cd853f",
  5: "#8b6914",
  6: "#1a1208",
}

const KNIGHT_DARK_PALETTE: Record<number, string> = {
  0: "transparent",
  7: "#4a5568",  // steel helmet
  8: "#00ff9d",  // visor glow
  9: "#6b7b8d",  // armor plate
  10: "#2d4a7a", // shield blue
  11: "#c0c0c0", // sword silver
  12: "#3a2518", // boots dark leather
  13: "#ff6b9d", // plume feather
  14: "#d4a574", // skin/face
}

const KNIGHT_EARTHY_PALETTE: Record<number, string> = {
  0: "transparent",
  7: "#8b6914",  // bronze helmet
  8: "#c84b00",  // amber visor glow
  9: "#a0784a",  // warm armor
  10: "#6b3a2a", // leather shield
  11: "#d4a054", // gold sword
  12: "#3a2518", // boots
  13: "#cd853f", // warm plume
  14: "#d4a574", // skin
}

export default function PixelAvatar() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()
  const [hovering, setHovering] = useState(false)
  const [spriteMode, setSpriteMode] = useState<"dev" | "knight">("dev")
  const [transitioning, setTransitioning] = useState(false)

  const handleToggle = () => {
    setTransitioning(true)
    setTimeout(() => {
      setSpriteMode((prev) => (prev === "dev" ? "knight" : "dev"))
      setTransitioning(false)
    }, 300)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const scale = 12
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
        ? theme === "dark"
          ? DEV_DARK_PALETTE
          : DEV_EARTHY_PALETTE
        : theme === "dark"
        ? KNIGHT_DARK_PALETTE
        : KNIGHT_EARTHY_PALETTE

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      breathPhase += 0.03
      blinkTimer++

      if (blinkTimer > 180 && !isBlinking) {
        isBlinking = true
        setTimeout(() => {
          isBlinking = false
        }, 100)
        blinkTimer = 0
      }

      const breathScale = 1 + Math.sin(breathPhase) * 0.01

      ctx.save()
      ctx.translate(canvas.width / 2, canvas.height)
      ctx.scale(1, breathScale)
      ctx.translate(-canvas.width / 2, -canvas.height)

      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const colorIdx = grid[y][x]

          // Blink: close eyes
          if (spriteMode === "dev") {
            if (isBlinking && colorIdx === 2 && y === 4) continue
            if (isBlinking && colorIdx === 3) continue
          } else {
            // Knight visor blink
            if (isBlinking && colorIdx === 8) {
              ctx.fillStyle = palette[7] || "transparent"
              ctx.fillRect(x * scale, y * scale, scale, scale)
              continue
            }
          }

          // Hover wave for knight: bob sword
          if (hovering && spriteMode === "knight" && colorIdx === 11) {
            waveFrame++
            const yOffset = Math.sin(waveFrame * 0.08) * 0.8
            const color = palette[colorIdx]
            if (color && color !== "transparent") {
              ctx.fillStyle = color
              ctx.fillRect(x * scale, (y + yOffset) * scale, scale, scale)
            }
            continue
          }

          // Hover wave for dev: shift right arm
          if (hovering && spriteMode === "dev" && x >= 12 && y >= 9 && y <= 12 && colorIdx === 5) {
            waveFrame++
            const waveOffset = Math.sin(waveFrame * 0.1) > 0 ? -1 : 0
            ctx.fillStyle = palette[5] || "transparent"
            ctx.fillRect((x + waveOffset) * scale, (y - 1) * scale, scale, scale)
            continue
          }

          const color = palette[colorIdx]
          if (!color || color === "transparent") continue

          ctx.fillStyle = color
          ctx.fillRect(x * scale, y * scale, scale, scale)
        }
      }

      // Accent outline glow
      const accentColor =
        spriteMode === "dev"
          ? palette[3]
          : palette[8]
      ctx.strokeStyle = accentColor || "#00ff9d"
      ctx.lineWidth = 2
      ctx.strokeRect(0, 0, canvas.width, canvas.height)

      ctx.restore()

      animFrame = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animFrame)
  }, [theme, hovering, spriteMode])

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        style={{
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? "scale(0.8) rotateY(90deg)" : "scale(1) rotateY(0deg)",
          transition: "all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <canvas
          ref={canvasRef}
          width={192}
          height={192}
          className="mx-auto cursor-pointer"
          style={{
            width: 192,
            height: 192,
            imageRendering: "pixelated",
          }}
          onClick={handleToggle}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          aria-label={`Pixel avatar showing ${spriteMode === "dev" ? "developer" : "medieval knight"} sprite. Click to toggle.`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleToggle()
          }}
        />
      </div>
      <button
        onClick={handleToggle}
        className="text-[8px] tracking-widest transition-colors duration-200"
        style={{
          fontFamily: "var(--font-press-start)",
          color: "var(--muted)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
      >
        {spriteMode === "dev" ? "CLICK TO TRANSFORM" : "CLICK TO REVERT"}
      </button>
    </div>
  )
}
