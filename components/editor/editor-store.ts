'use client'

import { useSyncExternalStore } from 'react'
import { createPage, deletePage, renamePage, updatePageContent, getPageContent, renameFolder } from '@/app/workspace/actions'
import { toast } from 'sonner'

// Types
export interface EditorFile {
  id: string
  title: string
  content: string
  isModified: boolean
  // NEW: Review state
  isReviewing?: boolean
  originalContent?: string | null // Snapshot before AI edit
}

export interface EditorTab {
  id: string
  fileId: string
  title: string
  isActive: boolean
  isPinned: boolean
}

export interface LayoutState {
  leftSidebarWidth: number
  rightSidebarWidth: number
  leftSidebarVisible: boolean
  rightSidebarVisible: boolean
}

// NEW: Selection type
export interface EditorSelection {
  fileId: string
  text: string
  start: number
  end: number
}

export interface EditorState {
  files: EditorFile[]
  tabs: EditorTab[]
  activeTabId: string | null
  layout: LayoutState
  activeSelection: EditorSelection | null
  // NEW: Workspace context
  workspaceId: string | null
  userId: string | null
  folderName: string
}

// Default layout state
const defaultLayout: LayoutState = {
  leftSidebarWidth: 260,
  rightSidebarWidth: 320,
  leftSidebarVisible: true,
  rightSidebarVisible: true,
}

// NEW: History entry for undo/redo
interface HistoryEntry {
  content: string
  timestamp: number
}

// History stacks per file
const historyStacks = new Map<string, {
  undoStack: HistoryEntry[]
  redoStack: HistoryEntry[]
}>()

const HISTORY_LIMIT = 100

// Store implementation
let state: EditorState = {
  files: [],
  tabs: [],
  activeTabId: null,
  layout: defaultLayout,
  activeSelection: null,
  workspaceId: null,
  userId: null,
  folderName: 'UNIX',
}

const listeners: Set<() => void> = new Set()

function emitChange() {
  listeners.forEach((listener) => listener())
}

// localStorage keys
const STORAGE_KEY_PREFIX = 'unix-editor-'
const SYNC_QUEUE_KEY = 'unix-sync-queue'

// Sync queue for offline changes
interface SyncQueueItem {
  fileId: string
  content: string
  timestamp: number
}

// Get sync queue from localStorage
function getSyncQueue(): SyncQueueItem[] {
  if (typeof window === 'undefined') return []
  try {
    const queue = localStorage.getItem(SYNC_QUEUE_KEY)
    return queue ? JSON.parse(queue) : []
  } catch {
    return []
  }
}

// Add to sync queue
function addToSyncQueue(fileId: string, content: string) {
  if (typeof window === 'undefined') return
  try {
    const queue = getSyncQueue()
    // Remove any existing entry for this file
    const filtered = queue.filter(item => item.fileId !== fileId)
    // Add new entry
    filtered.push({ fileId, content, timestamp: Date.now() })
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('Failed to add to sync queue:', error)
  }
}

// Remove from sync queue
function removeFromSyncQueue(fileId: string) {
  if (typeof window === 'undefined') return
  try {
    const queue = getSyncQueue()
    const filtered = queue.filter(item => item.fileId !== fileId)
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('Failed to remove from sync queue:', error)
  }
}

// Save to localStorage immediately
function saveToLocalStorage(fileId: string, content: string) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${fileId}`, content)
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
  }
}

// Load from localStorage
function loadFromLocalStorage(fileId: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(`${STORAGE_KEY_PREFIX}${fileId}`)
  } catch {
    return null
  }
}

// Debounced save to database with offline support
let saveTimeouts: Map<string, NodeJS.Timeout> = new Map()

async function debouncedSave(fileId: string, content: string) {
  // 1. IMMEDIATE: Save to localStorage for instant offline access
  saveToLocalStorage(fileId, content)

  // 2. Clear existing timeout for this file
  const existingTimeout = saveTimeouts.get(fileId)
  if (existingTimeout) {
    clearTimeout(existingTimeout)
  }

  // 3. Set new timeout for DB sync
  const timeout = setTimeout(async () => {
    // Check if online
    if (typeof window !== 'undefined' && !navigator.onLine) {
      // Offline: add to sync queue
      addToSyncQueue(fileId, content)
      toast.info('Working offline', {
        description: 'Your changes are saved locally and will sync when you reconnect to the internet.',
        duration: 3000,
      })
      return
    }

    try {
      // Online: sync to database
      const bodyText = content.replace(/[#*_`~\[\]()]/g, '').trim()
      await updatePageContent(fileId, { content }, bodyText)

      // Remove from sync queue if it was there
      removeFromSyncQueue(fileId)

      // Mark as not modified after successful save
      state = {
        ...state,
        files: state.files.map((f) =>
          f.id === fileId ? { ...f, isModified: false } : f
        ),
      }
      emitChange()
    } catch (error) {
      // Add to sync queue for retry
      addToSyncQueue(fileId, content)

      // Show user-friendly message
      toast.warning('Unable to sync to cloud', {
        description: 'Your changes are saved locally. Please check your internet connection.',
        duration: 4000,
      })
    } finally {
      saveTimeouts.delete(fileId)
    }
  }, 1000) // 1 second debounce

  saveTimeouts.set(fileId, timeout)
}

// Process sync queue (call when coming back online)
async function processSyncQueue() {
  if (typeof window === 'undefined') return

  const queue = getSyncQueue()
  if (queue.length === 0) return

  toast.info('Syncing changes', {
    description: `Syncing ${queue.length} ${queue.length === 1 ? 'change' : 'changes'} to the cloud...`,
    duration: 2000,
  })

  let successCount = 0
  let failCount = 0

  for (const item of queue) {
    try {
      const bodyText = item.content.replace(/[#*_`~\[\]()]/g, '').trim()
      await updatePageContent(item.fileId, { content: item.content }, bodyText)
      removeFromSyncQueue(item.fileId)
      successCount++
    } catch (error) {
      // Leave in queue for next retry
      failCount++
    }
  }

  // Show results
  if (successCount > 0) {
    toast.success('Changes synced', {
      description: `Successfully synced ${successCount} ${successCount === 1 ? 'change' : 'changes'} to the cloud.`,
      duration: 3000,
    })
  }

  if (failCount > 0) {
    toast.warning('Some changes not synced', {
      description: `${failCount} ${failCount === 1 ? 'change' : 'changes'} could not be synced. Please check your internet connection.`,
      duration: 4000,
    })
  }
}

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    toast.success('Back online', {
      description: 'Syncing your changes to the cloud...',
      duration: 2000,
    })
    void processSyncQueue()
  })

  window.addEventListener('offline', () => {
    toast.info('You are offline', {
      description: 'Changes will be saved locally and synced when you reconnect.',
      duration: 3000,
    })
  })
}


// History grouping
const lastChangeTimes = new Map<string, number>()
const HISTORY_THRESHOLD = 1000 // 1 second grouping

export const editorStore = {
  getState: () => state,

  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },

  // Initialize from database
  initFromDatabase: async (
    folder: { id: string; name: string },
    pages: Array<{ id: string; title: string; folder_id: string }>,
    userId: string
  ) => {
    // Convert pages to files
    const files: EditorFile[] = pages.map((page) => ({
      id: page.id,
      title: page.title,
      content: '', // Will be loaded on demand
      isModified: false,
    }))

    // Create .unixrc file if it doesn't exist in DB
    const hasUnixrc = files.some((f) => f.title === '.unixrc')
    if (!hasUnixrc) {
      try {
        const defaultUnixrcContent = '# Unix Style Guide\n\nTarget Audience: Young Adult\nPOV: First Person (Present Tense)\n\nRules:\n- No adverbs unless absolutely necessary.\n- Show, don\'t tell.\n- Keep dialogue snappy.\n- No flowery prose.'

        // Create .unixrc page in database
        const newPage = await createPage(folder.id, '.unixrc')

        // Update its content
        await updatePageContent(newPage.id, { content: defaultUnixrcContent }, defaultUnixrcContent)

        // Add to files
        files.push({
          id: newPage.id,
          title: '.unixrc',
          content: defaultUnixrcContent,
          isModified: false,
        })
      } catch (error) {
        console.error('Failed to create .unixrc page:', error)
        // If DB creation fails, add locally anyway
        files.push({
          id: 'unixrc-temp-' + Date.now(),
          title: '.unixrc',
          content: '# Unix Style Guide\n\nTarget Audience: Young Adult\nPOV: First Person (Present Tense)\n\nRules:\n- No adverbs unless absolutely necessary.\n- Show, don\'t tell.\n- Keep dialogue snappy.\n- No flowery prose.',
          isModified: false,
        })
      }
    }

    // Open first file if exists
    let tabs: EditorTab[] = []
    let activeTabId: string | null = null

    if (files.length > 0 && files[0]) {
      const firstFile = files[0]
      tabs = [
        {
          id: 'tab-initial',
          fileId: firstFile.id,
          title: firstFile.title,
          isActive: true,
          isPinned: false,
        },
      ]
      activeTabId = 'tab-initial'
    }

    state = {
      files,
      tabs,
      activeTabId,
      layout: defaultLayout,
      activeSelection: null,
      workspaceId: folder.id,
      userId,
      folderName: folder.name,
    }

    emitChange()
  },

  // Load content for a file on-demand
  loadFileContent: async (fileId: string) => {
    try {
      // 1. FIRST: Check localStorage for instant access (offline or cached)
      const cachedContent = loadFromLocalStorage(fileId)
      if (cachedContent !== null) {
        console.log(`Loaded from localStorage: ${fileId}`)
        state = {
          ...state,
          files: state.files.map((f) =>
            f.id === fileId ? { ...f, content: cachedContent } : f
          ),
        }
        emitChange()

        // Still fetch from DB in background to check for updates (if online)
        if (typeof window !== 'undefined' && navigator.onLine) {
          void getPageContent(fileId).then((pageData) => {
            if (pageData) {
              const contentData = Array.isArray(pageData.content) ? pageData.content[0] : pageData.content
              const dbContent = contentData?.body_json?.content || ''

              // Only update if DB content is different from cached
              if (dbContent !== cachedContent) {
                console.log(`DB content differs, updating: ${fileId}`)
                state = {
                  ...state,
                  files: state.files.map((f) =>
                    f.id === fileId ? { ...f, content: dbContent } : f
                  ),
                }
                // Update localStorage with latest from DB
                saveToLocalStorage(fileId, dbContent)
                emitChange()
              }
            }
          }).catch(() => {
            // Silent fail - we already loaded from cache
          })
        }
        return
      }

      // 2. FALLBACK: Load from database if not in localStorage
      const pageData = await getPageContent(fileId)
      if (pageData) {
        // Content comes as an array from Supabase join, get first element
        const contentData = Array.isArray(pageData.content) ? pageData.content[0] : pageData.content
        const content = contentData?.body_json?.content || ''

        // Save to localStorage for future offline access
        saveToLocalStorage(fileId, content)

        state = {
          ...state,
          files: state.files.map((f) =>
            f.id === fileId ? { ...f, content } : f
          ),
        }
        emitChange()
      }
    } catch (error) {
      // Last resort: try localStorage again
      const cachedContent = loadFromLocalStorage(fileId)
      if (cachedContent !== null) {
        state = {
          ...state,
          files: state.files.map((f) =>
            f.id === fileId ? { ...f, content: cachedContent } : f
          ),
        }
        emitChange()
      } else {
        // File not in cache and DB failed
        toast.error('Unable to load file', {
          description: 'Please check your internet connection and try again.',
          duration: 4000,
        })
      }
    }
  },

  setSelection: (selection: EditorSelection | null) => {
    state = { ...state, activeSelection: selection }
    listeners.forEach((listener) => listener())
  },

  // Tab actions
  openFile: (fileId: string) => {
    const file = state.files.find((f) => f.id === fileId)
    if (!file) return

    const existingTab = state.tabs.find((t) => t.fileId === fileId)
    if (existingTab) {
      state = {
        ...state,
        tabs: state.tabs.map((t) => ({
          ...t,
          isActive: t.id === existingTab.id,
        })),
        activeTabId: existingTab.id,
        activeSelection: null,
      }
    } else {
      const newTab: EditorTab = {
        id: `tab-${Date.now()}`,
        fileId,
        title: file.title,
        isActive: true,
        isPinned: false,
      }
      state = {
        ...state,
        tabs: [...state.tabs.map((t) => ({ ...t, isActive: false })), newTab],
        activeTabId: newTab.id,
        activeSelection: null,
      }
    }

    // Load content if not already loaded
    if (!file.content) {
      editorStore.loadFileContent(fileId)
    }

    emitChange()
  },

  closeTab: (tabId: string) => {
    const tabIndex = state.tabs.findIndex((t) => t.id === tabId)
    if (tabIndex === -1) return

    const newTabs = state.tabs.filter((t) => t.id !== tabId)
    let newActiveTabId = state.activeTabId

    if (state.activeTabId === tabId && newTabs.length > 0) {
      const newActiveIndex = Math.min(tabIndex, newTabs.length - 1)
      newActiveTabId = newTabs[newActiveIndex].id
      newTabs[newActiveIndex] = { ...newTabs[newActiveIndex], isActive: true }
    } else if (newTabs.length === 0) {
      newActiveTabId = null
    }

    state = { ...state, tabs: newTabs, activeTabId: newActiveTabId }
    emitChange()
  },

  setActiveTab: (tabId: string) => {
    state = {
      ...state,
      tabs: state.tabs.map((t) => ({ ...t, isActive: t.id === tabId })),
      activeTabId: tabId,
      activeSelection: null,
    }
    emitChange()
  },

  reorderTabs: (fromIndex: number, toIndex: number) => {
    const newTabs = [...state.tabs]
    const [removed] = newTabs.splice(fromIndex, 1)
    newTabs.splice(toIndex, 0, removed)
    state = { ...state, tabs: newTabs }
    emitChange()
  },

  // File actions
  updateFileContent: (fileId: string, content: string, addToHistory = true) => {
    const file = state.files.find((f) => f.id === fileId)
    if (!file) return

    // Add to history before changing
    if (addToHistory && file.content !== content) {
      const lastTime = lastChangeTimes.get(fileId) || 0
      const now = Date.now()

      // Only push to history if enough time has passed since last change
      // This groups continuous typing into single undo steps
      if (now - lastTime > HISTORY_THRESHOLD) {
        const history = historyStacks.get(fileId) || { undoStack: [], redoStack: [] }
        history.undoStack.push({ content: file.content, timestamp: now })

        // Limit history size
        if (history.undoStack.length > HISTORY_LIMIT) {
          history.undoStack.shift()
        }
        // Clear redo stack on new change
        history.redoStack = []
        historyStacks.set(fileId, history)
      }

      lastChangeTimes.set(fileId, now)
    }

    state = {
      ...state,
      files: state.files.map((f) =>
        f.id === fileId ? { ...f, content, isModified: true } : f,
      ),
    }
    emitChange()

    // Auto-save to database (debounced)
    debouncedSave(fileId, content)
  },

  // Undo/Redo actions
  undo: (fileId: string) => {
    const history = historyStacks.get(fileId)
    if (!history || history.undoStack.length === 0) return

    const file = state.files.find((f) => f.id === fileId)
    if (!file) return

    // Pop from undo stack
    const previous = history.undoStack.pop()!

    // Push current state to redo stack
    history.redoStack.push({ content: file.content, timestamp: Date.now() })
    if (history.redoStack.length > HISTORY_LIMIT) {
      history.redoStack.shift()
    }

    // Update using internal method (skip adding to history)
    editorStore.updateFileContent(fileId, previous.content, false)
  },

  redo: (fileId: string) => {
    const history = historyStacks.get(fileId)
    if (!history || history.redoStack.length === 0) return

    const file = state.files.find((f) => f.id === fileId)
    if (!file) return

    // Pop from redo stack
    const next = history.redoStack.pop()!

    // Push current state to undo stack
    history.undoStack.push({ content: file.content, timestamp: Date.now() })
    if (history.undoStack.length > HISTORY_LIMIT) {
      history.undoStack.shift()
    }

    // Update using internal method (skip adding to history)
    editorStore.updateFileContent(fileId, next.content, false)
  },

  canUndo: (fileId: string) => {
    const history = historyStacks.get(fileId)
    return history ? history.undoStack.length > 0 : false
  },

  canRedo: (fileId: string) => {
    const history = historyStacks.get(fileId)
    return history ? history.redoStack.length > 0 : false
  },

  getHistoryInfo: (fileId: string) => {
    const history = historyStacks.get(fileId)
    return {
      canUndo: history ? history.undoStack.length > 0 : false,
      canRedo: history ? history.redoStack.length > 0 : false,
      undoCount: history ? history.undoStack.length : 0,
      redoCount: history ? history.redoStack.length : 0,
    }
  },

  // NEW: AI Propose Logic
  proposeUpdate: (fileId: string, newContent: string) => {
    state = {
      ...state,
      files: state.files.map((f) => {
        if (f.id !== fileId) return f

        // If already reviewing, update the "proposal" but keep original backup
        if (f.isReviewing) {
          return { ...f, content: newContent, isModified: true }
        }

        // New proposal: Snapshot current content
        return {
          ...f,
          content: newContent,
          isModified: true,
          isReviewing: true,
          originalContent: f.content,
        }
      }),
    }
    emitChange()
  },

  acceptChange: (fileId: string) => {
    state = {
      ...state,
      files: state.files.map((f) => {
        if (f.id !== fileId) return f
        return {
          ...f,
          isReviewing: false,
          originalContent: null, // Commit change
        }
      }),
    }
    emitChange()

    // Save accepted change to database
    const file = state.files.find((f) => f.id === fileId)
    if (file) {
      debouncedSave(file.id, file.content)
    }
  },

  rejectChange: (fileId: string) => {
    state = {
      ...state,
      files: state.files.map((f) => {
        if (f.id !== fileId) return f
        // Revert to original
        return {
          ...f,
          content: f.originalContent || f.content,
          isReviewing: false,
          originalContent: null,
          isModified: true,
        }
      }),
    }
    emitChange()
  },

  // BULK ACTIONS
  acceptAllReviews: () => {
    const reviewingFiles = state.files.filter((f) => f.isReviewing)

    state = {
      ...state,
      files: state.files.map((f) => {
        if (!f.isReviewing) return f
        return {
          ...f,
          isReviewing: false,
          originalContent: null,
        }
      }),
    }
    emitChange()

    // Save all accepted changes
    reviewingFiles.forEach((file) => {
      debouncedSave(file.id, file.content)
    })
  },

  rejectAllReviews: () => {
    state = {
      ...state,
      files: state.files.map((f) => {
        if (!f.isReviewing) return f
        return {
          ...f,
          content: f.originalContent || f.content,
          isReviewing: false,
          originalContent: null,
          isModified: true,
        }
      }),
    }
    emitChange()
  },

  getReviewingFilesCount: () => {
    return state.files.filter((f) => f.isReviewing).length
  },

  renameFile: async (fileId: string, newTitle: string) => {
    // Optimistic update
    state = {
      ...state,
      files: state.files.map((f) =>
        f.id === fileId ? { ...f, title: newTitle } : f,
      ),
      tabs: state.tabs.map((t) =>
        t.fileId === fileId ? { ...t, title: newTitle } : t,
      ),
    }
    emitChange()

    // Save to database
    try {
      await renamePage(fileId, newTitle)
    } catch (error) {
      console.error('Failed to rename file:', error)
      // Revert on error - would need to store original title
    }
  },

  createFile: async (title: string) => {
    if (!state.workspaceId) {
      console.error('No workspace ID')
      return
    }

    try {
      const newPage = await createPage(state.workspaceId, title.trim())

      const newFile: EditorFile = {
        id: newPage.id,
        title: newPage.title,
        content: '',
        isModified: false,
      }

      state = {
        ...state,
        files: [...state.files, newFile],
      }
      emitChange()

      // Auto-open the new file
      editorStore.openFile(newFile.id)
    } catch (error) {
      console.error('Failed to create file:', error)
    }
  },

  renameWorkspace: async (newName: string) => {
    if (!state.workspaceId) return

    const workspaceId = state.workspaceId
    // Optimistic update
    state = { ...state, folderName: newName }
    emitChange()

    // Save to database
    try {
      await renameFolder(workspaceId, newName)
    } catch (error) {
      console.error('Failed to rename workspace:', error)
      // We might want to revert here, but for now we'll just log it
      // as the UI will be correct until refresh anyway
    }
  },

  deleteFile: async (fileId: string) => {
    // Close any tabs with this file
    const tabsToClose = state.tabs.filter((t) => t.fileId === fileId)
    tabsToClose.forEach((tab) => editorStore.closeTab(tab.id))

    // Optimistic removal
    state = {
      ...state,
      files: state.files.filter((f) => f.id !== fileId),
    }
    emitChange()

    // Delete from database
    try {
      await deletePage(fileId)
    } catch (error) {
      console.error('Failed to delete file:', error)
    }
  },

  // Layout actions
  setLeftSidebarWidth: (width: number) => {
    state = { ...state, layout: { ...state.layout, leftSidebarWidth: width } }
    emitChange()
  },

  setRightSidebarWidth: (width: number) => {
    state = { ...state, layout: { ...state.layout, rightSidebarWidth: width } }
    emitChange()
  },

  toggleLeftSidebar: () => {
    state = {
      ...state,
      layout: {
        ...state.layout,
        leftSidebarVisible: !state.layout.leftSidebarVisible,
      },
    }
    emitChange()
  },

  toggleRightSidebar: () => {
    state = {
      ...state,
      layout: {
        ...state.layout,
        rightSidebarVisible: !state.layout.rightSidebarVisible,
      },
    }
    emitChange()
  },
}

// React hooks
export function useEditorState() {
  return useSyncExternalStore(
    editorStore.subscribe,
    editorStore.getState,
    () => state,
  )
}

export function useActiveFile() {
  const state = useEditorState()
  const activeTab = state.tabs.find((t) => t.id === state.activeTabId)
  if (!activeTab) return null
  return state.files.find((f) => f.id === activeTab.fileId) || null
}
