"use client"

import Link from "next/link"
import type { Project } from "@/lib/projects"

export default function ProjectPageClient({ project }: { project: Project }) {
  return (
    <main
      className="min-h-screen px-6 py-24 md:py-32"
      style={{ background: "var(--bg)" }}
    >
      <div className="mx-auto max-w-4xl">
        {/* Top bar */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/#projects"
            className="font-sans text-sm font-bold transition-colors"
            style={{ color: "var(--accent)" }}
          >
            {"\u2190 BACK TO PROJECTS"}
          </Link>
          <h1 className="font-sans text-2xl font-black uppercase md:text-3xl" style={{ color: "var(--text)" }}>
            {project.name} <span style={{ color: "var(--muted)" }}>{project.index}</span>
          </h1>
        </div>

        {/* Divider */}
        <div style={{ borderTop: "4px solid var(--text)" }} className="mb-12" />

        {/* Overview */}
        <div className="mb-12">
          <h2 className="mb-4 font-sans text-xl font-bold uppercase" style={{ color: "var(--text)" }}>
            OVERVIEW
          </h2>
          <p
            className="text-lg leading-relaxed"
            style={{ fontFamily: "var(--font-playfair)", color: "var(--text)" }}
          >
            {project.description}
          </p>
        </div>

        {/* Built with + links */}
        <div className="mb-12 flex flex-col gap-8 md:flex-row md:gap-16">
          <div>
            <h3 className="mb-3 font-sans text-sm font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
              BUILT WITH
            </h3>
            <div className="flex flex-wrap gap-2">
              {project.stack.map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1 text-xs font-bold"
                  style={{
                    fontFamily: "var(--font-jetbrains)",
                    border: "2px solid var(--text)",
                    color: "var(--accent)",
                  }}
                >
                  {tech.toLowerCase()}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-sans text-sm font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
              LINKS
            </h3>
            <div className="flex flex-col gap-2">
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-sm font-bold transition-colors"
                style={{ color: "var(--text)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text)")}
              >
                {"GITHUB \u2197"}
              </a>
              {project.live && (
                <a
                  href={project.live}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-sans text-sm font-bold transition-colors"
                  style={{ color: "var(--text)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text)")}
                >
                  {"LIVE DEMO \u2197"}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: "4px solid var(--text)" }} className="mb-12" />

        {/* Pixel art placeholder */}
        <div
          className="mb-12 flex items-center justify-center p-12"
          style={{
            border: "3px solid var(--text)",
            boxShadow: "4px 4px 0 var(--shadow)",
            background: "var(--bg2)",
          }}
        >
          <ProjectPixelArt slug={project.slug} />
        </div>

        {/* Divider */}
        <div style={{ borderTop: "4px solid var(--text)" }} className="mb-12" />

        {/* What I learned */}
        <div>
          <h2 className="mb-4 font-sans text-xl font-bold uppercase" style={{ color: "var(--text)" }}>
            WHAT I LEARNED
          </h2>
          <p
            className="text-lg leading-relaxed"
            style={{ fontFamily: "var(--font-playfair)", color: "var(--text)" }}
          >
            {project.learned}
          </p>
        </div>
      </div>
    </main>
  )
}

function ProjectPixelArt({ slug }: { slug: string }) {
  const arts: Record<string, number[][]> = {
    memebot: [
      [0,0,0,0,1,1,1,1,1,1,0,0,0,0],
      [0,0,0,1,1,1,1,1,1,1,1,0,0,0],
      [0,0,1,1,2,2,1,1,2,2,1,1,0,0],
      [0,0,1,1,2,3,1,1,2,3,1,1,0,0],
      [0,0,1,1,1,1,1,1,1,1,1,1,0,0],
      [0,0,1,1,1,4,4,4,4,1,1,1,0,0],
      [0,0,0,1,1,1,1,1,1,1,1,0,0,0],
      [0,1,1,1,1,1,1,1,1,1,1,1,1,0],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,0,1,1,1,1,1,1,1,1,0,1,1],
      [1,1,0,0,1,1,1,1,1,1,0,0,1,1],
      [0,0,0,0,1,1,0,0,1,1,0,0,0,0],
    ],
    "flexi-test": [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,3,3,3,0,0,0,3,3,3,0,0,1],
      [1,0,3,0,0,0,0,0,3,0,0,0,0,1],
      [1,0,3,3,0,0,0,0,3,3,0,0,0,1],
      [1,0,3,0,0,0,0,0,3,0,0,0,0,1],
      [1,0,3,0,0,0,0,0,3,3,3,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,4,4,4,4,4,4,4,4,0,0,1],
      [1,0,0,4,0,0,4,0,0,4,0,0,0,1],
      [1,0,0,4,4,4,4,4,4,4,4,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
    "weather-lookup": [
      [0,0,0,0,0,3,3,3,0,0,0,0,0,0],
      [0,0,0,0,3,3,3,3,3,0,0,0,0,0],
      [0,0,0,3,3,3,3,3,3,3,0,0,0,0],
      [0,0,3,3,3,3,3,3,3,3,3,0,0,0],
      [0,3,3,3,3,3,3,3,3,3,3,3,0,0],
      [3,3,3,3,3,3,3,3,3,3,3,3,3,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,4,0,0,4,0,0,4,0,0,4,0,0,0],
      [0,0,4,0,0,4,0,0,4,0,0,4,0,0],
      [0,0,0,4,0,0,4,0,0,4,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    ],
  }

  const colorMap: Record<number, string> = {
    0: "transparent",
    1: "var(--text)",
    2: "var(--bg)",
    3: "var(--accent)",
    4: "var(--accent2)",
  }

  const art = arts[slug] || arts.memebot
  const pixelSize = 8

  return (
    <svg
      width={14 * pixelSize}
      height={12 * pixelSize}
      viewBox={`0 0 ${14 * pixelSize} ${12 * pixelSize}`}
      style={{ imageRendering: "pixelated" }}
    >
      {art.map((row, y) =>
        row.map((cell, x) =>
          cell ? (
            <rect
              key={`${x}-${y}`}
              x={x * pixelSize}
              y={y * pixelSize}
              width={pixelSize}
              height={pixelSize}
              fill={colorMap[cell]}
            />
          ) : null
        )
      )}
    </svg>
  )
}
