'use client'
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { usePathname, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/app/sidebar'
import { Topbar } from '@/components/app/topbar'
import { CommandPalette } from '@/components/app/command-palette'
import { useAppStore } from '@/store/app-store'
import { DashboardModule } from '@/components/modules/dashboard'
import { AiStudioModule } from '@/components/modules/ai-studio'
import { CoursesModule } from '@/components/modules/courses'
import { CommunityModule } from '@/components/modules/community'
import { ProductsModule } from '@/components/modules/products'
import { StoreModule } from '@/components/modules/store'
import { MembershipModule } from '@/components/modules/membership'
import { EmailModule } from '@/components/modules/email'
import { CrmModule } from '@/components/modules/crm'
import { AffiliatesModule } from '@/components/modules/affiliates'
import { AnalyticsModule } from '@/components/modules/analytics'
import { PagesFunnelsModule } from '@/components/modules/pages-funnels'
import { SupportModule } from '@/components/modules/support'
import { SettingsModule } from '@/components/modules/settings'
import { AdminModule } from '@/components/modules/admin'
import { CertificatesModule } from '@/components/modules/certificates'
import { MediaLibraryModule } from '@/components/modules/media-library'
import { CourseBuilder } from '@/components/course-builder/builder'
import { CoursePlayer } from '@/components/course-player/player'
import type { ModuleId } from '@/lib/nav'

const MODULES: Record<ModuleId, React.ComponentType> = {
  'dashboard': DashboardModule,
  'ai-studio': AiStudioModule,
  'courses': CoursesModule,
  'community': CommunityModule,
  'products': ProductsModule,
  'store': StoreModule,
  'membership': MembershipModule,
  'email': EmailModule,
  'crm': CrmModule,
  'affiliates': AffiliatesModule,
  'analytics': AnalyticsModule,
  'pages-funnels': PagesFunnelsModule,
  'support': SupportModule,
  'settings': SettingsModule,
  'admin': AdminModule,
  'certificates': CertificatesModule,
  'media-library': MediaLibraryModule,
}

function moduleFromPath(pathname: string): ModuleId {
  const seg = pathname.split('/').filter(Boolean)[0]
  if (seg && seg in MODULES) return seg as ModuleId
  return 'dashboard'
}

export function AppShell() {
  const pathname = usePathname()
  const router = useRouter()
  const activeModule = useAppStore((s) => s.activeModule)
  const setActiveModule = useAppStore((s) => s.setActiveModule)
  const builderCourseId = useAppStore((s) => s.builderCourseId)
  const previewCourseId = useAppStore((s) => s.previewCourseId)
  const [seeded, setSeeded] = useState(false)
  const activeModuleRef = useRef(activeModule)
  useEffect(() => {
    activeModuleRef.current = activeModule
  })
  const Active = MODULES[activeModule] ?? DashboardModule

  // Route -> store (deep links, refresh, back/forward). Only reacts to pathname changes
  // so programmatic setActiveModule(...) calls are never reverted.
  useEffect(() => {
    const fromPath = moduleFromPath(pathname)
    if (fromPath !== activeModuleRef.current) setActiveModule(fromPath)
    setSeeded(true)
  }, [pathname, setActiveModule])

  // Store -> URL (any setActiveModule call reflects in the path)
  useEffect(() => {
    if (!seeded) return
    const target = '/' + activeModule
    if (pathname !== target) router.replace(target)
  }, [seeded, activeModule, pathname, router])

  // ── Full-screen Course Builder (overrides entire dashboard layout) ──
  if (builderCourseId) {
    return <CourseBuilder courseId={builderCourseId} />
  }

  // ── Full-screen Course Preview (student-facing player) ──
  if (previewCourseId) {
    return <CoursePlayer />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto scroll-thin bg-grid">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-6 md:py-8"
            >
              <Active />
            </motion.div>
          </AnimatePresence>
        </main>
        <Footer />
      </div>
      <CommandPalette />
    </div>
  )
}

function Footer() {
  const [buildId, setBuildId] = useState('')
  useEffect(() => {
    fetch('/api/version', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setBuildId(d.buildId || ''))
      .catch(() => {})
  }, [])
  return (
    <footer className="flex h-9 shrink-0 items-center justify-between border-t border-border bg-background/60 px-4 md:px-6 text-[11px] text-muted-foreground">
      <div className="flex items-center gap-3">
        <span className="font-medium text-foreground/70">CreatorOS</span>
        <span className="hidden sm:inline">v2.4.0</span>
        {buildId && <span className="hidden lg:inline rounded border bg-muted px-1.5 py-0.5 font-mono text-[9px]">build:{buildId}</span>}
        <span className="hidden md:inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          All systems operational
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="hidden sm:inline">Press <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">⌘K</kbd> for commands</span>
        <span>© 2025 CreatorOS</span>
      </div>
    </footer>
  )
}