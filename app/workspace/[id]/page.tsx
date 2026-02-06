import { createClient } from '@/lib/supabase/server'
import { EditorLayout } from '@/components/editor'
import { redirect } from 'next/navigation'
import { getFolder, getPages } from '@/app/workspace/actions'

export default async function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/sign-in')
    }

    const folder = await getFolder(id)
    if (!folder) {
        return <div className="p-8">Workspace not found</div>
    }

    const pages = await getPages(id)

    return <EditorLayout folder={folder} initialPages={pages || []} userId={user.id} />
}
