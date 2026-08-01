'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, Pin, Bookmark, Share2, Plus, Flame, TrendingUp, Users, Sparkles, Send, Hash } from 'lucide-react'
import { useApi, timeAgo } from '@/hooks/use-api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { LoadingState } from '@/components/ui-enterprise/LoadingState'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Comment { id: string; content: string; createdAt: string; author: { name: string; initials: string } }
interface Post {
  id: string; title: string; content: string; category: string; likesCount: number;
  commentsCount: number; isPinned: boolean; createdAt: string;
  author: { name: string; initials: string }; comments: Comment[]
}

const CATEGORIES = ['All', 'Wins', 'Questions', 'Marketing', 'Community', 'Announcements']
const CAT_COLORS: Record<string, string> = {
  Wins: 'bg-emerald-500/10 text-emerald-600',
  Questions: 'bg-sky-500/10 text-sky-600',
  Marketing: 'bg-violet-500/10 text-violet-600',
  Community: 'bg-amber-500/10 text-amber-600',
  Announcements: 'bg-rose-500/10 text-rose-600',
  General: 'bg-muted text-muted-foreground',
}

export function CommunityModule() {
  const { data: posts, loading, refetch } = useApi<Post[]>('/api/data/community')
  const [activeCat, setActiveCat] = useState('All')
  const [liked, setLiked] = useState<Set<string>>(new Set())
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newCat, setNewCat] = useState('General')
  const [creating, setCreating] = useState(false)
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [extraComments, setExtraComments] = useState<Record<string, Comment[]>>({})

  const toggle = (set: Set<string>, setFn: (s: Set<string>) => void, id: string) => {
    const next = new Set(set)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setFn(next)
  }

  const submitComment = (postId: string) => {
    const text = (commentInputs[postId] || '').trim()
    if (!text) return
    const comment: Comment = {
      id: `local-${Date.now()}`,
      content: text,
      createdAt: new Date().toISOString(),
      author: { name: 'Alex Rivera', initials: 'AR' },
    }
    setExtraComments((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), comment] }))
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }))
    toast.success('Comment posted')
  }

  const sharePost = (p: Post) => {
    const url = `https://creatoros.io/c/${p.id}`
    navigator.clipboard.writeText(url)
    toast.success('Post link copied to clipboard', { description: url })
  }

  const createPost = async () => {
    if (!newTitle.trim() || !newContent.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/data/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, content: newContent, category: newCat }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Post published to community!')
      setNewTitle(''); setNewContent(''); setNewCat('General')
      refetch()
    } catch {
      toast.error('Failed to create post')
    } finally {
      setCreating(false)
    }
  }

  const filtered = (posts || []).filter((p) => activeCat === 'All' || p.category === activeCat)

  return (
    <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
      {/* Sidebar */}
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Categories</p>
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setActiveCat(c)}
                className={cn('flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition',
                  activeCat === c ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground')}>
                <Hash className="h-3.5 w-3.5" /> {c}
              </button>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Community Stats</p>
            <div className="space-y-2.5">
              <Stat icon={Users} label="Members" value="10,112" />
              <Stat icon={MessageCircle} label="Posts" value={String(posts?.length || 0)} />
              <Stat icon={Flame} label="Online now" value="342" />
              <Stat icon={TrendingUp} label="This week" value="+18%" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feed */}
      <div className="space-y-4">
        {/* Composer */}
        <Dialog>
          <Card className="cursor-pointer hover:border-primary/30 transition" >
            <CardContent className="p-4 flex items-center gap-3">
              <Avatar><AvatarFallback className="bg-primary/15 text-primary text-xs">AR</AvatarFallback></Avatar>
              <div className="flex-1 rounded-lg bg-muted/50 px-4 py-2.5 text-sm text-muted-foreground">
                Share a win, ask a question, or start a discussion...
              </div>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1.5" /> Post</Button>
              </DialogTrigger>
            </CardContent>
          </Card>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create a post</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.slice(1).map((c) => (
                  <button key={c} onClick={() => setNewCat(c)}
                    className={cn('rounded-full px-2.5 py-1 text-xs font-medium transition',
                      newCat === c ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/70')}>
                    {c}
                  </button>
                ))}
              </div>
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Post title" />
              <Textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="What's on your mind?" rows={5} />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => { toast.success('Draft saved'); setNewTitle(''); setNewContent(''); }}>
                  Save draft
                </Button>
                <Button size="sm" onClick={createPost} disabled={creating || !newTitle.trim() || !newContent.trim()}>
                  <Sparkles className="h-4 w-4 mr-1.5" /> Publish {creating && '...'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {loading ? (
          <LoadingState size="lg" text="Loading posts..." />
        ) : (
          filtered.map((p, i) => {
            const isLiked = liked.has(p.id)
            const isSaved = saved.has(p.id)
            const isExpanded = expanded.has(p.id)
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className={cn(p.isPinned && 'ring-1 ring-primary/30')}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <Avatar><AvatarFallback className="bg-muted text-xs font-medium">{p.author.initials}</AvatarFallback></Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold">{p.author.name}</span>
                          <span className="text-xs text-muted-foreground">· {timeAgo(p.createdAt)}</span>
                          {p.isPinned && <Badge variant="secondary" className="text-[10px]"><Pin className="h-2.5 w-2.5 mr-1" />Pinned</Badge>}
                          <Badge variant="secondary" className={cn('text-[10px]', CAT_COLORS[p.category])}>{p.category}</Badge>
                        </div>
                        <h3 className="mt-1.5 font-semibold leading-snug">{p.title}</h3>
                        <p className={cn('mt-1.5 text-sm text-muted-foreground leading-relaxed', !isExpanded && 'line-clamp-3')}>{p.content}</p>
                        <p className="mt-1 text-xs text-primary cursor-pointer hover:underline" onClick={() => toggle(expanded, setExpanded, p.id)}>
                          {isExpanded ? 'Show less' : 'Read more'}
                        </p>
                        <div className="mt-3 flex items-center gap-1">
                          <Button variant="ghost" size="sm" className={cn('h-8 gap-1.5 text-xs', isLiked && 'text-rose-500')}
                            onClick={() => toggle(liked, setLiked, p.id)}>
                            <Heart className={cn('h-4 w-4', isLiked && 'fill-current')} /> {p.likesCount + (isLiked ? 1 : 0)}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs"
                            onClick={() => toggle(expanded, setExpanded, p.id)}>
                            <MessageCircle className="h-4 w-4" /> {p.commentsCount + (extraComments[p.id]?.length || 0)}
                          </Button>
                          <Button variant="ghost" size="sm" className={cn('h-8 gap-1.5 text-xs', isSaved && 'text-primary')}
                            onClick={() => { toggle(saved, setSaved, p.id); if (!saved.has(p.id)) toast.success('Saved to bookmarks') }}>
                            <Bookmark className={cn('h-4 w-4', isSaved && 'fill-current')} />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => sharePost(p)}>
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Comments */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-3 space-y-2.5 overflow-hidden">
                              {[...p.comments, ...(extraComments[p.id] || [])].map((c) => (
                                <div key={c.id} className="flex gap-2.5">
                                  <Avatar className="h-7 w-7"><AvatarFallback className="bg-muted text-[10px]">{c.author.initials}</AvatarFallback></Avatar>
                                  <div className="flex-1 rounded-lg bg-muted/50 px-3 py-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium">{c.author.name}</span>
                                      <span className="text-[10px] text-muted-foreground">{timeAgo(c.createdAt)}</span>
                                    </div>
                                    <p className="text-xs mt-0.5 text-foreground/80">{c.content}</p>
                                  </div>
                                </div>
                              ))}
                              <div className="flex gap-2.5">
                                <Avatar className="h-7 w-7"><AvatarFallback className="bg-primary/15 text-primary text-[10px]">AR</AvatarFallback></Avatar>
                                <div className="flex-1 flex gap-2">
                                  <Input
                                    placeholder="Write a comment..."
                                    className="h-8 text-xs"
                                    value={commentInputs[p.id] || ''}
                                    onChange={(e) => setCommentInputs((prev) => ({ ...prev, [p.id]: e.target.value }))}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitComment(p.id) } }}
                                  />
                                  <Button size="icon" className="h-8 w-8 shrink-0" onClick={() => submitComment(p.id)} disabled={!(commentInputs[p.id] || '').trim()}>
                                    <Send className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Icon className="h-3.5 w-3.5" /></div>
      <span className="flex-1 text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-semibold tabular-nums">{value}</span>
    </div>
  )
}
