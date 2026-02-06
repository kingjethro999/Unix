import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getFolders } from './actions'
import { Dashboard } from './dashboard'

export default async function CreatePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/sign-in')
    }

    const folders = await getFolders()

    return (
        <Dashboard initialFolders={folders || []} userId={user.id} />
    )
}
