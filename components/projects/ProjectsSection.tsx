"use client"

import { useEffect, useRef, useState } from "react"
import { projects } from "@/lib/projects"
import ProjectCard from "./ProjectCard"

export default function ProjectsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)
  const [showEasterEgg, setShowEasterEgg] = useState(false)
  const [typedLines, setTypedLines] = useState<string[]>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  // Easter egg terminal animation
  useEffect(() => {
    if (!showEasterEgg) return

    const lines = [
      "> npm run ayush",
      "[=====] Loading personality modules...",
      'Installing: wit................. done \u2713',
      'Installing: charisma............ done \u2713',
      'Installing: coffee_dependency... done \u2713',
      'Installing: sleep............... ERROR 404 not found',
      "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500",
      "All systems nominal. Ayush is ready.",
    ]

    setTypedLines([])
    let i = 0
    const interval = setInterval(() => {
      if (i < lines.length) {
        setTypedLines((prev) => [...prev, lines[i]])
        i++
      } else {
        clearInterval(interval)
      }
    }, 400)

    return () => clearInterval(interval)
  }, [showEasterEgg])

  return (
    <section
      id="projects"
      ref={sectionRef}
      className="relative px-6 py-24 md:py-32"
      style={{ background: "var(--bg)" }}
    >
      {/* Thick divider */}
      <div
        className="mx-auto mb-12 max-w-6xl"
        style={{ borderTop: "4px solid var(--text)" }}
      />

      <div className="mx-auto max-w-6xl">
        {/* Section heading */}
        <h2
          className="mb-12 font-sans text-4xl font-black uppercase tracking-tight md:text-5xl"
          style={{
            color: "var(--text)",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(40px)",
            transition: "all 700ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          PROJECTS
        </h2>

        {/* 2-column × 3-row grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          {projects.map((project, idx) => (
            <div
              key={project.slug}
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(60px)",
                transition: `all 800ms cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 120}ms`,
              }}
            >
              <ProjectCard
                project={project}
                onEasterEgg={() => setShowEasterEgg(true)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Easter egg modal */}
      {showEasterEgg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => setShowEasterEgg(false)}
        >
          <div
            className="w-full max-w-lg p-6"
            style={{
              background: "#0a0a0a",
              border: "3px solid #f0f0f0",
              boxShadow: "8px 8px 0 #00ff9d",
              fontFamily: "var(--font-jetbrains)",
              color: "#00ff9d",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {typedLines.map((line, i) => (
              <p key={i} className="mb-1 text-sm">
                {line.includes("ERROR") ? (
                  <span style={{ color: "#ff6b6b" }}>{line}</span>
                ) : line.includes("done") ? (
                  <span>
                    {line.replace("done \u2713", "")}
                    <span style={{ color: "#00ff9d" }}>{"done \u2713"}</span>
                  </span>
                ) : (
                  line
                )}
              </p>
            ))}
            <span className="animate-blink">_</span>

            <button
              onClick={() => setShowEasterEgg(false)}
              className="mt-6 block w-full py-2 text-center text-sm font-bold"
              style={{
                border: "2px solid #f0f0f0",
                color: "#f0f0f0",
              }}
            >
              [CLOSE]
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
