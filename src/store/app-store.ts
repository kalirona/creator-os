import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ModuleId } from '@/lib/nav'

interface NavigationState {
  activeModule: ModuleId
  setActiveModule: (m: ModuleId) => void
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  commandOpen: boolean
  setCommandOpen: (v: boolean) => void
  theme: 'light' | 'dark'
  setTheme: (t: 'light' | 'dark') => void
  toggleTheme: () => void
  createDialogFor: ModuleId | null
  triggerCreateDialog: (m: ModuleId) => void
  clearCreateDialog: () => void
  builderCourseId: string | null
  openBuilder: (courseId: string) => void
  closeBuilder: () => void
  previewCourseId: string | null
  openPreview: (courseId: string) => void
  closePreview: () => void
  favorites: ModuleId[]
  toggleFavorite: (m: ModuleId) => void
  recentModules: ModuleId[]
  addToRecent: (m: ModuleId) => void
  pinnedModules: ModuleId[]
  togglePin: (m: ModuleId) => void
  breadcrumbs: { label: string; href?: string }[]
  setBreadcrumbs: (breadcrumbs: { label: string; href?: string }[]) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
}

export const useAppStore = create<NavigationState>()(
  persist(
    (set) => ({
      activeModule: 'dashboard',
      setActiveModule: (m) =>
        set((s) => ({
          activeModule: m,
          recentModules: [
            m,
            ...s.recentModules.filter((r) => r !== m),
          ].slice(0, 8),
        })),
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      commandOpen: false,
      setCommandOpen: (v) => set({ commandOpen: v }),
      theme: 'dark',
      setTheme: (t) => set({ theme: t }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      createDialogFor: null,
      triggerCreateDialog: (m) => set({ activeModule: m, createDialogFor: m }),
      clearCreateDialog: () => set({ createDialogFor: null }),
      builderCourseId: null,
      openBuilder: (courseId) => set({ builderCourseId: courseId }),
      closeBuilder: () => set({ builderCourseId: null }),
      previewCourseId: null,
      openPreview: (courseId) => set({ previewCourseId: courseId }),
      closePreview: () => set({ previewCourseId: null }),
      favorites: [],
      toggleFavorite: (m) =>
        set((s) => ({
          favorites: s.favorites.includes(m)
            ? s.favorites.filter((f) => f !== m)
            : [...s.favorites, m],
        })),
      recentModules: [],
      addToRecent: (m) =>
        set((s) => ({
          recentModules: [
            m,
            ...s.recentModules.filter((r) => r !== m),
          ].slice(0, 8),
        })),
      pinnedModules: [],
      togglePin: (m) =>
        set((s) => ({
          pinnedModules: s.pinnedModules.includes(m)
            ? s.pinnedModules.filter((p) => p !== m)
            : [...s.pinnedModules, m],
        })),
      breadcrumbs: [],
      setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
    }),
    {
      name: 'creatoros-app',
      partialize: (s) => ({
        activeModule: s.activeModule,
        sidebarCollapsed: s.sidebarCollapsed,
        theme: s.theme,
        favorites: s.favorites,
        recentModules: s.recentModules,
        pinnedModules: s.pinnedModules,
      }),
    }
  )
)
