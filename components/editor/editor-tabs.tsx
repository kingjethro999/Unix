'use client'

import { useState } from 'react'
import { X, FileText, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEditorState, editorStore, type EditorTab } from './editor-store'
import { motion, AnimatePresence, Reorder } from 'motion/react'

interface TabItemProps {
  tab: EditorTab
  isActive: boolean
  onClose: (e: React.MouseEvent) => void
  onActivate: () => void
}

function TabItem({ tab, isActive, onClose, onActivate }: TabItemProps) {
  return (
    <Reorder.Item
      value={tab}
      id={tab.id}
      className={cn(
        'group relative flex items-center gap-2 px-3 py-2 cursor-pointer select-none',
        'border-r border-zinc-800/50 transition-all duration-150',
        isActive
          ? 'bg-zinc-900 text-white'
          : 'bg-zinc-950 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50',
      )}
      onClick={onActivate}
      whileDrag={{ scale: 1.02, zIndex: 50 }}
    >
      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="activeTabIndicator"
          className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}

      {/* Drag handle */}
      <GripVertical
        size={12}
        className="opacity-0 group-hover:opacity-50 transition-opacity cursor-grab active:cursor-grabbing text-zinc-600"
      />

      {/* File icon */}
      <FileText
        size={14}
        className={cn(
          'shrink-0 transition-colors',
          isActive ? 'text-cyan-400' : 'text-zinc-600',
        )}
      />

      {/* Title */}
      <span className="text-xs font-mono truncate max-w-[120px]">
        {tab.title}
      </span>

      {/* Close button */}
      <button
        onClick={onClose}
        className={cn(
          'ml-1 p-0.5 rounded transition-all',
          'opacity-0 group-hover:opacity-100',
          'hover:bg-white/10 text-zinc-500 hover:text-white',
        )}
      >
        <X size={12} />
      </button>
    </Reorder.Item>
  )
}

export function EditorTabs() {
  const state = useEditorState()
  const [tabs, setTabs] = useState(state.tabs)

  // Sync with store
  if (
    JSON.stringify(tabs.map((t) => t.id)) !==
    JSON.stringify(state.tabs.map((t) => t.id))
  ) {
    setTabs(state.tabs)
  }

  const handleClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation()
    editorStore.closeTab(tabId)
  }

  if (state.tabs.length === 0) {
    return (
      <div className="h-10 bg-zinc-950 border-b border-zinc-800/50 flex items-center px-4">
        <span className="text-xs text-zinc-600 font-mono">No files open</span>
      </div>
    )
  }

  return (
    <div className="h-10 bg-zinc-950 border-b border-zinc-800/50 flex items-center overflow-x-auto scrollbar-none">
      <Reorder.Group
        axis="x"
        values={state.tabs}
        onReorder={(newOrder) => {
          // Update local state for smooth animation
          const newTabs = newOrder as EditorTab[]
          // Find original and new positions
          const originalIds = state.tabs.map((t) => t.id)
          const newIds = newTabs.map((t) => t.id)

          // Find which tab moved
          for (let i = 0; i < newIds.length; i++) {
            if (originalIds[i] !== newIds[i]) {
              const movedId = newIds[i]
              const fromIndex = originalIds.indexOf(movedId)
              editorStore.reorderTabs(fromIndex, i)
              break
            }
          }
        }}
        className="flex h-full"
      >
        <AnimatePresence mode="popLayout">
          {state.tabs.map((tab) => (
            <TabItem
              key={tab.id}
              tab={tab}
              isActive={tab.id === state.activeTabId}
              onClose={(e) => handleClose(e, tab.id)}
              onActivate={() => editorStore.setActiveTab(tab.id)}
            />
          ))}
        </AnimatePresence>
      </Reorder.Group>

      {/* Tab overflow indicator */}
      <div className="flex-1 min-w-[40px]" />
    </div>
  )
}
