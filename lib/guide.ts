import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { compileMDX } from 'next-mdx-remote/rsc'
import { Steps, Step, Callout, FeatureNote, FeatureGrid, FeatureCard } from '@/components/guide/mdx-components'
import {
  EssentialsDashboardMockup,
  AddObjectFormMockup,
  EssentialsObjectDetailMockup,
  ObjectSearchMockup,
  PublicSiteMockup,
  SiteBuilderMockup,
  FeaturedObjectsMockup,
  EssentialsAccountSettingsMockup,
  ProDashboardMockup,
  ProObjectDetailMockup,
  ObjectWithDocumentsMockup,
  ProPublicSiteMockup,
  AnalyticsDashboardMockup,
  EventsDashboardMockup,
  NewEventFormMockup,
  StaffDashboardMockup,
  ComplianceDashboardMockup,
  ProvenanceTabMockup,
  ProAccountSettingsMockup,
} from '@/components/guide/guide-mockups'
import type React from 'react'

export type GuideGroup = 'essentials' | 'professional'

export interface GuideSection {
  slug: string
  title: string
  section: string
  order: number
  icon: string
  description: string
  content: React.ReactNode
}

const CONTENT_DIR = path.join(process.cwd(), 'content', 'guide')

const MDX_COMPONENTS = {
  // Text / layout
  Steps, Step, Callout, FeatureNote, FeatureGrid, FeatureCard,
  // Mockups
  EssentialsDashboardMockup,
  AddObjectFormMockup,
  EssentialsObjectDetailMockup,
  ObjectSearchMockup,
  PublicSiteMockup,
  SiteBuilderMockup,
  FeaturedObjectsMockup,
  EssentialsAccountSettingsMockup,
  ProDashboardMockup,
  ProObjectDetailMockup,
  ObjectWithDocumentsMockup,
  ProPublicSiteMockup,
  AnalyticsDashboardMockup,
  EventsDashboardMockup,
  NewEventFormMockup,
  StaffDashboardMockup,
  ComplianceDashboardMockup,
  ProvenanceTabMockup,
  ProAccountSettingsMockup,
}

export async function getGuideSections(group: GuideGroup): Promise<GuideSection[]> {
  const dir = path.join(CONTENT_DIR, group)
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.mdx')).sort()

  const sections = await Promise.all(
    files.map(async (file) => {
      const raw = fs.readFileSync(path.join(dir, file), 'utf-8')
      const { data, content: source } = matter(raw)
      const slug = file.replace(/^\d+-/, '').replace(/\.mdx$/, '')
      const { content } = await compileMDX({
        source,
        components: MDX_COMPONENTS,
      })
      return {
        slug,
        title: data.title as string,
        section: data.section as string,
        order: data.order as number,
        icon: data.icon as string,
        description: data.description as string,
        content,
      }
    })
  )

  return sections.sort((a, b) => a.order - b.order)
}
