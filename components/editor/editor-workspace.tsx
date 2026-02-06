'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import { useActiveFile, editorStore } from './editor-store'
import { motion, AnimatePresence } from 'motion/react'
import { FileText, Sparkles, Check, X } from 'lucide-react'
import { DiffViewer } from './diff-viewer'

export function EditorWorkspace() {
  const activeFile = useActiveFile()
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (activeFile) {
      setContent(activeFile.content)
    }
  }, [activeFile?.id, activeFile?.content])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeFile?.isReviewing) return

      // Cmd+Enter to Accept
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        editorStore.acceptChange(activeFile.id)
      }
      // Esc to Reject
      else if (e.key === 'Escape') {
        e.preventDefault()
        editorStore.rejectChange(activeFile.id)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeFile?.id, activeFile?.isReviewing])

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value
      setContent(newContent)
      if (activeFile) {
        editorStore.updateFileContent(activeFile.id, newContent)
      }
    },
    [activeFile?.id],
  )

  const handleSelect = useCallback((e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget
    if (activeFile && target.selectionStart !== target.selectionEnd) {
      editorStore.setSelection({
        fileId: activeFile.id,
        text: target.value.substring(target.selectionStart, target.selectionEnd),
        start: target.selectionStart,
        end: target.selectionEnd
      })
    } else {
      editorStore.setSelection(null)
    }
  }, [activeFile])

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
            Select a file from the sidebar or create a new one to start writing
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-zinc-700">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[10px]">
                ⌘
              </kbd>
              <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[10px]">
                B
              </kbd>
              <span>Toggle sidebar</span>
            </span>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-zinc-950 relative">
      {/* Editor header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800/30">
        <div className="flex items-center gap-3">
          <FileText size={16} className={activeFile.isReviewing ? "text-cyan-400 animate-pulse" : "text-cyan-400"} />
          <h2 className="text-sm font-medium text-zinc-300">
            {activeFile.title}
          </h2>
          {activeFile.isReviewing && (
            <span className="px-1.5 py-0.5 text-[10px] bg-cyan-500/10 text-cyan-400 rounded border border-cyan-500/20">
              Review Mode
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => editorStore.toggleRightSidebar()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-500 hover:text-cyan-400 hover:bg-cyan-500/5 rounded-md transition-colors"
          >
            <Sparkles size={12} />
            <span>AI Assist</span>
          </button>
        </div>
      </div>

      {/* Editor content */}
      <div className="flex-1 overflow-hidden relative">
        <div className="h-full max-w-5xl mx-auto px-4 py-4">
          {activeFile.isReviewing ? (
            <motion.div
              key="review-mode"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full pb-4"
            >
              <DiffViewer
                original={activeFile.originalContent || ''}
                modified={content}
                title={`Reviewing changes for ${activeFile.title}`}
                onAccept={() => editorStore.acceptChange(activeFile.id)}
                onReject={() => editorStore.rejectChange(activeFile.id)}
              />
            </motion.div>
          ) : (
            <motion.div
              key={activeFile.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="h-full px-4 py-2"
            >
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                onSelect={handleSelect}
                onKeyUp={handleSelect}
                onMouseUp={handleSelect}
                placeholder="Start writing..."
                className="w-full h-full bg-transparent text-zinc-200 text-base leading-relaxed resize-none focus:outline-none placeholder:text-zinc-700 font-serif selection:bg-cyan-500/20 selection:text-cyan-200"
                style={{
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  fontSize: '17px',
                  lineHeight: '1.8',
                }}
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-800/30 text-[11px] text-zinc-600 font-mono">
        <div className="flex items-center gap-4">
          <span>{content.split(/\s+/).filter(Boolean).length} words</span>
          <span>{content.length} characters</span>
        </div>
        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          <span>Markdown</span>
        </div>
      </div>
    </div>
  )
}
