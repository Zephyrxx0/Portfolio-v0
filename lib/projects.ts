export interface Project {
  slug: string
  name: string
  index: string
  stack: string[]
  oneLiner: string
  description: string
  github: string
  live?: string
  learned: string
}

export const projects: Project[] = [
  {
    slug: "memebot",
    name: "MemeBot",
    index: "#01",
    stack: ["Python", "Discord API", "Bot"],
    oneLiner: "A bot that sources and delivers fresh memes on demand.",
    description:
      "MemeBot is a Discord bot built with Python and the Discord API. It connects to various meme sources and subreddits to deliver fresh, curated memes directly into your server channels. Users can request random memes, search by category, or set up automated meme delivery on a schedule.",
    github: "https://github.com/Zephyrxx0/MemeBot",
    learned:
      "Building MemeBot taught me a lot about working with REST APIs and handling asynchronous operations in Python. I learned how Discord's gateway system works, how to manage rate limits, and how to structure a bot for scalability. The biggest challenge was handling edge cases when APIs returned unexpected data.",
  },
  {
    slug: "flexi-test",
    name: "Flexi-Test",
    index: "#02",
    stack: ["CSS", "JavaScript", "HTML"],
    oneLiner: "A flexible UI component testing playground.",
    description:
      "Flexi-Test is a browser-based playground for testing and experimenting with UI components. It provides a sandbox environment where you can write HTML, CSS, and JavaScript in real-time and see the results instantly. Perfect for prototyping component ideas or testing responsive layouts.",
    github: "https://github.com/Zephyrxx0/Flexi-Test",
    learned:
      "This project deepened my understanding of CSS Flexbox and Grid layouts. I learned about creating live preview environments, sandboxed iframes for security, and how to build a responsive design testing tool. Managing state between the editor and preview panels was an interesting challenge.",
  },
  {
    slug: "weather-lookup",
    name: "Weather-Lookup",
    index: "#03",
    stack: ["JavaScript", "Weather API", "HTML/CSS"],
    oneLiner: "Check weather conditions for any place on earth.",
    description:
      "Weather-Lookup is a clean, simple weather application that lets you search for weather conditions in any city worldwide. It uses the OpenWeatherMap API to fetch real-time data including temperature, humidity, wind speed, and weather conditions with matching icons.",
    github: "https://github.com/Zephyrxx0/Weather-Lookup",
    learned:
      "Working on Weather-Lookup taught me about integrating third-party APIs, handling API keys securely, and displaying dynamic data in a user-friendly way. I also learned about geocoding, unit conversions, and how to handle errors gracefully when the API is unavailable.",
  },
  {
    slug: "context",
    name: "Context",
    index: "#04",
    stack: ["JavaScript", "HTML", "CSS"],
    oneLiner: "A clean and focused contextual note-taking app.",
    description: "Context is a web-based note taking application built to be fast and distraction-free, letting you organize thoughts directly in the browser.",
    github: "https://github.com/Zephyrxx0/Context",
    learned: "Building Context taught me efficient local storage management and state handling using vanilla JavaScript without heavy frameworks.",
  },
  {
    slug: "portfolio-v0",
    name: "Portfolio-v0",
    index: "#05",
    stack: ["HTML", "CSS", "JavaScript"],
    oneLiner: "The very first version of my developer portfolio.",
    description: "Portfolio-v0 marks my earliest attempt at building a personal space on the web, focusing on basic semantic HTML styling.",
    github: "https://github.com/Zephyrxx0/Portfolio-v0",
    learned: "This foundational project reinforced my core understanding of CSS positioning, flexbox, and semantic HTML.",
  },
  {
    slug: "node-cli",
    name: "Node-CLI-Tools",
    index: "#06",
    stack: ["Node.js", "CLI"],
    oneLiner: "A collection of helpful command line utilities.",
    description: "Various CLI scripts built in Node.js to automate repetitive developer tasks such as scaffolding and cleanup.",
    github: "https://github.com/Zephyrxx0/Node-CLI-Tools",
    learned: "Working heavily with the file system (fs) module and processing command line arguments in Node.js.",
  }
]

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug)
}
