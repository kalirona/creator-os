'use client'

import { forgotPassword } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sparkles, Mail } from 'lucide-react'
import Link from 'next/link'
import { useActionState } from 'react'

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(forgotPassword, undefined)

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
            <p className="text-sm text-muted-foreground">
              Enter your email and we'll send you a reset link
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
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  disabled={isPending}
                  className="pl-9"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Remember your password?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}