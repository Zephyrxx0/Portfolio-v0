"use client"

import { useEffect, useState } from "react"
import type { NowPlayingData } from "@/lib/spotify"
import { motion } from "framer-motion"

export default function SpotifyWidget() {
    const [data, setData] = useState<NowPlayingData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchNowPlaying = async () => {
            try {
                const res = await fetch("/api/now-playing", { cache: "no-store" })
                const json = await res.json()
                setData(json)
            } catch (error) {
                console.error("Error fetching Spotify data", error)
            } finally {
                setLoading(false)
            }
        }

        fetchNowPlaying()
        // Poll every 30 seconds
        const interval = setInterval(fetchNowPlaying, 30000)
        return () => clearInterval(interval)
    }, [])

    if (loading || !data?.title) {
        return (
            <div className="flex items-center gap-2 border-2 border-[var(--border)] bg-[var(--bg)] px-3 py-1 font-jetbrains text-xs text-[var(--muted)]">
                <span className="h-2 w-2 rounded-full bg-[var(--muted)] animate-pulse" />
                Not Playing
            </div>
        )
    }

    return (
        <motion.a
            href={data.songUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-row items-center gap-3 overflow-hidden border-2 border-[var(--text)] bg-[var(--bg2)] p-1 pr-3 shadow-[4px_4px_0_var(--shadow)] transition-all hover:shadow-[6px_6px_0_var(--accent)] hover:-translate-y-[2px] hover:-translate-x-[2px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            layout
        >
            {data.albumArt && (
                <img
                    src={data.albumArt}
                    alt={`${data.album} cover`}
                    className="h-10 w-10 border-r-2 border-[var(--border)] object-cover grayscale transition-all group-hover:grayscale-0"
                />
            )}
            <div className="flex flex-col justify-center overflow-hidden h-full max-w-[150px]">
                <span className="truncate font-sans text-xs font-bold text-[var(--accent)]">
                    {data.title}
                </span>
                <span className="truncate font-playfair text-[10px] italic text-[var(--muted)]">
                    {data.artist}
                </span>
            </div>
            <div className="ml-1 flex h-4 w-4 shrink-0 items-end justify-between gap-[2px]">
                {data.isPlaying ? (
                    <>
                        <motion.span
                            className="w-[3px] bg-[var(--accent)]"
                            animate={{ height: ["4px", "12px", "4px"] }}
                            transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                        />
                        <motion.span
                            className="w-[3px] bg-[var(--accent)]"
                            animate={{ height: ["8px", "16px", "8px"] }}
                            transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                        />
                        <motion.span
                            className="w-[3px] bg-[var(--accent)]"
                            animate={{ height: ["6px", "10px", "6px"] }}
                            transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                        />
                    </>
                ) : (
                    <>
                        <span className="w-[3px] bg-[var(--muted)]" style={{ height: "4px" }} />
                        <span className="w-[3px] bg-[var(--muted)]" style={{ height: "8px" }} />
                        <span className="w-[3px] bg-[var(--muted)]" style={{ height: "6px" }} />
                    </>
                )}
            </div>
        </motion.a>
    )
}
