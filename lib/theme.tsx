"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

type Theme = "dark" | "light"

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => { },
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark")

  useEffect(() => {
    const saved = localStorage.getItem("zephyr-theme") as Theme
    if (saved === "light") {
      setTheme("light")
      document.documentElement.classList.add("theme-light")
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark"
      if (next === "light") {
        document.documentElement.classList.add("theme-light")
      } else {
        document.documentElement.classList.remove("theme-light")
      }
      localStorage.setItem("zephyr-theme", next)
      return next
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
