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
import { signInAction } from '@/app/auth/actions'
import { ErrorState } from '@/components/ErrorState'

const signInSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
})

function SignInForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectUrl = searchParams.get('redirect')

    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const form = useForm({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    })

    const onSubmit = (data: z.infer<typeof signInSchema>) => {
        setError(null)
        startTransition(async () => {
            const result = await signInAction({ ...data, redirectUrl: redirectUrl || undefined })
            if (result?.error) {
                setError(result.error)
                form.setError('root', { message: result.error })
            }
            // If no error, the server action will handle the redirect
        })
    }

    return (
        <AuthCard
            title="Sign in"
            description="Enter your email and password to access your account"
        >
            <AuthForm
                schema={signInSchema}
                defaultValues={{
                    email: '',
                    password: '',
                }}
                onSubmit={onSubmit}
                submitText="Sign in"
                loadingText="Signing in..."
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
                            name="email"
                            label="Email"
                            placeholder="john@doe.com"
                            type="email"
                        />

                        <div className="space-y-2">
                            <AuthField
                                control={form.control}
                                name="password"
                                label="Password"
                                placeholder="Enter your password"
                                type="password"
                            />
                            <div className="text-right">
                                <Link
                                    href="/forgot-password"
                                    className="text-xs md:text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                        </div>
                    </>
                )}
            </AuthForm>

            <div className="text-center text-sm text-muted-foreground mt-4 space-x-1">
                <div className="inline-block">Don't have an account? </div>
                <div className="inline-block">
                    <Link
                        href={redirectUrl ? `/sign-up?redirect=${redirectUrl}` : "/sign-up"}
                        className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                        Sign up
                    </Link>
                </div>
            </div>
        </AuthCard>
    )
}

export default function SignInPage() {
    return (
        <React.Suspense fallback={
            <AuthCard
                title="Sign in"
                description="Loading..."
            >
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </AuthCard>
        }>
            <SignInForm />
        </React.Suspense>
    )
}
