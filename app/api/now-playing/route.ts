import { NextResponse } from "next/server"
import { getNowPlaying } from "@/lib/spotify"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const data = await getNowPlaying()

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=15",
      },
    })
  } catch (err) {
    console.error("Spotify API Error:", err)
    return NextResponse.json({ isPlaying: false, error: String(err) })
  }
}
