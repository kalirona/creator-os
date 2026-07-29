'use client'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/store/app-store'

export interface CreateField {
  name: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'number'
  placeholder?: string
  options?: { value: string; label: string }[]
  defaultValue?: string
  required?: boolean
}

export interface CreateDialogConfig {
  title: string
  description: string
  fields: CreateField[]
  submitLabel?: string
  aiHint?: string
  apiEndpoint?: string
  entityName?: string
}

export function CreateDialog({
  open, onOpenChange, config,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  config: CreateDialogConfig
}) {
  const { setActiveModule } = useAppStore()
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const set = (name: string, val: string) => setValues((p) => ({ ...p, [name]: val }))

  const submit = async () => {
    const missing = config.fields.filter((f) => f.required && !(values[f.name] || f.defaultValue || '').trim())
    if (missing.length) {
      toast.error(`Please fill in: ${missing.map((f) => f.label.toLowerCase()).join(', ')}`)
      return
    }

    // Build payload from fields
    const payload: Record<string, string> = {}
    for (const f of config.fields) {
      payload[f.name] = values[f.name] ?? f.defaultValue ?? ''
    }

    if (!config.apiEndpoint) {
      toast.error('No API endpoint configured')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create')
      }

      const entityName = config.entityName || config.title.replace('New ', '').replace('Add ', '')
      const itemName = payload[config.fields[0]?.name] || 'Item'
      toast.success(`${entityName} created!`, {
        description: `"${itemName}" is now in your workspace.`,
      })
      setValues({})
      onOpenChange(false)
    } catch (e) {
      toast.error('Failed to create', {
        description: e instanceof Error ? e.message : 'Unknown error',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {config.title}
          </DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>
        {config.aiHint && (
          <button
            onClick={() => { onOpenChange(false); setActiveModule('ai-studio'); toast.info('Opening AI Studio to generate content') }}
            className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-left text-sm hover:bg-primary/10 transition"
          >
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <span className="flex-1">{config.aiHint}</span>
            <span className="text-xs text-primary font-medium">Open AI →</span>
          </button>
        )}
        <div className="space-y-4 py-2">
          {config.fields.map((f) => (
            <div key={f.name} className="space-y-1.5">
              <Label className="text-sm font-medium">{f.label}{f.required && <span className="text-destructive ml-0.5">*</span>}</Label>
              {f.type === 'text' && (
                <Input
                  placeholder={f.placeholder}
                  value={values[f.name] ?? f.defaultValue ?? ''}
                  onChange={(e) => set(f.name, e.target.value)}
                />
              )}
              {f.type === 'number' && (
                <Input
                  type="number"
                  placeholder={f.placeholder}
                  value={values[f.name] ?? f.defaultValue ?? ''}
                  onChange={(e) => set(f.name, e.target.value)}
                />
              )}
              {f.type === 'textarea' && (
                <Textarea
                  rows={3}
                  placeholder={f.placeholder}
                  value={values[f.name] ?? f.defaultValue ?? ''}
                  onChange={(e) => set(f.name, e.target.value)}
                />
              )}
              {f.type === 'select' && (
                <Select value={values[f.name] ?? f.defaultValue} onValueChange={(v) => set(f.name, v)}>
                  <SelectTrigger><SelectValue placeholder={f.placeholder} /></SelectTrigger>
                  <SelectContent>
                    {f.options?.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
        </div>
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={submit} disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Saving...</> : config.submitLabel || 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
