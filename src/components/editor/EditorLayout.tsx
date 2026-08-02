import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PanelLeft,
  PanelRight,
  PanelLeftClose,
  PanelRightClose,
  Save,
  Send,
  Eye,
  History,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export type EditorStatus = 'draft' | 'published' | 'saving' | 'error'

export interface EditorAction {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'outline' | 'ghost' | 'destructive'
  disabled?: boolean
  shortcut?: string
}

export interface TopBarProps {
  title?: string
  actions?: EditorAction[]
  status?: EditorStatus
  lastSaved?: Date | null
  hasChanges?: boolean
  onSave?: () => void
  onPreview?: () => void
  onPublish?: () => void
  onUnpublish?: () => void
  onHistory?: () => void
}

export interface EditorLayoutProps {
  leftSidebar?: {
    title?: string
    icon?: React.ReactNode
    children: React.ReactNode
    width?: number
    defaultCollapsed?: boolean
  }
  centerCanvas: React.ReactNode
  rightInspector?: {
    title?: string
    children: React.ReactNode
    width?: number
    defaultCollapsed?: boolean
  }
  topBar?: TopBarProps
  publishBar?: {
    status?: EditorStatus
    lastSaved?: Date | null
    hasChanges?: boolean
    onSave?: () => void
    onPreview?: () => void
    onPublish?: () => void
    onUnpublish?: () => void
    onHistory?: () => void
    actions?: EditorAction[]
  }
  leftCollapsed?: boolean
  rightCollapsed?: boolean
  onLeftToggle?: (collapsed: boolean) => void
  onRightToggle?: (collapsed: boolean) => void
  className?: string
  children?: React.ReactNode
}

export function EditorLayout({
  leftSidebar,
  centerCanvas,
  rightInspector,
  topBar,
  publishBar,
  leftCollapsed: controlledLeft,
  rightCollapsed: controlledRight,
  onLeftToggle,
  onRightToggle,
  className,
}: EditorLayoutProps) {
  const [internalLeft, setInternalLeft] = React.useState(leftSidebar?.defaultCollapsed ?? false)
  const [internalRight, setInternalRight] = React.useState(rightInspector?.defaultCollapsed ?? false)

  const leftCollapsed = controlledLeft ?? internalLeft
  const rightCollapsed = controlledRight ?? internalRight

  const handleLeftToggle = (collapsed: boolean) => {
    if (onLeftToggle) {
      onLeftToggle(collapsed)
    } else {
      setInternalLeft(collapsed)
    }
  }

  const handleRightToggle = (collapsed: boolean) => {
    if (onRightToggle) {
      onRightToggle(collapsed)
    } else {
      setInternalRight(collapsed)
    }
  }

  const statusColors = {
    draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    published: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    saving: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  }

  const statusText = {
    draft: 'Draft',
    published: 'Published',
    saving: 'Saving...',
    error: 'Error',
  }

  const renderTopBar = (bar: TopBarProps) => (
    <div className="flex h-12 items-center justify-between gap-3 border-b bg-card px-4">
      <div className="flex items-center gap-3">
        {bar.title && <h2 className="text-sm font-semibold">{bar.title}</h2>}
        {bar.status && (
          <Badge
            variant="secondary"
            className={cn('text-xs font-medium', statusColors[bar.status])}
          >
            {statusText[bar.status]}
          </Badge>
        )}
        {bar.lastSaved && bar.status !== 'saving' && bar.status !== 'error' && (
          <span className="text-xs text-muted-foreground">
            Saved {bar.lastSaved.toLocaleTimeString()}
          </span>
        )}
        {bar.hasChanges && bar.status !== 'saving' && (
          <Badge variant="outline" className="text-xs text-orange-600">
            Unsaved changes
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        {bar.actions?.map((action) => (
          <Tooltip key={action.label} delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant={action.variant ?? 'ghost'}
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled}
              >
                {action.icon}
                {action.label}
              </Button>
            </TooltipTrigger>
            {action.shortcut && (
              <TooltipContent>
                <p>{action.label} — {action.shortcut}</p>
              </TooltipContent>
            )}
          </Tooltip>
        ))}

        <Separator orientation="vertical" className="h-6" />

        {bar.onHistory && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={bar.onHistory}>
                <History className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>History</p>
            </TooltipContent>
          </Tooltip>
        )}

        {bar.onPreview && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={bar.onPreview}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Preview (⌘P)</p>
            </TooltipContent>
          </Tooltip>
        )}

        {bar.onSave && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={bar.onSave}
                disabled={bar.status === 'saving'}
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Save (⌘S)</p>
            </TooltipContent>
          </Tooltip>
        )}

        {bar.status === 'published' ? (
          bar.onUnpublish && (
            <Button variant="outline" size="sm" onClick={bar.onUnpublish}>
              Unpublish
            </Button>
          )
        ) : (
          bar.onPublish && (
            <Button size="sm" onClick={bar.onPublish}>
              <Send className="h-4 w-4 mr-2" />
              Publish
            </Button>
          )
        )}
      </div>
    </div>
  )

  return (
    <div className={cn('flex h-full w-full flex-col', className)}>
      {topBar && renderTopBar(topBar)}
      <div className="flex flex-1 overflow-hidden">
        {leftSidebar && (
          <>
            <AnimatePresence initial={false}>
              {!leftCollapsed && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: leftSidebar.width ?? 280 }}
                  exit={{ width: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="flex flex-col border-r border-sidebar-border bg-card overflow-hidden"
                >
                  {(leftSidebar.title || leftSidebar.icon) && (
                    <div className="flex h-12 items-center gap-2.5 border-b px-4">
                      {leftSidebar.icon}
                      <h2 className="text-sm font-semibold">{leftSidebar.title}</h2>
                    </div>
                  )}
                  <div className="flex-1 overflow-y-auto scroll-thin">
                    {leftSidebar.children}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-1/2 -translate-y-1/2 z-20 h-6 w-6 rounded-full border bg-card shadow-md"
                    style={{ left: leftCollapsed ? 'auto' : '-12px' }}
                    onClick={() => handleLeftToggle(!leftCollapsed)}
                  >
                    {leftCollapsed ? (
                      <PanelLeft className="h-3.5 w-3.5" />
                    ) : (
                      <PanelLeftClose className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={leftCollapsed ? 'right' : 'left'}>
                  <p>{leftCollapsed ? 'Show sidebar' : 'Hide sidebar'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}
        <div className="flex-1 overflow-hidden">{centerCanvas}</div>
        {rightInspector && (
          <>
            <AnimatePresence initial={false}>
              {!rightCollapsed && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: rightInspector.width ?? 320 }}
                  exit={{ width: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="flex flex-col border-l border-sidebar-border bg-card overflow-hidden"
                >
                  {(rightInspector.title) && (
                    <div className="flex h-12 items-center gap-2.5 border-b px-4">
                      <h2 className="text-sm font-semibold">{rightInspector.title}</h2>
                    </div>
                  )}
                  <div className="flex-1 overflow-y-auto scroll-thin">
                    {rightInspector.children}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-1/2 -translate-y-1/2 z-20 h-6 w-6 rounded-full border bg-card shadow-md"
                    style={{ right: rightCollapsed ? 'auto' : '-12px' }}
                    onClick={() => handleRightToggle(!rightCollapsed)}
                  >
                    {rightCollapsed ? (
                      <PanelRight className="h-3.5 w-3.5" />
                    ) : (
                      <PanelRightClose className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={rightCollapsed ? 'left' : 'right'}>
                  <p>{rightCollapsed ? 'Show inspector' : 'Hide inspector'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}
      </div>
      {publishBar && (
        <div className="flex h-12 items-center justify-between gap-3 border-t bg-card px-4">
          <div className="flex items-center gap-3">
            <Badge
              variant="secondary"
              className={cn('text-xs font-medium', publishBar.status && statusColors[publishBar.status])}
            >
              {publishBar.status && statusText[publishBar.status]}
            </Badge>

            {publishBar.lastSaved && publishBar.status !== 'saving' && publishBar.status !== 'error' && (
              <span className="text-xs text-muted-foreground">
                Saved {publishBar.lastSaved.toLocaleTimeString()}
              </span>
            )}

            {publishBar.hasChanges && publishBar.status !== 'saving' && (
              <Badge variant="outline" className="text-xs text-orange-600">
                Unsaved changes
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {publishBar.actions?.map((action) => (
              <Tooltip key={action.label} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant={action.variant ?? 'ghost'}
                    size="sm"
                    onClick={action.onClick}
                    disabled={action.disabled}
                  >
                    {action.icon}
                    {action.label}
                  </Button>
                </TooltipTrigger>
                {action.shortcut && (
                  <TooltipContent>
                    <p>{action.label} — {action.shortcut}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            ))}

            <Separator orientation="vertical" className="h-6" />

            {publishBar.onHistory && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={publishBar.onHistory}>
                    <History className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>History</p>
                </TooltipContent>
              </Tooltip>
            )}

            {publishBar.onPreview && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={publishBar.onPreview}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Preview (⌘P)</p>
                </TooltipContent>
              </Tooltip>
            )}

            {publishBar.onSave && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={publishBar.onSave}
                    disabled={publishBar.status === 'saving'}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Save (⌘S)</p>
                </TooltipContent>
              </Tooltip>
            )}

            {publishBar.status === 'published' ? (
              publishBar.onUnpublish && (
                <Button variant="outline" size="sm" onClick={publishBar.onUnpublish}>
                  Unpublish
                </Button>
              )
            ) : (
              publishBar.onPublish && (
                <Button size="sm" onClick={publishBar.onPublish}>
                  <Send className="h-4 w-4 mr-2" />
                  Publish
                </Button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}