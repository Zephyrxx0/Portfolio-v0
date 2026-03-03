import { notFound } from "next/navigation"
import { projects, getProjectBySlug } from "@/lib/projects"
import ProjectPageClient from "./ProjectPageClient"

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = getProjectBySlug(slug)
  if (!project) return { title: "Not Found" }
  return {
    title: `${project.name} | Zephyrxx0`,
    description: project.oneLiner,
  }
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = getProjectBySlug(slug)
  if (!project) notFound()
  return <ProjectPageClient project={project} />
}
