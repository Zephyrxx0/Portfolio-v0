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

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" })
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
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
      } else {
        // Portal glow in overworld
        const portalLight = new THREE.PointLight(0xaa00ff, 1.5, 15)
        portalLight.position.set(-8, 4, -2)
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
        tex.wrapS = THREE.RepeatWrapping
        tex.wrapT = THREE.RepeatWrapping
        return tex
      }
      // 1×1 placeholder used for the inactive theme — never rendered, no network request
      const makeDummyTex = () => {
        const c = document.createElement("canvas"); c.width = c.height = 1
        const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; return t
      }
      const nt = makeDummyTex() // noTex shorthand
      const ow = (p: string) => isDark ? nt : loadTex(p)  // overworld-only
      const ne = (p: string) => isDark ? loadTex(p) : nt  // nether-only

      const tex = {
        // Overworld base
        dirt: ow('/assets/overworld/dirt.png'),
        coarseDirt: ow('/assets/overworld/coarse_dirt.png'),
        grassTop: ow('/assets/overworld/grass_block_top.png'),
        grassSide: ow('/assets/overworld/grass_block_side.png'),
        water: ow('/assets/overworld/water_still.png'),
        logTop: ow('/assets/overworld/oak_log_top.png'),
        logSide: ow('/assets/overworld/oak_log.png'),
        leaves: ow('/assets/overworld/oak_leaves.png'),
        sun: ow('/assets/overworld/sun.png'),
        path: ow('/assets/overworld/dirt_path_top.png'),
        chest: ow('/assets/overworld/chest_normal.png'),
        craftingFront: ow('/assets/overworld/crafting_table_front.png'),
        craftingSide: ow('/assets/overworld/crafting_table_side.png'),
        craftingTop: ow('/assets/overworld/crafting_table_top.png'),
        orchid: ow('/assets/overworld/blue_orchid.png'),
        poppy: ow('/assets/overworld/poppy.png'),
        rose: ow('/assets/overworld/rose_bush_top.png'),
        gravel: ow('/assets/overworld/gravel.png'),
        sand: ow('/assets/overworld/sand.png'),
        goldOre: ow('/assets/overworld/gold_ore.png'),
        ironOre: ow('/assets/overworld/iron_ore.png'),
        // Stone & ores
        stone: ow('/assets/overworld/stone.png'),
        cobblestone: ow('/assets/overworld/cobblestone.png'),
        mossyCobblestone: ow('/assets/overworld/mossy_cobblestone.png'),
        stoneBricks: ow('/assets/overworld/stone_bricks.png'),
        mossyStoneBricks: ow('/assets/overworld/mossy_stone_bricks.png'),
        diamondOre: ow('/assets/overworld/diamond_ore.png'),
        coalOre: ow('/assets/overworld/coal_ore.png'),
        redstoneOre: ow('/assets/overworld/redstone_ore.png'),
        // Wood variants
        oakPlanks: ow('/assets/overworld/oak_planks.png'),
        birchLogSide: ow('/assets/overworld/birch_log.png'),
        birchLogTop: ow('/assets/overworld/birch_log_top.png'),
        birchLeaves: ow('/assets/overworld/birch_leaves.png'),
        spruceLog: ow('/assets/overworld/spruce_log.png'),
        spruceLogTop: ow('/assets/overworld/spruce_log_top.png'),
        spruceLeaves: ow('/assets/overworld/spruce_leaves.png'),
        darkOakLog: ow('/assets/overworld/dark_oak_log.png'),
        darkOakLogTop: ow('/assets/overworld/dark_oak_log_top.png'),
        darkOakLeaves: ow('/assets/overworld/dark_oak_leaves.png'),
        // Flora
        redMushroom: ow('/assets/overworld/red_mushroom.png'),
        brownMushroom: ow('/assets/overworld/brown_mushroom.png'),
        lilyPad: ow('/assets/overworld/lily_pad.png'),
        shortGrass: ow('/assets/overworld/short_grass.png'),
        fern: ow('/assets/overworld/fern.png'),
        redTulip: ow('/assets/overworld/red_tulip.png'),
        cornflower: ow('/assets/overworld/cornflower.png'),
        oxeyeDaisy: ow('/assets/overworld/oxeye_daisy.png'),
        floweringAzalea: ow('/assets/overworld/flowering_azalea_leaves.png'),
        sugarCane: ow('/assets/overworld/sugar_cane.png'),
        // Decorative blocks
        tntSide: ow('/assets/overworld/tnt_side.png'),
        tntTop: ow('/assets/overworld/tnt_top.png'),
        tntBottom: ow('/assets/overworld/tnt_bottom.png'),
        pumpkinSide: ow('/assets/overworld/pumpkin_side.png'),
        pumpkinTop: ow('/assets/overworld/pumpkin_top.png'),
        jackOLantern: ow('/assets/overworld/jack_o_lantern.png'),
        melonSide: ow('/assets/overworld/melon_side.png'),
        melonTop: ow('/assets/overworld/melon_top.png'),
        mossBlock: ow('/assets/overworld/moss_block.png'),
        beeNest: ow('/assets/overworld/bee_nest_front_honey.png'),
        bookshelf: ow('/assets/overworld/bookshelf.png'),
        clay: ow('/assets/overworld/clay.png'),
        // Nether
        netherrack: ne('/assets/nether/netherrack.png'),
        lava: ne('/assets/nether/lava_flow.png'),
        obsidian: ne('/assets/nether/obsidian.png'),
        fire: ne('/assets/nether/fire_0.png'),
        magma: ne('/assets/nether/magma.png'),
        netherBricks: ne('/assets/nether/nether_bricks.png'),
        soulSand: ne('/assets/nether/soul_sand.png'),
        soulSoil: ne('/assets/nether/soul_soil.png'),
        blackstone: ne('/assets/nether/blackstone.png'),
        blackstoneTop: ne('/assets/nether/blackstone_top.png'),
        cryingObsidian: ne('/assets/nether/crying_obsidian.png'),
        glowstoneTex: ne('/assets/nether/glowstone.png'),
        shroomlight: ne('/assets/nether/shroomlight.png'),
        crimsonStem: ne('/assets/nether/crimson_stem.png'),
        crimsonStemTop: ne('/assets/nether/crimson_stem_top.png'),
        warpedStem: ne('/assets/nether/warped_stem.png'),
        warpedStemTop: ne('/assets/nether/warped_stem_top.png'),
        crimsonNylium: ne('/assets/nether/crimson_nylium.png'),
        crimsonNyliumSide: ne('/assets/nether/crimson_nylium_side.png'),
        warpedNylium: ne('/assets/nether/warped_nylium.png'),
        warpedNyliumSide: ne('/assets/nether/warped_nylium_side.png'),
        crimsonPlanks: ne('/assets/nether/crimson_planks.png'),
        warpedPlanks: ne('/assets/nether/warped_planks.png'),
        netherWartBlock: ne('/assets/nether/nether_wart_block.png'),
        warpedWartBlock: ne('/assets/nether/warped_wart_block.png'),
        ancientDebrisSide: ne('/assets/nether/ancient_debris_side.png'),
        ancientDebrisTop: ne('/assets/nether/ancient_debris_top.png'),
        netherGoldOre: ne('/assets/nether/nether_gold_ore.png'),
        basaltSide: ne('/assets/nether/basalt_side.png'),
        basaltTop: ne('/assets/nether/basalt_top.png'),
        soulFire: ne('/assets/nether/soul_fire_0.png'),
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
      const grassColor = 0x8ab66a
      const leavesColor = 0x5a8347
      const birchLeavesColor = 0x7eb048
      const autumnLeavesColor = 0xd97c27
      const spruceLeavesColor = 0x3a6b2a
      const darkOakLeavesColor = 0x4a7a3a
      const floweringAzaleaColor = 0xc98bc2

      const materials: Record<string, THREE.Material | THREE.Material[]> = {
        // Base terrain
        dirt: new THREE.MeshLambertMaterial({ map: tex.dirt }),
        coarse_dirt: new THREE.MeshLambertMaterial({ map: tex.coarseDirt }),
        stone: new THREE.MeshLambertMaterial({ map: tex.stone }),
        cobblestone: new THREE.MeshLambertMaterial({ map: tex.cobblestone }),
        mossy_cobblestone: new THREE.MeshLambertMaterial({ map: tex.mossyCobblestone }),
        stone_bricks: new THREE.MeshLambertMaterial({ map: tex.stoneBricks }),
        mossy_stone_bricks: new THREE.MeshLambertMaterial({ map: tex.mossyStoneBricks }),
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
        clay: new THREE.MeshLambertMaterial({ map: tex.clay }),
        moss: new THREE.MeshLambertMaterial({ map: tex.mossBlock }),
        water: new THREE.MeshLambertMaterial({ map: tex.water, color: 0x3377ff, transparent: true, opacity: 0.95 }),
        // Wood variants
        wood_log: [
          new THREE.MeshLambertMaterial({ map: tex.logSide }),
          new THREE.MeshLambertMaterial({ map: tex.logSide }),
          new THREE.MeshLambertMaterial({ map: tex.logTop }),
          new THREE.MeshLambertMaterial({ map: tex.logTop }),
          new THREE.MeshLambertMaterial({ map: tex.logSide }),
          new THREE.MeshLambertMaterial({ map: tex.logSide }),
        ],
        birch_log: [
          new THREE.MeshLambertMaterial({ map: tex.birchLogSide }),
          new THREE.MeshLambertMaterial({ map: tex.birchLogSide }),
          new THREE.MeshLambertMaterial({ map: tex.birchLogTop }),
          new THREE.MeshLambertMaterial({ map: tex.birchLogTop }),
          new THREE.MeshLambertMaterial({ map: tex.birchLogSide }),
          new THREE.MeshLambertMaterial({ map: tex.birchLogSide }),
        ],
        spruce_log: [
          new THREE.MeshLambertMaterial({ map: tex.spruceLog }),
          new THREE.MeshLambertMaterial({ map: tex.spruceLog }),
          new THREE.MeshLambertMaterial({ map: tex.spruceLogTop }),
          new THREE.MeshLambertMaterial({ map: tex.spruceLogTop }),
          new THREE.MeshLambertMaterial({ map: tex.spruceLog }),
          new THREE.MeshLambertMaterial({ map: tex.spruceLog }),
        ],
        dark_oak_log: [
          new THREE.MeshLambertMaterial({ map: tex.darkOakLog }),
          new THREE.MeshLambertMaterial({ map: tex.darkOakLog }),
          new THREE.MeshLambertMaterial({ map: tex.darkOakLogTop }),
          new THREE.MeshLambertMaterial({ map: tex.darkOakLogTop }),
          new THREE.MeshLambertMaterial({ map: tex.darkOakLog }),
          new THREE.MeshLambertMaterial({ map: tex.darkOakLog }),
        ],
        oak_planks: new THREE.MeshLambertMaterial({ map: tex.oakPlanks }),
        // Leaves
        oak_leaves: new THREE.MeshLambertMaterial({ map: tex.leaves, color: leavesColor, transparent: true, opacity: 0.9, alphaTest: 0.1 }),
        birch_leaves: new THREE.MeshLambertMaterial({ map: tex.birchLeaves, color: birchLeavesColor, transparent: true, opacity: 0.9, alphaTest: 0.1 }),
        autumn_leaves: new THREE.MeshLambertMaterial({ map: tex.leaves, color: autumnLeavesColor, transparent: true, opacity: 0.9, alphaTest: 0.1 }),
        spruce_leaves: new THREE.MeshLambertMaterial({ map: tex.spruceLeaves, color: spruceLeavesColor, transparent: true, opacity: 0.9, alphaTest: 0.1 }),
        dark_oak_leaves: new THREE.MeshLambertMaterial({ map: tex.darkOakLeaves, color: darkOakLeavesColor, transparent: true, opacity: 0.9, alphaTest: 0.1 }),
        flowering_azalea: new THREE.MeshLambertMaterial({ map: tex.floweringAzalea, color: floweringAzaleaColor, transparent: true, opacity: 0.9, alphaTest: 0.1 }),
        // Ores
        gold_ore: new THREE.MeshLambertMaterial({ map: tex.goldOre }),
        iron_ore: new THREE.MeshLambertMaterial({ map: tex.ironOre }),
        diamond_ore: new THREE.MeshLambertMaterial({ map: tex.diamondOre }),
        coal_ore: new THREE.MeshLambertMaterial({ map: tex.coalOre }),
        redstone_ore: new THREE.MeshLambertMaterial({ map: tex.redstoneOre }),
        // Decorative blocks
        crafting: [
          new THREE.MeshLambertMaterial({ map: tex.craftingSide }),
          new THREE.MeshLambertMaterial({ map: tex.craftingSide }),
          new THREE.MeshLambertMaterial({ map: tex.craftingTop }),
          new THREE.MeshLambertMaterial({ map: tex.dirt }),
          new THREE.MeshLambertMaterial({ map: tex.craftingFront }),
          new THREE.MeshLambertMaterial({ map: tex.craftingFront }),
        ],
        chest: new THREE.MeshLambertMaterial({ map: tex.chest }),
        tnt: [
          new THREE.MeshLambertMaterial({ map: tex.tntSide }),
          new THREE.MeshLambertMaterial({ map: tex.tntSide }),
          new THREE.MeshLambertMaterial({ map: tex.tntTop }),
          new THREE.MeshLambertMaterial({ map: tex.tntBottom }),
          new THREE.MeshLambertMaterial({ map: tex.tntSide }),
          new THREE.MeshLambertMaterial({ map: tex.tntSide }),
        ],
        pumpkin: [
          new THREE.MeshLambertMaterial({ map: tex.pumpkinSide }),
          new THREE.MeshLambertMaterial({ map: tex.pumpkinSide }),
          new THREE.MeshLambertMaterial({ map: tex.pumpkinTop }),
          new THREE.MeshLambertMaterial({ map: tex.pumpkinTop }),
          new THREE.MeshLambertMaterial({ map: tex.jackOLantern }),
          new THREE.MeshLambertMaterial({ map: tex.pumpkinSide }),
        ],
        melon: [
          new THREE.MeshLambertMaterial({ map: tex.melonSide }),
          new THREE.MeshLambertMaterial({ map: tex.melonSide }),
          new THREE.MeshLambertMaterial({ map: tex.melonTop }),
          new THREE.MeshLambertMaterial({ map: tex.melonTop }),
          new THREE.MeshLambertMaterial({ map: tex.melonSide }),
          new THREE.MeshLambertMaterial({ map: tex.melonSide }),
        ],
        bookshelf: [
          new THREE.MeshLambertMaterial({ map: tex.bookshelf }),
          new THREE.MeshLambertMaterial({ map: tex.bookshelf }),
          new THREE.MeshLambertMaterial({ map: tex.oakPlanks }),
          new THREE.MeshLambertMaterial({ map: tex.oakPlanks }),
          new THREE.MeshLambertMaterial({ map: tex.bookshelf }),
          new THREE.MeshLambertMaterial({ map: tex.bookshelf }),
        ],
        bee_nest:new THREE.MeshLambertMaterial({ map: tex.beeNest }),
        // Flora
        orchid: new THREE.MeshLambertMaterial({ map: tex.orchid, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }),
        poppy: new THREE.MeshLambertMaterial({ map: tex.poppy, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }),
        rose: new THREE.MeshLambertMaterial({ map: tex.rose, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }),
        dandelion: new THREE.MeshLambertMaterial({ map: tex.sun, color: 0xffff00, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }),
        red_tulip: new THREE.MeshLambertMaterial({ map: tex.redTulip, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }),
        cornflower: new THREE.MeshLambertMaterial({ map: tex.cornflower, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }),
        oxeye_daisy: new THREE.MeshLambertMaterial({ map: tex.oxeyeDaisy, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }),
        red_mushroom: new THREE.MeshLambertMaterial({ map: tex.redMushroom, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }),
        brown_mushroom: new THREE.MeshLambertMaterial({ map: tex.brownMushroom, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }),
        short_grass: new THREE.MeshLambertMaterial({ map: tex.shortGrass, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, color: grassColor }),
        fern: new THREE.MeshLambertMaterial({ map: tex.fern, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, color: 0x6a9a4a }),
        lily_pad: new THREE.MeshLambertMaterial({ map: tex.lilyPad, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, color: 0x4a8a3a }),
        sugar_cane: new THREE.MeshLambertMaterial({ map: tex.sugarCane, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, color: 0x6aaa4a }),

        // Nether
        netherrack: new THREE.MeshLambertMaterial({ map: tex.netherrack }),
        crimson_nylium: [
          new THREE.MeshLambertMaterial({ map: tex.crimsonNyliumSide }),
          new THREE.MeshLambertMaterial({ map: tex.crimsonNyliumSide }),
          new THREE.MeshLambertMaterial({ map: tex.crimsonNylium }),
          new THREE.MeshLambertMaterial({ map: tex.netherrack }),
          new THREE.MeshLambertMaterial({ map: tex.crimsonNyliumSide }),
          new THREE.MeshLambertMaterial({ map: tex.crimsonNyliumSide }),
        ],
        warped_nylium: [
          new THREE.MeshLambertMaterial({ map: tex.warpedNyliumSide }),
          new THREE.MeshLambertMaterial({ map: tex.warpedNyliumSide }),
          new THREE.MeshLambertMaterial({ map: tex.warpedNylium }),
          new THREE.MeshLambertMaterial({ map: tex.netherrack }),
          new THREE.MeshLambertMaterial({ map: tex.warpedNyliumSide }),
          new THREE.MeshLambertMaterial({ map: tex.warpedNyliumSide }),
        ],
        soul_sand: new THREE.MeshLambertMaterial({ map: tex.soulSand }),
        soul_soil: new THREE.MeshLambertMaterial({ map: tex.soulSoil }),
        basalt: [
          new THREE.MeshLambertMaterial({ map: tex.basaltSide }),
          new THREE.MeshLambertMaterial({ map: tex.basaltSide }),
          new THREE.MeshLambertMaterial({ map: tex.basaltTop }),
          new THREE.MeshLambertMaterial({ map: tex.basaltTop }),
          new THREE.MeshLambertMaterial({ map: tex.basaltSide }),
          new THREE.MeshLambertMaterial({ map: tex.basaltSide }),
        ],
        blackstone: [
          new THREE.MeshLambertMaterial({ map: tex.blackstone }),
          new THREE.MeshLambertMaterial({ map: tex.blackstone }),
          new THREE.MeshLambertMaterial({ map: tex.blackstoneTop }),
          new THREE.MeshLambertMaterial({ map: tex.blackstoneTop }),
          new THREE.MeshLambertMaterial({ map: tex.blackstone }),
          new THREE.MeshLambertMaterial({ map: tex.blackstone }),
        ],
        glowstone: new THREE.MeshLambertMaterial({ map: tex.glowstoneTex, emissive: 0xcca133, emissiveIntensity: 0.8 }),
        shroomlight: new THREE.MeshLambertMaterial({ map: tex.shroomlight, emissive: 0xddaa55, emissiveIntensity: 0.6 }),
        magma: new THREE.MeshLambertMaterial({ map: tex.magma, emissive: 0xff4400, emissiveIntensity: 0.4 }),
        nether_bricks: new THREE.MeshLambertMaterial({ map: tex.netherBricks }),
        nether_gold_ore: new THREE.MeshLambertMaterial({ map: tex.netherGoldOre }),
        ancient_debris: [
          new THREE.MeshLambertMaterial({ map: tex.ancientDebrisSide }),
          new THREE.MeshLambertMaterial({ map: tex.ancientDebrisSide }),
          new THREE.MeshLambertMaterial({ map: tex.ancientDebrisTop }),
          new THREE.MeshLambertMaterial({ map: tex.ancientDebrisTop }),
          new THREE.MeshLambertMaterial({ map: tex.ancientDebrisSide }),
          new THREE.MeshLambertMaterial({ map: tex.ancientDebrisSide }),
        ],
        crying_obsidian: new THREE.MeshLambertMaterial({ map: tex.cryingObsidian, emissive: 0x6600aa, emissiveIntensity: 0.3 }),
        crimson_stem: [
          new THREE.MeshLambertMaterial({ map: tex.crimsonStem }),
          new THREE.MeshLambertMaterial({ map: tex.crimsonStem }),
          new THREE.MeshLambertMaterial({ map: tex.crimsonStemTop }),
          new THREE.MeshLambertMaterial({ map: tex.crimsonStemTop }),
          new THREE.MeshLambertMaterial({ map: tex.crimsonStem }),
          new THREE.MeshLambertMaterial({ map: tex.crimsonStem }),
        ],
        warped_stem: [
          new THREE.MeshLambertMaterial({ map: tex.warpedStem }),
          new THREE.MeshLambertMaterial({ map: tex.warpedStem }),
          new THREE.MeshLambertMaterial({ map: tex.warpedStemTop }),
          new THREE.MeshLambertMaterial({ map: tex.warpedStemTop }),
          new THREE.MeshLambertMaterial({ map: tex.warpedStem }),
          new THREE.MeshLambertMaterial({ map: tex.warpedStem }),
        ],
        nether_wart_block: new THREE.MeshLambertMaterial({ map: tex.netherWartBlock }),
        warped_wart_block: new THREE.MeshLambertMaterial({ map: tex.warpedWartBlock }),
        crimson_planks: new THREE.MeshLambertMaterial({ map: tex.crimsonPlanks }),
        warped_planks: new THREE.MeshLambertMaterial({ map: tex.warpedPlanks }),
        obsidian: new THREE.MeshLambertMaterial({ map: tex.obsidian }),
        lava: new THREE.MeshLambertMaterial({ map: tex.lava, emissive: 0xff4400, emissiveIntensity: 0.8 }),
        fire: new THREE.MeshBasicMaterial({ map: tex.fire, color: 0xffaa00, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }),
        soul_fire: new THREE.MeshBasicMaterial({ map: tex.soulFire, color: 0x44bbff, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }),
        portal: new THREE.MeshBasicMaterial({ color: 0xaa00ff, transparent: true, opacity: 0.7, side: THREE.DoubleSide }),
      }

      const blockGeo = new THREE.BoxGeometry(1, 1, 1)
      const gridSize = 36
      const offset = gridSize / 2
      const maxHeight = 6

      const heights: number[][] = []
      const blockTypes: string[][] = []
      const edgeFactors: number[][] = []

      const terrainMeshes: THREE.Object3D[] = []

      // Terrain Generation
      for (let z = 0; z < gridSize; z++) {
        heights[z] = []
        blockTypes[z] = []
        edgeFactors[z] = []
        for (let x = 0; x < gridSize; x++) {
          const nx = x / gridSize
          const nz = z / gridSize

          const cx = x - offset
          const cz = z - offset
          const dist = Math.sqrt(cx * cx + cz * cz)
          const normDist = dist / offset

          const mainIslandRadius = 0.55
          const edgeFadeStart = 0.42
          const edgeFadeEnd = 0.95

          let skip = false
          let edgeFactor = 0

          if (normDist > edgeFadeStart) {
            edgeFactor = Math.min(1, (normDist - edgeFadeStart) / (edgeFadeEnd - edgeFadeStart))
            const edgeNoise = fbm(nx * 10 + 77, nz * 10 + 33, 4)
            const threshold = Math.pow(edgeFactor, 1.8)
            if (edgeNoise < threshold || normDist > edgeFadeEnd) {
              skip = true
            }
          }

          edgeFactors[z][x] = edgeFactor

          if (skip) {
            heights[z][x] = -99
            blockTypes[z][x] = "skip"
            continue
          }

          let h: number = 2

          if (isDark) {
            // Nether terrain
            const centerDist = dist / (offset * mainIslandRadius)
            if (centerDist < 0.35) {
              h = 1
              blockTypes[z][x] = "lava"
            } else {
              const noiseH = fbm(nx * 4, nz * 4, 3) * 4
              h = 1 + noiseH + (centerDist * 2)

              const biomeNoise = fbm(nx * 5, nz * 5, 2)
              if (biomeNoise < 0.3) {
                blockTypes[z][x] = "warped_nylium"
              } else if (biomeNoise > 0.65) {
                blockTypes[z][x] = "crimson_nylium"
              } else if (biomeNoise > 0.5 && Math.random() > 0.5) {
                blockTypes[z][x] = "soul_sand"
              } else if (Math.random() > 0.92) {
                blockTypes[z][x] = "magma"
              } else {
                blockTypes[z][x] = "netherrack"
              }

              if (h > 3.5 && Math.random() > 0.5) {
                blockTypes[z][x] = Math.random() > 0.5 ? "blackstone" : "basalt"
              }
            }
          } else {
            // Overworld terrain - more varied
            const xRatio = x / gridSize
            const riverCenter = 0.45
            const riverWidth = 0.1
            const meander = fbm(nz * 2, 0, 2) * 0.2
            const riverDist = Math.abs(xRatio - riverCenter + meander)

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
              // More dramatic height variation
              h = 2 + fbm(nx * 4, nz * 4, 3) * 3.5

              // Left side is hillier
              if (xRatio < 0.3) h += 1.5

              if (h < 2.2 && riverDist < riverWidth + 0.04) {
                blockTypes[z][x] = "sand"
              } else if (Math.random() > 0.97) {
                const oreR = Math.random()
                if (oreR < 0.2) blockTypes[z][x] = "diamond_ore"
                else if (oreR < 0.4) blockTypes[z][x] = "coal_ore"
                else if (oreR < 0.6) blockTypes[z][x] = "redstone_ore"
                else if (oreR < 0.8) blockTypes[z][x] = "iron_ore"
                else blockTypes[z][x] = "gold_ore"
              } else if (h > 4 && Math.random() > 0.85) {
                blockTypes[z][x] = Math.random() > 0.5 ? "cobblestone" : "mossy_cobblestone"
              } else if (Math.random() > 0.98) {
                blockTypes[z][x] = Math.random() > 0.5 ? "coarse_dirt" : "gravel"
              } else {
                blockTypes[z][x] = "grass"
              }
            }
          }

          // Reduce height at island edges for natural thinning
          if (edgeFactor > 0) {
            h = h * Math.max(0.3, 1 - edgeFactor * 0.7)
          }

          h = Math.max(1, Math.min(Math.round(h), maxHeight))
          heights[z][x] = h
        }
      }

      const allMeshes: THREE.Object3D[] = []

      // Return material key string for sub-surface blocks
      const getSubSurfaceKey = (y: number, stackHeight: number, type: string, isDark: boolean): string => {
        if (isDark) {
          if (y <= 1) return "blackstone"
          if (type === "basalt") return "basalt"
          return "netherrack"
        } else {
          const depthFromTop = stackHeight - y
          if (depthFromTop >= 3) {
            const r = hash(y * 37 + stackHeight, y * 13)
            if (r > 0.95) return "diamond_ore"
            if (r > 0.88) return "coal_ore"
            if (r > 0.82) return "iron_ore"
            if (r > 0.78) return "redstone_ore"
            return "stone"
          }
          return "dirt"
        }
      }

      // ── Collect block data then batch into InstancedMesh (single-mat) or Mesh (array-mat) ──
      const singleBatches = new Map<string, THREE.Vector3[]>()
      const arrayMatBlocks: { matKey: string; pos: THREE.Vector3 }[] = []

      for (let z = 0; z < gridSize; z++) {
        for (let x = 0; x < gridSize; x++) {
          const h = heights[z][x]
          const type = blockTypes[z][x]
          if (type === "skip") continue

          const stackHeight = h

          const ef = edgeFactors[z]?.[x] || 0
          let startY = 0
          if (ef > 0.15 && stackHeight > 1) {
            const erosionNoise = hash(x * 31 + 7, z * 17 + 11)
            startY = Math.min(
              Math.floor(ef * stackHeight * erosionNoise * 0.8),
              stackHeight - 1
            )
          }

          for (let y = startY; y <= stackHeight; y++) {
            const matKey = y === stackHeight ? type : getSubSurfaceKey(y, stackHeight, type, isDark)

            let isVisible = y === stackHeight || x === 0 || x === gridSize - 1 || z === 0 || z === gridSize - 1
            if (!isVisible) {
              const xMinus = heights[z][x - 1] || -99
              const xPlus = heights[z][x + 1] || -99
              const zMinus = heights[z - 1]?.[x] || -99
              const zPlus = heights[z + 1]?.[x] || -99
              if (y > xMinus || y > xPlus || y > zMinus || y > zPlus) isVisible = true
            }
            if (!isVisible) continue

            const mat = materials[matKey]
            if (!mat) continue

            const pos = new THREE.Vector3(x - offset + 0.5, y - 3, z - offset + 0.5)
            if (Array.isArray(mat)) {
              arrayMatBlocks.push({ matKey, pos })
            } else {
              if (!singleBatches.has(matKey)) singleBatches.set(matKey, [])
              singleBatches.get(matKey)!.push(pos)
            }
          }
        }
      }

      // Build InstancedMesh for single-material block types
      const dummy = new THREE.Object3D()
      singleBatches.forEach((positions, key) => {
        const mat = materials[key] as THREE.Material
        const im = new THREE.InstancedMesh(blockGeo, mat, positions.length)
        positions.forEach((pos, i) => {
          dummy.position.copy(pos)
          dummy.updateMatrix()
          im.setMatrixAt(i, dummy.matrix)
        })
        im.instanceMatrix.needsUpdate = true
        im.castShadow = true
        im.receiveShadow = true
        world.add(im)
        allMeshes.push(im)
        terrainMeshes.push(im)
      })

      // Regular Mesh for multi-face blocks (grass, logs, etc.)
      arrayMatBlocks.forEach(({ matKey, pos }) => {
        const block = new THREE.Mesh(blockGeo, materials[matKey] as THREE.Material[])
        block.position.copy(pos)
        block.castShadow = true
        block.receiveShadow = true
        world.add(block)
        allMeshes.push(block)
        terrainMeshes.push(block)
      })

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

      const flowerGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5)
      const tallGrassGeo = new THREE.PlaneGeometry(0.8, 0.8)
      const lilyPadGeo = new THREE.PlaneGeometry(0.7, 0.7)

      // Build a small floating island cluster
      const buildFloatingIsland = (
        icx: number, icy: number, icz: number, iRadius: number,
        surfMat: THREE.Material | THREE.Material[],
        midMat: THREE.Material | THREE.Material[],
        botMat: THREE.Material | THREE.Material[],
      ) => {
        for (let dx = -iRadius; dx <= iRadius; dx++) {
          for (let dz = -iRadius; dz <= iRadius; dz++) {
            const d = Math.sqrt(dx * dx + dz * dz)
            if (d > iRadius + 0.3) continue
            if (d > iRadius * 0.5 && hash(Math.abs(dx) + Math.round(icx) * 7, Math.abs(dz) + Math.round(icz) * 11) > 0.55) continue

            const colH = Math.max(1, Math.round((iRadius - d + 1) * (0.6 + hash(dx + Math.round(icx) * 3, dz + Math.round(icz) * 5) * 0.6)))
            for (let dy = 0; dy < colH; dy++) {
              const mat = dy === 0 ? surfMat : (dy >= colH - 1 ? botMat : midMat)
              const block = new THREE.Mesh(blockGeo, mat)
              block.position.set(icx + dx, icy - dy, icz + dz)
              block.castShadow = true
              block.receiveShadow = true
              world.add(block)
              allMeshes.push(block)
              terrainMeshes.push(block)
            }
          }
        }
      }

      if (!isDark) {
        let placedCrafting = false
        let placedChest = false
        let placedTNT = false
        let placedPumpkin = false
        let placedMelon = false
        let placedBookshelf = false
        let placedBeeNest = false

        for (let attempt = 0; attempt < 250; attempt++) {
          const tx = Math.floor(Math.random() * (gridSize - 4)) + 2
          const tz = Math.floor(Math.random() * (gridSize - 4)) + 2
          if (blockTypes[tz][tx] !== "grass" && blockTypes[tz][tx] !== "path" && blockTypes[tz][tx] !== "cobblestone" && blockTypes[tz][tx] !== "mossy_cobblestone") continue

          const surfaceY = heights[tz][tx]

          // Place unique decorative blocks
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
          if (!placedTNT && blockTypes[tz][tx] === "grass") {
            addDeco(blockGeo, materials.tnt, tx - offset + 0.5, surfaceY - 2, tz - offset + 0.5, true)
            placedTNT = true
            continue
          }
          if (!placedPumpkin && blockTypes[tz][tx] === "grass") {
            addDeco(blockGeo, materials.pumpkin, tx - offset + 0.5, surfaceY - 2, tz - offset + 0.5, true)
            placedPumpkin = true
            continue
          }
          if (!placedMelon && blockTypes[tz][tx] === "grass") {
            addDeco(blockGeo, materials.melon, tx - offset + 0.5, surfaceY - 2, tz - offset + 0.5, true)
            placedMelon = true
            continue
          }
          if (!placedBookshelf && blockTypes[tz][tx] === "grass") {
            addDeco(blockGeo, materials.bookshelf, tx - offset + 0.5, surfaceY - 2, tz - offset + 0.5, true)
            placedBookshelf = true
            continue
          }
          if (!placedBeeNest && blockTypes[tz][tx] === "grass") {
            addDeco(blockGeo, materials.bee_nest, tx - offset + 0.5, surfaceY - 2, tz - offset + 0.5, true)
            placedBeeNest = true
            continue
          }

          // Trees - more variety including spruce and dark oak
          if (Math.random() < 0.18 && blockTypes[tz][tx] === "grass") {
            const r = Math.random()
            if (r < 0.3) buildTree(tx, tz, surfaceY, materials.wood_log as THREE.Material[], materials.oak_leaves as THREE.Material)
            else if (r < 0.5) buildTree(tx, tz, surfaceY, materials.birch_log as THREE.Material[], materials.birch_leaves as THREE.Material)
            else if (r < 0.7) buildTree(tx, tz, surfaceY, materials.spruce_log as THREE.Material[], materials.spruce_leaves as THREE.Material)
            else if (r < 0.85) buildTree(tx, tz, surfaceY, materials.dark_oak_log as THREE.Material[], materials.dark_oak_leaves as THREE.Material)
            else if (r < 0.95) buildTree(tx, tz, surfaceY, materials.wood_log as THREE.Material[], materials.autumn_leaves as THREE.Material)
            else buildTree(tx, tz, surfaceY, materials.wood_log as THREE.Material[], materials.flowering_azalea as THREE.Material)
          } else if (Math.random() < 0.5 && blockTypes[tz][tx] === "grass") {
            // Flora - much more variety
            const r = Math.random()
            if (r < 0.2) {
              // Tall grass / fern (flat plane)
              const grassPlane = new THREE.Mesh(tallGrassGeo, Math.random() > 0.3 ? materials.short_grass : materials.fern)
              grassPlane.position.set(
                tx - offset + 0.5 + (Math.random() - 0.5) * 0.3,
                surfaceY - 2.6,
                tz - offset + 0.5 + (Math.random() - 0.5) * 0.3
              )
              grassPlane.rotation.y = Math.random() * Math.PI
              grassPlane.rotation.x = -0.1
              world.add(grassPlane)
              allMeshes.push(grassPlane)
              terrainMeshes.push(grassPlane)
            } else if (r < 0.32) {
              addDeco(flowerGeo, materials.poppy, tx - offset + 0.5 + (Math.random() - 0.5) * 0.5, surfaceY - 2.75, tz - offset + 0.5 + (Math.random() - 0.5) * 0.5, true)
            } else if (r < 0.42) {
              addDeco(flowerGeo, materials.orchid, tx - offset + 0.5 + (Math.random() - 0.5) * 0.5, surfaceY - 2.75, tz - offset + 0.5 + (Math.random() - 0.5) * 0.5, true)
            } else if (r < 0.52) {
              addDeco(flowerGeo, materials.dandelion, tx - offset + 0.5 + (Math.random() - 0.5) * 0.5, surfaceY - 2.75, tz - offset + 0.5 + (Math.random() - 0.5) * 0.5, true)
            } else if (r < 0.60) {
              addDeco(flowerGeo, materials.red_tulip, tx - offset + 0.5 + (Math.random() - 0.5) * 0.5, surfaceY - 2.75, tz - offset + 0.5 + (Math.random() - 0.5) * 0.5, true)
            } else if (r < 0.68) {
              addDeco(flowerGeo, materials.cornflower, tx - offset + 0.5 + (Math.random() - 0.5) * 0.5, surfaceY - 2.75, tz - offset + 0.5 + (Math.random() - 0.5) * 0.5, true)
            } else if (r < 0.76) {
              addDeco(flowerGeo, materials.oxeye_daisy, tx - offset + 0.5 + (Math.random() - 0.5) * 0.5, surfaceY - 2.75, tz - offset + 0.5 + (Math.random() - 0.5) * 0.5, true)
            } else if (r < 0.82) {
              addDeco(flowerGeo, materials.rose, tx - offset + 0.5 + (Math.random() - 0.5) * 0.5, surfaceY - 2.75, tz - offset + 0.5 + (Math.random() - 0.5) * 0.5, true)
            } else if (r < 0.88) {
              addDeco(flowerGeo, materials.red_mushroom, tx - offset + 0.5 + (Math.random() - 0.5) * 0.3, surfaceY - 2.75, tz - offset + 0.5 + (Math.random() - 0.5) * 0.3, true)
            } else {
              addDeco(flowerGeo, materials.brown_mushroom, tx - offset + 0.5 + (Math.random() - 0.5) * 0.3, surfaceY - 2.75, tz - offset + 0.5 + (Math.random() - 0.5) * 0.3, true)
            }
          }
        }

        // Lily pads on water
        for (let z = 0; z < gridSize; z++) {
          for (let x = 0; x < gridSize; x++) {
            if (blockTypes[z][x] === "water" && Math.random() < 0.15) {
              const lilyMesh = new THREE.Mesh(lilyPadGeo, materials.lily_pad)
              lilyMesh.position.set(x - offset + 0.5, heights[z][x] - 2.45, z - offset + 0.5)
              lilyMesh.rotation.x = -Math.PI / 2
              lilyMesh.rotation.z = Math.random() * Math.PI * 2
              world.add(lilyMesh)
              allMeshes.push(lilyMesh)
              terrainMeshes.push(lilyMesh)
            }
          }
        }

        // Sugar cane near water
        for (let z = 1; z < gridSize - 1; z++) {
          for (let x = 1; x < gridSize - 1; x++) {
            if (blockTypes[z][x] !== "sand" && blockTypes[z][x] !== "grass") continue
            const nearWater = (
              blockTypes[z - 1]?.[x] === "water" || blockTypes[z + 1]?.[x] === "water" ||
              blockTypes[z]?.[x - 1] === "water" || blockTypes[z]?.[x + 1] === "water"
            )
            if (nearWater && Math.random() < 0.15) {
              const sh = 1 + Math.floor(Math.random() * 2)
              for (let sy = 1; sy <= sh; sy++) {
                const canePlane = new THREE.Mesh(tallGrassGeo, materials.sugar_cane)
                canePlane.position.set(x - offset + 0.5, heights[z][x] - 3 + sy, z - offset + 0.5)
                canePlane.rotation.y = Math.random() * Math.PI
                world.add(canePlane)
                allMeshes.push(canePlane)
                terrainMeshes.push(canePlane)
              }
            }
          }
        }

        // Nether Portal in overworld (on left/high side)
        const portalX = -8, portalZ = -2
        const portalBaseY = 2
        for (let pyy = 0; pyy < 5; pyy++) {
          for (let pxx = 0; pxx < 4; pxx++) {
            if (pxx === 0 || pxx === 3 || pyy === 0 || pyy === 4) {
              addDeco(blockGeo, Math.random() > 0.8 ? materials.crying_obsidian : materials.obsidian, portalX + pxx, portalBaseY + pyy - 1, portalZ, true)
            } else {
              addDeco(blockGeo, materials.portal, portalX + pxx, portalBaseY + pyy - 1, portalZ)
            }
          }
        }

        // Floating islands around the main island
        const owIslands = [
          { angle: 2.5, dist: 15, y: 3, radius: 3 },
          { angle: 0.7, dist: 14, y: 0, radius: 2 },
          { angle: 4.3, dist: 16, y: -1, radius: 2 },
          { angle: 5.5, dist: 13, y: 2, radius: 1 },
          { angle: 1.4, dist: 17, y: -2, radius: 1 },
          { angle: 3.8, dist: 18, y: 1, radius: 1 },
        ]

        owIslands.forEach(island => {
          const ix = Math.cos(island.angle) * island.dist
          const iz = Math.sin(island.angle) * island.dist
          buildFloatingIsland(ix, island.y, iz, island.radius, materials.grass, materials.dirt, materials.stone)

          // Add small tree on larger islands
          if (island.radius >= 2) {
            const treeTypes = [
              { log: materials.wood_log, leaf: materials.oak_leaves },
              { log: materials.birch_log, leaf: materials.birch_leaves },
              { log: materials.spruce_log, leaf: materials.spruce_leaves },
            ]
            const tt = treeTypes[Math.floor(hash(island.angle * 10, island.dist) * treeTypes.length)]
            addDeco(blockGeo, tt.log, ix, island.y + 1, iz, true)
            addDeco(blockGeo, tt.log, ix, island.y + 2, iz, true)
            addDeco(blockGeo, tt.leaf, ix, island.y + 3, iz, true)
            for (let lx = -1; lx <= 1; lx++) {
              for (let lz = -1; lz <= 1; lz++) {
                if (lx === 0 && lz === 0) continue
                if (Math.abs(lx) + Math.abs(lz) === 2 && hash(lx + island.dist, lz + island.angle * 5) > 0.5) continue
                addDeco(blockGeo, tt.leaf, ix + lx, island.y + 2, iz + lz, true)
              }
            }
          }
        })

        // Scattered debris blocks
        const floatingBlockMats = [
          materials.grass, materials.stone, materials.dirt,
          materials.cobblestone, materials.mossy_cobblestone,
          materials.gold_ore, materials.iron_ore,
          materials.oak_planks, materials.sand,
          materials.moss, materials.clay,
        ]

        for (let i = 0; i < 10; i++) {
          const angle = Math.random() * Math.PI * 2
          const radius = 13 + Math.random() * 8
          const fx = Math.cos(angle) * radius
          const fz = Math.sin(angle) * radius
          const fy = -3 + Math.random() * 10
          const scale = 0.5 + Math.random() * 0.5
          const mat = floatingBlockMats[Math.floor(Math.random() * floatingBlockMats.length)]

          const floatBlock = new THREE.Mesh(blockGeo, mat)
          floatBlock.position.set(fx, fy, fz)
          floatBlock.scale.set(scale, scale, scale)
          floatBlock.rotation.set(
            (Math.random() - 0.5) * 0.4,
            Math.random() * Math.PI * 2,
            (Math.random() - 0.5) * 0.4
          )
          floatBlock.castShadow = true
          floatBlock.receiveShadow = true
          world.add(floatBlock)
          allMeshes.push(floatBlock)
          terrainMeshes.push(floatBlock)
        }
      }

      if (isDark) {
        // Nether features: Fungi trees, basalt pillars, glowstone, fire, nether bricks
        for (let attempt = 0; attempt < 120; attempt++) {
          const tx = Math.floor(Math.random() * (gridSize - 4)) + 2
          const tz = Math.floor(Math.random() * (gridSize - 4)) + 2
          const type = blockTypes[tz][tx]
          if (type === "skip" || type === "lava") continue
          const h = heights[tz][tx]

          if (type === "warped_nylium" || type === "crimson_nylium") {
            if (Math.random() < 0.2) {
              // Fungi Tree with proper stems and wart blocks
              const isWarped = type === "warped_nylium"
              const stemMat = isWarped ? materials.warped_stem : materials.crimson_stem
              const capMat = isWarped ? materials.warped_wart_block : materials.nether_wart_block
              const th = 2 + Math.floor(Math.random() * 3)
              for (let ty = 1; ty <= th; ty++) {
                addDeco(blockGeo, stemMat, tx - offset + 0.5, h - 3 + ty, tz - offset + 0.5, true)
              }
              // Shroomlight at top sometimes
              if (Math.random() > 0.5) {
                addDeco(blockGeo, materials.shroomlight, tx - offset + 0.5, h - 3 + th + 1, tz - offset + 0.5, true)
              }
              for (let ox = -1; ox <= 1; ox++) {
                for (let oz = -1; oz <= 1; oz++) {
                  if (ox === 0 && oz === 0) continue
                  if (Math.random() > 0.7 && Math.abs(ox) + Math.abs(oz) === 2) continue
                  addDeco(blockGeo, capMat, tx + ox - offset + 0.5, h - 3 + th, tz + oz - offset + 0.5, true)
                }
              }
            } else if (Math.random() < 0.35) {
              if (Math.random() > 0.6) {
                addDeco(flowerGeo, materials.fire, tx - offset + 0.5, h - 2.75, tz - offset + 0.5)
              } else if (Math.random() > 0.4) {
                addDeco(blockGeo, materials.glowstone, tx - offset + 0.5, h - 2, tz - offset + 0.5, true)
              } else {
                addDeco(blockGeo, materials.shroomlight, tx - offset + 0.5, h - 2, tz - offset + 0.5, true)
              }
            }
          }

          if (type === "soul_sand" && Math.random() < 0.4) {
            addDeco(flowerGeo, materials.soul_fire, tx - offset + 0.5, h - 2.75, tz - offset + 0.5)
          }

          if (type === "netherrack" && Math.random() < 0.08) {
            // Nether gold ore or ancient debris exposed
            const oreMat = Math.random() > 0.7 ? materials.ancient_debris : materials.nether_gold_ore
            addDeco(blockGeo, oreMat, tx - offset + 0.5, h - 2, tz - offset + 0.5, true)
          }

          if ((type === "blackstone" || type === "basalt") && Math.random() < 0.35) {
            const sh = Math.floor(Math.random() * 4) + 1
            const pillarMat = type === "blackstone" ? materials.blackstone : materials.basalt
            for (let ty = 1; ty <= sh; ty++) {
              addDeco(blockGeo, pillarMat, tx - offset + 0.5, h - 3 + ty, tz - offset + 0.5, true)
            }
          }

          // Occasional nether brick structures
          if (type === "netherrack" && Math.random() < 0.03) {
            for (let bx = 0; bx < 2; bx++) {
              for (let bz = 0; bz < 2; bz++) {
                addDeco(blockGeo, materials.nether_bricks, tx + bx - offset + 0.5, h - 2, tz + bz - offset + 0.5, true)
              }
            }
          }

          // Magma blocks near lava
          if (type === "netherrack") {
            const nearLava = (
              blockTypes[tz - 1]?.[tx] === "lava" || blockTypes[tz + 1]?.[tx] === "lava" ||
              blockTypes[tz]?.[tx - 1] === "lava" || blockTypes[tz]?.[tx + 1] === "lava"
            )
            if (nearLava && Math.random() < 0.4) {
              // Replace top block visually with magma
              addDeco(blockGeo, materials.magma, tx - offset + 0.5, h - 3, tz - offset + 0.5, true)
            }
          }
        }

        // Nether Portal
        const px = -6, py = 1, pz = 3
        for (let pyy = 0; pyy < 5; pyy++) {
          for (let pxx = 0; pxx < 4; pxx++) {
            if (pxx === 0 || pxx === 3 || pyy === 0 || pyy === 4) {
              addDeco(blockGeo, Math.random() > 0.85 ? materials.crying_obsidian : materials.obsidian, px + pxx, py + pyy - 1, pz, true)
            } else {
              addDeco(blockGeo, materials.portal, px + pxx, py + pyy - 1, pz)
            }
          }
        }

        // Nether floating islands
        const netherIslands = [
          { angle: 2.3, dist: 15, y: 4, radius: 3, tree: true },
          { angle: 5.0, dist: 14, y: 1, radius: 2, tree: false },
          { angle: 0.5, dist: 16, y: 2, radius: 2, tree: true },
          { angle: 3.5, dist: 13, y: -1, radius: 1, tree: false },
          { angle: 1.2, dist: 17, y: 0, radius: 1, tree: false },
          { angle: 4.5, dist: 18, y: 3, radius: 1, tree: false },
        ]

        netherIslands.forEach(island => {
          const ix = Math.cos(island.angle) * island.dist
          const iz = Math.sin(island.angle) * island.dist
          const isWarped = hash(Math.round(island.angle * 10), Math.round(island.dist)) > 0.5
          const surfMat = isWarped ? materials.warped_nylium : materials.crimson_nylium
          buildFloatingIsland(ix, island.y, iz, island.radius, surfMat, materials.netherrack, materials.blackstone)

          // Add fungi tree on islands with tree flag
          if (island.tree) {
            const stemMat = isWarped ? materials.warped_stem : materials.crimson_stem
            const capMat = isWarped ? materials.warped_wart_block : materials.nether_wart_block
            for (let ty = 1; ty <= 3; ty++) {
              addDeco(blockGeo, stemMat, ix, island.y + ty, iz, true)
            }
            addDeco(blockGeo, materials.shroomlight, ix, island.y + 4, iz, true)
            for (let lx = -1; lx <= 1; lx++) {
              for (let lz = -1; lz <= 1; lz++) {
                if (lx === 0 && lz === 0) continue
                if (Math.abs(lx) + Math.abs(lz) === 2 && hash(lx + island.dist, lz + Math.round(island.angle * 5)) > 0.5) continue
                addDeco(blockGeo, capMat, ix + lx, island.y + 3, iz + lz, true)
              }
            }
          }
        })

        // Scattered nether debris blocks
        const netherFloatingMats = [
          materials.netherrack, materials.blackstone, materials.basalt,
          materials.magma, materials.nether_bricks, materials.glowstone,
          materials.nether_gold_ore, materials.soul_sand, materials.obsidian,
          materials.crying_obsidian, materials.ancient_debris,
          materials.crimson_planks, materials.warped_planks,
          materials.nether_wart_block, materials.warped_wart_block,
        ]

        for (let i = 0; i < 10; i++) {
          const angle = Math.random() * Math.PI * 2
          const radius = 13 + Math.random() * 8
          const fx = Math.cos(angle) * radius
          const fz = Math.sin(angle) * radius
          const fy = -3 + Math.random() * 10
          const scale = 0.5 + Math.random() * 0.5
          const mat = netherFloatingMats[Math.floor(Math.random() * netherFloatingMats.length)]

          const floatBlock = new THREE.Mesh(blockGeo, mat)
          floatBlock.position.set(fx, fy, fz)
          floatBlock.scale.set(scale, scale, scale)
          floatBlock.rotation.set(
            (Math.random() - 0.5) * 0.4,
            Math.random() * Math.PI * 2,
            (Math.random() - 0.5) * 0.4
          )
          floatBlock.castShadow = true
          floatBlock.receiveShadow = true
          world.add(floatBlock)
          allMeshes.push(floatBlock)
          terrainMeshes.push(floatBlock)
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
      const particleCount = 80
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
        tallGrassGeo.dispose()
        lilyPadGeo.dispose()
        Object.values(materials).forEach(m => {
          if (Array.isArray(m)) m.forEach(mat => mat.dispose())
          else m.dispose()
        })
        Object.values(tex).forEach(t => t.dispose())
        nt.dispose()
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
