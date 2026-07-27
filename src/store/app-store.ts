import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ModuleId } from '@/lib/nav'

interface AppState {
  activeModule: ModuleId
  setActiveModule: (m: ModuleId) => void
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  commandOpen: boolean
  setCommandOpen: (v: boolean) => void
  theme: 'light' | 'dark'
  setTheme: (t: 'light' | 'dark') => void
  toggleTheme: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeModule: 'dashboard',
      setActiveModule: (m) => set({ activeModule: m }),
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      commandOpen: false,
      setCommandOpen: (v) => set({ commandOpen: v }),
      theme: 'dark',
      setTheme: (t) => set({ theme: t }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
    }),
    {
      name: 'creatoros-app',
      partialize: (s) => ({ activeModule: s.activeModule, sidebarCollapsed: s.sidebarCollapsed, theme: s.theme }),
    }
  )
)
