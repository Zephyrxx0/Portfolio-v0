"use client"

import type { ReactNode, CSSProperties } from "react"

interface BrutalistCardProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  onClick?: () => void
  hoverable?: boolean
}

export default function BrutalistCard({
  children,
  className = "",
  style,
  onClick,
  hoverable = true,
}: BrutalistCardProps) {
  return (
    <div
      onClick={onClick}
      className={`brutalist-card ${className}`}
      style={{
        border: "3px solid var(--text)",
        boxShadow: "4px 4px 0 var(--shadow)",
        background: "var(--bg2)",
        padding: "1.5rem",
        borderRadius: 0,
        transition: "all 0.15s ease",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!hoverable) return
        e.currentTarget.style.boxShadow = "8px 8px 0 var(--accent)"
        e.currentTarget.style.transform = "translate(-2px, -2px)"
      }}
      onMouseLeave={(e) => {
        if (!hoverable) return
        e.currentTarget.style.boxShadow = "4px 4px 0 var(--shadow)"
        e.currentTarget.style.transform = "translate(0, 0)"
      }}
    >
      {children}
    </div>
  )
}
