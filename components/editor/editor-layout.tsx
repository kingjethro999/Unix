'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Download,
  Undo2,
  Redo2,
  Command,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEditorState, editorStore, useActiveFile } from './editor-store'
import { FileSidebar } from './file-sidebar'
import { EditorTabs } from './editor-tabs'
import { EditorWorkspace } from './editor-workspace'
import { AIChatSidebar } from './ai-chat-sidebar'
import { ExportDialog } from './export-dialog'
import { motion, AnimatePresence } from 'motion/react'

interface ResizeHandleProps {
  side: 'left' | 'right'
  onResize: (delta: number) => void
}

function ResizeHandle({ side, onResize }: ResizeHandleProps) {
  const [isDragging, setIsDragging] = useState(false)
  const startXRef = useRef(0)

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    startXRef.current = e.clientX
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startXRef.current
      startXRef.current = e.clientX
      onResize(side === 'left' ? delta : -delta)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, onResize, side])

  return (
    <div
      onMouseDown={handleMouseDown}
      className={cn(
        'w-1 cursor-col-resize group relative z-10',
        'hover:bg-cyan-500/30 transition-colors',
        isDragging && 'bg-cyan-500/50',
      )}
    >
      <div
        className={cn(
          'absolute inset-y-0 w-4 -translate-x-1/2',
          'flex items-center justify-center',
        )}
      >
        <div
          className={cn(
            'w-0.5 h-8 rounded-full transition-all',
            'bg-zinc-700 group-hover:bg-cyan-400',
            isDragging && 'bg-cyan-400 h-12',
          )}
        />
      </div>
    </div>
  )
}

interface EditorLayoutProps {
  folder: { id: string; name: string }
  initialPages: Array<{ id: string; title: string; folder_id: string }>
  userId: string
}

export function EditorLayout({ folder, initialPages, userId }: EditorLayoutProps) {
  const state = useEditorState()
  const { layout } = state
  const activeFile = useActiveFile()
  const [isExportOpen, setIsExportOpen] = useState(false)

  // Force re-render on history changes (subscribing to store updates)
  const [, setTick] = useState(0)
  useEffect(() => {
    const unsub = editorStore.subscribe(() => setTick((t) => t + 1))
    return () => { unsub() }
  }, [])

  const historyInfo = activeFile
    ? editorStore.getHistoryInfo(activeFile.id)
    : { canUndo: false, canRedo: false }

  // Initialize store with database data on mount
  useEffect(() => {
    void editorStore.initFromDatabase(folder, initialPages, userId)
  }, [folder.id]) // Re-init only if folder changes

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + B: Toggle left sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        editorStore.toggleLeftSidebar()
      }
      // Cmd/Ctrl + J or Cmd/Ctrl + K: Toggle right sidebar
      if ((e.metaKey || e.ctrlKey) && (e.key === 'j' || e.key === 'k')) {
        e.preventDefault()
        editorStore.toggleRightSidebar()
      }
      // Cmd/Ctrl + 1-9: Switch tabs
      if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '9') {
        e.preventDefault()
        const index = parseInt(e.key) - 1
        if (state.tabs[index]) {
          editorStore.setActiveTab(state.tabs[index].id)
        }
      }
      // Cmd/Ctrl + W: Close current tab
      if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
        e.preventDefault()
        if (state.activeTabId) {
          editorStore.closeTab(state.activeTabId)
        }
      }
      // Cmd/Ctrl + Z: Undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (activeFile) editorStore.undo(activeFile.id)
      }
      // Cmd/Ctrl + Shift + Z: Redo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        if (activeFile) editorStore.redo(activeFile.id)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state.tabs, state.activeTabId, activeFile])

  const handleLeftResize = useCallback(
    (delta: number) => {
      const newWidth = Math.max(
        200,
        Math.min(400, layout.leftSidebarWidth + delta),
      )
      editorStore.setLeftSidebarWidth(newWidth)
    },
    [layout.leftSidebarWidth],
  )

  const handleRightResize = useCallback(
    (delta: number) => {
      const newWidth = Math.max(
        280,
        Math.min(500, layout.rightSidebarWidth + delta),
      )
      editorStore.setRightSidebarWidth(newWidth)
    },
    [layout.rightSidebarWidth],
  )

  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-950 text-white overflow-hidden">
      <ExportDialog open={isExportOpen} onOpenChange={setIsExportOpen} />

      {/* Top bar */}
      <div className="h-12 bg-zinc-950 border-b border-zinc-800/50 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => editorStore.toggleLeftSidebar()}
            className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Toggle sidebar (⌘B)"
          >
            {layout.leftSidebarVisible ? (
              <PanelLeftClose size={18} />
            ) : (
              <PanelLeftOpen size={18} />
            )}
          </button>
          <div className="h-4 w-px bg-zinc-800" />
          <span className="text-xs text-zinc-600 font-mono">Unix Editor</span>
        </div>

        {/* Toolbar Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => activeFile && editorStore.undo(activeFile.id)}
            disabled={!historyInfo.canUndo}
            className={cn(
              "p-2 rounded-lg transition-colors",
              historyInfo.canUndo
                ? "hover:bg-white/5 text-zinc-400 hover:text-zinc-200"
                : "text-zinc-700 cursor-not-allowed"
            )}
            title="Undo (⌘Z)"
          >
            <Undo2 size={16} />
          </button>
          <button
            onClick={() => activeFile && editorStore.redo(activeFile.id)}
            disabled={!historyInfo.canRedo}
            className={cn(
              "p-2 rounded-lg transition-colors",
              historyInfo.canRedo
                ? "hover:bg-white/5 text-zinc-400 hover:text-zinc-200"
                : "text-zinc-700 cursor-not-allowed"
            )}
            title="Redo (⌘Shift+Z)"
          >
            <Redo2 size={16} />
          </button>

          <div className="h-4 w-px bg-zinc-800 mx-2" />

          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs text-zinc-300 transition-colors"
            title="Export manuscript"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-500">
            <Command size={12} />
            <span>K</span>
          </div>
          <button
            onClick={() => editorStore.toggleRightSidebar()}
            className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Toggle AI chat (⌘J)"
          >
            {layout.rightSidebarVisible ? (
              <PanelRightClose size={18} />
            ) : (
              <PanelRightOpen size={18} />
            )}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <AnimatePresence mode="wait">
          {layout.leftSidebarVisible && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: layout.leftSidebarWidth, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="shrink-0 overflow-hidden"
            >
              <FileSidebar />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Left resize handle */}
        {layout.leftSidebarVisible && (
          <ResizeHandle side="left" onResize={handleLeftResize} />
        )}

        {/* Center workspace */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <EditorTabs />
          <div className="flex-1 overflow-hidden">
            <EditorWorkspace />
          </div>
        </div>

        {/* Right resize handle */}
        {layout.rightSidebarVisible && (
          <ResizeHandle side="right" onResize={handleRightResize} />
        )}

        {/* Right Sidebar (AI Chat) */}
        <AnimatePresence mode="wait">
          {layout.rightSidebarVisible && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: layout.rightSidebarWidth, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="shrink-0 overflow-hidden"
            >
              <AIChatSidebar />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="h-6 bg-zinc-950 border-t border-zinc-800/30 flex items-center justify-center gap-6 text-[10px] text-zinc-600 font-mono shrink-0">
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[9px]">
            ⌘B
          </kbd>
          <span>Files</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[9px]">
            ⌘Z
          </kbd>
          <span>Undo</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[9px]">
            ⌘J
          </kbd>
          <span>AI Chat</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[9px]">
            ⌘W
          </kbd>
          <span>Close Tab</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[9px]">
            ⌘1-9
          </kbd>
          <span>Switch Tab</span>
        </span>
      </div>
    </div>
  )
}
