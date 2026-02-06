'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createPage(folderId: string, title: string = 'Untitled') {
    const supabase = await createClient()

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        const { data: page, error } = await supabase
            .from('pages')
            .insert({
                folder_id: folderId,
                user_id: user.id,
                title: title
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating page:', error)
            return { error: `Failed to create page: ${error.message}` }
        }

        revalidatePath(`/workspace/${folderId}`) // Ensure server components refresh
        return { success: true, page }

    } catch (err: any) {
        console.error('Server error:', err)
        return { error: 'Server error' }
    }
}
