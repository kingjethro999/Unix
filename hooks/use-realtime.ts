'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'

interface UseRealtimeSubscriptionProps {
    table: string
    event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
    schema?: string
    filter?: string
    callback: (payload: any) => void
}

export function useRealtimeSubscription({
    table,
    event = '*',
    schema = 'public',
    filter,
    callback
}: UseRealtimeSubscriptionProps) {
    const supabase = createClient()

    useEffect(() => {
        const channel = supabase
            .channel(`realtime:${table}`)
            .on(
                'postgres_changes',
                {
                    event,
                    schema,
                    table,
                    filter,
                },
                (payload) => {
                    callback(payload)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [table, event, schema, filter, callback])
}
