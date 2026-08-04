import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.string().optional(),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  workspaceName: z.string().min(2, 'Workspace name must be at least 2 characters').max(100),
  workspaceSlug: z.string().optional(),
  country: z.string().optional(),
  timezone: z.string().optional(),
  acceptTerms: z.string().optional(),
  newsletter: z.string().optional(),
})

export type ActionState = { success?: boolean; error?: string; message?: string; [key: string]: unknown }

export function validatedAction<T extends z.ZodTypeAny>(
  schema: T,
  action: (data: z.infer<T>, formData: FormData) => Promise<ActionState>
) {
  return async (_prevState: ActionState | undefined, formData: FormData): Promise<ActionState> => {
    const result = schema.safeParse(Object.fromEntries(formData))
    if (!result.success) {
      return { error: result.error.issues[0]?.message || 'Validation failed' }
    }
    return action(result.data, formData)
  }
}
