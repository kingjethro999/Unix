'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const createFolderSchema = z.object({
    name: z.string().min(1, 'Name is required'),
})

export async function createFolderAction(data: z.infer<typeof createFolderSchema>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { name } = data

    const { data: folder, error } = await supabase
        .from('folders')
        .insert({
            name,
            user_id: user.id
        })
        .select()
        .single()

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/create')
    return { folder }
}

export async function getFolders() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return []
    }

    const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        return []
    }

    return data
}
