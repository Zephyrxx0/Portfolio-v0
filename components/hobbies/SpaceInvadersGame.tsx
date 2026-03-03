"use client"

import { useRef, useEffect, useState, useCallback } from "react"

interface SpaceInvadersGameProps {
  onClose: () => void
  accentColor: string
}

interface Entity {
  x: number
  y: number
  alive: boolean
}

interface Bullet {
  x: number
  y: number
  dy: number
}

export default function SpaceInvadersGame({ onClose, accentColor }: SpaceInvadersGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [gameOver, setGameOver] = useState(false)
  const keysRef = useRef<Set<string>>(new Set())

  const restart = useCallback(() => {
    setScore(0)
    setLives(3)
    setGameOver(false)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const W = 600
    const H = 400
    canvas.width = W
    canvas.height = H

    // Player
    const player = { x: W / 2 - 8, y: H - 30, width: 16, speed: 4 }
    let playerBullets: Bullet[] = []
    let enemyBullets: Bullet[] = []
    let localScore = 0
    let localLives = 3
    let isGameOver = false
    let shootCooldown = 0

    // Enemies: 3 rows x 8
    const enemies: Entity[][] = []
    for (let row = 0; row < 3; row++) {
      const rowArr: Entity[] = []
      for (let col = 0; col < 8; col++) {
        rowArr.push({ x: 60 + col * 60, y: 40 + row * 35, alive: true })
      }
      enemies.push(rowArr)
    }
    let enemyDir = 1
    let enemySpeed = 0.5
    let enemyMoveTimer = 0

    const keys = keysRef.current

    const onKeyDown = (e: KeyboardEvent) => {
      keys.add(e.key)
      e.preventDefault()
    }
    const onKeyUp = (e: KeyboardEvent) => {
      keys.delete(e.key)
    }

    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)

    let animId: number

    const gameLoop = () => {
      if (isGameOver) return

      ctx.fillStyle = "#0a0a0a"
      ctx.fillRect(0, 0, W, H)

      // Player movement
      if (keys.has("ArrowLeft") && player.x > 0) player.x -= player.speed
      if (keys.has("ArrowRight") && player.x < W - player.width) player.x += player.speed

      // Shooting
      shootCooldown--
      if (keys.has(" ") && shootCooldown <= 0) {
        playerBullets.push({ x: player.x + 6, y: player.y - 4, dy: -5 })
        shootCooldown = 15
      }

      // Draw player (pixel ship)
      ctx.fillStyle = accentColor
      ctx.fillRect(player.x + 6, player.y, 4, 4)
      ctx.fillRect(player.x + 2, player.y + 4, 12, 4)
      ctx.fillRect(player.x, player.y + 8, 16, 4)

      // Player bullets
      for (let i = playerBullets.length - 1; i >= 0; i--) {
        const b = playerBullets[i]
        b.y += b.dy
        ctx.fillStyle = accentColor
        ctx.fillRect(b.x, b.y, 3, 6)

        if (b.y < 0) {
          playerBullets.splice(i, 1)
          continue
        }

        // Check collision with enemies
        let hit = false
        for (const row of enemies) {
          for (const e of row) {
            if (e.alive && b.x >= e.x && b.x <= e.x + 8 && b.y >= e.y && b.y <= e.y + 8) {
              e.alive = false
              hit = true
              localScore += 100
              setScore(localScore)
              break
            }
          }
          if (hit) break
        }
        if (hit) playerBullets.splice(i, 1)
      }

      // Enemy movement
      enemyMoveTimer++
      if (enemyMoveTimer > 3) {
        enemyMoveTimer = 0
        let hitEdge = false
        for (const row of enemies) {
          for (const e of row) {
            if (!e.alive) continue
            e.x += enemyDir * enemySpeed
            if (e.x > W - 20 || e.x < 10) hitEdge = true
          }
        }
        if (hitEdge) {
          enemyDir *= -1
          for (const row of enemies) {
            for (const e of row) {
              e.y += 8
            }
          }
        }
      }

      // Draw enemies
      for (const row of enemies) {
        for (const e of row) {
          if (!e.alive) continue
          ctx.fillStyle = "#ff6b9d"
          ctx.fillRect(e.x, e.y, 8, 4)
          ctx.fillRect(e.x - 2, e.y + 4, 12, 4)
          ctx.fillRect(e.x, e.y + 8, 2, 2)
          ctx.fillRect(e.x + 6, e.y + 8, 2, 2)
        }
      }

      // Enemy shooting
      if (Math.random() < 0.01) {
        const aliveEnemies = enemies.flat().filter((e) => e.alive)
        if (aliveEnemies.length > 0) {
          const shooter = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)]
          enemyBullets.push({ x: shooter.x + 4, y: shooter.y + 10, dy: 3 })
        }
      }

      // Enemy bullets
      for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const b = enemyBullets[i]
        b.y += b.dy
        ctx.fillStyle = "#ff6b6b"
        ctx.fillRect(b.x, b.y, 3, 6)

        if (b.y > H) {
          enemyBullets.splice(i, 1)
          continue
        }

        // Hit player?
        if (b.x >= player.x && b.x <= player.x + 16 && b.y >= player.y && b.y <= player.y + 12) {
          enemyBullets.splice(i, 1)
          localLives--
          setLives(localLives)
          if (localLives <= 0) {
            isGameOver = true
            setGameOver(true)
            return
          }
        }
      }

      // Check win
      const allDead = enemies.flat().every((e) => !e.alive)
      if (allDead) {
        isGameOver = true
        setGameOver(true)
        return
      }

      // Check enemies reached bottom
      for (const row of enemies) {
        for (const e of row) {
          if (e.alive && e.y > H - 40) {
            isGameOver = true
            setGameOver(true)
            return
          }
        }
      }

      // HUD
      ctx.fillStyle = "#f0f0f0"
      ctx.font = "10px 'Press Start 2P', monospace"
      ctx.fillText(`SCORE: ${localScore}`, 10, 20)
      ctx.fillText(`LIVES: ${"*".repeat(localLives)}`, W - 120, 20)

      animId = requestAnimationFrame(gameLoop)
    }

    if (!gameOver) {
      animId = requestAnimationFrame(gameLoop)
    }

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
    }
  }, [gameOver, accentColor])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.9)" }}
    >
      <div
        style={{
          border: "3px solid #f0f0f0",
          boxShadow: `8px 8px 0 ${accentColor}`,
          background: "#0a0a0a",
        }}
      >
        <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: "2px solid #2a2a2a" }}>
          <span
            className="text-xs"
            style={{ fontFamily: "var(--font-press-start)", color: accentColor }}
          >
            SPACE INVADERS
          </span>
          <button
            onClick={onClose}
            className="text-sm font-bold"
            style={{ color: "#f0f0f0", fontFamily: "var(--font-jetbrains)" }}
          >
            [X]
          </button>
        </div>

        <canvas
          ref={canvasRef}
          className="block"
          style={{ imageRendering: "pixelated" }}
        />

        {gameOver && (
          <div
            className="flex flex-col items-center gap-4 p-6"
            style={{ borderTop: "2px solid #2a2a2a" }}
          >
            <p
              className="text-xs"
              style={{ fontFamily: "var(--font-press-start)", color: "#ff6b6b" }}
            >
              GAME OVER
            </p>
            <p
              className="text-xs"
              style={{ fontFamily: "var(--font-press-start)", color: "#f0f0f0" }}
            >
              SCORE: {score}
            </p>
            <button
              onClick={restart}
              className="px-4 py-2 text-xs font-bold"
              style={{
                fontFamily: "var(--font-press-start)",
                border: "2px solid #f0f0f0",
                color: "#f0f0f0",
                background: "transparent",
              }}
            >
              INSERT COIN?
            </button>
          </div>
        )}

        {!gameOver && (
          <div className="px-4 py-2 text-center" style={{ borderTop: "2px solid #2a2a2a" }}>
            <p className="text-[8px]" style={{ fontFamily: "var(--font-press-start)", color: "#555" }}>
              {"ARROWS: MOVE  |  SPACE: SHOOT"}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
