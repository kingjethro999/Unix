'use client'

import { useSyncExternalStore } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

// Types
export interface WikiEntry {
    id: string
    folder_id: string
    user_id: string
    type: 'character' | 'location' | 'timeline' | 'lore' | 'item'
    name: string
    description: string
    metadata: WikiMetadata
    created_at: string
    updated_at: string
}

export interface WikiMetadata {
    // Character-specific
    aliases?: string[]
    relationships?: { name: string; relation: string }[]
    traits?: string[]
    appearance?: string
    backstory?: string

    // Location-specific
    coordinates?: string
    climate?: string
    population?: string
    significance?: string

    // Timeline-specific
    date?: string
    era?: string
    duration?: string

    // Lore-specific
    category?: string
    source?: string

    // Item-specific
    owner?: string
    powers?: string[]
    history?: string

    // Universal
    tags?: string[]
    notes?: string
    imageUrl?: string
}

export interface WikiState {
    entries: WikiEntry[]
    isLoading: boolean
    activeEntryId: string | null
    searchQuery: string
    filterType: WikiEntry['type'] | 'all'
    folderId: string | null
}

// Initial state
let state: WikiState = {
    entries: [],
    isLoading: false,
    activeEntryId: null,
    searchQuery: '',
    filterType: 'all',
    folderId: null,
}

const listeners: Set<() => void> = new Set()

function emitChange() {
    listeners.forEach(listener => listener())
}

// Supabase client
const getSupabase = () => createClient()

export const wikiStore = {
    getState() {
        return state
    },

    subscribe(listener: () => void) {
        listeners.add(listener)
        return () => listeners.delete(listener)
    },

    // Initialize wiki for a folder
    async initForFolder(folderId: string) {
        state = { ...state, isLoading: true, folderId }
        emitChange()

        try {
            const supabase = getSupabase()
            const { data, error } = await supabase
                .from('wiki_entries')
                .select('*')
                .eq('folder_id', folderId)
                .order('name', { ascending: true })

            if (error) throw error

            state = {
                ...state,
                entries: data || [],
                isLoading: false
            }
            emitChange()
        } catch (error) {
            console.error('Error loading wiki entries:', error)
            state = { ...state, isLoading: false }
            emitChange()
            toast.error('Failed to load wiki entries')
        }
    },

    // Create new entry
    async createEntry(entry: Omit<WikiEntry, 'id' | 'created_at' | 'updated_at'>) {
        try {
            const supabase = getSupabase()
            const { data, error } = await supabase
                .from('wiki_entries')
                .insert({
                    folder_id: entry.folder_id,
                    user_id: entry.user_id,
                    type: entry.type,
                    name: entry.name,
                    description: entry.description,
                    metadata: entry.metadata,
                })
                .select()
                .single()

            if (error) throw error

            state = {
                ...state,
                entries: [...state.entries, data].sort((a, b) => a.name.localeCompare(b.name)),
            }
            emitChange()
            toast.success(`Created "${entry.name}"`)
            return data
        } catch (error) {
            console.error('Error creating wiki entry:', error)
            toast.error('Failed to create entry')
            return null
        }
    },

    // Update entry
    async updateEntry(id: string, updates: Partial<Omit<WikiEntry, 'id' | 'created_at' | 'updated_at'>>) {
        try {
            const supabase = getSupabase()
            const { data, error } = await supabase
                .from('wiki_entries')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single()

            if (error) throw error

            state = {
                ...state,
                entries: state.entries.map(e => e.id === id ? data : e),
            }
            emitChange()
            toast.success('Entry updated')
            return data
        } catch (error) {
            console.error('Error updating wiki entry:', error)
            toast.error('Failed to update entry')
            return null
        }
    },

    // Delete entry
    async deleteEntry(id: string) {
        const entry = state.entries.find(e => e.id === id)

        try {
            const supabase = getSupabase()
            const { error } = await supabase
                .from('wiki_entries')
                .delete()
                .eq('id', id)

            if (error) throw error

            state = {
                ...state,
                entries: state.entries.filter(e => e.id !== id),
                activeEntryId: state.activeEntryId === id ? null : state.activeEntryId,
            }
            emitChange()
            toast.success(`Deleted "${entry?.name}"`)
            return true
        } catch (error) {
            console.error('Error deleting wiki entry:', error)
            toast.error('Failed to delete entry')
            return false
        }
    },

    // Set active entry
    setActiveEntry(id: string | null) {
        state = { ...state, activeEntryId: id }
        emitChange()
    },

    // Set search query
    setSearchQuery(query: string) {
        state = { ...state, searchQuery: query }
        emitChange()
    },

    // Set filter type
    setFilterType(type: WikiEntry['type'] | 'all') {
        state = { ...state, filterType: type }
        emitChange()
    },

    // Get filtered entries
    getFilteredEntries(): WikiEntry[] {
        let entries = state.entries

        // Filter by type
        if (state.filterType !== 'all') {
            entries = entries.filter(e => e.type === state.filterType)
        }

        // Filter by search
        if (state.searchQuery) {
            const query = state.searchQuery.toLowerCase()
            entries = entries.filter(e =>
                e.name.toLowerCase().includes(query) ||
                e.description?.toLowerCase().includes(query) ||
                e.metadata.tags?.some(t => t.toLowerCase().includes(query))
            )
        }

        return entries
    },

    // Get entry by ID
    getEntry(id: string): WikiEntry | undefined {
        return state.entries.find(e => e.id === id)
    },

    // Get entries by type
    getEntriesByType(type: WikiEntry['type']): WikiEntry[] {
        return state.entries.filter(e => e.type === type)
    },

    // Get all characters (for AI context)
    getCharacters(): WikiEntry[] {
        return state.entries.filter(e => e.type === 'character')
    },

    // Get all locations (for AI context)
    getLocations(): WikiEntry[] {
        return state.entries.filter(e => e.type === 'location')
    },

    // Get formatted context for AI
    getAIContext(): string {
        if (state.entries.length === 0) return ''

        const characters = this.getCharacters()
        const locations = this.getLocations()
        const lore = state.entries.filter(e => e.type === 'lore')
        const items = state.entries.filter(e => e.type === 'item')
        const timelines = state.entries.filter(e => e.type === 'timeline')

        let context = '\n\n*** WORLD-BUILDING WIKI ***\n'

        if (characters.length > 0) {
            context += '\nCHARACTERS:\n'
            characters.forEach(c => {
                context += `- ${c.name}`
                if (c.metadata.aliases?.length) context += ` (aka ${c.metadata.aliases.join(', ')})`
                if (c.description) context += `: ${c.description}`
                if (c.metadata.traits?.length) context += ` [Traits: ${c.metadata.traits.join(', ')}]`
                context += '\n'
            })
        }

        if (locations.length > 0) {
            context += '\nLOCATIONS:\n'
            locations.forEach(l => {
                context += `- ${l.name}`
                if (l.description) context += `: ${l.description}`
                if (l.metadata.significance) context += ` (${l.metadata.significance})`
                context += '\n'
            })
        }

        if (lore.length > 0) {
            context += '\nLORE:\n'
            lore.forEach(l => {
                context += `- ${l.name}: ${l.description || 'No description'}\n`
            })
        }

        if (items.length > 0) {
            context += '\nITEMS:\n'
            items.forEach(i => {
                context += `- ${i.name}`
                if (i.description) context += `: ${i.description}`
                if (i.metadata.powers?.length) context += ` [Powers: ${i.metadata.powers.join(', ')}]`
                context += '\n'
            })
        }

        if (timelines.length > 0) {
            context += '\nTIMELINE EVENTS:\n'
            timelines.forEach(t => {
                context += `- ${t.metadata.date || 'Unknown date'}: ${t.name}`
                if (t.description) context += ` - ${t.description}`
                context += '\n'
            })
        }

        context += '******************************\n'

        return context
    },

    // Clear state (on logout or folder change)
    clear() {
        state = {
            entries: [],
            isLoading: false,
            activeEntryId: null,
            searchQuery: '',
            filterType: 'all',
            folderId: null,
        }
        emitChange()
    },
}

// React hooks
export function useWikiState() {
    return useSyncExternalStore(
        wikiStore.subscribe,
        wikiStore.getState,
        wikiStore.getState
    )
}

export function useWikiEntries() {
    const state = useWikiState()
    return wikiStore.getFilteredEntries()
}

export function useActiveWikiEntry() {
    const state = useWikiState()
    return state.activeEntryId ? wikiStore.getEntry(state.activeEntryId) : null
}
