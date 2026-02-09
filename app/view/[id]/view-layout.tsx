'use client'

import { useEffect, useState } from 'react'
import { editorStore } from '@/components/editor/editor-store'
import { FileSidebar } from '@/components/editor/file-sidebar'
import { ViewWorkspace } from '@/components/editor/view-workspace'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

interface ViewLayoutProps {
    folder: { id: string; name: string }
    initialPages: Array<{ id: string; title: string; folder_id: string }>
}

export function ViewLayout({ folder, initialPages }: ViewLayoutProps) {
    const [leftSidebarVisible, setLeftSidebarVisible] = useState(true)

    // Initialize store with database data on mount
    useEffect(() => {
        // Pass undefined for userId to trigger read-only/no-create mode
        void editorStore.initFromDatabase(folder, initialPages, undefined)
    }, [folder.id])

    return (
        <div className="h-screen w-screen flex flex-col bg-zinc-950 text-white overflow-hidden">
            {/* Top bar */}
            <div className="h-12 bg-zinc-950 border-b border-zinc-800/50 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setLeftSidebarVisible(!leftSidebarVisible)}
                        className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-zinc-300 transition-colors"
                        title="Toggle sidebar"
                    >
                        {leftSidebarVisible ? (
                            <PanelLeftClose size={18} />
                        ) : (
                            <PanelLeftOpen size={18} />
                        )}
                    </button>
                    <div className="h-4 w-px bg-zinc-800" />
                    <span className="text-xs text-zinc-600 font-mono">Unix View</span>
                </div>

                <div className="text-sm font-medium text-zinc-400">
                    {folder.name}
                </div>

                <div className="w-8" /> {/* Spacer */}
            </div>

            {/* Main content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar */}
                {leftSidebarVisible && (
                    <div className="w-64 border-r border-zinc-800/50 shrink-0">
                        <FileSidebar readOnly={true} />
                    </div>
                )}

                {/* Center workspace */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <div className="flex-1 overflow-hidden">
                        <ViewWorkspace />
                    </div>
                </div>
            </div>
        </div>
    )
}
