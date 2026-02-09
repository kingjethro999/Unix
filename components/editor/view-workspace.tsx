'use client'

import { useEffect, useState } from 'react'
import { useActiveFile } from './editor-store'
import { motion } from 'motion/react'
import { FileText } from 'lucide-react'
import { marked } from 'marked'

export function ViewWorkspace() {
    const activeFile = useActiveFile()
    const [htmlContent, setHtmlContent] = useState('')

    useEffect(() => {
        if (activeFile) {
            // Convert markdown to HTML for display
            // In a real app we might want to sanitize this, but for now we trust the content or use a library that sanitizes
            const parseMarkdown = async () => {
                const html = await marked(activeFile.content, { breaks: true, gfm: true })
                setHtmlContent(html)
            }
            void parseMarkdown()
        }
    }, [activeFile?.id, activeFile?.content])

    if (!activeFile) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-600">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                        <FileText size={28} className="text-zinc-700" />
                    </div>
                    <h3 className="text-lg font-medium text-zinc-400 mb-2">
                        No file selected
                    </h3>
                    <p className="text-sm text-zinc-600 max-w-xs">
                        Select a file from the sidebar to view its content
                    </p>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col bg-zinc-950 relative">
            {/* Editor header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800/30">
                <div className="flex items-center gap-3">
                    <FileText size={16} className="text-zinc-500" />
                    <h2 className="text-sm font-medium text-zinc-300">
                        {activeFile.title}
                    </h2>
                    <span className="px-1.5 py-0.5 text-[10px] bg-zinc-800 text-zinc-400 rounded border border-zinc-700">
                        Read Only
                    </span>
                </div>
            </div>

            {/* Editor content */}
            <div className="flex-1 overflow-y-auto relative scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                <div className="max-w-3xl mx-auto px-8 py-12">
                    <motion.div
                        key={activeFile.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="prose prose-invert prose-zinc max-w-none"
                        dangerouslySetInnerHTML={{ __html: htmlContent }}
                        style={{
                            fontFamily: "'Georgia', 'Times New Roman', serif",
                            fontSize: '17px',
                            lineHeight: '1.8',
                        }}
                    />
                </div>
            </div>
        </div>
    )
}
