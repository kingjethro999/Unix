'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, View } from 'lucide-react'
import { motion } from 'motion/react'

export default function ViewLandingPage() {
    const [workspaceId, setWorkspaceId] = useState('')
    const router = useRouter()

    const handleView = (e: React.FormEvent) => {
        e.preventDefault()
        if (workspaceId.trim()) {
            // clean up ID if full URL is pasted
            const id = workspaceId.split('/').pop() || workspaceId
            router.push(`/view/${id}`)
        }
    }

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-white">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-zinc-800">
                        <View size={32} className="text-zinc-400" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">
                        View Project
                    </h1>
                    <p className="text-zinc-500">
                        Enter a Workspace ID or paste a link to view a project.
                    </p>
                </div>

                <form onSubmit={handleView} className="space-y-4">
                    <div>
                        <label htmlFor="workspace-id" className="sr-only">Workspace ID</label>
                        <input
                            id="workspace-id"
                            type="text"
                            value={workspaceId}
                            onChange={(e) => setWorkspaceId(e.target.value)}
                            placeholder="e.g. 69cf702e-c774..."
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono text-sm"
                            autoFocus
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!workspaceId.trim()}
                        className="w-full bg-white text-black hover:bg-zinc-200 disabled:opacity-50 disabled:hover:bg-white font-medium rounded-xl px-4 py-3 transition-colors flex items-center justify-center gap-2"
                    >
                        <span>View Project</span>
                        <ArrowRight size={16} />
                    </button>
                </form>

                <p className="mt-8 text-center text-xs text-zinc-700">
                    Unix Read-Only Mode
                </p>
            </motion.div>
        </div>
    )
}