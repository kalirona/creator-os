import {
  LayoutDashboard, GraduationCap, Users, ShoppingBag, Package,
  Mail, UserCircle, Link2, BarChart3, Sparkles, LifeBuoy, Settings,
  CreditCard, Globe, type LucideIcon,
} from 'lucide-react'

export type ModuleId =
  | 'dashboard' | 'courses' | 'community' | 'store' | 'products'
  | 'membership' | 'email' | 'crm' | 'affiliates' | 'analytics'
  | 'ai-studio' | 'website' | 'support' | 'settings'

export interface NavItem {
  id: ModuleId
  label: string
  icon: LucideIcon
  description: string
  badge?: string
  accent?: string
}

export const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Revenue, growth, and key metrics at a glance' },
      { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Deep-dive performance across your business' },
      { id: 'ai-studio', label: 'AI Studio', icon: Sparkles, description: 'Generate courses, copy, and content with AI', badge: 'AI', accent: 'text-primary' },
    ],
  },
  {
    title: 'Create & Sell',
    items: [
      { id: 'courses', label: 'Courses', icon: GraduationCap, description: 'Build and sell online courses' },
      { id: 'products', label: 'Digital Products', icon: Package, description: 'Sell templates, downloads, and bundles' },
      { id: 'store', label: 'Store', icon: ShoppingBag, description: 'Checkout, coupons, refunds, invoices' },
      { id: 'membership', label: 'Membership', icon: CreditCard, description: 'Recurring revenue plans and tiers' },
      { id: 'website', label: 'Website Builder', icon: Globe, description: 'Landing pages, sales pages, blog' },
    ],
  },
  {
    title: 'Audience',
    items: [
      { id: 'community', label: 'Community', icon: Users, description: 'Posts, discussions, events, moderation' },
      { id: 'email', label: 'Email Marketing', icon: Mail, description: 'Broadcasts, automations, sequences' },
      { id: 'crm', label: 'CRM', icon: UserCircle, description: 'Customers, orders, activity timeline' },
      { id: 'affiliates', label: 'Affiliates', icon: Link2, description: 'Referral links, commissions, payouts' },
    ],
  },
  {
    title: 'System',
    items: [
      { id: 'support', label: 'Support', icon: LifeBuoy, description: 'Tickets, help center, live chat' },
      { id: 'settings', label: 'Settings', icon: Settings, description: 'Workspace, team, billing, security' },
    ],
  },
]

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap(g => g.items)

export const KEYBOARD_SHORTCUTS: { keys: string; label: string; moduleId?: ModuleId }[] = [
  { keys: '⌘K', label: 'Open command palette' },
  { keys: 'G D', label: 'Go to Dashboard', moduleId: 'dashboard' },
  { keys: 'G A', label: 'Go to AI Studio', moduleId: 'ai-studio' },
  { keys: 'G C', label: 'Go to Courses', moduleId: 'courses' },
  { keys: 'G P', label: 'Go to Products', moduleId: 'products' },
  { keys: 'G O', label: 'Go to Community', moduleId: 'community' },
  { keys: 'G E', label: 'Go to Email', moduleId: 'email' },
  { keys: 'G S', label: 'Go to Settings', moduleId: 'settings' },
]
