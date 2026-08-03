'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronLeft,
  Sparkles,
  Star,
  Clock,
  Pin,
  Search,
  Command,
  Settings,
  Crown,
  Plus,
  LayoutDashboard,
  GraduationCap,
  Users,
  ShoppingBag,
  Package,
  Mail,
  UserCircle,
  Link2,
  BarChart3,
  LifeBuoy,
  ShieldCheck,
  Award,
  FolderOpen,
  Globe,
  CreditCard,
} from 'lucide-react'
import { NAV_GROUPS, KEYBOARD_SHORTCUTS } from '@/lib/nav'
import { useAppStore } from '@/store/app-store'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { BuyCreditsDialog } from '@/components/app/buy-credits-dialog'
import type { NavItem, ModuleId } from '@/lib/nav'

const itemIcons: Record<string, any> = {
  dashboard: LayoutDashboard,
  courses: GraduationCap,
  community: Users,
  store: ShoppingBag,
  products: Package,
  membership: CreditCard,
  email: Mail,
  crm: UserCircle,
  affiliates: Link2,
  analytics: BarChart3,
  'ai-studio': Sparkles,
  'pages-funnels': Globe,
  support: LifeBuoy,
  settings: Settings,
  admin: ShieldCheck,
  certificates: Award,
  'media-library': FolderOpen,
}

export function Sidebar() {
  const {
    activeModule,
    setActiveModule,
    sidebarCollapsed,
    toggleSidebar,
    favorites,
    toggleFavorite,
    recentModules,
    pinnedModules,
    togglePin,
    searchQuery,
    setSearchQuery,
  } = useAppStore()

  const [credits] = useState(4280)
  const [buyOpen, setBuyOpen] = useState(false)

  const allItems = useMemo(() => {
    return NAV_GROUPS.flatMap((group) => group.items)
  }, [])

  const filteredItems = useMemo(() => {
    if (!searchQuery) return allItems
    const query = searchQuery.toLowerCase()
    return allItems.filter(
      (item) =>
        item.label.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
    )
  }, [searchQuery, allItems])

  const pinnedItems = useMemo(
    () =>
      pinnedModules
        .map((id) => allItems.find((item) => item.id === id))
        .filter(Boolean) as NavItem[],
    [pinnedModules, allItems]
  )

  const recentItems = useMemo(
    () =>
      recentModules
        .map((id) => allItems.find((item) => item.id === id))
        .filter(Boolean) as NavItem[],
    [recentModules, allItems]
  )

  const favoriteItems = useMemo(
    () =>
      favorites
        .map((id) => allItems.find((item) => item.id === id))
        .filter(Boolean) as NavItem[],
    [favorites, allItems]
  )

  const handleNavigate = (moduleId: ModuleId) => {
    setActiveModule(moduleId)
    setSearchQuery('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey) {
      if (e.key === 'k') {
        e.preventDefault()
      }
    }
  }

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'b') {
          e.preventDefault()
          toggleSidebar()
        }
      }

      const shortcut = KEYBOARD_SHORTCUTS.find((s) => s.moduleId)
      if (shortcut?.moduleId && (e.metaKey || e.ctrlKey)) {
        const keyCombo = e.key.toLowerCase()
        const expectedKey = shortcut.keys.replace('⌘', '').replace('Ctrl', '').trim().toLowerCase()
        if (keyCombo === expectedKey && !e.shiftKey && !e.altKey) {
          e.preventDefault()
          handleNavigate(shortcut.moduleId)
        }
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, [activeModule])

  return (
    <aside
      className={cn(
        'relative z-30 flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300 ease-in-out'
      )}
      onKeyDown={handleKeyDown}
    >
      <div className="flex h-16 items-center gap-2.5 px-4 border-b border-sidebar-border">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        {!sidebarCollapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold tracking-tight leading-none">CreatorOS</p>
            <p className="text-xs text-muted-foreground mt-1">Scale Plan</p>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 z-40 hidden h-6 w-6 items-center justify-center rounded-full border bg-card shadow-md md:flex hover:bg-accent transition"
          aria-label="Toggle sidebar"
        >
          <ChevronLeft className={cn('h-3.5 w-3.5 transition-transform', sidebarCollapsed && 'rotate-180')} />
        </button>
      </div>

      {!sidebarCollapsed && (
        <div className="border-b border-sidebar-border p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-10 pr-3 text-sm"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-4 items-center gap-0.5 rounded border bg-muted px-1.5 text-[10px] font-medium">
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto scroll-thin py-2">
        <div className="space-y-6 px-3">
          {searchQuery ? (
            <div className="space-y-1">
              {filteredItems.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  active={activeModule === item.id}
                  collapsed={sidebarCollapsed}
                  onClick={() => handleNavigate(item.id)}
                />
              ))}
            </div>
          ) : (
            <>
              {pinnedItems.length > 0 && (
                <div>
                  {!sidebarCollapsed && (
                    <p className="px-3 mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                      Pinned
                    </p>
                  )}
                  <div className="space-y-0.5">
                    {pinnedItems.map((item) => (
                      <NavItem
                        key={item.id}
                        item={item}
                        active={activeModule === item.id}
                        collapsed={sidebarCollapsed}
                        onClick={() => handleNavigate(item.id)}
                        onPin={() => togglePin(item.id)}
                        showPin
                      />
                    ))}
                  </div>
                </div>
              )}

              {favoriteItems.length > 0 && (
                <div>
                  {!sidebarCollapsed && (
                    <p className="px-3 mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                      Favorites
                    </p>
                  )}
                  <div className="space-y-0.5">
                    {favoriteItems.map((item) => (
                      <NavItem
                        key={item.id}
                        item={item}
                        active={activeModule === item.id}
                        collapsed={sidebarCollapsed}
                        onClick={() => handleNavigate(item.id)}
                        onFavorite={() => toggleFavorite(item.id)}
                        showFavorite
                      />
                    ))}
                  </div>
                </div>
              )}

              {recentItems.length > 0 && (
                <div>
                  {!sidebarCollapsed && (
                    <p className="px-3 mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                      Recent
                    </p>
                  )}
                  <div className="space-y-0.5">
                    {recentItems.slice(0, 5).map((item) => (
                      <NavItem
                        key={item.id}
                        item={item}
                        active={activeModule === item.id}
                        collapsed={sidebarCollapsed}
                        onClick={() => handleNavigate(item.id)}
                        showRecent
                      />
                    ))}
                  </div>
                </div>
              )}

              {NAV_GROUPS.map((group) => (
                <div key={group.title}>
                  {!sidebarCollapsed && (
                    <p className="px-3 mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                      {group.title}
                    </p>
                  )}
                  <div className="space-y-0.5">
                    {group.items.map((item) => (
                      <NavItem
                        key={item.id}
                        item={item}
                        active={activeModule === item.id}
                        collapsed={sidebarCollapsed}
                        onClick={() => handleNavigate(item.id)}
                        onFavorite={() => toggleFavorite(item.id)}
                        showFavorite={favorites.includes(item.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </nav>

      <div className="border-t border-sidebar-border p-3 space-y-2">
        {!sidebarCollapsed && (
          <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/15 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Crown className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold">AI Credits</span>
            </div>
            <p className="text-lg font-bold tabular-nums">{credits.toLocaleString()}</p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-primary/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60"
                style={{ width: `${Math.min(100, (credits / 6280) * 100)}%` }}
              />
            </div>
            <Button size="sm" className="mt-2.5 w-full h-7 text-xs" onClick={() => setBuyOpen(true)}>
              <Plus className="h-3 w-3 mr-1" /> Buy credits
            </Button>
          </div>
        )}
        {sidebarCollapsed && (
          <Button
            size="icon"
            variant="ghost"
            className="w-full h-9"
            onClick={() => setBuyOpen(true)}
            title="Buy credits"
          >
            <Crown className="h-4 w-4 text-primary" />
          </Button>
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setActiveModule('settings')}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg p-2 hover:bg-sidebar-accent/50 transition',
                  sidebarCollapsed && 'justify-center'
                )}
              >
                <Avatar className="h-8 w-8 ring-2 ring-border">
                  <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">AR</AvatarFallback>
                </Avatar>
                {!sidebarCollapsed && (
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-xs font-semibold truncate">Alex Rivera</p>
                    <p className="text-[10px] text-muted-foreground truncate">Owner</p>
                  </div>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="ml-2">
              <p>Alex Rivera — Owner</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <BuyCreditsDialog
        open={buyOpen}
        onOpenChange={setBuyOpen}
        currentCredits={credits}
        onPurchase={() => {}}
      />
    </aside>
  )
}

interface NavItemProps {
  item: NavItem
  active: boolean
  collapsed: boolean
  onClick: () => void
  onFavorite?: () => void
  onPin?: () => void
  showFavorite?: boolean
  showPin?: boolean
  showRecent?: boolean
}

function NavItem({
  item,
  active,
  collapsed,
  onClick,
  onFavorite,
  onPin,
  showFavorite = false,
  showPin = false,
  showRecent = false,
}: NavItemProps) {
  const Icon = itemIcons[item.id] || item.icon

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            title={collapsed ? item.label : undefined}
            className={cn(
              'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
              active
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
              collapsed && 'justify-center'
            )}
          >
            {active && (
              <motion.div
                layoutId="sidebar-active"
                className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <Icon className={cn('h-[18px] w-[18px] shrink-0', active && 'text-primary')} />
            {!collapsed && (
              <>
                <span className="flex-1 text-left truncate">{item.label}</span>
                {item.badge && (
                  <Badge
                    variant="secondary"
                    className="h-4 px-1.5 text-[9px] font-semibold uppercase bg-primary/10 text-primary"
                  >
                    {item.badge}
                  </Badge>
                )}
                {showRecent && (
                  <Clock className="h-3 w-3 text-muted-foreground opacity-50" />
                )}
                {showPin && (
                  <span
                    role="button"
                    tabIndex={-1}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPin?.() }}
                    className="cursor-pointer"
                    title={item.label}
                  >
                    <Pin className="h-3 w-3 text-muted-foreground opacity-50" />
                  </span>
                )}
                {showFavorite && (
                  <span
                    role="button"
                    tabIndex={-1}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFavorite?.() }}
                    className="cursor-pointer"
                    title={item.label}
                  >
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                  </span>
                )}
              </>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="ml-2">
          <p>{item.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
