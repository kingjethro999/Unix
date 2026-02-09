'use client'

import { useState } from 'react'
import {
    Share2,
    Copy,
    X,
    Check,
    Globe,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'

interface ShareModalProps {
    isOpen: boolean
    onClose: () => void
    workspaceId: string
}

export function ShareModal({ isOpen, onClose, workspaceId }: ShareModalProps) {
    const [copied, setCopied] = useState(false)
    const shareUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/view/${workspaceId}`
        : `/view/${workspaceId}`

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        toast.success('Link copied to clipboard')
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', duration: 0.3 }}
                            className="w-full max-w-md mx-4 pointer-events-auto"
                        >
                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
                                {/* Header */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                            <Share2 size={20} className="text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-white">
                                                Share Project
                                            </h2>
                                            <p className="text-xs text-zinc-500">
                                                Share a read-only View link
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-zinc-300 transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 mb-4">
                                        <div className="flex gap-3 mb-2">
                                            <Globe size={16} className="text-zinc-500 mt-0.5" />
                                            <div>
                                                <h3 className="text-sm font-medium text-zinc-200">Public Access</h3>
                                                <p className="text-xs text-zinc-500">Anyone with this link can view this project.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wide">
                                        Project Link
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-300 font-mono truncate select-all">
                                            {shareUrl}
                                        </div>
                                        <button
                                            onClick={handleCopy}
                                            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors flex items-center justify-center min-w-[44px]"
                                            title="Copy link"
                                        >
                                            {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="px-6 py-4 bg-zinc-950/50 border-t border-zinc-800 flex justify-end">
                                    <button
                                        onClick={onClose}
                                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )
}
