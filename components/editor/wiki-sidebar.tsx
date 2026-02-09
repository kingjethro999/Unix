'use client'

import { useState, useEffect } from 'react'
import {
    Users,
    MapPin,
    Clock,
    BookOpen,
    Package,
    Plus,
    Search,
    ChevronDown,
    Trash2,
    Edit3,
    X,
    GripVertical,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { wikiStore, useWikiState, useWikiEntries, WikiEntry } from './wiki-store'
import { WikiEntryModal } from './wiki-entry-modal'
import { motion, AnimatePresence } from 'framer-motion'

const typeIcons = {
    character: Users,
    location: MapPin,
    timeline: Clock,
    lore: BookOpen,
    item: Package,
}

const typeColors = {
    character: 'text-violet-400 bg-violet-500/10',
    location: 'text-emerald-400 bg-emerald-500/10',
    timeline: 'text-amber-400 bg-amber-500/10',
    lore: 'text-blue-400 bg-blue-500/10',
    item: 'text-rose-400 bg-rose-500/10',
}

const typeLabels = {
    character: 'Characters',
    location: 'Locations',
    timeline: 'Timeline',
    lore: 'Lore',
    item: 'Items',
}

interface WikiSidebarProps {
    folderId: string
    userId: string
}

export function WikiSidebar({ folderId, userId }: WikiSidebarProps) {
    const state = useWikiState()
    const entries = useWikiEntries()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingEntry, setEditingEntry] = useState<WikiEntry | null>(null)
    const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set(['character', 'location']))
    const [draggedEntry, setDraggedEntry] = useState<WikiEntry | null>(null)

    useEffect(() => {
        if (folderId) {
            wikiStore.initForFolder(folderId)
        }
        return () => wikiStore.clear()
    }, [folderId])

    const handleCreateEntry = () => {
        setEditingEntry(null)
        setIsModalOpen(true)
    }

    const handleEditEntry = (entry: WikiEntry) => {
        setEditingEntry(entry)
        setIsModalOpen(true)
    }

    const handleDeleteEntry = async (entry: WikiEntry) => {
        if (confirm(`Delete "${entry.name}"? This cannot be undone.`)) {
            await wikiStore.deleteEntry(entry.id)
        }
    }

    const toggleType = (type: string) => {
        const newExpanded = new Set(expandedTypes)
        if (newExpanded.has(type)) {
            newExpanded.delete(type)
        } else {
            newExpanded.add(type)
        }
        setExpandedTypes(newExpanded)
    }

    const handleDragStart = (e: React.DragEvent, entry: WikiEntry) => {
        setDraggedEntry(entry)
        e.dataTransfer.setData('text/plain', `[[${entry.name}]]`)
        e.dataTransfer.setData('application/wiki-entry', JSON.stringify(entry))
        e.dataTransfer.effectAllowed = 'copy'
    }

    const handleDragEnd = () => {
        setDraggedEntry(null)
    }

    // Group entries by type
    const groupedEntries = entries.reduce((acc, entry) => {
        if (!acc[entry.type]) acc[entry.type] = []
        acc[entry.type].push(entry)
        return acc
    }, {} as Record<string, WikiEntry[]>)

    return (
        <div className="h-full flex flex-col bg-zinc-950 border-r border-zinc-800">
            {/* Header */}
            <div className="p-3 border-b border-zinc-800">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-violet-400" />
                        World Wiki
                    </h2>
                    <button
                        onClick={handleCreateEntry}
                        className="p-1.5 rounded-md bg-violet-600 hover:bg-violet-500 text-white transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search wiki..."
                        value={state.searchQuery}
                        onChange={(e) => wikiStore.setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-sm bg-zinc-900 border border-zinc-800 rounded-md text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50"
                    />
                </div>

                {/* Type Filter */}
                <div className="flex gap-1 mt-2 flex-wrap">
                    <button
                        onClick={() => wikiStore.setFilterType('all')}
                        className={cn(
                            'px-2 py-1 text-xs rounded-md transition-colors',
                            state.filterType === 'all'
                                ? 'bg-zinc-700 text-white'
                                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                        )}
                    >
                        All
                    </button>
                    {Object.entries(typeLabels).map(([type, label]) => {
                        const Icon = typeIcons[type as keyof typeof typeIcons]
                        return (
                            <button
                                key={type}
                                onClick={() => wikiStore.setFilterType(type as WikiEntry['type'])}
                                className={cn(
                                    'px-2 py-1 text-xs rounded-md transition-colors flex items-center gap-1',
                                    state.filterType === type
                                        ? typeColors[type as keyof typeof typeColors]
                                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                                )}
                            >
                                <Icon className="w-3 h-3" />
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Entries List */}
            <div className="flex-1 overflow-y-auto">
                {state.isLoading ? (
                    <div className="p-4 text-center text-zinc-500 text-sm">Loading wiki...</div>
                ) : entries.length === 0 ? (
                    <div className="p-4 text-center">
                        <p className="text-zinc-500 text-sm mb-2">No entries yet</p>
                        <button
                            onClick={handleCreateEntry}
                            className="text-violet-400 text-sm hover:underline"
                        >
                            Create your first entry
                        </button>
                    </div>
                ) : state.filterType === 'all' ? (
                    // Grouped view
                    <div className="p-2 space-y-1">
                        {Object.entries(typeLabels).map(([type, label]) => {
                            const typeEntries = groupedEntries[type] || []
                            if (typeEntries.length === 0) return null

                            const Icon = typeIcons[type as keyof typeof typeIcons]
                            const isExpanded = expandedTypes.has(type)

                            return (
                                <div key={type}>
                                    <button
                                        onClick={() => toggleType(type)}
                                        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-zinc-400 hover:bg-zinc-900 rounded-md transition-colors"
                                    >
                                        <ChevronDown className={cn('w-4 h-4 transition-transform', !isExpanded && '-rotate-90')} />
                                        <Icon className={cn('w-4 h-4', typeColors[type as keyof typeof typeColors].split(' ')[0])} />
                                        <span>{label}</span>
                                        <span className="ml-auto text-xs text-zinc-600">{typeEntries.length}</span>
                                    </button>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                {typeEntries.map(entry => (
                                                    <WikiEntryItem
                                                        key={entry.id}
                                                        entry={entry}
                                                        onEdit={() => handleEditEntry(entry)}
                                                        onDelete={() => handleDeleteEntry(entry)}
                                                        onDragStart={(e) => handleDragStart(e, entry)}
                                                        onDragEnd={handleDragEnd}
                                                        isDragging={draggedEntry?.id === entry.id}
                                                    />
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    // Flat filtered view
                    <div className="p-2 space-y-1">
                        {entries.map(entry => (
                            <WikiEntryItem
                                key={entry.id}
                                entry={entry}
                                onEdit={() => handleEditEntry(entry)}
                                onDelete={() => handleDeleteEntry(entry)}
                                onDragStart={(e) => handleDragStart(e, entry)}
                                onDragEnd={handleDragEnd}
                                isDragging={draggedEntry?.id === entry.id}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            <WikiEntryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                entry={editingEntry}
                folderId={folderId}
                userId={userId}
            />
        </div>
    )
}

interface WikiEntryItemProps {
    entry: WikiEntry
    onEdit: () => void
    onDelete: () => void
    onDragStart: (e: React.DragEvent) => void
    onDragEnd: () => void
    isDragging: boolean
}

function WikiEntryItem({ entry, onEdit, onDelete, onDragStart, onDragEnd, isDragging }: WikiEntryItemProps) {
    const [showActions, setShowActions] = useState(false)
    const Icon = typeIcons[entry.type]
    const colors = typeColors[entry.type]

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
            className={cn(
                'group flex items-center gap-2 px-2 py-1.5 ml-6 rounded-md cursor-grab transition-all',
                isDragging ? 'opacity-50 bg-zinc-800' : 'hover:bg-zinc-900'
            )}
        >
            <GripVertical className="w-3 h-3 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className={cn('w-5 h-5 rounded flex items-center justify-center', colors.split(' ')[1])}>
                <Icon className={cn('w-3 h-3', colors.split(' ')[0])} />
            </div>
            <span className="text-sm text-zinc-300 truncate flex-1">{entry.name}</span>

            <AnimatePresence>
                {showActions && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex items-center gap-1"
                    >
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit() }}
                            className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-white"
                        >
                            <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete() }}
                            className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-red-400"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
