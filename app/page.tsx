"use client"

import Nav from "@/components/shared/Nav"
import HeroSection from "@/components/hero/HeroSection"
import AboutSection from "@/components/about/AboutSection"
import ProjectsSection from "@/components/projects/ProjectsSection"
import SkillsSection from "@/components/skills/SkillsSection"
import HobbiesSection from "@/components/hobbies/HobbiesSection"
import ContactSection from "@/components/contact/ContactSection"

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <HeroSection />
        <AboutSection />
        <ProjectsSection />
        <SkillsSection />
        <HobbiesSection />
        <ContactSection />
      </main>
    </>
  )
}
