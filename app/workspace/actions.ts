'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// Helper to get current user
async function getCurrentUser() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
}

export async function getFolder(folderId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/sign-in')
    }

    const { data: folder, error } = await supabase
        .from('folders')
        .select('*')
        .eq('id', folderId)
        .single()

    if (error || !folder) {
        return null
    }

    return folder
}

export async function getPages(folderId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return []
    }

    const { data: pages, error } = await supabase
        .from('pages')
        .select('*')
        .eq('folder_id', folderId)
        .order('created_at', { ascending: true })

    if (error) {
        return []
    }

    return pages
}

// Create a new page
export async function createPage(folderId: string, title?: string) {
    const user = await getCurrentUser()
    if (!user) {
        throw new Error('Not authenticated')
    }

    const supabase = await createClient()

    const { data: page, error } = await supabase
        .from('pages')
        .insert({
            folder_id: folderId,
            user_id: user.id,
            title: title || 'Untitled',
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating page:', error)
        throw new Error(error.message)
    }

    revalidatePath(`/workspace/${folderId}`)
    return page
}

// Delete a page
export async function deletePage(pageId: string) {
    const user = await getCurrentUser()
    if (!user) {
        throw new Error('Not authenticated')
    }

    const supabase = await createClient()

    // Verify ownership before deleting
    const { data: page, error: fetchError } = await supabase
        .from('pages')
        .select('user_id, folder_id')
        .eq('id', pageId)
        .single()

    if (fetchError || !page) {
        throw new Error('Page not found')
    }

    if (page.user_id !== user.id) {
        throw new Error('Not authorized to delete this page')
    }

    // Delete page (content will cascade delete due to foreign key)
    const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', pageId)

    if (error) {
        console.error('Error deleting page:', error)
        throw new Error(error.message)
    }

    revalidatePath(`/workspace/${page.folder_id}`)
    return { success: true }
}

// Rename a page
export async function renamePage(pageId: string, title: string) {
    const user = await getCurrentUser()
    if (!user) {
        throw new Error('Not authenticated')
    }

    const supabase = await createClient()

    // Verify ownership and update
    const { data: page, error } = await supabase
        .from('pages')
        .update({ title, last_edited: new Date().toISOString() })
        .eq('id', pageId)
        .eq('user_id', user.id)
        .select()
        .single()

    if (error) {
        console.error('Error renaming page:', error)
        throw new Error(error.message)
    }

    if (!page) {
        throw new Error('Page not found or unauthorized')
    }

    revalidatePath(`/workspace/${page.folder_id}`)
    return page
}

// Rename a folder (workspace)
export async function renameFolder(folderId: string, name: string) {
    const user = await getCurrentUser()
    if (!user) {
        throw new Error('Not authenticated')
    }

    const supabase = await createClient()

    // Verify ownership and update
    const { data: folder, error } = await supabase
        .from('folders')
        .update({ name })
        .eq('id', folderId)
        .eq('user_id', user.id)
        .select()
        .single()

    if (error) {
        console.error('Error renaming folder:', error)
        throw new Error(error.message)
    }

    if (!folder) {
        throw new Error('Folder not found or unauthorized')
    }

    revalidatePath(`/workspace/${folderId}`)
    return folder
}

// Update page content
export async function updatePageContent(
    pageId: string,
    bodyJson: any,
    bodyText: string
) {
    const user = await getCurrentUser()
    if (!user) {
        throw new Error('Not authenticated')
    }

    const supabase = await createClient()

    // Verify page ownership
    const { data: page, error: pageError } = await supabase
        .from('pages')
        .select('user_id, folder_id')
        .eq('id', pageId)
        .single()

    if (pageError || !page) {
        throw new Error('Page not found')
    }

    if (page.user_id !== user.id) {
        throw new Error('Not authorized to update this page')
    }

    // Update content
    const { error } = await supabase
        .from('content')
        .update({
            body_json: bodyJson,
            body_text: bodyText,
            updated_at: new Date().toISOString()
        })
        .eq('page_id', pageId)

    if (error) {
        console.error('Error updating content:', error)
        throw new Error(error.message)
    }

    // Update page last_edited timestamp
    await supabase
        .from('pages')
        .update({ last_edited: new Date().toISOString() })
        .eq('id', pageId)

    revalidatePath(`/workspace/${page.folder_id}`)
    return { success: true }
}

// Get page with content
export async function getPageContent(pageId: string) {
    const user = await getCurrentUser()
    if (!user) {
        return null
    }

    const supabase = await createClient()

    // Get page with content
    const { data: result, error } = await supabase
        .from('pages')
        .select(`
            id,
            title,
            folder_id,
            user_id,
            is_pinned,
            last_edited,
            created_at,
            content (
                body_json,
                body_text,
                updated_at
            )
        `)
        .eq('id', pageId)
        .single()

    if (error) {
        console.error('Error fetching page content:', error)
        return null
    }

    return result
}

// Get pages for a folder (for workspace actions)
export async function getPagesForFolder(folderId: string) {
    const user = await getCurrentUser()
    if (!user) {
        return []
    }

    const supabase = await createClient()

    const { data: pages, error } = await supabase
        .from('pages')
        .select('*')
        .eq('folder_id', folderId)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching pages:', error)
        return []
    }

    return pages
}
