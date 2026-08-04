'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Heart, MessageCircle, Pin, Bookmark, Share2, Plus, Flame, Users, Hash,
  Calendar, Trophy, Search, Filter, MoreHorizontal, HelpCircle, Megaphone, Clock,
  BarChart2 as BarChart2Icon
} from 'lucide-react'
import { useApi, timeAgo } from '@/hooks/use-api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadingState } from '@/components/ui-enterprise/LoadingState'
import { ErrorState } from '@/components/ui-enterprise/ErrorState'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Types
interface Author {
  id: string
  name: string
  initials: string
  role?: string
  reputation?: number
}

interface Post {
  id: string
  title?: string
  content: string
  type: string
  category: string
  spaceId?: string
  likesCount: number
  commentsCount: number
  isPinned: boolean
  isLocked: boolean
  createdAt: string
  author: Author
}

interface Space {
  id: string
  name: string
  slug: string
  description: string
  color?: string
  postsCount: number
  membersCount: number
}

interface EventData {
  id: string
  title: string
  description: string
  location: string
  startsAt: string
  endsAt: string
  attendeesCount: number
  isAttending: boolean
}

interface Member {
  id: string
  name: string
  email: string
  role: string
  reputation: number
  postsCount: number
  isOnline: boolean
}

type View = 'feed' | 'spaces' | 'events' | 'members' | 'leaderboard'

const CATEGORIES = ['All', 'General', 'Wins', 'Questions', 'Marketing', 'Announcements']
const CAT_COLORS: Record<string, string> = {
  Wins: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  Questions: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  Marketing: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  Announcements: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  General: 'bg-muted text-muted-foreground',
}

const POST_TYPES = [
  { value: 'TEXT', label: 'Text', icon: MessageCircle },
  { value: 'QUESTION', label: 'Question', icon: HelpCircle },
  { value: 'ANNOUNCEMENT', label: 'Announcement', icon: Megaphone },
  { value: 'POLL', label: 'Poll', icon: BarChart2Icon },
]

export function CommunityModule() {
  const [currentView, setCurrentView] = useState<View>('feed')
  const [activeCat, setActiveCat] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showSpaceDialog, setShowSpaceDialog] = useState(false)
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const [postTitle, setPostTitle] = useState('')
  const [postContent, setPostContent] = useState('')
  const [postCategory, setPostCategory] = useState('General')
  const [postType, setPostType] = useState('TEXT')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: posts, loading: postsLoading, error: postsError, refetch: refetchPosts } = useApi<Post[]>('/api/data/community')
  const { data: spaces, loading: spacesLoading } = useApi<Space[]>('/api/community/spaces')
  const { data: events, loading: eventsLoading } = useApi<EventData[]>('/api/community/events')
  const { data: members, loading: membersLoading } = useApi<Member[]>('/api/community/members')

  const filteredPosts = (posts || []).filter(p => {
    if (activeCat !== 'All' && p.category !== activeCat) return false
    if (searchQuery && !p.title?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !p.content.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const createPost = async () => {
    if (!postContent.trim()) return
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/data/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: postTitle, content: postContent, category: postCategory, type: postType }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Post published!')
      setPostTitle('')
      setPostContent('')
      setPostCategory('General')
      setShowCreateDialog(false)
      refetchPosts()
    } catch {
      toast.error('Failed to create post')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Left Sidebar */}
      <Card className={cn('flex flex-col transition-all duration-300', sidebarCollapsed ? 'w-16' : 'w-64')}>
        <CardContent className="flex flex-col h-full p-3 space-y-1">
          <div className="flex items-center justify-between mb-3 px-2">
            {!sidebarCollapsed && <h2 className="font-semibold text-sm">Community</h2>}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
              <MoreHorizontal className="h-4 w-4 transition-transform" />
            </Button>
          </div>

          <nav className="flex-1 space-y-0.5">
            {([
              { id: 'feed', label: 'Feed', icon: MessageCircle },
              { id: 'spaces', label: 'Spaces', icon: Hash },
              { id: 'events', label: 'Events', icon: Calendar },
              { id: 'members', label: 'Members', icon: Users },
              { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
            ] as { id: View; label: string; icon: any }[]).map(item => (
              <Button
                key={item.id}
                variant={currentView === item.id ? 'secondary' : 'ghost'}
                className={cn('w-full justify-start gap-2', sidebarCollapsed && 'justify-center px-0')}
                onClick={() => setCurrentView(item.id)}
              >
                <item.icon className="h-4 w-4" />
                {!sidebarCollapsed && <span className="text-sm">{item.label}</span>}
              </Button>
            ))}
          </nav>

          {!sidebarCollapsed && (
            <div className="mt-auto pt-3 border-t space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Flame className="h-3.5 w-3.5 text-orange-500" />
                <span className="flex-1">Online now</span>
                <span className="font-semibold text-foreground">342</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span className="flex-1">Members</span>
                <span className="font-semibold text-foreground">10.1K</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {currentView === 'feed' && (
          <div className="flex-1 overflow-y-auto pr-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
                <Select value={activeCat} onValueChange={setActiveCat}>
                  <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> New Post</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader><DialogTitle>Create a post</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-1.5">
                      {POST_TYPES.map(t => (
                        <Button key={t.value} variant={postType === t.value ? 'default' : 'outline'} size="sm"
                          onClick={() => setPostType(t.value)} className="gap-1.5">
                          <t.icon className="h-3.5 w-3.5" /> {t.label}
                        </Button>
                      ))}
                    </div>
                    <Select value={postCategory} onValueChange={setPostCategory}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.slice(1).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {postType === 'QUESTION' && (
                      <Input placeholder="Question title (optional)" value={postTitle} onChange={e => setPostTitle(e.target.value)} />
                    )}
                    <Textarea
                      placeholder={postType === 'QUESTION' ? 'Describe your question...' : "What's on your mind?"}
                      value={postContent} onChange={e => setPostContent(e.target.value)} rows={6}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                      <Button size="sm" onClick={createPost} disabled={isSubmitting || !postContent.trim()}>
                        {isSubmitting ? 'Publishing...' : 'Publish'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {postsLoading ? (
              <LoadingState size="md" text="Loading feed..." />
            ) : postsError ? (
              <ErrorState description={postsError} action={{ label: 'Retry', onClick: refetchPosts }} />
            ) : (
              <div className="space-y-3">
                {filteredPosts.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground">No posts yet. Be the first to share!</p>
                      <Button size="sm" className="mt-3" onClick={() => setShowCreateDialog(true)}>
                        <Plus className="h-4 w-4 mr-1.5" /> Create Post
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  filteredPosts.map((post, i) => (
                    <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                      <Card className={cn('hover:border-primary/20 transition-colors', post.isPinned && 'border-primary/30')}>
                        <CardContent className="p-5">
                          <div className="flex items-start gap-3">
                            <Avatar><AvatarFallback className="bg-muted text-xs font-medium">{post.author.initials}</AvatarFallback></Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold">{post.author.name}</span>
                                {post.author.role && <Badge variant="secondary" className="text-[10px] h-5">{post.author.role}</Badge>}
                                <span className="text-xs text-muted-foreground">· {timeAgo(post.createdAt)}</span>
                                {post.isPinned && <Badge variant="secondary" className="text-[10px]"><Pin className="h-2.5 w-2.5 mr-1" />Pinned</Badge>}
                                <Badge variant="secondary" className={cn('text-[10px]', CAT_COLORS[post.category])}>{post.category}</Badge>
                              </div>
                              {post.title && <h3 className="mt-1.5 font-semibold leading-snug">{post.title}</h3>}
                              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>
                              <div className="mt-3 flex items-center gap-1">
                                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">
                                  <Heart className="h-4 w-4" /> {post.likesCount}
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">
                                  <MessageCircle className="h-4 w-4" /> {post.commentsCount}
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs"><Bookmark className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => {
                                  navigator.clipboard.writeText(window.location.origin + '/community/post/' + post.id)
                                  toast.success('Link copied')
                                }}><Share2 className="h-4 w-4" /></Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {currentView === 'spaces' && (
          <div className="flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Spaces</h3>
              <Dialog open={showSpaceDialog} onOpenChange={setShowSpaceDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Create Space</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Create Space</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div><Label>Name</Label><Input placeholder="Space name" /></div>
                    <div><Label>Description</Label><Textarea placeholder="What's this space about?" /></div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowSpaceDialog(false)}>Cancel</Button>
                      <Button onClick={() => { toast.success('Space created'); setShowSpaceDialog(false) }}>Create</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {spacesLoading ? (
              <LoadingState text="Loading spaces..." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(spaces || []).map(space => (
                  <Card key={space.id} className="hover:border-primary/20 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg"
                          style={{ backgroundColor: space.color + '20', color: space.color }}>
                          <Hash className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{space.name}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{space.description || 'No description'}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{space.postsCount}</span>
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{space.membersCount}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {currentView === 'events' && (
          <div className="flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Events</h3>
              <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Create Event</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>Create Event</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div><Label>Title</Label><Input placeholder="Event title" /></div>
                    <div><Label>Description</Label><Textarea placeholder="What's this event about?" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Start</Label><Input type="datetime-local" /></div>
                      <div><Label>End</Label><Input type="datetime-local" /></div>
                    </div>
                    <div><Label>Location / Meeting URL</Label><Input placeholder="https://..." /></div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowEventDialog(false)}>Cancel</Button>
                      <Button onClick={() => { toast.success('Event created'); setShowEventDialog(false) }}>Create</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {eventsLoading ? (
              <LoadingState text="Loading events..." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {(events || []).map(event => (
                  <Card key={event.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Calendar className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{event.title}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{event.description}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(event.startsAt).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{event.attendeesCount}</span>
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="w-full mt-3">
                        {event.isAttending ? 'Cancel RSVP' : 'RSVP'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {currentView === 'members' && (
          <div className="flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Members</h3>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search members..." className="pl-9 h-9 w-64" />
                </div>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Filter className="h-4 w-4" />Filter
                </Button>
              </div>
            </div>
            {membersLoading ? (
              <LoadingState text="Loading members..." />
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {(members || []).map(member => (
                      <div key={member.id} className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors">
                        <div className="relative">
                          <Avatar>
                            <AvatarFallback className="bg-muted text-xs font-medium">
                              {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          {member.isOnline && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{member.name}</p>
                            <Badge variant="secondary" className="text-[10px] h-5">{member.role}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{member.email}</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Trophy className="h-3 w-3" />{member.reputation}</span>
                          <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{member.postsCount}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {currentView === 'leaderboard' && (
          <div className="flex-1 overflow-y-auto">
            <h3 className="font-semibold mb-4">Leaderboard</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { rank: 1, name: 'Alex Rivera', points: 4520, badge: 'Top Contributor' },
                { rank: 2, name: 'Jamie Chen', points: 3890, badge: 'Instructor' },
                { rank: 3, name: 'Priya Patel', points: 3450, badge: 'VIP' },
              ].map((entry, i) => (
                <Card key={i} className={cn(i === 0 ? 'border-yellow-500/30 bg-yellow-500/5' : '')}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-full font-bold text-sm',
                      i === 0 ? 'bg-yellow-500 text-white' : i === 1 ? 'bg-gray-400 text-white' : 'bg-orange-600 text-white'
                    )}>
                      {entry.rank}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{entry.name}</p>
                      <p className="text-xs text-muted-foreground">{entry.points.toLocaleString()} points</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">{entry.badge}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
