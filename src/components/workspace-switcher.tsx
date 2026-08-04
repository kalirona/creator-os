'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar } from '@/components/ui/avatar'
import { Building2, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Workspace {
  id: string
  name: string
  slug: string
  logoUrl?: string | null
  plan?: string
}

interface WorkspaceSwitcherProps {
  currentWorkspace: Workspace | null
  workspaces: Workspace[]
  userRole?: string
}

export function WorkspaceSwitcher({ currentWorkspace, workspaces, userRole }: WorkspaceSwitcherProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSwitch = async (workspaceId: string) => {
    if (workspaceId === currentWorkspace?.id) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/workspace/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId }),
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to switch workspace:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateWorkspace = () => {
    router.push('/workspace/create')
  }

  if (!currentWorkspace) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 h-9 px-2">
          <Avatar className="h-6 w-6">
            {currentWorkspace.logoUrl ? (
              <img src={currentWorkspace.logoUrl} alt={currentWorkspace.name} />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs">
                {currentWorkspace.name.charAt(0).toUpperCase()}
              </div>
            )}
          </Avatar>
          <span className="hidden md:inline-flex text-sm font-medium">{currentWorkspace.name}</span>
          {currentWorkspace.plan && (
            <span className="hidden md:inline-flex text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
              {currentWorkspace.plan}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{currentWorkspace.name}</p>
            <p className="text-xs text-muted-foreground">/{currentWorkspace.slug}</p>
            {userRole && <p className="text-xs text-muted-foreground capitalize">{userRole}</p>}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {workspaces.length > 1 && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">Recent Workspaces</DropdownMenuLabel>
            {workspaces
              .filter((ws) => ws.id !== currentWorkspace.id)
              .map((workspace) => (
                <DropdownMenuItem
                  key={workspace.id}
                  onClick={() => handleSwitch(workspace.id)}
                  disabled={isLoading}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <Avatar className="h-6 w-6">
                      {workspace.logoUrl ? (
                        <img src={workspace.logoUrl} alt={workspace.name} />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs">
                          {workspace.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm">{workspace.name}</span>
                      <span className="text-xs text-muted-foreground">/{workspace.slug}</span>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem onClick={handleCreateWorkspace} className="cursor-pointer">
          <Plus className="h-4 w-4 mr-2" />
          Create Workspace
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/workspaces')} className="cursor-pointer">
          <Building2 className="h-4 w-4 mr-2" />
          Manage Workspaces
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
