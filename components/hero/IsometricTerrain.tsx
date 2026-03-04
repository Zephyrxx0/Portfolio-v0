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

export default function IsometricTerrain() {
  const mountRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    let animId: number
    let disposed = false

    const init = async () => {
      // Dynamically import THREE and postprocessing dependencies
      const [
        THREE,
        { EffectComposer },
        { RenderPass },
        { OutlinePass },
        { OutputPass }
      ] = await Promise.all([
        import("three"),
        import("three/examples/jsm/postprocessing/EffectComposer.js"),
        import("three/examples/jsm/postprocessing/RenderPass.js"),
        import("three/examples/jsm/postprocessing/OutlinePass.js"),
        import("three/examples/jsm/postprocessing/OutputPass.js")
      ])

      if (disposed || !mountRef.current) return

      const scene = new THREE.Scene()
      const isDark = theme === "dark"

      // Isometric-style orthographic camera
      const aspect = window.innerWidth / window.innerHeight
      const frustum = 26 // slightly larger to fit fragmented islands
      const camera = new THREE.OrthographicCamera(
        -frustum * aspect / 2, frustum * aspect / 2,
        frustum / 2, -frustum / 2,
        0.1, 200
      )
      camera.position.set(24, 24, 24)
      camera.lookAt(0, 0, 0)

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      mountRef.current.appendChild(renderer.domElement)

      // Postprocessing Composer
      const composer = new EffectComposer(renderer)
      const renderPass = new RenderPass(scene, camera)
      // RenderPass background needs to be fully transparent so we preserve the alpha channel
      renderPass.clearColor = new THREE.Color(0x000000)
      renderPass.clearAlpha = 0
      composer.addPass(renderPass)

      const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera)
      outlinePass.edgeStrength = 3.0
      outlinePass.edgeGlow = 0.0
      outlinePass.edgeThickness = 1.0
      outlinePass.pulsePeriod = 0 // no pulsing
      outlinePass.visibleEdgeColor.set(isDark ? '#552288' : '#ffffff')
      outlinePass.hiddenEdgeColor.set(isDark ? '#220044' : '#aaaaaa')
      composer.addPass(outlinePass)

      const outputPass = new OutputPass()
      composer.addPass(outputPass)

      // Lights
      const ambient = new THREE.AmbientLight(0xffffff, isDark ? 0.6 : 0.8)
      scene.add(ambient)

      const sunLight = new THREE.DirectionalLight(isDark ? 0xffaa88 : 0xffffff, isDark ? 0.5 : 1.2)
      sunLight.position.set(15, 25, 15)
      sunLight.castShadow = true
      // Expanding shadow camera bounds
      sunLight.shadow.camera.left = -30
      sunLight.shadow.camera.right = 30
      sunLight.shadow.camera.top = 30
      sunLight.shadow.camera.bottom = -30
      sunLight.shadow.camera.far = 100
      sunLight.shadow.bias = -0.002
      scene.add(sunLight)

      if (isDark) {
        const fireLight = new THREE.PointLight(0xff4400, 2, 20)
        fireLight.position.set(0, 0, 0)
        scene.add(fireLight)
      }

      // World group
      const world = new THREE.Group()
      scene.add(world)

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
        sun: loadTex('/assets/overworld/sun.png'),
        netherrack: loadTex('/assets/nether/netherrack.png'),
        lava: loadTex('/assets/nether/lava_flow.png'),
        obsidian: loadTex('/assets/nether/obsidian.png'),
      }

      // ── Sun sprite (Overworld only) ──
      let sunSprite: THREE.Sprite | null = null
      if (!isDark) {
        const sunMat = new THREE.SpriteMaterial({ map: tex.sun, color: 0xffffff })
        sunSprite = new THREE.Sprite(sunMat)
        sunSprite.scale.set(15, 15, 1)
        sunSprite.position.set(-20, 18, -20)
        world.add(sunSprite)
      }

      // Toned down greens
      const grassColor = 0x76a056
      const leavesColor = 0x4a7337

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
        // water bluer and more opaque
        water: new THREE.MeshLambertMaterial({ map: tex.water, color: 0x4488ff, transparent: true, opacity: 0.95 }),
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
        crimson_nylium: new THREE.MeshLambertMaterial({ color: 0xbd3030 }),
        warped_nylium: new THREE.MeshLambertMaterial({ color: 0x167e86 }),
        basalt: new THREE.MeshLambertMaterial({ color: 0x4a4a50 }),
        soul_sand: new THREE.MeshLambertMaterial({ color: 0x5e483e }),
        glowstone: new THREE.MeshLambertMaterial({ color: 0xffe699, emissive: 0xcc8800, emissiveIntensity: 0.6 }),
        portal: new THREE.MeshLambertMaterial({ color: 0x9900ff, emissive: 0x5500cc, transparent: true, opacity: 0.85 }),
        crimson_stem: new THREE.MeshLambertMaterial({ color: 0x3d1b27 }),
        nether_wart: new THREE.MeshLambertMaterial({ color: 0x8a0000 }),
        warped_stem: new THREE.MeshLambertMaterial({ color: 0x2b6a68 }),
        warped_wart: new THREE.MeshLambertMaterial({ color: 0x14b4a6 }),
      }

      const blockGeo = new THREE.BoxGeometry(1, 1, 1)
      const gridSize = 32 // larger grid to allow for islands around the main land
      const offset = gridSize / 2

      const heights: number[][] = []
      const blockTypes: string[][] = []

      // Outline meshes array
      const terrainMeshes: THREE.Object3D[] = []

      for (let z = 0; z < gridSize; z++) {
        heights[z] = []
        blockTypes[z] = []
        for (let x = 0; x < gridSize; x++) {
          const nx = x / gridSize
          const nz = z / gridSize

          // Distance from center 
          const cx = x - offset
          const cz = z - offset
          const dist = Math.sqrt(cx * cx + cz * cz)

          // Normalized distance from center (0 = center, 1 = edge of grid)
          const normDist = dist / offset

          // Edge dithering / fragmentation
          const noiseValue = fbm(nx * 10, nz * 10, 3)
          const ditherThreshold = 0.35 + (normDist * 0.75) // requires higher noise value to exist if further out

          // Base island radius
          const mainIslandRadius = 0.55

          let skip = false
          if (normDist > mainIslandRadius) {
            // Outside main island: fragmented islands
            if (noiseValue < ditherThreshold) {
              skip = true
            }
          }

          if (skip) {
            heights[z][x] = -99
            blockTypes[z][x] = "skip"
            continue
          }

          let h: number

          if (isDark) {
            // Nether
            const centerDist = dist / (offset * mainIslandRadius)

            // Biome noise
            const biomeNoise = fbm(nx * 4, nz * 4, 2)
            const isSoulSand = biomeNoise < 0.2
            const isBasalt = biomeNoise > 0.8
            const isCrimson = fbm(nx * 6, nz * 6, 2) > 0.6
            const isWarped = fbm(nx * 6 + 10, nz * 6 + 10, 2) > 0.6

            if (centerDist < 0.3) {
              // Central lava lake, varied depth
              h = 1 + fbm(nx * 8, nz * 8, 2) * 0.5
              blockTypes[z][x] = "lava"
            } else {
              // Surrounding land
              const noiseH = fbm(nx * 4, nz * 4, 3) * 3
              h = 1 + noiseH + (centerDist * 1.5)

              if (h > 3.5 && Math.random() > 0.6) {
                blockTypes[z][x] = "obsidian"
              } else if (isBasalt) {
                blockTypes[z][x] = "basalt"
              } else if (isSoulSand) {
                blockTypes[z][x] = "soul_sand"
              } else if (isCrimson) {
                blockTypes[z][x] = "crimson_nylium"
              } else if (isWarped) {
                blockTypes[z][x] = "warped_nylium"
              } else {
                blockTypes[z][x] = "netherrack"
              }
            }
          } else {
            // Overworld
            const xRatio = x / gridSize
            const riverCenter = 0.5
            const riverWidth = 0.08
            // Add some meandering to the river
            const meander = fbm(nz * 2, 0, 2) * 0.15
            const riverDist = Math.abs(xRatio - riverCenter + meander)

            if (riverDist < riverWidth && normDist < mainIslandRadius * 0.9) {
              h = 1
              blockTypes[z][x] = "water"
            } else if (xRatio < 0.45) {
              // Hills
              h = 2 + fbm(nx * 4, nz * 4, 3) * 2.5
              blockTypes[z][x] = "grass"
            } else {
              // Plains
              h = 1.5 + fbm(nx * 3, nz * 3, 2) * 1.0
              blockTypes[z][x] = "grass"
            }
          }

          // Max elevation clamped to 4 (seen from edges/surface)
          // Minimum floor level is 1
          h = Math.max(1, Math.min(Math.round(h), 4))

          heights[z][x] = h
        }
      }

      const allMeshes: THREE.Mesh[] = []

      for (let z = 0; z < gridSize; z++) {
        for (let x = 0; x < gridSize; x++) {
          const h = heights[z][x]
          const type = blockTypes[z][x]

          if (type === "skip") continue

          const stackHeight = h

          for (let y = 0; y <= stackHeight; y++) {
            let mat: THREE.Material | THREE.Material[]

            if (y === stackHeight) {
              if (type === "water") mat = materials.water
              else if (type === "lava") mat = materials.lava
              else if (type === "grass") mat = materials.grass
              else if (type === "netherrack") mat = materials.netherrack
              else if (type === "obsidian") mat = materials.obsidian
              else if (type === "crimson_nylium") mat = materials.crimson_nylium
              else if (type === "warped_nylium") mat = materials.warped_nylium
              else if (type === "basalt") mat = materials.basalt
              else if (type === "soul_sand") mat = materials.soul_sand
              else mat = materials.dirt
            } else {
              if (isDark) {
                if (type === "obsidian") mat = materials.obsidian
                else if (type === "basalt") mat = materials.basalt
                else mat = materials.netherrack
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
              block.castShadow = true
              block.receiveShadow = true
              world.add(block)
              allMeshes.push(block)
              terrainMeshes.push(block)
            }
          }
        }
      }

      outlinePass.selectedObjects = terrainMeshes

      // ── Trees (Overworld) ──
      if (!isDark) {
        for (let attempt = 0; attempt < 15; attempt++) {
          const tx = Math.floor(Math.random() * (gridSize - 4)) + 2
          const tz = Math.floor(Math.random() * (gridSize - 4)) + 2
          if (blockTypes[tz][tx] !== "grass") continue

          const surfaceY = heights[tz][tx]

          // Trunk
          for (let ty = 1; ty <= 3; ty++) {
            const trunk = new THREE.Mesh(blockGeo, materials.log)
            trunk.position.set(tx - offset + 0.5, surfaceY - 3 + ty, tz - offset + 0.5)
            trunk.castShadow = true
            trunk.receiveShadow = true
            world.add(trunk)
            allMeshes.push(trunk)
            terrainMeshes.push(trunk)
          }

          // Leaves
          const leafCenters = [
            [tx, surfaceY + 3, tz],
            [tx + 1, surfaceY + 3, tz], [tx - 1, surfaceY + 3, tz],
            [tx, surfaceY + 3, tz + 1], [tx, surfaceY + 3, tz - 1],
            [tx, surfaceY + 4, tz],
          ]
          leafCenters.forEach(([lx, ly, lz]) => {
            const leaf = new THREE.Mesh(blockGeo, materials.leaves)
            leaf.position.set(lx - offset + 0.5, ly - 3, lz - offset + 0.5)
            leaf.castShadow = true
            leaf.receiveShadow = true
            world.add(leaf)
            allMeshes.push(leaf)
            terrainMeshes.push(leaf)
          })
        }
      }

      // ── Nether Biome Features ──
      let hasPortal = false
      if (isDark) {
        // Nether Portal
        const portalGroup = new THREE.Group()
        for (let py = 0; py < 5; py++) {
          for (let px = 0; px < 4; px++) {
            if (py === 0 || py === 4 || px === 0 || px === 3) {
              const b = new THREE.Mesh(blockGeo, materials.obsidian)
              b.position.set(px, py, 0)
              portalGroup.add(b)
            } else {
              const p = new THREE.Mesh(blockGeo, materials.portal)
              p.position.set(px, py, 0)
              portalGroup.add(p)
            }
          }
        }

        // Find a good spot for the portal near the base
        const pz = Math.floor(gridSize * 0.75)
        const px = Math.floor(gridSize * 0.75)
        const ph = Math.max(1, heights[pz]?.[px] || 1)
        portalGroup.position.set(px - offset, ph - 2.5, pz - offset)
        portalGroup.rotation.y = -Math.PI / 4 // Angle it slightly towards the camera
        world.add(portalGroup)
        hasPortal = true

        // Distribute trees and features
        for (let z = 2; z < gridSize - 2; z++) {
          for (let x = 2; x < gridSize - 2; x++) {
            const type = blockTypes[z][x]
            const h = heights[z][x]
            if (h <= 0 || type === "skip" || type === "lava") continue

            const r = Math.random()

            // Crimson Trees
            if (type === "crimson_nylium" && r < 0.15) {
              const th = Math.floor(Math.random() * 3) + 3
              for (let ty = 1; ty <= th; ty++) {
                const trunk = new THREE.Mesh(blockGeo, materials.crimson_stem)
                trunk.position.set(x - offset + 0.5, h - 3 + ty, z - offset + 0.5)
                world.add(trunk)
                allMeshes.push(trunk)
              }
              for (let wx = -1; wx <= 1; wx++) {
                for (let wz = -1; wz <= 1; wz++) {
                  if (Math.abs(wx) === 1 && Math.abs(wz) === 1 && Math.random() > 0.5) continue;
                  const leaves = new THREE.Mesh(blockGeo, materials.nether_wart)
                  leaves.position.set(x - offset + 0.5 + wx, h - 3 + th, z - offset + 0.5 + wz)
                  world.add(leaves)
                  allMeshes.push(leaves)
                }
              }
            } else if (type === "warped_nylium" && r < 0.15) {
              const th = Math.floor(Math.random() * 3) + 3
              for (let ty = 1; ty <= th; ty++) {
                const trunk = new THREE.Mesh(blockGeo, materials.warped_stem)
                trunk.position.set(x - offset + 0.5, h - 3 + ty, z - offset + 0.5)
                world.add(trunk)
                allMeshes.push(trunk)
              }
              for (let wx = -1; wx <= 1; wx++) {
                for (let wz = -1; wz <= 1; wz++) {
                  if (Math.abs(wx) === 1 && Math.abs(wz) === 1 && Math.random() > 0.5) continue;
                  const leaves = new THREE.Mesh(blockGeo, materials.warped_wart)
                  leaves.position.set(x - offset + 0.5 + wx, h - 3 + th, z - offset + 0.5 + wz)
                  world.add(leaves)
                  allMeshes.push(leaves)
                }
              }
            } else if (type === "basalt" && r < 0.1) {
              const th = Math.floor(Math.random() * 4) + 2
              for (let ty = 1; ty <= th; ty++) {
                const b = new THREE.Mesh(blockGeo, materials.basalt)
                b.position.set(x - offset + 0.5, h - 3 + ty, z - offset + 0.5)
                world.add(b)
                allMeshes.push(b)
              }
              if (Math.random() > 0.7) {
                const lv = new THREE.Mesh(blockGeo, materials.lava)
                lv.position.set(x - offset + 0.5, h - 3 + th + 1, z - offset + 0.5)
                world.add(lv)
                allMeshes.push(lv)
              }
            } else if (r < 0.02 && (type === "netherrack" || type === "soul_sand")) {
              const g1 = new THREE.Mesh(blockGeo, materials.glowstone)
              g1.position.set(x - offset + 0.5, h - 3 + 1, z - offset + 0.5)
              world.add(g1)
              allMeshes.push(g1)
            }
          }
        }
      }

      // ── Mobs ──
      const mobs: MobDef[] = []

      const findSurfacePos = (avoidWater: boolean) => {
        for (let attempts = 0; attempts < 100; attempts++) {
          const mx = Math.floor(Math.random() * (gridSize - 4)) + 2
          const mz = Math.floor(Math.random() * (gridSize - 4)) + 2
          if (blockTypes[mz][mx] === "skip") continue
          if (avoidWater && blockTypes[mz][mx] === "water") continue
          if (!avoidWater && blockTypes[mz][mx] === "lava") continue
          return { x: mx, z: mz, y: heights[mz][mx] }
        }
        return { x: Math.floor(gridSize / 2), z: Math.floor(gridSize / 2), y: heights[Math.floor(gridSize / 2)][Math.floor(gridSize / 2)] }
      }

      if (!isDark) {
        // Cows 
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
          terrainMeshes.push(group)
        }

        // Sheep 
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
          terrainMeshes.push(group)
        }

        // Bees 
        for (let i = 0; i < 3; i++) {
          const pos = findSurfacePos(true)
          if (pos.y < 0) continue
          const beeGroup = buildBee(THREE)
          const flyY = pos.y - 3 + 3 + Math.random() * 2
          beeGroup.position.set(pos.x - offset + 0.5, flyY, pos.z - offset + 0.5)
          world.add(beeGroup)
          mobs.push({
            group: beeGroup, baseY: flyY, baseX: pos.x, baseZ: pos.z,
            speed: 0.02 + Math.random() * 0.01, dir: Math.random() * Math.PI * 2,
            type: "fly", animTimer: Math.random() * 100,
          })
          terrainMeshes.push(beeGroup)
        }
      } else {
        // Ghasts 
        for (let i = 0; i < 2; i++) {
          const pos = findSurfacePos(false)
          const ghast = buildGhast(THREE, blockGeo)
          const flyY = Math.max(0, pos.y) - 3 + 5 + Math.random() * 3
          ghast.position.set(pos.x - offset + 0.5, flyY, pos.z - offset + 0.5)
          world.add(ghast)
          mobs.push({
            group: ghast, baseY: flyY, baseX: pos.x, baseZ: pos.z,
            speed: 0.008 + Math.random() * 0.005, dir: Math.random() * Math.PI * 2,
            type: "fly", animTimer: Math.random() * 100,
          })
          terrainMeshes.push(ghast)
        }
      }

      // ── Particles ──
      const particleCount = 100
      const particleGeo = new THREE.BufferGeometry()
      const positionsArr = new Float32Array(particleCount * 3)
      for (let i = 0; i < particleCount; i++) {
        positionsArr[i * 3] = (Math.random() - 0.5) * 36
        positionsArr[i * 3 + 1] = Math.random() * 10 - 2
        positionsArr[i * 3 + 2] = (Math.random() - 0.5) * 36
      }
      particleGeo.setAttribute("position", new THREE.BufferAttribute(positionsArr, 3))

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

      const clock = new THREE.Clock()

      const animate = () => {
        if (disposed) return

        const delta = clock.getDelta()
        const elapsedTime = clock.getElapsedTime()

        camera.position.x = 24 + mouseX * 2.5
        camera.position.z = 24 + mouseY * 2.5
        camera.lookAt(0, 0, 0)

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
            posAttr.setX(i, posAttr.getX(i) + Math.sin(elapsedTime + i) * 0.01)
          } else {
            posAttr.setY(i, baseY + Math.sin(elapsedTime * 2 + i) * 0.003)
            posAttr.setX(i, posAttr.getX(i) + Math.sin(elapsedTime + i * 0.5) * 0.002)
          }
        }
        posAttr.needsUpdate = true

        // Portal animation
        if (hasPortal) {
          const intensity = 0.5 + 0.5 * Math.sin(elapsedTime * 2)
          if (!Array.isArray(materials.portal)) {
            materials.portal.opacity = 0.6 + 0.3 * intensity
          }
        }

        // ── Mob animation ──
        mobs.forEach((mob) => {
          mob.animTimer += 1

          if (mob.type === "walk") {
            const dx = Math.sin(mob.dir) * mob.speed
            const dz = Math.cos(mob.dir) * mob.speed

            const nextX = mob.group.position.x + dx
            const nextZ = mob.group.position.z + dz

            // Map world pos to grid pos
            const gridX = Math.floor(nextX + offset)
            const gridZ = Math.floor(nextZ + offset)

            let canMove = true

            // Bounds and valid ground check
            if (
              gridX < 0 || gridX >= gridSize ||
              gridZ < 0 || gridZ >= gridSize ||
              blockTypes[gridZ]?.[gridX] === "skip" ||
              blockTypes[gridZ]?.[gridX] === "water" ||
              blockTypes[gridZ]?.[gridX] === "lava"
            ) {
              canMove = false
            } else {
              // Only walk on top layer: adjust Y height dynamically
              const targetY = heights[gridZ][gridX] - 3 + 0.01
              // Smooth Y transition
              mob.group.position.y += (targetY - mob.group.position.y) * 0.1

              // Only move horizontally if height diff is small
              if (Math.abs(targetY - mob.group.position.y) > 1.2) {
                canMove = false
              }
            }

            if (canMove) {
              mob.group.position.x = nextX
              mob.group.position.z = nextZ
            } else {
              mob.dir += Math.PI + (Math.random() - 0.5) * 1.5
            }

            mob.group.rotation.y = mob.dir

            if (Math.random() < 0.005) {
              mob.dir += (Math.random() - 0.5) * 1.5
            }

            if (mob.headPivot && !isDark) {
              if (mob.isEating) {
                mob.eatTimer = (mob.eatTimer || 0) + 1
                mob.headPivot.rotation.x = Math.sin(mob.eatTimer * 0.15) * 0.4 - 0.5
                if (mob.eatTimer > 80) {
                  mob.isEating = false
                  mob.eatTimer = 0
                  mob.headPivot.rotation.x = 0
                }
              } else {
                if (Math.random() < 0.002) {
                  mob.isEating = true
                  mob.eatTimer = 0
                  mob.speed = 0
                }
                if (mob.speed === 0 && !mob.isEating) {
                  mob.speed = 0.004 + Math.random() * 0.004
                }
              }
            }
          } else {
            // Flying mob
            mob.group.position.y = mob.baseY + Math.sin(elapsedTime * 0.8 + mob.animTimer * 0.02) * 0.25
            mob.group.position.x += Math.sin(mob.dir + elapsedTime * 0.2) * mob.speed
            mob.group.position.z += Math.cos(mob.dir + elapsedTime * 0.15) * mob.speed

            mob.dir += Math.sin(elapsedTime * 0.7 + mob.animTimer * 0.01) * 0.002

            const halfGrid = gridSize / 2
            if (mob.group.position.x < -halfGrid + 2 || mob.group.position.x > halfGrid - 2) {
              mob.dir += Math.PI
            }
            if (mob.group.position.z < -halfGrid + 2 || mob.group.position.z > halfGrid - 2) {
              mob.dir += Math.PI
            }
          }
        })

        // Render via composer instead of renderer
        composer.render(delta)
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
        composer.setSize(window.innerWidth, window.innerHeight)
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
