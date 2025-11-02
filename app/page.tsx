"use client"

import { useState, useEffect } from "react"

const THEMES = {
  cyberpunk: {
    name: "CYBERPUNK",
    bgGradient: "from-violet-950 to-purple-950",
    primary: "from-violet-500 to-purple-500",
  },
  synthwave: {
    name: "SYNTHWAVE",
    bgGradient: "from-pink-950 to-rose-950",
    primary: "from-pink-500 to-rose-500",
  },
  retroNeon: {
    name: "RETRO NEON",
    bgGradient: "from-cyan-950 to-blue-950",
    primary: "from-cyan-500 to-blue-500",
  },
  light: {
    name: "LIGHT",
    bgGradient: "from-orange-50 to-yellow-50",
    primary: "from-violet-500 to-purple-500",
  },
}

export default function Home() {
  const [theme, setTheme] = useState<keyof typeof THEMES>("cyberpunk")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem("theme")
    if (saved && saved in THEMES) {
      setTheme(saved as keyof typeof THEMES)
    }
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("theme", theme)
      document.documentElement.setAttribute("data-theme", theme)
    }
  }, [theme, mounted])

  const currentTheme = THEMES[theme]
  const themeKeys = Object.keys(THEMES) as (keyof typeof THEMES)[]
  const nextTheme = themeKeys[(themeKeys.indexOf(theme) + 1) % themeKeys.length]

  const toggleTheme = () => {
    setTheme(nextTheme)
  }

  const pixelShapes = ["◆◆◆", "███", "▓▓▓", "╱╲╱", "■■■", "▀▀▀", "░░░"]

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 overflow-hidden relative scanlines">
      <div className="fixed top-20 right-12 text-6xl opacity-25 pointer-events-none animate-pulse">
        ▀█▄
        <br />
        █▀█
        <br />
        █░█
      </div>
      <div className="fixed bottom-40 left-8 text-5xl opacity-15 pointer-events-none">◆█◆</div>
      <div className="fixed top-1/3 right-12 text-5xl opacity-20 pointer-events-none">▓▓▓</div>
      <div className="fixed bottom-20 right-1/4 text-6xl opacity-15 pointer-events-none">■░■</div>
      <div className="fixed top-1/4 left-1/4 text-5xl opacity-18 pointer-events-none">▀█▀</div>
      <div className="fixed bottom-1/3 left-1/2 text-4xl opacity-15 pointer-events-none">░▓░</div>
      <div className="fixed top-1/2 left-10 text-5xl opacity-20 pointer-events-none">█▀█</div>
      <div className="fixed top-1/2 right-20 text-4xl opacity-12 pointer-events-none">◇▓◇</div>

      <header className="mb-16 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary border-3 border-secondary flex items-center justify-center text-primary-foreground font-bold pixel-font text-lg cyber-glow">
              ▶
            </div>
            <div>
              <h1 className="text-5xl md:text-7xl font-bold text-primary pixel-font cyber-glow">ALEX.SYS</h1>
              <p className="text-xs md:text-sm text-accent pixel-font">// FULL-STACK REALITY HACKER</p>
            </div>
          </div>
          <div className="w-32 h-32 border-3 border-accent flex-shrink-0">
            <img
              src="/pixel-art-portrait-cyberpunk-neon.jpg"
              alt="alex avatar"
              className="w-full h-full object-cover pixel-object"
            />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto relative z-10">
        <section className="mb-16 p-8 bg-secondary/10 border-3 border-secondary pixel-border">
          <h2 className="text-2xl font-bold text-secondary-foreground mb-6 pixel-font cyber-glow">[ ABOUT ]</h2>
          <div className="space-y-4 text-foreground/90 text-sm md:text-base">
            <p>
              hey, i'm alex. been architecting digital experiences since 2016. obsessed with building fast, resilient
              systems that don't just work—they sing. react, node.js, and databases are my playground.
            </p>
            <p>
              when i'm not shipping code, you'll find me debugging legacy systems at 3am, contributing to open source,
              or exploring the intersection of performance and beauty in web design. coffee is a food group.
            </p>
            <p>
              currently building scalable backends and interactive frontends. previous work at tech startups and
              enterprise level systems.
            </p>
          </div>
        </section>

        <section className="mb-16 p-8 bg-card border-3 border-primary pixel-border">
          <h2 className="text-3xl font-bold text-primary mb-4 pixel-font cyber-glow">{">> STACK"}</h2>
          <p className="text-foreground leading-relaxed mb-6 text-sm md:text-base">
            full-stack developer with 8+ years of experience. specialized in modern web architecture, real-time systems,
            and developer experience optimization.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="px-3 py-2 bg-primary/20 border-2 border-primary text-primary font-semibold text-xs pixel-font">
              [REACT]
            </div>
            <div className="px-3 py-2 bg-accent/20 border-2 border-accent text-accent font-semibold text-xs pixel-font">
              [NODE.JS]
            </div>
            <div className="px-3 py-2 bg-secondary/20 border-2 border-secondary text-secondary-foreground font-semibold text-xs pixel-font">
              [POSTGRES]
            </div>
            <div className="px-3 py-2 bg-muted/20 border-2 border-muted text-muted-foreground font-semibold text-xs pixel-font">
              [TYPESCRIPT]
            </div>
          </div>
        </section>

        {/* Featured Work */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-primary mb-6 pixel-font cyber-glow">{"[ PROJECTS ]"}</h2>
          <div className="space-y-4">
            {[
              {
                title: "DataSync Platform ◆",
                desc: "real-time data synchronization engine serving 50k+ concurrent users. built with websockets and event streaming.",
                status: "COMPLETE",
              },
              {
                title: "Analytics Dashboard ▓",
                desc: "interactive analytics suite processing petabytes of user data. performance optimized for sub-100ms queries.",
                status: "IN PROGRESS",
              },
              {
                title: "Auth Microservice █",
                desc: "zero-trust authentication system with oauth2, 2fa, and biometric support. deployed globally.",
                status: "COMPLETE",
              },
            ].map((project, idx) => (
              <div
                key={idx}
                className="p-6 bg-card border-3 border-muted hover:border-secondary transition-all cursor-pointer pixel-border group hover:bg-secondary/10"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-primary group-hover:text-accent transition-colors pixel-font">
                    {project.title}
                  </h3>
                  <span className="text-xs bg-muted text-muted-foreground px-3 py-1 border border-muted pixel-font">
                    [{project.status}]
                  </span>
                </div>
                <p className="text-foreground/80 text-sm">{project.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact CTA */}
        <section className="p-8 bg-primary/10 border-3 border-primary pixel-border">
          <h2 className="text-2xl font-bold text-primary mb-4 pixel-font cyber-glow">[ CONNECT ]</h2>
          <p className="text-foreground mb-6 text-sm md:text-base">
            interested in collaboration? let's build something incredible together. open to freelance projects,
            consulting, or just geeking out about architecture.
          </p>
          <div className="flex flex-wrap gap-3">
            <button className="px-6 py-3 bg-primary text-primary-foreground border-4 border-primary font-bold hover:bg-primary/80 transition-all pixel-font text-sm hover:shadow-lg hover:shadow-primary/50 hover:scale-105 active:scale-95">
              EMAIL
            </button>
            <button className="px-6 py-3 bg-transparent text-accent border-4 border-accent font-bold hover:bg-accent/10 transition-all pixel-font text-sm hover:shadow-lg hover:shadow-accent/50 hover:scale-105 active:scale-95">
              GITHUB
            </button>
            <button className="px-6 py-3 bg-transparent text-secondary-foreground border-4 border-secondary font-bold hover:bg-secondary/10 transition-all pixel-font text-sm hover:shadow-lg hover:shadow-secondary/50 hover:scale-105 active:scale-95">
              LINKEDIN
            </button>
          </div>
        </section>
      </main>

      <footer className="mt-16 text-center text-muted-foreground pixel-font text-xs border-t-3 border-muted pt-8 relative z-10">
        <div className="flex justify-center gap-6 mb-4 text-4xl">
          <span className="opacity-30">◆◆◆</span>
          <span className="opacity-25">▓▓▓</span>
          <span className="opacity-30">█░█</span>
        </div>
        <p>// ALEX RODRIGUEZ - FULL-STACK ENGINEER</p>
        <p className="mt-2">// BUILDING THE FUTURE IN BITS AND BYTES</p>
      </footer>
    </div>
  )
}
