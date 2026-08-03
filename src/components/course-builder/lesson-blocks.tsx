'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Pencil, ArrowUp, ArrowDown, Copy, Trash2, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Block-based lesson content editor with hover-to-edit (craft.js-style).
//
// Parses `lesson.content` (an HTML string) into top-level blocks and renders a
// live preview that students will see. Hovering a block shows a floating
// toolbar (edit / move up / move down / duplicate / delete). Clicking edit
// turns the block into a contentEditable region so you can click-and-type
// directly on the canvas; changes commit on blur.
// ============================================================================

export interface LessonBlock {
  id: string
  html: string
  tag: string
}

const TAG_LABELS: Record<string, string> = {
  H1: 'Heading', H2: 'Heading', H3: 'Heading', H4: 'Heading', H5: 'Heading',
  P: 'Text', UL: 'List', OL: 'List', LI: 'List item',
  FIGURE: 'Media', IMG: 'Image', IFRAME: 'Video',
  HR: 'Divider', BLOCKQUOTE: 'Callout', PRE: 'Code', TABLE: 'Table', DIV: 'Block',
}

const EDITABLE_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'PRE', 'TABLE', 'DIV'])

let idCounter = 0
function makeId(): string {
  idCounter += 1
  return `blk-${Date.now().toString(36)}-${idCounter}`
}

function parseBlocks(html: string): LessonBlock[] {
  if (!html || !html.trim()) return []
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const blocks: LessonBlock[] = []
  doc.body.childNodes.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element
      blocks.push({ id: makeId(), html: el.outerHTML, tag: el.tagName })
    } else if (node.nodeType === Node.TEXT_NODE && (node.textContent || '').trim()) {
      blocks.push({ id: makeId(), html: `<p>${node.textContent}</p>`, tag: 'P' })
    }
  })
  return blocks
}

function serializeBlocks(blocks: LessonBlock[]): string {
  return blocks.map((b) => b.html).join('\n')
}

function labelFor(tag: string, html: string): string {
  if (tag === 'FIGURE') return html.includes('<iframe') ? 'Video' : html.includes('<img') ? 'Image' : 'Media'
  return TAG_LABELS[tag] || tag.toLowerCase()
}

function BlockToolbar({
  label, editable, onEdit, onUp, onDown, onDup, onDelete, canUp, canDown,
}: {
  label: string
  editable: boolean
  onEdit: () => void
  onUp: () => void
  onDown: () => void
  onDup: () => void
  onDelete: () => void
  canUp: boolean
  canDown: boolean
}) {
  return (
    <div className="absolute -top-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5 rounded-full border bg-background px-1.5 py-1 shadow-md">
      <span className="px-1.5 text-[10px] font-semibold text-primary whitespace-nowrap">{label}</span>
      {editable && (
        <button
          onClick={onEdit}
          className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition"
          title="Edit block"
        >
          <Pencil className="h-3 w-3" />
        </button>
      )}
      <button
        onClick={onUp}
        disabled={!canUp}
        className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition disabled:opacity-30"
        title="Move up"
      >
        <ArrowUp className="h-3 w-3" />
      </button>
      <button
        onClick={onDown}
        disabled={!canDown}
        className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition disabled:opacity-30"
        title="Move down"
      >
        <ArrowDown className="h-3 w-3" />
      </button>
      <button
        onClick={onDup}
        className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition"
        title="Duplicate block"
      >
        <Copy className="h-3 w-3" />
      </button>
      <button
        onClick={onDelete}
        className="rounded-full p-1 text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition"
        title="Delete block"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  )
}

export function LessonBlocks({ html, onCommit }: { html: string; onCommit: (html: string) => void }) {
  const blocks = useMemo(() => parseBlocks(html), [html])
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const commit = (next: LessonBlock[]) => {
    onCommit(serializeBlocks(next))
    setEditingId(null)
  }

  const commitBlockEdit = (id: string, innerHTML: string) => {
    const next = blocks.map((b) => (b.id === id ? { ...b, html: innerHTML } : b))
    commit(next)
  }

  const move = (id: string, dir: -1 | 1) => {
    const i = blocks.findIndex((b) => b.id === id)
    if (i < 0) return
    const j = i + dir
    if (j < 0 || j >= blocks.length) return
    const next = [...blocks]
    ;[next[i], next[j]] = [next[j], next[i]]
    commit(next)
  }

  const duplicate = (id: string) => {
    const i = blocks.findIndex((b) => b.id === id)
    if (i < 0) return
    const copy: LessonBlock = { ...blocks[i], id: makeId() }
    const next = [...blocks]
    next.splice(i + 1, 0, copy)
    commit(next)
  }

  const remove = (id: string) => {
    commit(blocks.filter((b) => b.id !== id))
    if (editingId === id) setEditingId(null)
  }

  if (blocks.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed p-10 text-center">
        <Layers className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm font-medium">No content yet</p>
        <p className="text-xs text-muted-foreground mt-1">Click &ldquo;Add block&rdquo; below to start building this lesson.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {blocks.map((b, i) => {
        const isHovered = hoveredId === b.id
        const isEditing = editingId === b.id
        const editable = EDITABLE_TAGS.has(b.tag)
        return (
          <motion.div
            key={b.id}
            layout
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'group/block relative rounded-lg px-1 transition-shadow',
              isHovered && !isEditing && 'ring-1 ring-primary/40 ring-offset-2 ring-offset-background',
            )}
            onMouseEnter={() => setHoveredId(b.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => setHoveredId(b.id)}
          >
            {(isHovered || isEditing) && (
              <BlockToolbar
                label={labelFor(b.tag, b.html)}
                editable={editable}
                canUp={i > 0}
                canDown={i < blocks.length - 1}
                onEdit={() => setEditingId(isEditing ? null : b.id)}
                onUp={() => move(b.id, -1)}
                onDown={() => move(b.id, 1)}
                onDup={() => duplicate(b.id)}
                onDelete={() => remove(b.id)}
              />
            )}
            {isEditing && editable ? (
              <div
                contentEditable
                suppressContentEditableWarning
                spellCheck={false}
                className="cursor-text rounded-md outline-none transition focus:ring-2 focus:ring-primary/40 focus:ring-inset"
                dangerouslySetInnerHTML={{ __html: b.html }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') { e.preventDefault(); ;(e.target as HTMLElement).blur() }
                }}
                onBlur={(e) => commitBlockEdit(b.id, e.currentTarget.innerHTML)}
              />
            ) : (
              <div
                className={cn('prose prose-sm dark:prose-invert max-w-none cursor-pointer', isHovered && 'cursor-text')}
                dangerouslySetInnerHTML={{ __html: b.html }}
                onClick={(e) => {
                  e.stopPropagation()
                  if (editable && !isEditing) setEditingId(b.id)
                }}
              />
            )}
          </motion.div>
        )
      })}
      <p className="pt-1 text-center text-[10px] text-muted-foreground">
        Hover a block to edit, reorder, duplicate, or delete it.
      </p>
    </div>
  )
}
