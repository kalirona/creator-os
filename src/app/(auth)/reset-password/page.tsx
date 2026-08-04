'use client'

import { resetPassword } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sparkles, Lock } from 'lucide-react'
import Link from 'next/link'
import { useActionState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [state, formAction, isPending] = useActionState(resetPassword, undefined)

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Invalid reset link</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The password reset link is invalid or has expired.
            </p>
            <Link href="/forgot-password" className="mt-4 inline-block text-primary hover:underline">
              Request a new link
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Create new password</h1>
            <p className="text-sm text-muted-foreground">
              Enter a new password for your account
            </p>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          {state?.error && (
            <div className="mb-4 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              {state.error}
            </div>
          )}

          {state?.success && state.message && (
            <div className="mb-4 rounded-lg bg-green-50 px-3 py-2.5 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
              {state.message as string}
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <input type="hidden" name="token" value={token} />

            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  disabled={isPending}
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>

          {state?.success && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in with your new password
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}