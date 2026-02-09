'use client'

import { useCallback, useEffect, useState, useRef, useMemo } from 'react'
import { useActiveFile, editorStore } from './editor-store'
import { motion, AnimatePresence } from 'motion/react'
import { FileText, Sparkles, Search } from 'lucide-react'
import { DiffViewer } from './diff-viewer'
import { FindReplaceDialog } from './find-replace'

export function EditorWorkspace() {
  const activeFile = useActiveFile()
  const [content, setContent] = useState('')
  const [showFind, setShowFind] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (activeFile) {
      setContent(activeFile.content)
    }
  }, [activeFile?.id, activeFile?.content])

  // Compute line numbers
  const lines = useMemo(() => {
    const lineCount = content.split('\n').length
    return Array.from({ length: lineCount }, (_, i) => i + 1)
  }, [content])

  // Sync line numbers scroll with textarea
  const handleTextareaScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }, [])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+F to open find
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        setShowFind(true)
        return
      }

      if (!activeFile?.isReviewing) return

      // Cmd+Enter to Accept
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        editorStore.acceptChange(activeFile.id)
      }
      // Esc to Reject (but not if find is open)
      else if (e.key === 'Escape' && !showFind) {
        e.preventDefault()
        editorStore.rejectChange(activeFile.id)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeFile?.id, activeFile?.isReviewing, showFind])

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

  // Handle replacement from find dialog
  const handleReplace = useCallback((newContent: string) => {
    setContent(newContent)
    if (activeFile) {
      editorStore.updateFileContent(activeFile.id, newContent)
    }
  }, [activeFile])

  // Navigate to match position
  const handleNavigateToMatch = useCallback((position: number) => {
    if (textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(position, position)

      // Scroll to position
      const textBeforePosition = content.substring(0, position)
      const lineNumber = textBeforePosition.split('\n').length
      const lineHeight = 30.6 // 17px * 1.8 line-height
      const scrollPosition = (lineNumber - 5) * lineHeight // Scroll to show 5 lines before
      textareaRef.current.scrollTop = Math.max(0, scrollPosition)
    }
  }, [content])

  // Calculate current line and column
  const cursorInfo = useMemo(() => {
    if (!textareaRef.current) return { line: 1, col: 1 }
    const pos = textareaRef.current.selectionStart || 0
    const textBeforeCursor = content.substring(0, pos)
    const lines = textBeforeCursor.split('\n')
    return {
      line: lines.length,
      col: (lines[lines.length - 1]?.length || 0) + 1
    }
  }, [content])

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
      {/* Find/Replace Dialog */}
      <AnimatePresence>
        {showFind && (
          <FindReplaceDialog
            content={content}
            onReplace={handleReplace}
            onClose={() => setShowFind(false)}
            onNavigateToMatch={handleNavigateToMatch}
          />
        )}
      </AnimatePresence>

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
            onClick={() => setShowFind(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-500 hover:text-cyan-400 hover:bg-cyan-500/5 rounded-md transition-colors"
            title="Find & Replace (⌘F)"
          >
            <Search size={12} />
            <span>Find</span>
          </button>
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
        <div className="h-full">
          {activeFile.isReviewing ? (
            <motion.div
              key="review-mode"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full pb-4 px-4"
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
              className="h-full flex"
            >
              {/* Line numbers gutter */}
              <div
                ref={lineNumbersRef}
                className="w-12 shrink-0 overflow-hidden bg-zinc-900/50 border-r border-zinc-800/50 select-none"
                style={{ paddingTop: '8px' }}
              >
                <div className="flex flex-col text-right pr-3 font-mono text-[13px] text-zinc-600">
                  {lines.map((lineNum) => (
                    <div
                      key={lineNum}
                      className="leading-[1.8]"
                      style={{ height: '30.6px' }}
                    >
                      {lineNum}
                    </div>
                  ))}
                </div>
              </div>

              {/* Editor textarea */}
              <div className="flex-1 overflow-hidden">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={handleContentChange}
                  onSelect={handleSelect}
                  onKeyUp={handleSelect}
                  onMouseUp={handleSelect}
                  onScroll={handleTextareaScroll}
                  placeholder="Start writing..."
                  className="w-full h-full bg-transparent text-zinc-200 text-base leading-relaxed resize-none focus:outline-none placeholder:text-zinc-700 font-serif selection:bg-cyan-500/20 selection:text-cyan-200 px-4 py-2"
                  style={{
                    fontFamily: "'Georgia', 'Times New Roman', serif",
                    fontSize: '17px',
                    lineHeight: '1.8',
                  }}
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-800/30 text-[11px] text-zinc-600 font-mono">
        <div className="flex items-center gap-4">
          <span>Ln {cursorInfo.line}, Col {cursorInfo.col}</span>
          <span>{content.split(/\s+/).filter(Boolean).length} words</span>
          <span>{content.length} characters</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-zinc-700">⌘F Find</span>
          <span>UTF-8</span>
          <span>Markdown</span>
        </div>
      </div>
    </div>
  )
}
