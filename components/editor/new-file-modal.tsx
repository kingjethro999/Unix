'use client'

import { useState, useRef, useEffect } from 'react'
import { FileText, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { editorStore } from './editor-store'

interface NewFileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function NewFileModal({ isOpen, onClose }: NewFileModalProps) {
  const [fileName, setFileName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
      setFileName('')
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = fileName.trim()
    if (trimmed) {
      editorStore.createFile(trimmed)
      onClose()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
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
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                      <FileText size={20} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        New File
                      </h2>
                      <p className="text-xs text-zinc-500">
                        Create a new document
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

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6">
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="fileName"
                        className="block text-sm font-medium text-zinc-400 mb-2"
                      >
                        File Name
                      </label>
                      <input
                        ref={inputRef}
                        id="fileName"
                        type="text"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="e.g., Chapter Two, Character Notes..."
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                      />
                      <p className="mt-2 text-xs text-zinc-600">
                        Give your file a descriptive name
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 mt-6">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!fileName.trim()}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Create File
                    </button>
                  </div>

                  {/* Keyboard hint */}
                  <div className="mt-4 pt-4 border-t border-zinc-800">
                    <div className="flex items-center justify-center gap-4 text-[10px] text-zinc-600">
                      <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 bg-zinc-950 border border-zinc-800 rounded text-[9px]">
                          Enter
                        </kbd>
                        <span>Create</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 bg-zinc-950 border border-zinc-800 rounded text-[9px]">
                          Esc
                        </kbd>
                        <span>Cancel</span>
                      </span>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
