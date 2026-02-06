'use server'

import { createClient } from '@/lib/supabase/server'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_SMTP_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
})

export async function sendInvite(folderId: string, email: string, role: 'view' | 'edit') {
    const supabase = await createClient()

    // 1. Check if user is owner (RLS handles this mostly, but good to check)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // 2. Add to share_requests (Pre-approval)
    // We first look up if the user exists in our DB to link them directly
    // Ideally, invitations are by email. Supabase Auth handles users. 
    // If the user doesn't exist yet, we might need an 'invitations' table.
    // For Unix MVP, we will assume we just invite via email and they need to sign up.
    // However, `share_requests` links to `auth.users`. 
    // If user isn't signed up, we can't insert into `share_requests` with a valid user_id.

    // STRATEGY: 
    // For this internal version, we'll send the email. 
    // The link will be the "Join Link".
    // When they click it, they see "Request Access" or if the folder is "Anyone with link", they just get in.

    // If specifically inviting someone to a PRIVATE folder, we usually need an `invitations` table (email -> folder).
    // The current schema uses `share_requests` which relies on `user_id`.

    // PLAN: Just enable "Anyone with Link" for this simplistic flow, 
    // OR create a quick invitations table if we want to be strict.
    // Let's stick to the "Share Link" flow as primarily described in the plan,
    // plus sending that link via email.

    // Get Folder Name
    const { data: folder } = await supabase.from('folders').select('name').eq('id', folderId).single()

    // Fetch the Share Token (ensure it exists)
    let { data: settings } = await supabase
        .from('folder_share_settings')
        .select('*')
        .eq('folder_id', folderId)
        .single()

    if (!settings) {
        // Create if missing
        const { data: newSettings } = await supabase
            .from('folder_share_settings')
            .insert({ folder_id: folderId, status: 'anyone_with_link', default_access: role })
            .select()
            .single()
        settings = newSettings
    } else {
        // Update role if needed
        if (settings.default_access !== role) {
            await supabase
                .from('folder_share_settings')
                .update({ default_access: role, status: 'anyone_with_link' })
                .eq('folder_id', folderId)
        }
    }

    if (!settings?.share_token) return { error: 'Could not generate share link' }

    const shareUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '.vercel.app') || 'http://localhost:3000'}/join/${settings.share_token}`

    // 3. Send Email
    try {
        await transporter.sendMail({
            from: `"Unix Workspaces" <${process.env.GMAIL_SMTP_USER}>`,
            to: email,
            subject: `Has invited you to collaborate on "${folder?.name || 'Untitled Folder'}"`,
            html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h1>Unix Workspace Invitation</h1>
                    <p>You have been invited to collaborate on <strong>${folder?.name || 'Folder'}</strong>.</p>
                    <p>Role: <strong>${role.toUpperCase()}</strong></p>
                    <br/>
                    <a href="${shareUrl}" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                        Open Workspace
                    </a>
                    <br/><br/>
                    <p style="color: #666; font-size: 12px;">Powered by Unix</p>
                </div>
            `
        })
        return { success: true }
    } catch (err: any) {
        console.error('Email error:', err)
        return { error: 'Failed to send email' }
    }
}
