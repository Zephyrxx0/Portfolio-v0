"use client"

import { useRef, useEffect } from "react"
import { useTheme } from "@/lib/theme"

export default function ThreeBackground() {
  const mountRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  const themeRef = useRef(theme)
  const materialRef = useRef<{ color: { setHex: (hex: number) => void } } | null>(null)

  useEffect(() => {
    themeRef.current = theme
    if (materialRef.current) {
      materialRef.current.color.setHex(theme === "dark" ? 0x00ff9d : 0xc84b00)
    }
  }, [theme])

  useEffect(() => {
    let animId: number
    let disposed = false

    const init = async () => {
      const THREE = await import("three")
      if (disposed || !mountRef.current) return

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100)
      camera.position.z = 5

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      mountRef.current.appendChild(renderer.domElement)

      // Low-poly icosahedron
      const geometry = new THREE.IcosahedronGeometry(1.8, 1)
      const material = new THREE.MeshPhongMaterial({
        color: themeRef.current === "dark" ? 0x00ff9d : 0xc84b00,
        emissive: themeRef.current === "dark" ? 0x003322 : 0x331100,
        emissiveIntensity: 0.15,
        flatShading: true,
        transparent: true,
        opacity: 0.4,
      })
      materialRef.current = material as unknown as { color: { setHex: (hex: number) => void } }

      const mesh = new THREE.Mesh(geometry, material)
      scene.add(mesh)

      // Lights
      const ambient = new THREE.AmbientLight(0x404040, 1)
      scene.add(ambient)
      const directional = new THREE.DirectionalLight(0xffffff, 0.8)
      directional.position.set(5, 5, 5)
      scene.add(directional)

      // Mouse parallax
      let mouseX = 0, mouseY = 0
      const onMouseMove = (e: MouseEvent) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2
      }
      window.addEventListener("mousemove", onMouseMove)

      const animate = () => {
        if (disposed) return
        mesh.rotation.y += 0.003
        mesh.rotation.x += 0.001

        // Lerp toward mouse
        mesh.rotation.x += (mouseY * 0.3 - mesh.rotation.x) * 0.02
        mesh.rotation.z += (mouseX * 0.2 - mesh.rotation.z) * 0.02

        // Update material color
        const targetColor = themeRef.current === "dark" ? 0x00ff9d : 0xc84b00
        material.color.setHex(targetColor)
        material.emissive.setHex(themeRef.current === "dark" ? 0x003322 : 0x331100)

        renderer.render(scene, camera)
        animId = requestAnimationFrame(animate)
      }
      animate()

      const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight
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
        geometry.dispose()
        material.dispose()
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
