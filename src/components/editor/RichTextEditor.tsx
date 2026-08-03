'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TiptapLink from '@tiptap/extension-link'
import TiptapImage from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import TextAlign from '@tiptap/extension-text-align'
import {
  Bold, Italic, Strikethrough, Code,
  List, ListOrdered, Quote, Link as LinkIcon, Image as ImageIcon,
  Table as TableIcon,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Undo as UndoIcon, Redo as RedoIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Start writing...',
  editable = true,
  className,
}: {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  editable?: boolean
  className?: string
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder }),
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary underline' },
      }),
      TiptapImage.configure({ HTMLAttributes: { class: 'rounded-lg max-w-full' } }),
      Table.configure({ resizable: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px]',
      },
    },
  })

  if (!editor) return null

  return (
    <div className={cn('border border-border rounded-lg bg-background', className)}>
      <div className="flex flex-wrap gap-1 p-2 border-b border-border bg-card">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          disabled={!editor.can().toggleHeading({ level: 1 })}
          title="Heading 1"
        >
          <span className="text-[10px] font-bold">H1</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          disabled={!editor.can().toggleHeading({ level: 2 })}
          title="Heading 2"
        >
          <span className="text-[11px] font-bold">H2</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          disabled={!editor.can().toggleHeading({ level: 3 })}
          title="Heading 3"
        >
          <span className="text-[12px] font-bold">H3</span>
        </Button>

        <Separator className="h-6 mx-1" />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-primary text-primary-foreground' : ''}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-primary text-primary-foreground' : ''}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? 'bg-primary text-primary-foreground' : ''}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={editor.isActive('code') ? 'bg-primary text-primary-foreground' : ''}
          title="Inline code"
        >
          <Code className="h-4 w-4" />
        </Button>

        <Separator className="h-6 mx-1" />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-primary text-primary-foreground' : ''}
          title="Bullet list"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-primary text-primary-foreground' : ''}
          title="Numbered list"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'bg-primary text-primary-foreground' : ''}
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive('codeBlock') ? 'bg-primary text-primary-foreground' : ''}
          title="Code block"
        >
          <Code className="h-4 w-4" />
        </Button>

        <Separator className="h-6 mx-1" />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            const url = window.prompt('Enter URL:')
            if (url) editor.chain().focus().setLink({ href: url }).run()
          }}
          className={editor.isActive('link') ? 'bg-primary text-primary-foreground' : ''}
          title="Add link"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            const url = window.prompt('Enter image URL:')
            if (url) editor.chain().focus().setImage({ src: url }).run()
          }}
          title="Add image"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          title="Insert table"
        >
          <TableIcon className="h-4 w-4" />
        </Button>

        <Separator className="h-6 mx-1" />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={editor.isActive({ textAlign: 'left' }) ? 'bg-primary text-primary-foreground' : ''}
          title="Align left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={editor.isActive({ textAlign: 'center' }) ? 'bg-primary text-primary-foreground' : ''}
          title="Align center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={editor.isActive({ textAlign: 'right' }) ? 'bg-primary text-primary-foreground' : ''}
          title="Align right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={editor.isActive({ textAlign: 'justify' }) ? 'bg-primary text-primary-foreground' : ''}
          title="Align justify"
        >
          <AlignJustify className="h-4 w-4" />
        </Button>

        <Separator className="h-6 mx-1" />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (⌘Z)"
        >
          <UndoIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (⌘Y)"
        >
          <RedoIcon className="h-4 w-4" />
        </Button>
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}

export default RichTextEditor