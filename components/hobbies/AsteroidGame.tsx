"use client"

import { useRef, useEffect, useState, useCallback } from "react"

interface AsteroidGameProps {
    onClose: () => void
    accentColor: string
}

export default function AsteroidGame({ onClose, accentColor }: AsteroidGameProps) {
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

        const W = 750
        const H = 500
        canvas.width = W
        canvas.height = H

        const ship = { x: W / 2, y: H / 2, r: 8, angle: -Math.PI / 2, vx: 0, vy: 0, rotSpeed: 0.07, thrust: 0.06 }
        const bullets: { x: number, y: number, vx: number, vy: number, life: number }[] = []
        let asteroids: { x: number, y: number, vx: number, vy: number, r: number, points: number[] }[] = []

        let localScore = 0
        let localLives = 3
        let isGameOver = false
        let shootCooldown = 0
        let invulnTimer = 60

        // Generate random polygon points for asteroids
        const createAsteroid = (x: number, y: number, r: number) => {
            const points = []
            const verts = Math.floor(Math.random() * 5 + 5)
            for (let i = 0; i < verts; i++) {
                points.push(r * (0.5 + Math.random() * 0.5))
            }
            return {
                x, y,
                vx: (Math.random() - 0.5) * 2.4,
                vy: (Math.random() - 0.5) * 2.4,
                r, points
            }
        }

        // Initial asteroids
        for (let i = 0; i < 4; i++) {
            asteroids.push(createAsteroid(Math.random() * W, Math.random() * H, 30))
        }

        const keys = keysRef.current
        const onKeyDown = (e: KeyboardEvent) => { keys.add(e.key); e.preventDefault() }
        const onKeyUp = (e: KeyboardEvent) => { keys.delete(e.key) }

        window.addEventListener("keydown", onKeyDown)
        window.addEventListener("keyup", onKeyUp)

        let animId: number

        const gameLoop = () => {
            if (isGameOver) return

            ctx.fillStyle = "#0a0a0a"
            ctx.fillRect(0, 0, W, H)

            // Ship controls
            if (keys.has("ArrowLeft") || keys.has("a")) ship.angle -= ship.rotSpeed
            if (keys.has("ArrowRight") || keys.has("d")) ship.angle += ship.rotSpeed
            if (keys.has("ArrowUp") || keys.has("w")) {
                ship.vx += Math.cos(ship.angle) * ship.thrust
                ship.vy += Math.sin(ship.angle) * ship.thrust
            }

            // Friction
            ship.vx *= 0.99
            ship.vy *= 0.99

            ship.x += ship.vx
            ship.y += ship.vy

            // Wrap ship
            if (ship.x < 0) ship.x = W
            if (ship.x > W) ship.x = 0
            if (ship.y < 0) ship.y = H
            if (ship.y > H) ship.y = 0

            // Shoot
            shootCooldown--
            if (keys.has(" ") && shootCooldown <= 0) {
                bullets.push({
                    x: ship.x + Math.cos(ship.angle) * ship.r,
                    y: ship.y + Math.sin(ship.angle) * ship.r,
                    vx: ship.vx + Math.cos(ship.angle) * 3.5,
                    vy: ship.vy + Math.sin(ship.angle) * 3.5,
                    life: 60
                })
                shootCooldown = 15
            }

            // Draw Ship
            if (invulnTimer > 0) invulnTimer--
            if (invulnTimer % 10 < 5) {
                ctx.save()
                ctx.translate(ship.x, ship.y)
                ctx.rotate(ship.angle)
                ctx.strokeStyle = accentColor
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.moveTo(ship.r, 0)
                ctx.lineTo(-ship.r, ship.r - 2)
                ctx.lineTo(-ship.r + 2, 0)
                ctx.lineTo(-ship.r, -ship.r + 2)
                ctx.closePath()
                ctx.stroke()
                // Thrust flame
                if ((keys.has("ArrowUp") || keys.has("w")) && Math.random() > 0.5) {
                    ctx.beginPath()
                    ctx.moveTo(-ship.r, 2)
                    ctx.lineTo(-ship.r - 6, 0)
                    ctx.lineTo(-ship.r, -2)
                    ctx.stroke()
                }
                ctx.restore()
            }

            // Bullets
            for (let i = bullets.length - 1; i >= 0; i--) {
                const b = bullets[i]
                b.x += b.vx
                b.y += b.vy
                b.life--

                if (b.x < 0) b.x = W
                if (b.x > W) b.x = 0
                if (b.y < 0) b.y = H
                if (b.y > H) b.y = 0

                ctx.fillStyle = "#fff"
                ctx.fillRect(b.x, b.y, 2, 2)

                if (b.life <= 0) {
                    bullets.splice(i, 1)
                    continue
                }

                // Bullet hit asteroid?
                let hit = false
                for (let j = asteroids.length - 1; j >= 0; j--) {
                    const a = asteroids[j]
                    const dist = Math.hypot(b.x - a.x, b.y - a.y)
                    if (dist < a.r) {
                        hit = true
                        localScore += 100
                        setScore(localScore)
                        if (a.r > 15) {
                            asteroids.push(createAsteroid(a.x, a.y, a.r / 2))
                            asteroids.push(createAsteroid(a.x, a.y, a.r / 2))
                        }
                        asteroids.splice(j, 1)
                        break
                    }
                }
                if (hit) bullets.splice(i, 1)
            }

            // Asteroids
            for (let i = asteroids.length - 1; i >= 0; i--) {
                const a = asteroids[i]
                a.x += a.vx
                a.y += a.vy

                if (a.x < -a.r) a.x = W + a.r
                if (a.x > W + a.r) a.x = -a.r
                if (a.y < -a.r) a.y = H + a.r
                if (a.y > H + a.r) a.y = -a.r

                ctx.save()
                ctx.translate(a.x, a.y)
                ctx.strokeStyle = "#f0f0f0"
                ctx.lineWidth = 2
                ctx.beginPath()
                for (let j = 0; j < a.points.length; j++) {
                    const ang = (j / a.points.length) * Math.PI * 2
                    const r = a.points[j]
                    if (j === 0) ctx.moveTo(Math.cos(ang) * r, Math.sin(ang) * r)
                    else ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r)
                }
                ctx.closePath()
                ctx.stroke()
                ctx.restore()

                // Ship hit asteroid?
                if (invulnTimer <= 0) {
                    const dist = Math.hypot(ship.x - a.x, ship.y - a.y)
                    if (dist < a.r + ship.r) {
                        localLives--
                        setLives(localLives)
                        if (localLives <= 0) {
                            isGameOver = true
                            setGameOver(true)
                            return
                        } else {
                            // Reset ship
                            ship.x = W / 2; ship.y = H / 2; ship.vx = 0; ship.vy = 0
                            invulnTimer = 60
                        }
                    }
                }
            }

            // Next level if cleared
            if (asteroids.length === 0) {
                for (let i = 0; i < 6; i++) {
                    asteroids.push(createAsteroid(Math.random() * W, Math.random() * H, 30))
                }
            }

            // HUD
            ctx.fillStyle = "#f0f0f0"
            ctx.font = "10px 'Press Start 2P', monospace"
            ctx.fillText(`SCORE: ${localScore}`, 10, 20)
            ctx.fillText(`LIVES: ${"A ".repeat(localLives)}`, W - 100, 20)

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
                        ASTEROIDS
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
                        className="absolute inset-0 flex flex-col items-center justify-center p-6"
                        style={{
                            background: "rgba(10, 10, 10, 0.85)",
                            backdropFilter: "blur(4px)",
                            zIndex: 10
                        }}
                    >
                        <p
                            className="text-2xl mb-8 animate-pulse"
                            style={{ fontFamily: "var(--font-press-start)", color: "#ff6b6b", textShadow: "4px 4px 0px rgba(255, 107, 107, 0.3)" }}
                        >
                            GAME OVER
                        </p>

                        <div className="flex flex-col gap-4 mb-10 w-64 p-6" style={{ border: `2px solid ${accentColor}`, background: "#111" }}>
                            <div className="flex justify-between w-full">
                                <span className="text-xs" style={{ fontFamily: "var(--font-press-start)", color: "#aaa" }}>SCORE:</span>
                                <span className="text-xs" style={{ fontFamily: "var(--font-press-start)", color: "#fff" }}>{score}</span>
                            </div>
                            <div className="flex justify-between w-full">
                                <span className="text-xs" style={{ fontFamily: "var(--font-press-start)", color: "#aaa" }}>ASTEROIDS:</span>
                                <span className="text-xs" style={{ fontFamily: "var(--font-press-start)", color: "#fff" }}>{Math.floor(score / 100)}</span>
                            </div>
                            <div className="flex justify-between w-full">
                                <span className="text-xs" style={{ fontFamily: "var(--font-press-start)", color: "#aaa" }}>RATING:</span>
                                <span className="text-xs" style={{ fontFamily: "var(--font-press-start)", color: (score > 2000 ? "#00ff9d" : score > 1000 ? "#ffcf00" : "#ff6b6b") }}>
                                    {score > 2000 ? "S RANK" : score > 1000 ? "A RANK" : score > 500 ? "B RANK" : "C RANK"}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={restart}
                            className="px-6 py-4 text-xs font-bold transition-all hover:scale-105"
                            style={{
                                fontFamily: "var(--font-press-start)",
                                border: `3px solid ${accentColor}`,
                                color: "#0a0a0a",
                                background: accentColor,
                                boxShadow: "4px 4px 0 #fff"
                            }}
                        >
                            PLAY AGAIN
                        </button>
                    </div>
                )}

                {!gameOver && (
                    <div className="px-4 py-2 text-center" style={{ borderTop: "2px solid #2a2a2a" }}>
                        <p className="text-[8px]" style={{ fontFamily: "var(--font-press-start)", color: "#555" }}>
                            {"W/A/D: MOVE  |  SPACE: SHOOT"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
