import { NextResponse } from "next/server"
import { getNowPlaying } from "@/lib/spotify"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const data = await getNowPlaying()

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    })
  } catch (err) {
    console.error("Spotify API Error:", err)
    return NextResponse.json({ isPlaying: false, error: String(err) })
  }
}
