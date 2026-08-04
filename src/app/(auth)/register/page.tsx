'use client'

import { register } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sparkles, Mail, Lock, User, Building2, Globe, Clock } from 'lucide-react'
import Link from 'next/link'
import { useActionState } from 'react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(register, undefined)
  const router = useRouter()

  useEffect(() => {
    if (state?.success) {
      router.push('/')
    }
  }, [state?.success, router])

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
            <p className="text-sm text-muted-foreground">Start your 14-day free trial today</p>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          {state?.error && (
            <div className="mb-4 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="name" name="name" placeholder="John Doe" required disabled={isPending} className="pl-9" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" name="email" type="email" placeholder="you@example.com" required disabled={isPending} className="pl-9" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" name="password" type="password" placeholder="••••••••" required disabled={isPending} className="pl-9" />
              </div>
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters with uppercase, lowercase, and number
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workspaceName">Workspace Name</Label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="workspaceName" name="workspaceName" placeholder="Acme Inc" required disabled={isPending} className="pl-9" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workspaceSlug">Workspace Slug (optional)</Label>
              <Input id="workspaceSlug" name="workspaceSlug" placeholder="acme-inc" disabled={isPending} />
              <p className="text-xs text-muted-foreground">Leave blank to auto-generate from workspace name</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <div className="relative">
                  <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Select name="country">
                    <SelectTrigger className="pl-9">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                      <SelectItem value="PH">Philippines</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <div className="relative">
                  <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Select name="timezone">
                    <SelectTrigger className="pl-9">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Asia/Manila">Manila</SelectItem>
                      <SelectItem value="Asia/Singapore">Singapore</SelectItem>
                      <SelectItem value="Australia/Sydney">Sydney</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Checkbox id="acceptTerms" name="acceptTerms" required />
              <Label htmlFor="acceptTerms" className="text-sm font-normal leading-tight">
                I agree to the{' '}
                <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
              </Label>
            </div>

            <div className="flex items-start gap-2">
              <Checkbox id="newsletter" name="newsletter" />
              <Label htmlFor="newsletter" className="text-sm font-normal leading-tight">
                Send me product updates and marketing emails
              </Label>
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
