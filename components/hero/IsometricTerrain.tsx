"use client"

import { useRef, useEffect } from "react"
import { useTheme } from "@/lib/theme"
import type * as THREE from "three"

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

// ── Voxel mob builder ──────────────────────────────────────────────
interface MobDef {
  group: THREE.Group
  baseY: number
  baseX: number
  baseZ: number
  speed: number
  dir: number
  type: "walk" | "fly"
  animTimer: number
  headPivot?: THREE.Group
  isEating?: boolean
  eatTimer?: number
}

function buildVoxelMob(
  THREE: typeof import("three"),
  blockGeo: THREE.BoxGeometry,
  bodyColor: number,
  headColor: number,
  legColor: number,
  bodyW: number,
  bodyH: number,
  bodyD: number,
  headSize: number,
  legH: number,
  scale: number
): { group: THREE.Group; headPivot: THREE.Group } {
  const g = new THREE.Group()
  g.scale.set(scale, scale, scale)

  // Body
  const bodyMat = new THREE.MeshLambertMaterial({ color: bodyColor })
  const body = new THREE.Mesh(new THREE.BoxGeometry(bodyW, bodyH, bodyD), bodyMat)
  body.position.y = legH + bodyH / 2
  g.add(body)

  // Head pivot (for eating animation)
  const headPivot = new THREE.Group()
  headPivot.position.set(0, legH + bodyH, bodyD / 2)
  const headMat = new THREE.MeshLambertMaterial({ color: headColor })
  const head = new THREE.Mesh(new THREE.BoxGeometry(headSize, headSize, headSize), headMat)
  head.position.y = headSize / 2
  head.position.z = headSize / 2
  headPivot.add(head)
  g.add(headPivot)

  // 4 legs
  const legMat = new THREE.MeshLambertMaterial({ color: legColor })
  const legW = bodyW * 0.25
  const offX = bodyW / 2 - legW / 2
  const offZ = bodyD / 2 - legW / 2
  const positions = [
    [-offX, 0, -offZ],
    [offX, 0, -offZ],
    [-offX, 0, offZ],
    [offX, 0, offZ],
  ]
  positions.forEach(([px, , pz]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(legW, legH, legW), legMat)
    leg.position.set(px, legH / 2, pz)
    g.add(leg)
  })

  return { group: g, headPivot }
}

function buildGhast(THREE: typeof import("three"), blockGeo: THREE.BoxGeometry): THREE.Group {
  const g = new THREE.Group()
  g.scale.set(0.4, 0.4, 0.4)

  const bodyMat = new THREE.MeshLambertMaterial({ color: 0xeeeeee })
  const body = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), bodyMat)
  g.add(body)

  // Eyes (red)
  const eyeMat = new THREE.MeshLambertMaterial({ color: 0xcc0000 })
  const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.3), eyeMat)
  leftEye.position.set(-0.8, 0.3, 2.05)
  g.add(leftEye)
  const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.3), eyeMat)
  rightEye.position.set(0.8, 0.3, 2.05)
  g.add(rightEye)

  // Mouth
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.3), eyeMat)
  mouth.position.set(0, -0.6, 2.05)
  g.add(mouth)

  // Tentacles
  const tentacleMat = new THREE.MeshLambertMaterial({ color: 0xcccccc })
  for (let i = 0; i < 9; i++) {
    const tx = (i % 3 - 1) * 1.2
    const tz = (Math.floor(i / 3) - 1) * 1.2
    const tentacle = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2 + Math.random() * 2, 0.4), tentacleMat)
    tentacle.position.set(tx, -3, tz)
    g.add(tentacle)
  }

  return g
}

function buildBee(THREE: typeof import("three")): THREE.Group {
  const g = new THREE.Group()
  g.scale.set(0.2, 0.2, 0.2)

  const yellow = new THREE.MeshLambertMaterial({ color: 0xf5c71a })
  const black = new THREE.MeshLambertMaterial({ color: 0x222222 })
  const white = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })

  // Body (yellow)
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 2), yellow)
  g.add(body)

  // Stripes
  const stripe1 = new THREE.Mesh(new THREE.BoxGeometry(1.55, 1.25, 0.3), black)
  stripe1.position.z = -0.3
  g.add(stripe1)
  const stripe2 = new THREE.Mesh(new THREE.BoxGeometry(1.55, 1.25, 0.3), black)
  stripe2.position.z = 0.5
  g.add(stripe2)

  // Wings
  const wing1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 1.5), white)
  wing1.position.set(0.85, 0.7, 0)
  g.add(wing1)
  const wing2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 1.5), white)
  wing2.position.set(-0.85, 0.7, 0)
  g.add(wing2)

  return g
}

// ── Overworld sun ──────────────────────────────────────────────────
function buildSun(THREE: typeof import("three")): THREE.Group {
  const g = new THREE.Group()

  const sunMat = new THREE.MeshBasicMaterial({ color: 0xffdd33 })
  const sun = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.5, 0.3), sunMat)
  g.add(sun)

  // Rays (small cubes around the sun)
  const rayMat = new THREE.MeshBasicMaterial({ color: 0xffee66 })
  const rayPositions = [
    [0, 2, 0], [0, -2, 0], [2, 0, 0], [-2, 0, 0],
    [1.5, 1.5, 0], [-1.5, 1.5, 0], [1.5, -1.5, 0], [-1.5, -1.5, 0],
  ]
  rayPositions.forEach(([rx, ry, rz]) => {
    const ray = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.2), rayMat)
    ray.position.set(rx, ry, rz)
    g.add(ray)
  })

  return g
}

export default function IsometricTerrain() {
  const mountRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    let animId: number
    let disposed = false

    const init = async () => {
      const THREE = await import("three")
      if (disposed || !mountRef.current) return

      const scene = new THREE.Scene()
      const isDark = theme === "dark"

      // Isometric-style orthographic camera
      const aspect = window.innerWidth / window.innerHeight
      const frustum = 22
      const camera = new THREE.OrthographicCamera(
        -frustum * aspect / 2, frustum * aspect / 2,
        frustum / 2, -frustum / 2,
        0.1, 200
      )
      camera.position.set(16, 16, 16)
      camera.lookAt(0, 0, 0)

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      mountRef.current.appendChild(renderer.domElement)

      // Lights
      const ambient = new THREE.AmbientLight(0xffffff, isDark ? 0.6 : 0.8)
      scene.add(ambient)
      const sun = new THREE.DirectionalLight(isDark ? 0xffaa88 : 0xffffff, isDark ? 0.5 : 1.0)
      sun.position.set(8, 12, 6)
      scene.add(sun)

      if (isDark) {
        const fireLight = new THREE.PointLight(0xff4400, 2, 20)
        fireLight.position.set(0, 0, 0)
        scene.add(fireLight)
      }

      // World group
      const world = new THREE.Group()
      scene.add(world)

      // ── Sun sprite (Overworld only) ──
      let sunSprite: THREE.Group | null = null
      if (!isDark) {
        sunSprite = buildSun(THREE)
        sunSprite.position.set(-10, 12, -10)
        // Face camera
        sunSprite.lookAt(camera.position)
        world.add(sunSprite)
      }

      // Load Textures
      const loader = new THREE.TextureLoader()
      const loadTex = (path: string) => {
        const tex = loader.load(path)
        tex.magFilter = THREE.NearestFilter
        tex.minFilter = THREE.NearestFilter
        return tex
      }

      const tex = {
        dirt: loadTex('/assets/overworld/dirt.png'),
        grassTop: loadTex('/assets/overworld/grass_block_top.png'),
        grassSide: loadTex('/assets/overworld/grass_block_side.png'),
        water: loadTex('/assets/overworld/water_still.png'),
        logTop: loadTex('/assets/overworld/oak_log_top.png'),
        logSide: loadTex('/assets/overworld/oak_log.png'),
        leaves: loadTex('/assets/overworld/oak_leaves.png'),
        netherrack: loadTex('/assets/nether/netherrack.png'),
        lava: loadTex('/assets/nether/lava_flow.png'),
        obsidian: loadTex('/assets/nether/obsidian.png'),
      }

      // Exact hex colors to make grayscale textures look like Minecraft grass/leaves
      const grassColor = 0x55c93f
      const leavesColor = 0x3e8e23

      // Materials
      const materials: Record<string, THREE.Material | THREE.Material[]> = {
        dirt: new THREE.MeshLambertMaterial({ map: tex.dirt }),
        grass: [
          new THREE.MeshLambertMaterial({ map: tex.grassSide }),
          new THREE.MeshLambertMaterial({ map: tex.grassSide }),
          new THREE.MeshLambertMaterial({ map: tex.grassTop, color: grassColor }),
          new THREE.MeshLambertMaterial({ map: tex.dirt }),
          new THREE.MeshLambertMaterial({ map: tex.grassSide }),
          new THREE.MeshLambertMaterial({ map: tex.grassSide }),
        ],
        water: new THREE.MeshLambertMaterial({ map: tex.water, transparent: true, opacity: 0.8 }),
        log: [
          new THREE.MeshLambertMaterial({ map: tex.logSide }),
          new THREE.MeshLambertMaterial({ map: tex.logSide }),
          new THREE.MeshLambertMaterial({ map: tex.logTop }),
          new THREE.MeshLambertMaterial({ map: tex.logTop }),
          new THREE.MeshLambertMaterial({ map: tex.logSide }),
          new THREE.MeshLambertMaterial({ map: tex.logSide }),
        ],
        leaves: new THREE.MeshLambertMaterial({ map: tex.leaves, color: leavesColor, transparent: true, opacity: 0.9, alphaTest: 0.1 }),
        netherrack: new THREE.MeshLambertMaterial({ map: tex.netherrack }),
        obsidian: new THREE.MeshLambertMaterial({ map: tex.obsidian }),
        lava: new THREE.MeshLambertMaterial({ map: tex.lava, emissive: 0xff3300, emissiveIntensity: 0.8 }),
      }

      const blockGeo = new THREE.BoxGeometry(1, 1, 1)
      const gridSize = 24
      const offset = gridSize / 2

      const heights: number[][] = []
      const blockTypes: string[][] = []

      for (let z = 0; z < gridSize; z++) {
        heights[z] = []
        blockTypes[z] = []
        for (let x = 0; x < gridSize; x++) {
          const nx = x / gridSize
          const nz = z / gridSize

          let h: number

          if (isDark) {
            h = fbm(nx * 4, nz * 4, 3) * 8
            heights[z][x] = Math.round(h)

            if (h < 2) {
              blockTypes[z][x] = "lava"
            } else if (h > 6) {
              blockTypes[z][x] = "obsidian"
            } else {
              blockTypes[z][x] = "netherrack"
            }
          } else {
            h = fbm(nx * 2, nz * 2, 3) * 5
            heights[z][x] = Math.round(h)

            if (h < 0.6) {
              blockTypes[z][x] = "water"
            } else {
              blockTypes[z][x] = "grass"
            }
          }
        }
      }

      const allMeshes: THREE.Mesh[] = []

      for (let z = 0; z < gridSize; z++) {
        for (let x = 0; x < gridSize; x++) {
          const h = heights[z][x]
          const type = blockTypes[z][x]

          const floorLevel = 1
          const stackHeight = Math.max(floorLevel, Math.round(h))

          for (let y = 0; y <= stackHeight; y++) {
            let mat: THREE.Material | THREE.Material[]

            if (y === stackHeight) {
              if (type === "water") mat = materials.water
              else if (type === "lava") mat = materials.lava
              else if (type === "grass") mat = materials.grass
              else if (type === "netherrack") mat = materials.netherrack
              else if (type === "obsidian") mat = materials.obsidian
              else mat = materials.dirt
            } else {
              if (isDark) {
                mat = type === "obsidian" ? materials.obsidian : materials.netherrack
              } else {
                mat = materials.dirt
              }
            }

            let isVisible = y === stackHeight || x === 0 || x === gridSize - 1 || z === 0 || z === gridSize - 1
            if (!isVisible) {
              const xMinus = heights[z][x - 1]
              const xPlus = heights[z][x + 1]
              const zMinus = heights[z - 1][x]
              const zPlus = heights[z + 1][x]
              if (y > xMinus || y > xPlus || y > zMinus || y > zPlus) {
                isVisible = true
              }
            }

            if (isVisible) {
              const block = new THREE.Mesh(blockGeo, mat)
              block.position.set(x - offset + 0.5, y - 3, z - offset + 0.5)
              world.add(block)
              allMeshes.push(block)
            }
          }
        }
      }

      // ── Trees (Overworld) ──
      if (!isDark) {
        const treePositions = [
          [3, 3], [12, 4], [8, 11], [2, 13], [18, 6], [20, 16], [15, 20], [5, 19]
        ]
        treePositions.forEach(([tx, tz]) => {
          if (tx < 0 || tx >= gridSize || tz < 0 || tz >= gridSize) return
          if (blockTypes[tz][tx] === "water") return
          const surfaceY = heights[tz][tx]

          for (let ty = 1; ty <= 3; ty++) {
            const trunk = new THREE.Mesh(blockGeo, materials.log)
            trunk.position.set(tx - offset + 0.5, surfaceY - 3 + ty, tz - offset + 0.5)
            world.add(trunk)
            allMeshes.push(trunk)
          }

          const leafCenters = [
            [tx, surfaceY + 3, tz],
            [tx + 1, surfaceY + 3, tz], [tx - 1, surfaceY + 3, tz],
            [tx, surfaceY + 3, tz + 1], [tx, surfaceY + 3, tz - 1],
            [tx, surfaceY + 4, tz],
          ]
          leafCenters.forEach(([lx, ly, lz]) => {
            const leaf = new THREE.Mesh(blockGeo, materials.leaves)
            leaf.position.set(lx - offset + 0.5, ly - 3, lz - offset + 0.5)
            world.add(leaf)
            allMeshes.push(leaf)
          })
        })
      }

      // ── Nether spikes ──
      if (isDark) {
        const spikes = [[4, 4], [10, 10], [5, 13], [18, 8], [20, 18], [14, 20]]
        spikes.forEach(([tx, tz]) => {
          if (tx < 0 || tx >= gridSize || tz < 0 || tz >= gridSize) return
          const surfaceY = heights[tz][tx]
          for (let ty = 1; ty <= 4; ty++) {
            const mat = ty === 4 ? materials.lava : materials.obsidian
            const spike = new THREE.Mesh(blockGeo, mat)
            spike.position.set(tx - offset + 0.5, surfaceY - 3 + ty, tz - offset + 0.5)
            world.add(spike)
            allMeshes.push(spike)
          }
        })
      }

      // ── Mobs ──
      const mobs: MobDef[] = []

      // Find valid surface positions for walking mobs
      const findSurfacePos = (avoidWater: boolean) => {
        for (let attempts = 0; attempts < 100; attempts++) {
          const mx = Math.floor(Math.random() * (gridSize - 4)) + 2
          const mz = Math.floor(Math.random() * (gridSize - 4)) + 2
          if (avoidWater && blockTypes[mz][mx] === "water") continue
          if (!avoidWater && blockTypes[mz][mx] === "lava") continue
          return { x: mx, z: mz, y: heights[mz][mx] }
        }
        return { x: gridSize / 2, z: gridSize / 2, y: heights[gridSize / 2][gridSize / 2] }
      }

      if (!isDark) {
        // ── Overworld Mobs ──

        // Cows (brown body, lighter head)
        for (let i = 0; i < 2; i++) {
          const pos = findSurfacePos(true)
          const { group, headPivot } = buildVoxelMob(THREE, blockGeo, 0x6b3a2a, 0x8b5a3a, 0x5a2a1a, 1.6, 1.0, 2.0, 0.8, 0.8, 0.5)
          const surfY = pos.y - 3 + 0.01
          group.position.set(pos.x - offset + 0.5, surfY, pos.z - offset + 0.5)
          group.rotation.y = Math.random() * Math.PI * 2
          world.add(group)
          mobs.push({
            group, headPivot, baseY: surfY, baseX: pos.x, baseZ: pos.z,
            speed: 0.005 + Math.random() * 0.005, dir: Math.random() * Math.PI * 2,
            type: "walk", animTimer: Math.random() * 100,
            isEating: false, eatTimer: 0,
          })
        }

        // Sheep (white body, gray legs)
        for (let i = 0; i < 2; i++) {
          const pos = findSurfacePos(true)
          const { group, headPivot } = buildVoxelMob(THREE, blockGeo, 0xeeeeee, 0xdddddd, 0x888888, 1.4, 1.0, 1.6, 0.7, 0.7, 0.5)
          const surfY = pos.y - 3 + 0.01
          group.position.set(pos.x - offset + 0.5, surfY, pos.z - offset + 0.5)
          group.rotation.y = Math.random() * Math.PI * 2
          world.add(group)
          mobs.push({
            group, headPivot, baseY: surfY, baseX: pos.x, baseZ: pos.z,
            speed: 0.004 + Math.random() * 0.004, dir: Math.random() * Math.PI * 2,
            type: "walk", animTimer: Math.random() * 100,
            isEating: false, eatTimer: 0,
          })
        }

        // Bees (small, flying)
        for (let i = 0; i < 3; i++) {
          const pos = findSurfacePos(true)
          const beeGroup = buildBee(THREE)
          const flyY = pos.y - 3 + 3 + Math.random() * 2
          beeGroup.position.set(pos.x - offset + 0.5, flyY, pos.z - offset + 0.5)
          world.add(beeGroup)
          mobs.push({
            group: beeGroup, baseY: flyY, baseX: pos.x, baseZ: pos.z,
            speed: 0.02 + Math.random() * 0.01, dir: Math.random() * Math.PI * 2,
            type: "fly", animTimer: Math.random() * 100,
          })
        }
      } else {
        // ── Nether Mobs ──

        // Ghasts (large, floating)
        for (let i = 0; i < 2; i++) {
          const pos = findSurfacePos(false)
          const ghast = buildGhast(THREE, blockGeo)
          const flyY = pos.y - 3 + 5 + Math.random() * 3
          ghast.position.set(pos.x - offset + 0.5, flyY, pos.z - offset + 0.5)
          world.add(ghast)
          mobs.push({
            group: ghast, baseY: flyY, baseX: pos.x, baseZ: pos.z,
            speed: 0.008 + Math.random() * 0.005, dir: Math.random() * Math.PI * 2,
            type: "fly", animTimer: Math.random() * 100,
          })
        }

        // Zombie Pigmen (pink/green body, walking)
        for (let i = 0; i < 3; i++) {
          const pos = findSurfacePos(false)
          const { group, headPivot } = buildVoxelMob(THREE, blockGeo, 0xd4967a, 0x7a9c3a, 0x8b6a4a, 1.0, 1.2, 0.6, 0.7, 0.8, 0.5)
          const surfY = pos.y - 3 + 0.01
          group.position.set(pos.x - offset + 0.5, surfY, pos.z - offset + 0.5)
          group.rotation.y = Math.random() * Math.PI * 2
          world.add(group)
          mobs.push({
            group, headPivot, baseY: surfY, baseX: pos.x, baseZ: pos.z,
            speed: 0.006 + Math.random() * 0.004, dir: Math.random() * Math.PI * 2,
            type: "walk", animTimer: Math.random() * 100,
          })
        }
      }

      // ── Particles ──
      const particleCount = 80
      const particleGeo = new THREE.BufferGeometry()
      const positions = new Float32Array(particleCount * 3)
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 28
        positions[i * 3 + 1] = Math.random() * 10 - 2
        positions[i * 3 + 2] = (Math.random() - 0.5) * 28
      }
      particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3))

      const particleColor = isDark ? 0xff6600 : 0xaaffaa
      const particleMat = new THREE.PointsMaterial({
        color: particleColor,
        size: 0.15,
        transparent: true,
        opacity: 0.8,
      })
      const particles = new THREE.Points(particleGeo, particleMat)
      world.add(particles)

      world.position.y = -2

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

        camera.position.x = 16 + mouseX * 2.0
        camera.position.z = 16 + mouseY * 2.0
        camera.lookAt(0, 0, 0)

        // Sun always faces camera
        if (sunSprite) {
          sunSprite.lookAt(camera.position)
        }

        // Particles
        const posAttr = particleGeo.getAttribute("position")
        for (let i = 0; i < particleCount; i++) {
          const baseY = posAttr.getY(i)
          if (isDark) {
            posAttr.setY(i, baseY + 0.02 + Math.random() * 0.02)
            if (posAttr.getY(i) > 8) posAttr.setY(i, -2)
            posAttr.setX(i, posAttr.getX(i) + Math.sin(time + i) * 0.01)
          } else {
            posAttr.setY(i, baseY + Math.sin(time * 2 + i) * 0.003)
            posAttr.setX(i, posAttr.getX(i) + Math.sin(time + i * 0.5) * 0.002)
          }
        }
        posAttr.needsUpdate = true

        // ── Mob animation ──
        mobs.forEach((mob) => {
          mob.animTimer += 1

          if (mob.type === "walk") {
            // Move forward
            const dx = Math.sin(mob.dir) * mob.speed
            const dz = Math.cos(mob.dir) * mob.speed
            mob.group.position.x += dx
            mob.group.position.z += dz

            // Face direction
            mob.group.rotation.y = mob.dir

            // Bounds check — turn around at edges
            const halfGrid = gridSize / 2
            if (
              mob.group.position.x < -halfGrid + 2 || mob.group.position.x > halfGrid - 2 ||
              mob.group.position.z < -halfGrid + 2 || mob.group.position.z > halfGrid - 2
            ) {
              mob.dir += Math.PI + (Math.random() - 0.5) * 0.5
            }

            // Random direction change
            if (Math.random() < 0.005) {
              mob.dir += (Math.random() - 0.5) * 1.5
            }

            // Eating animation (cow/sheep in overworld)
            if (mob.headPivot && !isDark) {
              if (mob.isEating) {
                mob.eatTimer = (mob.eatTimer || 0) + 1
                // Head bobs down
                mob.headPivot.rotation.x = Math.sin(mob.eatTimer * 0.15) * 0.4 - 0.5
                // Stop after ~3 seconds
                if (mob.eatTimer > 80) {
                  mob.isEating = false
                  mob.eatTimer = 0
                  mob.headPivot.rotation.x = 0
                }
              } else {
                // Random chance to start eating
                if (Math.random() < 0.002) {
                  mob.isEating = true
                  mob.eatTimer = 0
                  mob.speed = 0 // Stop while eating
                }
                if (mob.speed === 0 && !mob.isEating) {
                  mob.speed = 0.004 + Math.random() * 0.004 // Resume walking
                }
              }
            }
          } else {
            // Flying mob
            mob.group.position.y = mob.baseY + Math.sin(time * 0.8 + mob.animTimer * 0.02) * 0.25
            mob.group.position.x += Math.sin(mob.dir + time * 0.2) * mob.speed
            mob.group.position.z += Math.cos(mob.dir + time * 0.15) * mob.speed

            // Drift direction slowly
            mob.dir += Math.sin(time * 0.7 + mob.animTimer * 0.01) * 0.002

            // Bounds
            const halfGrid = gridSize / 2
            if (mob.group.position.x < -halfGrid + 2 || mob.group.position.x > halfGrid - 2) {
              mob.dir += Math.PI
            }
            if (mob.group.position.z < -halfGrid + 2 || mob.group.position.z > halfGrid - 2) {
              mob.dir += Math.PI
            }
          }
        })

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
        allMeshes.forEach(m => world.remove(m))
        mobs.forEach(m => world.remove(m.group))
        blockGeo.dispose()
        Object.values(materials).forEach(m => {
          if (Array.isArray(m)) m.forEach(mat => mat.dispose())
          else m.dispose()
        })
        Object.values(tex).forEach(t => t.dispose())
        particleGeo.dispose()
        particleMat.dispose()

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
      cleanup?.()
    }
  }, [theme])

  return (
    <div
      ref={mountRef}
      className="absolute inset-0"
      style={{ zIndex: 0 }}
    />
  )
}
