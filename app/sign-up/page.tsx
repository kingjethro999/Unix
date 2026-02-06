'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { AuthCard } from '@/components/auth/auth-card'
import { AuthForm } from '@/components/auth/auth-form'
import { AuthField } from '@/components/auth/auth-field'
import { signUpAction } from '@/app/auth/actions'
import { ErrorState } from '@/components/ErrorState'

const signUpSchema = z.object({
    fullName: z.string().min(1, 'Full name is required'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
})

function SignUpForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectUrl = searchParams.get('redirect')

    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const form = useForm({
        resolver: zodResolver(signUpSchema),
        defaultValues: {
            fullName: '',
            email: '',
            password: '',
        },
    })

    const onSubmit = (data: z.infer<typeof signUpSchema>) => {
        setError(null)
        startTransition(async () => {
            const result = await signUpAction({ ...data, redirectUrl: redirectUrl || undefined })
            if (result?.error) {
                setError(result.error)
                form.setError('root', { message: result.error })
            }
            // If no error, the server action will handle the redirect
        })
    }

    return (
        <AuthCard
            title="Sign up"
            description="Enter your details to create a new account"
        >
            <AuthForm
                schema={signUpSchema}
                defaultValues={{
                    fullName: '',
                    email: '',
                    password: '',
                }}
                onSubmit={onSubmit}
                submitText="Sign up"
                loadingText="Signing up..."
                isLoading={isPending}
                form={form}
            >
                {(form) => (
                    <>
                        {error && (
                            <div className="mb-4">
                                <ErrorState message={error} />
                            </div>
                        )}
                        <AuthField
                            control={form.control}
                            name="fullName"
                            label="Full Name"
                            placeholder="John Doe"
                            type="text"
                        />

                        <AuthField
                            control={form.control}
                            name="email"
                            label="Email"
                            placeholder="john@doe.com"
                            type="email"
                        />

                        <AuthField
                            control={form.control}
                            name="password"
                            label="Password"
                            placeholder="Enter your password"
                            type="password"
                        />
                    </>
                )}
            </AuthForm>

            <div className="text-center text-sm text-muted-foreground mt-4 space-x-1">
                <div className="inline-block">Already have an account? </div>
                <div className="inline-block">
                    <Link
                        href={redirectUrl ? `/sign-in?redirect=${redirectUrl}` : "/sign-in"}
                        className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                        Sign in
                    </Link>
                </div>
            </div>
        </AuthCard>
    )
}

export default function SignUpPage() {
    return (
        <React.Suspense fallback={
            <AuthCard
                title="Sign up"
                description="Loading..."
            >
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </AuthCard>
        }>
            <SignUpForm />
        </React.Suspense>
    )
}
