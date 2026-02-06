'use client'

import { useEffect } from 'react'
import { X, BookOpen, Bot, FileText, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

interface HelpModalProps {
    isOpen: boolean
    onClose: () => void
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        if (isOpen) window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onClose])

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
                            className="w-full max-w-2xl mx-4 pointer-events-auto"
                        >
                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
                                {/* Header */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/10">
                                            <BookOpen size={20} className="text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-white tracking-tight">
                                                Platform Guide
                                            </h2>
                                            <p className="text-xs text-zinc-500 font-medium">
                                                Mastering the Unix Editor
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
                                <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-zinc-800">

                                    {/* Section 1: AI Assistant */}
                                    <div className="flex gap-4">
                                        <div className="shrink-0 w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                            <Bot size={20} className="text-emerald-400" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-semibold text-zinc-200">AI Writing Assistant</h3>
                                            <p className="text-sm text-zinc-400 leading-relaxed">
                                                Interact with the AI sidebar to brainstorm, draft, or edit your work.
                                                Drag files into the chat to provide context. The AI is aware of your entire project structure.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Section 2: Style Guide */}
                                    <div className="flex gap-4">
                                        <div className="shrink-0 w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                            <FileText size={20} className="text-indigo-400" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-semibold text-zinc-200">The .unixrc Style Guide</h3>
                                            <p className="text-sm text-zinc-400 leading-relaxed">
                                                Every workspace comes with a <code className="text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded text-xs font-mono">.unixrc</code> file.
                                                Define your style rules here (e.g., "No adverbs", "First person POV").
                                                The AI analyzes this file before every response to ensure consistency.
                                                <span className="block mt-1 text-xs text-zinc-500 italic">This file is automatically excluded from exports.</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Section 3: Review Mode */}
                                    <div className="flex gap-4">
                                        <div className="shrink-0 w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                            <CheckCircle2 size={20} className="text-orange-400" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-semibold text-zinc-200">Review & Diff Workflow</h3>
                                            <p className="text-sm text-zinc-400 leading-relaxed">
                                                When the AI updates files, changes are proposed in "Review Mode".
                                                You'll see a global review bar at the bottom of the chat with precise addition/deletion stats.
                                                You can <strong>Accept</strong> or <strong>Reject</strong> changes individually or in bulk.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Section 4: Coming Soon - Live Collaboration */}
                                    <div className="flex gap-4 opacity-60">
                                        <div className="shrink-0 w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                                <circle cx="9" cy="7" r="4" />
                                                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                            </svg>
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-semibold text-zinc-200">
                                                Live Collaboration
                                                <span className="ml-2 text-[10px] px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full font-medium">Coming Soon</span>
                                            </h3>
                                            <p className="text-sm text-zinc-400 leading-relaxed">
                                                Real-time collaboration with team members will be added in the next major update.
                                                Work together on documents with live cursors, comments, and shared editing sessions.
                                            </p>
                                        </div>
                                    </div>

                                </div>

                                {/* Footer */}
                                <div className="p-4 border-t border-zinc-800 bg-zinc-950/30 flex justify-end">
                                    <button
                                        onClick={onClose}
                                        className="px-6 py-2 bg-white text-black hover:bg-zinc-200 rounded-lg text-sm font-semibold transition-colors"
                                    >
                                        Got it
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
