'use client'

import { useState, useRef, useEffect } from 'react'
import {
  FileText,
  Plus,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  Download,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEditorState, editorStore, type EditorFile } from './editor-store'
import { motion } from 'motion/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { NewFileModal } from './new-file-modal'
import { ExportModal } from './export-modal'

interface FileItemProps {
  file: EditorFile
  isActive: boolean
  onDragStart: (e: React.DragEvent, file: EditorFile) => void
  onExport: (file: EditorFile) => void
  readOnly?: boolean
}

function FileItem({ file, isActive, onDragStart, onExport, readOnly }: FileItemProps) {
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(file.title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isRenaming])

  const handleRename = () => {
    const trimmed = renameValue.trim()
    if (trimmed && trimmed !== file.title) {
      editorStore.renameFile(file.id, trimmed)
    } else {
      setRenameValue(file.title)
    }
    setIsRenaming(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename()
    } else if (e.key === 'Escape') {
      setRenameValue(file.title)
      setIsRenaming(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-150 group',
        'hover:bg-white/5',
        isActive && 'bg-cyan-500/10 border-l-2 border-cyan-400 rounded-l-none',
      )}
    >
      <button
        draggable={!isRenaming}
        onDragStart={(e) =>
          !isRenaming && onDragStart(e as unknown as React.DragEvent, file)
        }
        onClick={() => !isRenaming && editorStore.openFile(file.id)}
        className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
      >
        <FileText
          size={16}
          className={cn(
            'shrink-0 transition-colors',
            isActive
              ? 'text-cyan-400'
              : 'text-zinc-500 group-hover:text-zinc-300',
          )}
        />

        {isRenaming ? (
          <input
            ref={inputRef}
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRename}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-zinc-900 border border-cyan-500/50 rounded px-2 py-0.5 text-sm font-mono text-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className={cn(
              'truncate font-mono text-sm tracking-tight',
              isActive
                ? 'text-cyan-400 font-medium'
                : 'text-zinc-400 group-hover:text-zinc-200',
            )}
          >
            {file.title}
          </span>
        )}
      </button>

      {!readOnly && (
        <div className="flex items-center gap-1 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'p-1 rounded hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100',
                  isActive && 'opacity-100',
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical size={14} className="text-zinc-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  setIsRenaming(true)
                }}
              >
                <Edit2 size={14} className="mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onExport(file)
                }}
              >
                <Download size={14} className="mr-2" />
                Export
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-400 focus:text-red-400"
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm(`Delete "${file.title}"? This cannot be undone.`)) {
                    editorStore.deleteFile(file.id)
                  }
                }}
              >
                <Trash2 size={14} className="mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </motion.div>
  )
}

import { HelpModal } from './help-modal' // Import HelpModal
import { BookOpen } from 'lucide-react' // Import BookOpen icon

interface FileSidebarProps {
  readOnly?: boolean
}

export function FileSidebar({ readOnly }: FileSidebarProps) {
  const state = useEditorState()
  const [searchQuery, setSearchQuery] = useState('')
  const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false)
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false)
  const [exportFile, setExportFile] = useState<EditorFile | null>(null)
  const [isBulkExport, setIsBulkExport] = useState(false)

  // Workspace renaming state
  const [isRenamingWorkspace, setIsRenamingWorkspace] = useState(false)
  const [workspaceRenameValue, setWorkspaceRenameValue] = useState(state.folderName)
  const workspaceInputRef = useRef<HTMLInputElement>(null)

  // Update local state when value changes in store
  useEffect(() => {
    setWorkspaceRenameValue(state.folderName)
  }, [state.folderName])

  // Focus input when renaming starts
  useEffect(() => {
    if (isRenamingWorkspace && workspaceInputRef.current) {
      workspaceInputRef.current.focus()
      workspaceInputRef.current.select()
    }
  }, [isRenamingWorkspace])

  const handleWorkspaceRename = () => {
    const trimmed = workspaceRenameValue.trim()
    if (trimmed && trimmed !== state.folderName) {
      editorStore.renameWorkspace(trimmed)
    } else {
      setWorkspaceRenameValue(state.folderName)
    }
    setIsRenamingWorkspace(false)
  }

  const handleWorkspaceKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleWorkspaceRename()
    } else if (e.key === 'Escape') {
      setWorkspaceRenameValue(state.folderName)
      setIsRenamingWorkspace(false)
    }
  }

  const activeTab = state.tabs.find((t) => t.id === state.activeTabId)
  const activeFileId = activeTab?.fileId || null

  const handleFileDragStart = (e: React.DragEvent, file: EditorFile) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ type: 'file', ...file }),
    )
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleExport = (file: EditorFile) => {
    setExportFile(file)
    setIsBulkExport(false)
  }

  const handleBulkExport = () => {
    setExportFile(null)
    setIsBulkExport(true)
  }

  const filteredFiles = searchQuery
    ? state.files.filter((f) =>
      f.title.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    : state.files

  return (
    <div className="h-full flex flex-col bg-zinc-950 border-r border-zinc-800/50">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800/50">
        <div className="flex items-center justify-between mb-4">
          {isRenamingWorkspace ? (
            <input
              ref={workspaceInputRef}
              type="text"
              value={workspaceRenameValue}
              onChange={(e) => setWorkspaceRenameValue(e.target.value)}
              onBlur={handleWorkspaceRename}
              onKeyDown={handleWorkspaceKeyDown}
              className="flex-1 bg-zinc-900 border border-cyan-500/50 rounded px-2 py-0.5 text-lg font-bold tracking-tighter text-cyan-400 font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500/50 mr-2"
            />
          ) : (
            <h1
              onClick={() => setIsRenamingWorkspace(true)}
              className="text-lg font-bold tracking-tighter text-white font-mono cursor-pointer hover:bg-white/5 rounded px-1 -ml-1 transition-colors truncate flex-1"
              title={!readOnly ? "Click to rename" : undefined}
            >
              {state.folderName}
            </h1>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsHelpModalOpen(true)}
              title="Guide"
              className="p-1.5 rounded-md hover:bg-white/5 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <BookOpen size={16} />
            </button>
            <button
              onClick={handleBulkExport}
              title="Export All"
              className="p-1.5 rounded-md hover:bg-white/5 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <Download size={16} />
            </button>
            {!readOnly && (
              <button
                onClick={() => setIsNewFileModalOpen(true)}
                title="New File"
                className="p-1.5 rounded-md hover:bg-white/5 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <Plus size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
          />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
          />
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        <div className="space-y-1">
          <p className="px-3 py-2 text-[10px] uppercase tracking-widest text-zinc-600 font-medium">
            Files
          </p>
          {filteredFiles.map((file, index) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <FileItem
                file={file}
                isActive={file.id === activeFileId}
                onDragStart={handleFileDragStart}
                onExport={handleExport}
                readOnly={readOnly}
              />
            </motion.div>
          ))}
          {filteredFiles.length === 0 && (
            <p className="px-3 py-6 text-xs text-zinc-600 text-center">
              No files found
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-zinc-800/50">
        <div className="flex items-center gap-2 text-[10px] text-zinc-600">
          <span className="font-mono">{state.files.length} files</span>
        </div>
      </div>

      <NewFileModal
        isOpen={isNewFileModalOpen}
        onClose={() => setIsNewFileModalOpen(false)}
      />

      <ExportModal
        isOpen={!!exportFile || isBulkExport}
        onClose={() => {
          setExportFile(null)
          setIsBulkExport(false)
        }}
        file={exportFile}
        files={isBulkExport ? state.files.filter(f => f.title !== '.unixrc') : null}
      />

      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </div>
  )
}
