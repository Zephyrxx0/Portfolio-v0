"use client"

import { useEffect, useRef, useState } from "react"
import PixelAvatar from "./PixelAvatar"

export default function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

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

  const lines = [
    { type: "label" },
    { type: "heading" },
    { type: "body1" },
    { type: "body2" },
    { type: "pills" },
  ]

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative px-6 py-24 md:py-32"
      style={{ background: "var(--bg)" }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-12 md:flex-row md:items-center md:gap-16">
        {/* Text block — 60% */}
        <div className="flex flex-col gap-6 md:w-3/5">
          {/* Section label */}
          <p
            className="font-mono text-sm tracking-wider"
            style={{
              color: "var(--muted)",
              fontFamily: "var(--font-jetbrains)",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateX(0)" : "translateX(-60px)",
              transition: "all 700ms cubic-bezier(0.16, 1, 0.3, 1)",
              transitionDelay: "0ms",
            }}
          >
            {"ABOUT \u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014 [001]"}
          </p>

          {/* Heading */}
          <h2
            className="font-sans text-3xl font-bold md:text-4xl"
            style={{
              color: "var(--text)",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateX(0)" : "translateX(-60px)",
              transition: "all 700ms cubic-bezier(0.16, 1, 0.3, 1)",
              transitionDelay: "80ms",
            }}
          >
            Building things that matter.
          </h2>

          {/* Body text */}
          <p
            className="text-lg leading-relaxed"
            style={{
              fontFamily: "var(--font-playfair)",
              color: "var(--text)",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateX(0)" : "translateX(-60px)",
              transition: "all 700ms cubic-bezier(0.16, 1, 0.3, 1)",
              transitionDelay: "160ms",
            }}
          >
            {"I'm Ayush \u2014 a software engineer based in India who builds things that live on the internet."}
          </p>

          <p
            className="text-lg leading-relaxed"
            style={{
              fontFamily: "var(--font-playfair)",
              color: "var(--text)",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateX(0)" : "translateX(-60px)",
              transition: "all 700ms cubic-bezier(0.16, 1, 0.3, 1)",
              transitionDelay: "240ms",
            }}
          >
            {"When I'm not coding, I'm probably sketching pixel art, composing lo-fi tracks, or lost deep in a game."}
          </p>

          {/* Status pills */}
          <div
            className="flex flex-wrap gap-3"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateX(0)" : "translateX(-60px)",
              transition: "all 700ms cubic-bezier(0.16, 1, 0.3, 1)",
              transitionDelay: "320ms",
            }}
          >
            {["CURRENTLY: Building", "LOCATION: India", "OPEN TO WORK"].map((pill) => (
              <span
                key={pill}
                className="inline-block px-3 py-1 font-mono text-xs font-bold"
                style={{
                  border: "2px solid var(--text)",
                  color: "var(--text)",
                  fontFamily: "var(--font-jetbrains)",
                }}
              >
                {pill}
              </span>
            ))}
          </div>
        </div>

        {/* Pixel avatar — 40% */}
        <div
          className="flex items-center justify-center md:w-2/5"
          style={{
            opacity: visible ? 1 : 0,
            transition: "opacity 700ms 400ms",
          }}
        >
          <PixelAvatar />
        </div>
      </div>
    </section>
  )
}
