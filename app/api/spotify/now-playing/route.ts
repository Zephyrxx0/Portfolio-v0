import { NextResponse } from "next/server"
import { getNowPlaying } from "@/lib/spotify"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    const data = await getNowPlaying()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in spotify route:", error)
    return NextResponse.json({ isPlaying: false }, { status: 500 })
  }
}
