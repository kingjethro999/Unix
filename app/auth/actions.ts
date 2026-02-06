'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const signInSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
    redirectUrl: z.string().optional(),
})

const signUpSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    fullName: z.string().min(1).optional(),
    redirectUrl: z.string().optional(),
})

export async function signInAction(data: z.infer<typeof signInSchema>) {
    const supabase = await createClient()
    const { email, password, redirectUrl } = data

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    // Redirect after successful login
    return redirect(redirectUrl || '/create')
}

export async function signUpAction(data: z.infer<typeof signUpSchema>) {
    const supabase = await createClient()
    const { email, password, fullName, redirectUrl } = data

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
        return { error: error.message }
    }

    // Redirect after successful signup
    return redirect(redirectUrl || '/create')
}
