'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const signUpInSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').optional(),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  redirect: z.string().optional(),
})

export async function signUpFn(data: z.infer<typeof signUpInSchema>) {
  const { fullName, email, password, redirect: redirectUrl } = signUpInSchema.parse(data)
  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  if (redirectUrl) {
    redirect(redirectUrl)
  } else {
    redirect('/create')
  }
}

export async function signInFn(data: z.infer<typeof signUpInSchema>) {
  const { email, password, redirect: redirectUrl } = signUpInSchema.parse(data)
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new Error(error.message)
  }

  if (redirectUrl) {
    redirect(redirectUrl)
  } else {
    redirect('/create')
  }
}

export async function signOutFn() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/sign-in')
}

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export async function forgotPasswordFn(data: z.infer<typeof forgotPasswordSchema>) {
  const { email } = forgotPasswordSchema.parse(data)
  const supabase = await createClient()

  // Get the base URL from environment or use localhost for development
  const redirectTo = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`
    : 'http://localhost:3000/reset-password'

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  })

  if (error) {
    throw new Error(error.message)
  }

  return {
    success: true,
    message: 'Password recovery email sent successfully',
  }
}

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function resetPasswordFn(data: z.infer<typeof resetPasswordSchema>) {
  const { password, confirmPassword } = resetPasswordSchema.parse(data)

  if (password !== confirmPassword) {
    throw new Error('Passwords do not match')
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password: password
  })

  if (error) {
    throw new Error(error.message)
  }

  return {
    success: true,
    message: 'Password reset successfully',
  }
}
