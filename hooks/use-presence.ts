'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { RealtimePresenceState } from '@supabase/supabase-js'

interface UsePresenceProps {
    room: string
    user: {
        id: string
        name?: string
        avatar_url?: string
    }
}

interface PresenceState {
    [key: string]: any[]
}

export function usePresence({ room, user }: UsePresenceProps) {
    const supabase = createClient()
    const [presenceState, setPresenceState] = useState<PresenceState>({})

    useEffect(() => {
        const channel = supabase.channel(room)

        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState()
                setPresenceState(newState)
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                // Handle join if needed specifically
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                // Handle leave if needed specifically
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        user_id: user.id,
                        online_at: new Date().toISOString(),
                        ...user,
                    })
                }
            })

        return () => {
            channel.unsubscribe()
        }
    }, [room, user.id])

    // Convert presence state object to an array of users for easier display
    const activeUsers = Object.values(presenceState)
        .flat()
        .map((p: any) => ({
            id: p.user_id,
            name: p.name,
            avatar_url: p.avatar_url,
            online_at: p.online_at
        }))
        // Filter out duplicates if a user has multiple tabs open
        .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)

    return {
        activeUsers,
        presenceState
    }
}
