'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Copy, Check, Mail, Globe, Lock, UserPlus } from 'lucide-react'
import { sendInvite } from '@/app/actions/invite'
import { toast } from 'sonner'

interface ShareDialogProps {
    folderId: string
    initialStatus?: 'no_one' | 'anyone_with_link' | 'approval_required'
}

export function ShareDialog({ folderId, initialStatus = 'no_one' }: ShareDialogProps) {
    const [email, setEmail] = useState('')
    const [role, setRole] = useState<'view' | 'edit'>('view')
    const [isSending, setIsSending] = useState(false)
    const [copied, setCopied] = useState(false)
    const [isOpen, setIsOpen] = useState(false)

    const handleInvite = async () => {
        if (!email) return
        setIsSending(true)
        const res = await sendInvite(folderId, email, role)
        setIsSending(false)

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success(`Invite sent to ${email}`)
            setEmail('')
        }
    }

    const copyLink = async () => {
        // In a real app we'd fetch the token, but for now let's assume the invite action 
        // would have generated one if we hit it. 
        // Simplified: Just copy the current URL for now as a placeholder or 
        // we'd need a separate client action to 'get share link'.
        const url = window.location.href.replace('/workspace/', '/join/') // Concept
        navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <UserPlus size={14} />
                    Share
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-zinc-100">
                <DialogHeader>
                    <DialogTitle>Share Workspace</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Invite Section */}
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Email address"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="bg-zinc-800 border-zinc-700"
                            />
                            <Select value={role} onValueChange={(v: any) => setRole(v)}>
                                <SelectTrigger className="w-[110px] bg-zinc-800 border-zinc-700">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-100">
                                    <SelectItem value="view">Can view</SelectItem>
                                    <SelectItem value="edit">Can edit</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button onClick={handleInvite} disabled={isSending}>
                                {isSending ? '...' : 'Invite'}
                            </Button>
                        </div>
                    </div>

                    <div className="border-t border-zinc-800" />

                    {/* General Access */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-zinc-400">General access</h4>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-zinc-800">
                                    <Globe size={16} className="text-zinc-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Anyone with the link</p>
                                    <p className="text-xs text-zinc-500">Anyone on the internet with the link can view</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={copyLink} className="gap-2 text-blue-400 hover:text-blue-300">
                                {copied ? <Check size={14} /> : <Copy size={14} />}
                                {copied ? 'Copied' : 'Copy link'}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
