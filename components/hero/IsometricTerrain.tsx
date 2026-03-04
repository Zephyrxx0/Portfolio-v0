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
      const frustum = 30 // expanded to fit surrounding floating islands
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
        const fireLight = new THREE.PointLight(0xff4400, 2.5, 30)
        fireLight.position.set(0, 0, 0)
        scene.add(fireLight)

        const portalLight = new THREE.PointLight(0xaa00ff, 3, 20)
        portalLight.position.set(-6, 4, 3)
        scene.add(portalLight)
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
        // Wrap for larger repeating surfaces
        tex.wrapS = THREE.RepeatWrapping
        tex.wrapT = THREE.RepeatWrapping
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
        path: loadTex('/assets/overworld/dirt_path_top.png'),
        chest: loadTex('/assets/overworld/chest_normal.png'),
        craftingFront: loadTex('/assets/overworld/crafting_table_front.png'),
        craftingSide: loadTex('/assets/overworld/crafting_table_side.png'),
        craftingTop: loadTex('/assets/overworld/crafting_table_top.png'),
        orchid: loadTex('/assets/overworld/blue_orchid.png'),
        poppy: loadTex('/assets/overworld/poppy.png'),
        rose: loadTex('/assets/overworld/rose_bush_top.png'),
        gravel: loadTex('/assets/overworld/gravel.png'),
        sand: loadTex('/assets/overworld/sand.png'),
        goldOre: loadTex('/assets/overworld/gold_ore.png'),
        ironOre: loadTex('/assets/overworld/iron_ore.png'),
        fire: loadTex('/assets/nether/fire_0.png'),
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
      const grassColor = 0x8ab66a // Less intense, more natural green
      const leavesColor = 0x5a8347
      const birchLeavesColor = 0x7eb048
      const autumnLeavesColor = 0xd97c27

      // Materials map definition
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
        path: [
          new THREE.MeshLambertMaterial({ map: tex.dirt }),
          new THREE.MeshLambertMaterial({ map: tex.dirt }),
          new THREE.MeshLambertMaterial({ map: tex.path }),
          new THREE.MeshLambertMaterial({ map: tex.dirt }),
          new THREE.MeshLambertMaterial({ map: tex.dirt }),
          new THREE.MeshLambertMaterial({ map: tex.dirt }),
        ],
        gravel: new THREE.MeshLambertMaterial({ map: tex.gravel }),
        sand: new THREE.MeshLambertMaterial({ map: tex.sand }),
        // Water is bluer and opaque
        water: new THREE.MeshLambertMaterial({ map: tex.water, color: 0x3377ff, transparent: true, opacity: 0.95 }),
        wood_log: [
          new THREE.MeshLambertMaterial({ map: tex.logSide }),
          new THREE.MeshLambertMaterial({ map: tex.logSide }),
          new THREE.MeshLambertMaterial({ map: tex.logTop }),
          new THREE.MeshLambertMaterial({ map: tex.logTop }),
          new THREE.MeshLambertMaterial({ map: tex.logSide }),
          new THREE.MeshLambertMaterial({ map: tex.logSide }),
        ],
        birch_log: [
          new THREE.MeshLambertMaterial({ map: tex.logSide, color: 0xdddddd }),
          new THREE.MeshLambertMaterial({ map: tex.logSide, color: 0xdddddd }),
          new THREE.MeshLambertMaterial({ map: tex.logTop, color: 0xeaeaea }),
          new THREE.MeshLambertMaterial({ map: tex.logTop, color: 0xeaeaea }),
          new THREE.MeshLambertMaterial({ map: tex.logSide, color: 0xdddddd }),
          new THREE.MeshLambertMaterial({ map: tex.logSide, color: 0xdddddd }),
        ],
        oak_leaves: new THREE.MeshLambertMaterial({ map: tex.leaves, color: leavesColor, transparent: true, opacity: 0.9, alphaTest: 0.1 }),
        birch_leaves: new THREE.MeshLambertMaterial({ map: tex.leaves, color: birchLeavesColor, transparent: true, opacity: 0.9, alphaTest: 0.1 }),
        autumn_leaves: new THREE.MeshLambertMaterial({ map: tex.leaves, color: autumnLeavesColor, transparent: true, opacity: 0.9, alphaTest: 0.1 }),

        // Custom Blocks
        crafting: [
          new THREE.MeshLambertMaterial({ map: tex.craftingSide }),
          new THREE.MeshLambertMaterial({ map: tex.craftingSide }),
          new THREE.MeshLambertMaterial({ map: tex.craftingTop }),
          new THREE.MeshLambertMaterial({ map: tex.dirt }),
          new THREE.MeshLambertMaterial({ map: tex.craftingFront }),
          new THREE.MeshLambertMaterial({ map: tex.craftingFront }),
        ],
        chest: new THREE.MeshLambertMaterial({ map: tex.chest }),
        gold_ore: new THREE.MeshLambertMaterial({ map: tex.goldOre }),
        iron_ore: new THREE.MeshLambertMaterial({ map: tex.ironOre }),

        // Flora (Sprites mapped to faces)
        orchid: new THREE.MeshLambertMaterial({ map: tex.orchid, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }),
        poppy: new THREE.MeshLambertMaterial({ map: tex.poppy, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }),
        rose: new THREE.MeshLambertMaterial({ map: tex.rose, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }),
        dandelion: new THREE.MeshLambertMaterial({ map: tex.sun, color: 0xffff00, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }), // re-used tex

        // Nether
        netherrack: new THREE.MeshLambertMaterial({ map: tex.netherrack }),
        crimson_nylium: new THREE.MeshLambertMaterial({ map: tex.netherrack, color: 0xb53535 }),
        warped_nylium: new THREE.MeshLambertMaterial({ map: tex.netherrack, color: 0x16827a }),
        soul_sand: new THREE.MeshLambertMaterial({ map: tex.dirt, color: 0x6e5241 }),
        basalt: new THREE.MeshLambertMaterial({ map: tex.logSide, color: 0x515151 }),
        glowstone: new THREE.MeshLambertMaterial({ map: tex.sand, color: 0xffddaa, emissive: 0xcca133, emissiveIntensity: 0.8 }),
        obsidian: new THREE.MeshLambertMaterial({ map: tex.obsidian }),
        lava: new THREE.MeshLambertMaterial({ map: tex.lava, emissive: 0xff4400, emissiveIntensity: 0.8 }),
        fire: new THREE.MeshBasicMaterial({ map: tex.fire, color: 0xffaa00, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }),
        portal: new THREE.MeshBasicMaterial({ color: 0xaa00ff, transparent: true, opacity: 0.7, side: THREE.DoubleSide }),
      }

      const blockGeo = new THREE.BoxGeometry(1, 1, 1)
      const gridSize = 36 // Increased grid to allow more organic shapes and small outer fragments
      const offset = gridSize / 2

      const heights: number[][] = []
      const blockTypes: string[][] = []

      // Outline meshes array
      const terrainMeshes: THREE.Object3D[] = []

      // Terrain Generation
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

          const noiseValue = fbm(nx * 8, nz * 8, 3)
          const ditherThreshold = 0.3 + (normDist * 0.7)

          const mainIslandRadius = 0.55

          let skip = false
          if (normDist > mainIslandRadius) {
            if (isDark) {
              // Nether breaks apart smoothly into void
              if (noiseValue < ditherThreshold) skip = true
            } else {
              // Overworld has solid main island and distinct tiny floating sub-islands
              if (noiseValue > 0.8 && normDist < 0.85) {
                skip = false // tiny floating island
              } else {
                skip = true
              }
            }
          }

          if (skip) {
            heights[z][x] = -99
            blockTypes[z][x] = "skip"
            continue
          }

          let h: number = 2

          if (isDark) {
            // Nether
            const centerDist = dist / (offset * mainIslandRadius)
            if (centerDist < 0.35) {
              // Central lava lake
              h = 1
              blockTypes[z][x] = "lava"
            } else {
              // Surrounding land
              const noiseH = fbm(nx * 4, nz * 4, 3) * 3
              h = 1 + noiseH + (centerDist * 1.5)

              const biomeNoise = fbm(nx * 5, nz * 5, 2)
              if (biomeNoise < 0.35) {
                blockTypes[z][x] = "warped_nylium"
              } else if (biomeNoise > 0.65) {
                blockTypes[z][x] = "crimson_nylium"
              } else if (Math.random() > 0.9) {
                blockTypes[z][x] = "soul_sand"
              } else {
                blockTypes[z][x] = "netherrack"
              }

              if (h > 3.0 && Math.random() > 0.6) {
                blockTypes[z][x] = "obsidian"
              }
            }
          } else {
            // Overworld
            const xRatio = x / gridSize
            const riverCenter = 0.45
            const riverWidth = 0.1
            const meander = fbm(nz * 2, 0, 2) * 0.2
            const riverDist = Math.abs(xRatio - riverCenter + meander)

            // Winding Path
            const pathCenter = 0.7
            const pathMeander = fbm(nz * 3 + 10, nx * 3, 2) * 0.15
            const pathDist = Math.abs(xRatio - pathCenter + pathMeander)

            if (riverDist < riverWidth && normDist < mainIslandRadius * 0.9) {
              h = 1
              blockTypes[z][x] = "water"
            } else if (pathDist < 0.05 && normDist < mainIslandRadius) {
              h = 2 + fbm(nx * 3, nz * 3, 2) * 0.5
              blockTypes[z][x] = "path"
            } else {
              h = 2 + fbm(nx * 4, nz * 4, 3) * 2.5

              if (h < 2.2 && riverDist < riverWidth + 0.04) {
                blockTypes[z][x] = "sand"
              } else if (Math.random() > 0.97) {
                blockTypes[z][x] = (Math.random() > 0.5) ? "gold_ore" : "iron_ore"
              } else {
                blockTypes[z][x] = "grass"
              }
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
              mat = materials[type] || materials.dirt
            } else {
              if (isDark) {
                if (type === "obsidian" || type === "basalt") mat = materials[type]
                else mat = materials.netherrack
              } else {
                if (type === "sand" || type === "gold_ore" || type === "iron_ore") mat = materials.dirt
                else mat = materials.dirt
              }
            }

            let isVisible = y === stackHeight || x === 0 || x === gridSize - 1 || z === 0 || z === gridSize - 1
            if (!isVisible) {
              const xMinus = heights[z][x - 1] || -99
              const xPlus = heights[z][x + 1] || -99
              const zMinus = heights[z - 1]?.[x] || -99
              const zPlus = heights[z + 1]?.[x] || -99
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

      // Add special Objects to terrain array
      const addDeco = (geo: THREE.BufferGeometry, mat: THREE.Material | THREE.Material[], px: number, py: number, pz: number, isTerrain = false) => {
        const mesh = new THREE.Mesh(geo, mat)
        mesh.position.set(px, py, pz)
        mesh.castShadow = true
        mesh.receiveShadow = true
        world.add(mesh)
        allMeshes.push(mesh)
        if (isTerrain) terrainMeshes.push(mesh)
        return mesh
      }

      const buildTree = (tx: number, tz: number, surfaceY: number, logMat: THREE.Material[], leafMat: THREE.Material) => {
        const th = 3 + Math.floor(Math.random() * 2)
        for (let ty = 1; ty <= th; ty++) {
          addDeco(blockGeo, logMat, tx - offset + 0.5, surfaceY - 3 + ty, tz - offset + 0.5, true)
        }
        for (let ox = -1; ox <= 1; ox++) {
          for (let oz = -1; oz <= 1; oz++) {
            if (ox === 0 && oz === 0) continue
            if (Math.random() > 0.8 && Math.abs(ox) + Math.abs(oz) === 2) continue // round corners
            addDeco(blockGeo, leafMat, tx + ox - offset + 0.5, surfaceY - 3 + th, tz + oz - offset + 0.5, true)
          }
        }
        addDeco(blockGeo, leafMat, tx - offset + 0.5, surfaceY - 3 + th + 1, tz - offset + 0.5, true)
      }

      const flowerGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5) // A small box for plant representation

      if (!isDark) {
        let placedCrafting = false
        let placedChest = false

        for (let attempt = 0; attempt < 150; attempt++) {
          const tx = Math.floor(Math.random() * (gridSize - 4)) + 2
          const tz = Math.floor(Math.random() * (gridSize - 4)) + 2
          if (blockTypes[tz][tx] !== "grass" && blockTypes[tz][tx] !== "path") continue

          const surfaceY = heights[tz][tx]

          if (!placedCrafting && blockTypes[tz][tx] === "grass") {
            addDeco(blockGeo, materials.crafting, tx - offset + 0.5, surfaceY - 2, tz - offset + 0.5, true)
            placedCrafting = true
            continue
          }
          if (!placedChest && blockTypes[tz][tx] === "grass") {
            addDeco(blockGeo, materials.chest, tx - offset + 0.5, surfaceY - 2, tz - offset + 0.5, true)
            placedChest = true
            continue
          }

          if (Math.random() < 0.15 && blockTypes[tz][tx] === "grass") {
            const r = Math.random()
            if (r < 0.5) buildTree(tx, tz, surfaceY, materials.wood_log as THREE.Material[], materials.oak_leaves as THREE.Material)
            else if (r < 0.8) buildTree(tx, tz, surfaceY, materials.birch_log as THREE.Material[], materials.birch_leaves as THREE.Material)
            else buildTree(tx, tz, surfaceY, materials.wood_log as THREE.Material[], materials.autumn_leaves as THREE.Material)
          } else if (Math.random() < 0.4 && blockTypes[tz][tx] === "grass") {
            // Flowers / Tall Grass
            const r = Math.random()
            let fmat = materials.rose
            if (r < 0.25) fmat = materials.orchid
            else if (r < 0.5) fmat = materials.poppy
            else if (r < 0.75) fmat = materials.dandelion

            addDeco(flowerGeo, fmat, tx - offset + 0.5 + (Math.random() - 0.5) * 0.5, surfaceY - 2.75, tz - offset + 0.5 + (Math.random() - 0.5) * 0.5, true)
          }
        }
      }

      if (isDark) {
        // Nether features: Basalt pillars, Trees, Glowstone, Fire
        for (let attempt = 0; attempt < 80; attempt++) {
          const tx = Math.floor(Math.random() * (gridSize - 4)) + 2
          const tz = Math.floor(Math.random() * (gridSize - 4)) + 2
          const type = blockTypes[tz][tx]
          if (type === "skip" || type === "lava") continue
          const h = heights[tz][tx]

          if (type === "warped_nylium" || type === "crimson_nylium") {
            if (Math.random() < 0.2) {
              // Fungi Tree
              const logMat = type === "warped_nylium" ? materials.warped_nylium : materials.crimson_nylium
              const leafMat = type === "warped_nylium" ? materials.warped_nylium : materials.crimson_nylium // using same color for blocky vibe
              const th = 2 + Math.floor(Math.random() * 2)
              for (let ty = 1; ty <= th; ty++) {
                addDeco(blockGeo, logMat, tx - offset + 0.5, h - 3 + ty, tz - offset + 0.5, true)
              }
              // cap
              for (let ox = -1; ox <= 1; ox++) {
                for (let oz = -1; oz <= 1; oz++) {
                  if (ox === 0 && oz === 0) continue
                  addDeco(blockGeo, leafMat, tx + ox - offset + 0.5, h - 3 + th, tz + oz - offset + 0.5, true)
                }
              }
            } else if (Math.random() < 0.3) {
              // fire or glowstone scatter
              if (Math.random() > 0.5) addDeco(flowerGeo, materials.fire, tx - offset + 0.5, h - 2.75, tz - offset + 0.5)
              else addDeco(blockGeo, materials.glowstone, tx - offset + 0.5, h - 2, tz - offset + 0.5, true)
            }
          }

          if (type === "soul_sand" && Math.random() < 0.4) {
            addDeco(flowerGeo, materials.fire, tx - offset + 0.5, h - 2.75, tz - offset + 0.5) // soul fire visually just fire here
          }

          if (type === "basalt" && Math.random() < 0.3) {
            const sh = Math.floor(Math.random() * 4) + 1
            for (let ty = 1; ty <= sh; ty++) {
              addDeco(blockGeo, materials.basalt, tx - offset + 0.5, h - 3 + ty, tz - offset + 0.5, true)
            }
          }
        }

        // Nether Portal
        const px = -6, py = 1, pz = 3
        for (let pyy = 0; pyy < 5; pyy++) {
          for (let pxx = 0; pxx < 4; pxx++) {
            if (pxx === 0 || pxx === 3 || pyy === 0 || pyy === 4) {
              addDeco(blockGeo, materials.obsidian, px + pxx, py + pyy - 1, pz, true)
            } else {
              addDeco(blockGeo, materials.portal, px + pxx, py + pyy - 1, pz)
            }
          }
        }
      }

      outlinePass.selectedObjects = terrainMeshes

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
          const surfY = pos.y - 3 + 0.01 // only walk on top surface
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
        // Ghasts only in nether (no Piglin)
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
      const particleCount = 200
      const particleGeo = new THREE.BufferGeometry()
      const positionsArr = new Float32Array(particleCount * 3)
      for (let i = 0; i < particleCount; i++) {
        // spread widely
        positionsArr[i * 3] = (Math.random() - 0.5) * 40
        positionsArr[i * 3 + 1] = Math.random() * 15 - 4
        positionsArr[i * 3 + 2] = (Math.random() - 0.5) * 40
      }
      particleGeo.setAttribute("position", new THREE.BufferAttribute(positionsArr, 3))

      const particleColor = isDark ? 0xffaa00 : 0xccffaa // fire motes vs fireflies
      const particleMat = new THREE.PointsMaterial({
        color: particleColor,
        size: 0.2,
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

        // Gentle isometric parallax
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
            if (posAttr.getY(i) > 12) posAttr.setY(i, -4)
            posAttr.setX(i, posAttr.getX(i) + Math.sin(elapsedTime + i) * 0.01)
          } else {
            posAttr.setY(i, baseY + Math.sin(elapsedTime * 2 + i) * 0.005)
            posAttr.setX(i, posAttr.getX(i) + Math.sin(elapsedTime + i * 0.5) * 0.005)
            // wrap around
            if (posAttr.getY(i) > 12) posAttr.setY(i, -2)
          }
        }
        posAttr.needsUpdate = true

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

            if (
              gridX < 0 || gridX >= gridSize ||
              gridZ < 0 || gridZ >= gridSize ||
              blockTypes[gridZ]?.[gridX] === "skip" ||
              blockTypes[gridZ]?.[gridX] === "water" ||
              blockTypes[gridZ]?.[gridX] === "lava"
            ) {
              canMove = false
            } else {
              // constraint: walk only on top layer
              const targetY = heights[gridZ][gridX] - 3 + 0.01
              mob.group.position.y += (targetY - mob.group.position.y) * 0.1

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
        flowerGeo.dispose()
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
