"use client"

import { useRef, useEffect } from "react"
import { useTheme } from "@/lib/theme"

// Simple hash-based noise (no external lib needed)
function hash(x: number, y: number): number {
  let h = x * 374761393 + y * 668265263
  h = ((h ^ (h >> 13)) * 1274126177) | 0
  return ((h ^ (h >> 16)) >>> 0) / 4294967296
}

function smoothNoise(x: number, y: number): number {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const fx = x - ix
  const fy = y - iy
  const sx = fx * fx * (3 - 2 * fx)
  const sy = fy * fy * (3 - 2 * fy)

  const n00 = hash(ix, iy)
  const n10 = hash(ix + 1, iy)
  const n01 = hash(ix, iy + 1)
  const n11 = hash(ix + 1, iy + 1)

  const nx0 = n00 + sx * (n10 - n00)
  const nx1 = n01 + sx * (n11 - n01)
  return nx0 + sy * (nx1 - nx0)
}

function fbm(x: number, y: number, octaves = 3): number {
  let val = 0
  let amp = 1
  let freq = 1
  let max = 0
  for (let i = 0; i < octaves; i++) {
    val += smoothNoise(x * freq, y * freq) * amp
    max += amp
    amp *= 0.5
    freq *= 2
  }
  return val / max
}

export default function IsometricTerrain() {
  const mountRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  const themeRef = useRef(theme)

  useEffect(() => {
    themeRef.current = theme
  }, [theme])

  useEffect(() => {
    let animId: number
    let disposed = false

    const init = async () => {
      const THREE = await import("three")
      if (disposed || !mountRef.current) return

      const scene = new THREE.Scene()

      // Isometric-style orthographic camera
      const aspect = window.innerWidth / window.innerHeight
      const frustum = 12
      const camera = new THREE.OrthographicCamera(
        -frustum * aspect / 2, frustum * aspect / 2,
        frustum / 2, -frustum / 2,
        0.1, 100
      )
      // Classic isometric angle
      camera.position.set(10, 10, 10)
      camera.lookAt(0, 0, 0)

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      mountRef.current.appendChild(renderer.domElement)

      // Lights
      const ambient = new THREE.AmbientLight(0x404040, 1.5)
      scene.add(ambient)
      const sun = new THREE.DirectionalLight(0xffffff, 0.8)
      sun.position.set(8, 12, 6)
      scene.add(sun)

      // World group (for floating/rotation)
      const world = new THREE.Group()
      scene.add(world)

      // Color palettes
      const darkColors = {
        grass1: 0x1a472a,
        grass2: 0x2d6a4f,
        stone: 0x4a4a5a,
        water: 0x1a3a5c,
        dirt: 0x3a2a1a,
        path: 0x5a5a6a,
        castle: 0x5a5a6a,
        castleTop: 0x4a4a5a,
        trunk: 0x3a2518,
        leaves: 0x1a6a3a,
        flag: 0xff6b9d,
        window: 0x00ff9d,
        accent: 0x00ff9d,
      }
      const earthyColors = {
        grass1: 0x5a7a3a,
        grass2: 0x6a8a4a,
        stone: 0x8a7a6a,
        water: 0x4a6a50,
        dirt: 0x6a5a4a,
        path: 0xc4a76c,
        castle: 0x8a7a6a,
        castleTop: 0x7a6a5a,
        trunk: 0x5a3a1a,
        leaves: 0x5a8a3a,
        flag: 0xcd853f,
        window: 0xc84b00,
        accent: 0xc84b00,
      }

      // Use instanced mesh for terrain blocks
      const blockGeo = new THREE.BoxGeometry(0.95, 0.95, 0.95)
      const gridSize = 16
      const blockCount = gridSize * gridSize
      const grassMat1 = new THREE.MeshLambertMaterial({ color: darkColors.grass1 })
      const grassMat2 = new THREE.MeshLambertMaterial({ color: darkColors.grass2 })
      const stoneMat = new THREE.MeshLambertMaterial({ color: darkColors.stone })
      const waterMat = new THREE.MeshLambertMaterial({ color: darkColors.water, transparent: true, opacity: 0.7 })
      const dirtMat = new THREE.MeshLambertMaterial({ color: darkColors.dirt })
      const pathMat = new THREE.MeshLambertMaterial({ color: darkColors.path })

      const allMaterials = [grassMat1, grassMat2, stoneMat, waterMat, dirtMat, pathMat]

      // Castle materials
      const castleMat = new THREE.MeshLambertMaterial({ color: darkColors.castle })
      const castleTopMat = new THREE.MeshLambertMaterial({ color: darkColors.castleTop })
      const flagMat = new THREE.MeshLambertMaterial({ color: darkColors.flag })
      const windowMat = new THREE.MeshLambertMaterial({ color: darkColors.window, emissive: darkColors.window, emissiveIntensity: 0.6 })
      const trunkMat = new THREE.MeshLambertMaterial({ color: darkColors.trunk })
      const leavesMat = new THREE.MeshLambertMaterial({ color: darkColors.leaves })

      const castleMats = [castleMat, castleTopMat, flagMat, windowMat, trunkMat, leavesMat]

      // Generate terrain heightmap
      const heights: number[][] = []
      const blockTypes: string[][] = []

      for (let z = 0; z < gridSize; z++) {
        heights[z] = []
        blockTypes[z] = []
        for (let x = 0; x < gridSize; x++) {
          const nx = x / gridSize
          const nz = z / gridSize
          let h = fbm(nx * 3 + 0.5, nz * 3 + 0.5) * 4

          // Flatten center area for castle
          const cx = x - gridSize / 2
          const cz = z - gridSize / 2
          const dist = Math.sqrt(cx * cx + cz * cz)
          if (dist < 3) {
            h = 2 + (h - 2) * (dist / 3)
          }

          heights[z][x] = Math.round(h * 2) / 2

          // Determine type
          if (h < 0.8) {
            blockTypes[z][x] = "water"
          } else if (dist < 2.5 && dist > 1.5) {
            blockTypes[z][x] = "path"
          } else if (h > 3) {
            blockTypes[z][x] = "stone"
          } else if (h < 1.2) {
            blockTypes[z][x] = "dirt"
          } else {
            blockTypes[z][x] = hash(x * 7, z * 13) > 0.5 ? "grass1" : "grass2"
          }
        }
      }

      // Place terrain blocks
      const offset = gridSize / 2
      for (let z = 0; z < gridSize; z++) {
        for (let x = 0; x < gridSize; x++) {
          const h = heights[z][x]
          const type = blockTypes[z][x]
          let mat: THREE.MeshLambertMaterial

          switch (type) {
            case "water":
              mat = waterMat
              break
            case "path":
              mat = pathMat
              break
            case "stone":
              mat = stoneMat
              break
            case "dirt":
              mat = dirtMat
              break
            case "grass2":
              mat = grassMat2
              break
            default:
              mat = grassMat1
          }

          // Stack blocks for height
          const stackHeight = Math.max(1, Math.round(h))
          for (let y = 0; y < stackHeight; y++) {
            const block = new THREE.Mesh(blockGeo, mat)
            block.position.set(x - offset, y * 0.95 - 2, z - offset)
            world.add(block)
          }
        }
      }

      // Castle tower (center of map)
      const towerX = 0
      const towerZ = 0
      const towerBase = 1
      for (let y = 0; y < 5; y++) {
        const tower = new THREE.Mesh(blockGeo, castleMat)
        tower.position.set(towerX, towerBase + y * 0.95, towerZ)
        world.add(tower)
      }
      // Battlements
      for (let dx = -1; dx <= 1; dx += 2) {
        const battlement = new THREE.Mesh(blockGeo, castleTopMat)
        battlement.position.set(towerX + dx, towerBase + 5 * 0.95, towerZ)
        world.add(battlement)
      }
      for (let dz = -1; dz <= 1; dz += 2) {
        const battlement = new THREE.Mesh(blockGeo, castleTopMat)
        battlement.position.set(towerX, towerBase + 5 * 0.95, towerZ + dz)
        world.add(battlement)
      }

      // Flag on top
      const flagPoleGeo = new THREE.BoxGeometry(0.1, 1.5, 0.1)
      const flagPole = new THREE.Mesh(flagPoleGeo, trunkMat)
      flagPole.position.set(towerX, towerBase + 5.5 * 0.95 + 0.75, towerZ)
      world.add(flagPole)

      const flagGeo = new THREE.BoxGeometry(0.6, 0.3, 0.05)
      const flag = new THREE.Mesh(flagGeo, flagMat)
      flag.position.set(towerX + 0.35, towerBase + 6.5 * 0.95 + 0.5, towerZ)
      world.add(flag)

      // Glowing windows
      const windowGeo = new THREE.BoxGeometry(0.2, 0.3, 0.05)
      const windowPositions = [
        [towerX, towerBase + 1.5, towerZ + 0.5],
        [towerX, towerBase + 3, towerZ + 0.5],
        [towerX + 0.5, towerBase + 2.2, towerZ],
      ]
      windowPositions.forEach(([wx, wy, wz]) => {
        const win = new THREE.Mesh(windowGeo, windowMat)
        win.position.set(wx, wy, wz)
        world.add(win)
      })

      // Pixel trees
      const treePositions = [
        [-4, -3], [-3, 4], [4, -4], [5, 3], [-5, 1], [3, -2], [-2, 5], [6, -1],
      ]
      treePositions.forEach(([tx, tz]) => {
        if (tx + offset < 0 || tx + offset >= gridSize || tz + offset < 0 || tz + offset >= gridSize) return
        const baseH = heights[tz + offset]?.[tx + offset] || 1
        if (blockTypes[tz + offset]?.[tx + offset] === "water") return

        const trunkH = Math.round(baseH)
        // Trunk
        const trunk = new THREE.Mesh(
          new THREE.BoxGeometry(0.3, 1.2, 0.3),
          trunkMat
        )
        trunk.position.set(tx, trunkH * 0.95 - 2 + 0.6, tz)
        world.add(trunk)

        // Leaves (cube on top)
        const leavesBlock = new THREE.Mesh(
          new THREE.BoxGeometry(0.9, 0.9, 0.9),
          leavesMat
        )
        leavesBlock.position.set(tx, trunkH * 0.95 - 2 + 1.65, tz)
        world.add(leavesBlock)
      })

      // Firefly / sparkle particles
      const particleCount = 30
      const particleGeo = new THREE.BufferGeometry()
      const positions = new Float32Array(particleCount * 3)
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 14
        positions[i * 3 + 1] = Math.random() * 5 - 1
        positions[i * 3 + 2] = (Math.random() - 0.5) * 14
      }
      particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
      const particleMat = new THREE.PointsMaterial({
        color: darkColors.accent,
        size: 0.08,
        transparent: true,
        opacity: 0.8,
      })
      const particles = new THREE.Points(particleGeo, particleMat)
      world.add(particles)

      // Mouse parallax
      let mouseX = 0
      let mouseY = 0
      const onMouseMove = (e: MouseEvent) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2
      }
      window.addEventListener("mousemove", onMouseMove)

      let time = 0
      const animate = () => {
        if (disposed) return
        time += 0.01

        // Slowly rotate the world
        world.rotation.y += 0.002

        // Gentle bob
        world.position.y = Math.sin(time * 0.8) * 0.15

        // Mouse parallax on camera
        camera.position.x = 10 + mouseX * 1.5
        camera.position.z = 10 + mouseY * 1.5
        camera.lookAt(0, 0, 0)

        // Animate flag wave
        flag.rotation.z = Math.sin(time * 3) * 0.15

        // Animate fireflies
        const posAttr = particleGeo.getAttribute("position")
        for (let i = 0; i < particleCount; i++) {
          const baseY = posAttr.getY(i)
          posAttr.setY(i, baseY + Math.sin(time * 2 + i) * 0.003)
          posAttr.setX(i, posAttr.getX(i) + Math.sin(time + i * 0.5) * 0.002)
        }
        posAttr.needsUpdate = true

        // Update particle and material colors on theme change
        const colors = themeRef.current === "dark" ? darkColors : earthyColors
        particleMat.color.setHex(colors.accent)
        windowMat.color.setHex(colors.window)
        windowMat.emissive.setHex(colors.window)
        grassMat1.color.setHex(colors.grass1)
        grassMat2.color.setHex(colors.grass2)
        stoneMat.color.setHex(colors.stone)
        waterMat.color.setHex(colors.water)
        dirtMat.color.setHex(colors.dirt)
        pathMat.color.setHex(colors.path)
        castleMat.color.setHex(colors.castle)
        castleTopMat.color.setHex(colors.castleTop)
        flagMat.color.setHex(colors.flag)
        trunkMat.color.setHex(colors.trunk)
        leavesMat.color.setHex(colors.leaves)

        renderer.render(scene, camera)
        animId = requestAnimationFrame(animate)
      }
      animate()

      const onResize = () => {
        const a = window.innerWidth / window.innerHeight
        camera.left = -frustum * a / 2
        camera.right = frustum * a / 2
        camera.top = frustum / 2
        camera.bottom = -frustum / 2
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
      }
      window.addEventListener("resize", onResize)

      const onVisChange = () => {
        if (document.hidden) {
          cancelAnimationFrame(animId)
        } else {
          animate()
        }
      }
      document.addEventListener("visibilitychange", onVisChange)

      return () => {
        disposed = true
        cancelAnimationFrame(animId)
        window.removeEventListener("mousemove", onMouseMove)
        window.removeEventListener("resize", onResize)
        document.removeEventListener("visibilitychange", onVisChange)
        renderer.dispose()
        blockGeo.dispose()
        allMaterials.forEach((m) => m.dispose())
        castleMats.forEach((m) => m.dispose())
        particleGeo.dispose()
        particleMat.dispose()
        flagPoleGeo.dispose()
        flagGeo.dispose()
        windowGeo.dispose()
        if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
          mountRef.current.removeChild(renderer.domElement)
        }
      }
    }

    let cleanup: (() => void) | undefined
    init().then((c) => {
      cleanup = c
    })

    return () => {
      disposed = true
      cleanup?.()
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className="absolute inset-0"
      style={{ zIndex: 0 }}
    />
  )
}
