import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface JoinPageProps {
    params: Promise<{ token: string }>
}

export default async function JoinPage(props: JoinPageProps) {
    const params = await props.params;
    const { token } = params
    const supabase = await createClient()

    // 1. Validate Token
    const { data: shareSettings } = await supabase
        .from('folder_share_settings')
        .select(`
            folder_id, 
            default_access,
            folders ( name )
        `)
        .eq('share_token', token)
        .eq('status', 'anyone_with_link')
        .single()

    if (!shareSettings) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-4">
                <h1 className="text-2xl font-bold mb-2">Invalid or Expired Link</h1>
                <p className="text-zinc-400 mb-6">This invite link is no longer valid or you do not have permission.</p>
                <Link href="/">
                    <Button variant="outline">Go Home</Button>
                </Link>
            </div>
        )
    }

    // 2. Auto-Join Logic (Simplification)
    // If it's "Anyone with link", we just redirect them to the workspace.
    // In a full app, we might add this folder to their "Shared with me" list in the DB.
    // But for this MVP, accessing the URL is enough if the RLS policy checks for the token/settings.
    // Actually, RLS on 'content' checks:
    // EXISTS (SELECT 1 FROM folder_share_settings ... WHERE status = 'anyone_with_link')

    // So simply having the folder_id is enough to "view/edit". 
    // We just need to redirect them.

    const folderData = Array.isArray(shareSettings.folders) ? shareSettings.folders[0] : shareSettings.folders
    const folderName = folderData?.name || 'Untitled Folder'

    return (
        <div className="h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-4">
            <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
                <h1 className="text-2xl font-bold mb-2">Join "{folderName}"</h1>
                <p className="text-zinc-400 mb-6">
                    You have been invited to <strong>{shareSettings.default_access}</strong> this workspace.
                </p>

                <form action={async () => {
                    'use server'
                    redirect(`/workspace/${shareSettings.folder_id}`)
                }}>
                    <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white" size="lg">
                        Open Workspace
                    </Button>
                </form>
            </div>
        </div>
    )
}
