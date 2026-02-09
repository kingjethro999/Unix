import { createClient } from '@/lib/supabase/server'
import { ViewLayout } from './view-layout'
import { notFound } from 'next/navigation'

export default async function ViewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    // 1. Fetch Folder (Workspace) & Verify Access
    // For now, we assume if you have the ID you can view it (public link sharing)
    // Or we might check a 'is_public' flag if we had one.
    // Since user said "just like google meet you tell them kindly paste the link", implying simple ID access.
    // We'll just fetch based on ID.
    const { data: folder, error: folderError } = await supabase
        .from('folders')
        .select('id, name')
        .eq('id', id)
        .single()

    if (folderError || !folder) {
        console.error('Folder fetch error:', folderError)
        notFound()
    }

    // 2. Fetch Pages
    const { data: pages, error: pagesError } = await supabase
        .from('pages')
        .select('id, title, folder_id')
        .eq('folder_id', id)
        .order('created_at', { ascending: false })

    if (pagesError) {
        console.error('Pages fetch error:', pagesError)
        return <div>Error loading project files</div>
    }

    return (
        <ViewLayout
            folder={folder}
            initialPages={pages || []}
        />
    )
}