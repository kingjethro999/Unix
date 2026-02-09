'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Send,
  Sparkles,
  X,
  FileText,
  MessageSquare,
  Lightbulb,
  PenLine,
  CheckCircle2,
  ScanEye,
  Check,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { useActiveFile, useEditorState, editorStore } from './editor-store'
import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle } from 'lucide-react'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  attachments?: { id: string; title: string }[]
  timestamp: Date
  action?: {
    type: 'read' | 'write' | 'review'
    detail: string
    fileId?: string
  }
}

interface ContextAttachment {
  id: string
  title: string
}

const quickActions = [
  {
    icon: PenLine,
    label: 'Improve writing',
    prompt: 'Improve the writing style of the selected text or current chapter',
  },
  {
    icon: CheckCircle2,
    label: 'Proofread',
    prompt: 'Proofread and fix any errors',
  },
  {
    icon: Lightbulb,
    label: 'Suggest ideas',
    prompt: 'Suggest ideas to expand on this',
  },
]

export function AIChatSidebar() {
  const activeFile = useActiveFile()
  const editorState = useEditorState()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [attachments, setAttachments] = useState<ContextAttachment[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [lastModifiedFileId, setLastModifiedFileId] = useState<string | null>(null)

  // NEW: Quota state
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Fetch chat history on mount
  useEffect(() => {
    async function loadHistory() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true })

      if (data) {
        setMessages(data.map((msg: any) => {
          let attachments: any[] = []
          let action: any = undefined

          try {
            const rawAttachments = typeof msg.attachments === 'string' ? JSON.parse(msg.attachments) : msg.attachments
            if (Array.isArray(rawAttachments)) {
              // Separate action metadata from file attachments
              const actionMeta = rawAttachments.find((a: any) => a.type === 'action_metadata')
              if (actionMeta) {
                action = actionMeta.action
              }

              // Filter out metadata for display attachments
              attachments = rawAttachments.filter((a: any) => a.type !== 'action_metadata')
            } else {
              attachments = rawAttachments
            }
          } catch (e) {
            attachments = []
          }

          return {
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.created_at),
            attachments,
            action
          }
        }))
      }
    }
    loadHistory()
  }, [])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))
      if (data.type === 'file') {
        // Avoid duplicates
        if (!attachments.find((a) => a.id === data.id)) {
          setAttachments((prev) => [
            ...prev,
            { id: data.id, title: data.title },
          ])
        }
      }
    } catch (err) {
      console.error('Failed to parse drop data:', err)
    }
  }

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input
    if (!textToSend.trim() && attachments.length === 0) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(), // Fix duplicate key issue
      role: 'user',
      content: textToSend,
      attachments: attachments.length > 0 ? [...attachments] : undefined,
      timestamp: new Date(),
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setAttachments([])
    setIsTyping(true)

    // Clear selection immediately to allow user to continue
    editorStore.setSelection(null)

    try {
      // Prepare context files from explicit attachments
      let contextFiles = userMessage.attachments
        ? userMessage.attachments.map((att) => {
          const file = editorStore.getState().files.find((f) => f.id === att.id)
          return file ? { id: file.id, title: file.title, content: file.content } : null
        }).filter((f): f is { id: string; title: string; content: string } => f !== null)
        : []

      // If no attachments but we have a last modified file, include it for context
      // ALSO: If active file exists, include it as context too (default behavior)
      if (activeFile && !contextFiles.find(f => f.id === activeFile.id)) {
        contextFiles.push({ id: activeFile.id, title: activeFile.title, content: activeFile.content })
      }
      else if (contextFiles.length === 0 && lastModifiedFileId) {
        const lastFile = editorStore.getState().files.find(f => f.id === lastModifiedFileId)
        if (lastFile && !contextFiles.find(f => f.id === lastFile.id)) {
          contextFiles.push({ id: lastFile.id, title: lastFile.title, content: lastFile.content })
        }
      }

      // Build allFiles list for environment awareness
      const allFiles = editorStore.getState().files.map(f => ({
        id: f.id,
        title: f.title,
        wordCount: f.content.split(/\s+/).filter(Boolean).length
      }))

      const apiMessages = newMessages.map(m => ({
        role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
        content: m.content
      }));

      const apiResponse = await fetch('/api/ai/chat', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages,
          contextFiles,
          allFiles,
          activeSelection: editorState.activeSelection
        }),
      })

      if (!apiResponse.ok) {
        if (apiResponse.status === 429) {
          setIsQuotaExceeded(true)
          // Start fresh conversation next time or just stop input
          // We don't throw normal error here, we handle it via state
          return
        }
        throw new Error('Failed to chat with AI')
      }

      const response = await apiResponse.json()

      if (response.type === 'text') {
        if (!response.text) return
        const aiMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response.text,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, aiMessage])
      } else if (response.type === 'tool_call') {
        // Handle tool calls
        const aiText = response.text || ''

        for (const call of response.toolCalls) {
          if (call.name === 'read_file') {
            const { fileId } = call.args
            const fileToRead = editorStore.getState().files.find(f => f.id === fileId)
            if (fileToRead) {
              setMessages(prev => [...prev, {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: aiText + (aiText ? '\n\n' : '') + `I'm reading "${fileToRead.title}" to get more context...`,
                timestamp: new Date(),
                action: { type: 'read', detail: fileToRead.title }
              }])
            }
          }
          if (call.name === 'update_file') {
            const { fileId, content, actionDescription } = call.args

            // KEY CHANGE: Propose Update instead of overwrite
            editorStore.proposeUpdate(fileId, content)

            // Track last modified file for follow-up context
            setLastModifiedFileId(fileId)

            // Find file title for better UX
            const file = editorStore.getState().files.find(f => f.id === fileId)
            const fileTitle = file ? file.title : fileId

            // Use action description if provided, otherwise fall back to generic message
            const messageContent = actionDescription || `I've updated "${fileTitle}". Please review the changes.`

            const aiMessage: ChatMessage = {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: aiText + (aiText ? '\n\n' : '') + messageContent,
              timestamp: new Date(),
              action: { type: 'review', detail: fileTitle, fileId: fileId }
            }
            setMessages((prev) => [...prev, aiMessage])
          } else if (call.name === 'create_file') {
            const { title, content, actionDescription } = call.args
            editorStore.createFile(title)

            // Find the newly created file and update its content
            const newFile = editorStore.getState().files.find(f => f.title === title)
            if (newFile) {
              editorStore.updateFileContent(newFile.id, content)
              setLastModifiedFileId(newFile.id)
            }

            const messageContent = actionDescription || `Created "${title}".`

            const aiMessage: ChatMessage = {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: aiText + (aiText ? '\n\n' : '') + messageContent,
              timestamp: new Date(),
              action: { type: 'write', detail: title }
            }
            setMessages((prev) => [...prev, aiMessage])
          } else if (call.name === 'rename_file') {
            const { fileId, newTitle } = call.args
            editorStore.renameFile(fileId, newTitle)

            setMessages(prev => [...prev, {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: aiText + (aiText ? '\n\n' : '') + `Renamed file to "${newTitle}".`,
              timestamp: new Date(),
              action: { type: 'write', detail: newTitle }
            }])
          } else if (call.name === 'delete_file') {
            const { fileId } = call.args
            const file = editorStore.getState().files.find(f => f.id === fileId)
            const title = file ? file.title : 'File'

            editorStore.deleteFile(fileId)

            setMessages(prev => [...prev, {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: aiText + (aiText ? '\n\n' : '') + `Deleted "${title}".`,
              timestamp: new Date(),
              action: { type: 'write', detail: title }
            }])
          } else if (call.name === 'replace_text') {
            const { fileId, targetText, replacementText } = call.args
            editorStore.replaceText(fileId, targetText, replacementText)

            setMessages(prev => [...prev, {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: aiText + (aiText ? '\n\n' : '') + `Replaced text in file.`,
              timestamp: new Date(),
              action: { type: 'write', detail: 'Text Replacement' }
            }])
          } else if (call.name === 'search_and_replace') {
            const { query, replacement, scope } = call.args
            editorStore.searchAndReplace(query, replacement, scope || 'file')

            setMessages(prev => [...prev, {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: aiText + (aiText ? '\n\n' : '') + `Replaced all occurrences of "${query}" with "${replacement}".`,
              timestamp: new Date(),
              action: { type: 'write', detail: 'Global Replace' }
            }])
          }
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "Sorry, I encountered an error processing your request.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleQuickAction = (prompt: string) => {
    handleSend(prompt)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  return (
    <div className="h-full flex flex-col bg-zinc-950 border-l border-zinc-800/50">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Unix AI</h2>
            <p className="text-[10px] text-zinc-500">Context-aware assistant</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-3 py-2 border-b border-zinc-800/30">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => handleQuickAction(action.prompt)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors whitespace-nowrap"
            >
              <action.icon size={12} />
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                'flex gap-3',
                message.role === 'user' && 'flex-row-reverse',
              )}
            >
              <div
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                  message.role === 'assistant'
                    ? 'bg-gradient-to-br from-cyan-500 to-blue-600'
                    : 'bg-zinc-800',
                )}
              >
                {message.role === 'assistant' ? (
                  message.action?.type === 'read' ? <ScanEye size={14} className="text-white" /> :
                    <Sparkles size={14} className="text-white" />
                ) : (
                  <MessageSquare size={14} className="text-zinc-400" />
                )}
              </div>
              <div
                className={cn(
                  'flex-1 max-w-[85%]',
                  message.role === 'user' && 'text-right',
                )}
              >
                <div
                  className={cn(
                    'inline-block px-3 py-2 rounded-xl text-sm text-left', // Always text-left for content legibility
                    message.role === 'assistant'
                      ? 'bg-zinc-900 text-zinc-300 rounded-tl-sm'
                      : 'bg-cyan-600 text-white rounded-tr-sm',
                  )}
                >
                  <div
                    className="prose prose-invert prose-p:leading-relaxed prose-pre:p-0 prose-h1:text-base prose-h1:font-bold prose-h2:text-sm prose-h2:font-bold prose-h3:text-sm prose-p:text-sm prose-strong:text-cyan-400 prose-ul:my-2 prose-ul:ml-4 prose-li:mb-1 prose-code:text-cyan-300 prose-blockquote:border-l-2 prose-blockquote:border-zinc-700 prose-blockquote:pl-3 prose-blockquote:text-zinc-500 max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(marked.parse(message.content) as string),
                    }}
                  />

                  {/* IN-CHAT REVIEW CONTROLS */}
                  {message.action?.type === 'review' && message.action.fileId && (
                    (() => {
                      const file = editorState.files.find(f => f.id === message.action!.fileId)
                      // Only show controls if the file is STILL in reviewing mode
                      if (file && file.isReviewing) {
                        return (
                          <div className="mt-3 flex gap-2 pt-2 border-t border-zinc-800">
                            <button
                              onClick={() => editorStore.acceptChange(file.id)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded text-xs font-medium transition-colors"
                            >
                              <Check size={12} /> Accept
                            </button>
                            <button
                              onClick={() => editorStore.rejectChange(file.id)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-xs font-medium transition-colors"
                            >
                              <X size={12} /> Reject
                            </button>
                          </div>
                        )
                      } else if (file && !file.isReviewing && !file.originalContent) {
                        // Already accepted
                        return <div className="mt-2 text-[10px] text-emerald-500 flex items-center gap-1"><Check size={10} /> Changes accepted</div>
                      } else if (file && !file.isReviewing && file.isModified) {
                        // Already rejected (assuming manual check logic, slightly loose here)
                        return <div className="mt-2 text-[10px] text-zinc-500 flex items-center gap-1">Review complete</div>
                      }
                    })()
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            <div className="px-3 py-2 bg-zinc-900 rounded-xl rounded-tl-sm flex items-center gap-2">
              <div className="flex gap-1">
                <span
                  className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
              <span className="text-xs text-zinc-500 font-medium">Writing...</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Global Review Action Bar */}
      {/* Global Review Action Bar */}
      <AnimatePresence>
        {editorStore.getReviewingFilesCount() > 1 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="z-50 border-t border-zinc-800 bg-zinc-900/95 backdrop-blur shadow-[0_-8px_20px_-6px_rgba(0,0,0,0.5)]"
          >
            {/* File List Header */}
            <div className="max-h-[300px] overflow-y-auto px-4 py-2 space-y-1">
              {editorState.files.filter(f => f.isReviewing).map(file => {
                // Precise diff calculation
                const originalLines = (file.originalContent || '').split('\n')
                const newLines = file.content.split('\n')

                // Very naive diff: 
                // insertions = lines in new not in old 
                // deletions = lines in old not in new
                // Real diffs are harder, but this is a decent heuristic for "stats"
                // Better heuristic for writing:
                // If length diff is positive, it's mostly additions. 
                // If we want "Green +X, Red -Y", we can do:
                // Added = Math.max(0, newLines.length - originalLines.length) + changedLines?

                // Let's do a simple count difference for now, but split into + and -
                // actually the user wants +X -Y.
                // A simple approximation:
                let additions = 0
                let deletions = 0

                const lineDiff = newLines.length - originalLines.length
                if (lineDiff > 0) {
                  additions = lineDiff
                  // assume some edits too
                  const changes = newLines.filter((l, i) => l !== originalLines[i]).length - lineDiff
                  if (changes > 0) {
                    additions += changes
                    deletions += changes
                  }
                } else if (lineDiff < 0) {
                  deletions = Math.abs(lineDiff)
                  const changes = originalLines.filter((l, i) => l !== newLines[i]).length - deletions
                  if (changes > 0) {
                    additions += changes
                    deletions += changes
                  }
                } else {
                  // Length same, check changed lines
                  const changes = newLines.filter((l, i) => l !== originalLines[i]).length
                  additions = changes
                  deletions = changes
                }

                return (
                  <div key={file.id} className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-xs text-zinc-300">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />

                      {/* Diff Stats */}
                      <div className="flex items-center gap-1 font-mono text-[10px]">
                        <span className="text-emerald-400">+{additions}</span>
                        <span className="text-red-400">-{deletions}</span>
                      </div>

                      <span className="truncate max-w-[150px] ml-1">{file.title}</span>
                      <span className="text-zinc-600 truncate">...{file.id.slice(-5)}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Bottom Action Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-950 border-t border-zinc-800">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-zinc-400">
                  <FileText size={16} />
                  <span className="text-sm">{editorStore.getReviewingFilesCount()} Files With Changes</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => editorStore.rejectAllReviews()}
                  className="px-3 py-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md text-sm font-medium transition-all"
                >
                  Reject all
                </button>
                <div className="relative flex items-center">
                  <button
                    onClick={() => editorStore.acceptAllReviews()}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-medium transition-all"
                  >
                    Accept all
                  </button>
                  <button className="ml-0.5 p-1.5 hover:bg-zinc-800 rounded-md text-zinc-400 transition-colors">
                    <ChevronDown size={14} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div
        className={cn(
          'p-3 border-t border-zinc-800/50 transition-colors',
          isDragOver && 'bg-cyan-500/5 border-cyan-500/30',
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <AnimatePresence>
          {editorState.activeSelection && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-2 flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg"
            >
              <ScanEye size={12} className="text-cyan-400" />
              <span className="text-xs text-cyan-300 truncate max-w-[200px]">
                Selected: "{editorState.activeSelection.text.slice(0, 30)}..."
              </span>
              <button onClick={() => editorStore.setSelection(null)} className="ml-auto text-cyan-500 hover:text-cyan-300">
                <X size={12} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Attachments */}
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex flex-wrap gap-1.5 mb-2"
            >
              {attachments.map((att) => (
                <motion.span
                  key={att.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded-full text-xs"
                >
                  <FileText size={12} />@{att.title}
                  <button
                    onClick={() => removeAttachment(att.id)}
                    className="ml-0.5 hover:text-white transition-colors"
                  >
                    <X size={12} />
                  </button>
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              editorState.activeSelection ? 'Ask about selection...' : isDragOver ? 'Drop to add context...' : 'Ask Unix AI...'
            }
            rows={1}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 resize-none transition-all"
            style={{ minHeight: '42px', maxHeight: '120px' }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() && attachments.length === 0}
            className={cn(
              'p-2.5 rounded-xl transition-all',
              (input.trim() || attachments.length > 0)
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:opacity-90'
                : 'bg-zinc-900 text-zinc-600 cursor-not-allowed',
            )}
          >
            <Send size={16} />
          </button>
        </div>

        <p className="text-[10px] text-zinc-600 mt-2 text-center">
          Drag files here to add context • Press Enter to send
        </p>
      </div>

      {/* QUOTA OVERLAY */}
      {isQuotaExceeded && (
        <div className="absolute inset-0 z-50 bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center p-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl max-w-xs"
          >
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={24} className="text-red-500" />
            </div>
            <h3 className="text-white font-semibold mb-2">Daily Quota Reached</h3>
            <p className="text-sm text-zinc-400 mb-6">
              You&apos;ve hit the daily limit for AI usage. Please come back tomorrow to continue chatting.
            </p>
          </motion.div>
        </div>
      )}
    </div>
  )
}
