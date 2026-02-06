import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr'
import { getRequestHeader, setResponseHeader } from '@tanstack/react-start/server'

export function createSupabaseServerClient() {
    return createServerClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.VITE_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return parseCookieHeader(getRequestHeader('Cookie') ?? '').map((c) => ({
                        name: c.name,
                        value: c.value ?? '',
                    }))
                },
                setAll(cookiesToSet) {
                    const headers = cookiesToSet.map(({ name, value, options }) =>
                        serializeCookieHeader(name, value, options)
                    )
                    setResponseHeader('Set-Cookie', headers)
                },
            },
        },
    )
}
