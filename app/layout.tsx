import type { Metadata, Viewport } from "next"
import { Space_Grotesk, Playfair_Display, JetBrains_Mono, Press_Start_2P } from "next/font/google"
import { ThemeProvider } from "@/lib/theme"
import "./globals.css"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "700"],
})

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  style: ["normal", "italic"],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
})

const pressStart2P = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-press-start",
})

export const metadata: Metadata = {
  title: "Ayush Mahajan | @Zephyrxx0 — Portfolio",
  description:
    "Software Engineer. Builder. Pixel Enthusiast. Portfolio of Ayush Mahajan featuring projects, skills, and creative endeavors.",
}

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${playfairDisplay.variable} ${jetbrainsMono.variable} ${pressStart2P.variable}`}>
      <body className="font-sans antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
