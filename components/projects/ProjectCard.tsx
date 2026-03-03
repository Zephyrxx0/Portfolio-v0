"use client"

import { useState } from "react"
import Link from "next/link"
import type { Project } from "@/lib/projects"
import BrutalistCard from "../shared/BrutalistCard"

// Pixel icons for projects
const PIXEL_ICONS: Record<string, number[][]> = {
  bot: [
    [0,1,1,1,1,0],
    [1,0,1,1,0,1],
    [1,1,1,1,1,1],
    [1,0,0,0,0,1],
    [0,1,1,1,1,0],
    [0,0,1,1,0,0],
  ],
  test: [
    [1,1,1,1,1,1],
    [1,0,0,0,0,1],
    [1,0,1,0,0,1],
    [1,0,0,0,0,1],
    [1,0,0,1,0,1],
    [1,1,1,1,1,1],
  ],
  weather: [
    [0,0,1,1,0,0],
    [0,1,1,1,1,0],
    [1,1,1,1,1,1],
    [0,1,1,1,1,0],
    [0,0,0,0,1,0],
    [0,0,1,0,0,0],
  ],
}

const ICON_MAP: Record<string, string> = {
  memebot: "bot",
  "flexi-test": "test",
  "weather-lookup": "weather",
}

interface ProjectCardProps {
  project: Project
  onEasterEgg: () => void
}

export default function ProjectCard({ project, onEasterEgg }: ProjectCardProps) {
  const [badgeClicks, setBadgeClicks] = useState(0)
  const [hovered, setHovered] = useState(false)

  const handleBadgeClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const next = badgeClicks + 1
    setBadgeClicks(next)
    if (next >= 3) {
      onEasterEgg()
      setBadgeClicks(0)
    }
  }

  const iconData = PIXEL_ICONS[ICON_MAP[project.slug] || "bot"]

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <BrutalistCard className="relative h-full">
        {/* Top row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Pixel icon */}
            <svg width="24" height="24" viewBox="0 0 24 24">
              {iconData.map((row, y) =>
                row.map((cell, x) =>
                  cell ? (
                    <rect
                      key={`${x}-${y}`}
                      x={x * 4}
                      y={y * 4}
                      width="4"
                      height="4"
                      fill="var(--accent)"
                    />
                  ) : null
                )
              )}
            </svg>

            <h3 className="font-sans text-lg font-bold" style={{ color: "var(--text)" }}>
              {project.name}
            </h3>
          </div>

          {/* Index badge */}
          <button
            onClick={handleBadgeClick}
            className="font-mono text-sm font-bold"
            style={{
              color: "var(--muted)",
              fontFamily: "var(--font-jetbrains)",
            }}
          >
            {project.index}
          </button>
        </div>

        {/* Separator */}
        <div
          className="my-3"
          style={{ borderTop: "2px solid var(--border)" }}
        />

        {/* Description */}
        <p
          className="mb-4"
          style={{
            fontFamily: "var(--font-playfair)",
            color: "var(--text)",
            fontSize: "1rem",
            lineHeight: 1.6,
          }}
        >
          {project.oneLiner}
        </p>

        {/* Tags */}
        <div className="mb-4 flex flex-wrap gap-2">
          {project.stack.map((tech) => (
            <span
              key={tech}
              className="px-2 py-0.5 text-xs font-bold"
              style={{
                fontFamily: "var(--font-jetbrains)",
                border: "2px solid var(--border)",
                color: "var(--accent)",
              }}
            >
              {tech.toLowerCase()}
            </span>
          ))}
        </div>

        {/* View link */}
        <div className="flex justify-end">
          <Link
            href={`/projects/${project.slug}`}
            className="font-sans text-sm font-bold tracking-wide transition-colors"
            style={{ color: "var(--accent)" }}
          >
            {"VIEW PROJECT \u2192"}
          </Link>
        </div>

        {/* Hover sprite */}
        {hovered && (
          <div
            className="absolute right-2 top-2"
            style={{
              opacity: hovered ? 1 : 0,
              transform: hovered ? "scale(1)" : "scale(0)",
              transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16">
              <rect x="6" y="0" width="4" height="4" fill="var(--accent)" />
              <rect x="2" y="4" width="4" height="4" fill="var(--accent)" />
              <rect x="6" y="4" width="4" height="4" fill="var(--accent)" />
              <rect x="10" y="4" width="4" height="4" fill="var(--accent)" />
              <rect x="0" y="8" width="4" height="4" fill="var(--accent)" />
              <rect x="6" y="8" width="4" height="4" fill="var(--accent)" />
              <rect x="12" y="8" width="4" height="4" fill="var(--accent)" />
              <rect x="6" y="12" width="4" height="4" fill="var(--accent)" />
            </svg>
          </div>
        )}
      </BrutalistCard>
    </div>
  )
}
