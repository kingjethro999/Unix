'use client'

import { useState, useEffect } from 'react'
import {
    X,
    Users,
    MapPin,
    Clock,
    BookOpen,
    Package,
    Plus,
    Trash2,
    Save,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { wikiStore, WikiEntry, WikiMetadata } from './wiki-store'
import { motion, AnimatePresence } from 'framer-motion'

const typeOptions = [
    { value: 'character', label: 'Character', icon: Users, color: 'violet' },
    { value: 'location', label: 'Location', icon: MapPin, color: 'emerald' },
    { value: 'timeline', label: 'Timeline Event', icon: Clock, color: 'amber' },
    { value: 'lore', label: 'Lore', icon: BookOpen, color: 'blue' },
    { value: 'item', label: 'Item', icon: Package, color: 'rose' },
] as const

interface WikiEntryModalProps {
    isOpen: boolean
    onClose: () => void
    entry: WikiEntry | null
    folderId: string
    userId: string
}

export function WikiEntryModal({ isOpen, onClose, entry, folderId, userId }: WikiEntryModalProps) {
    const [type, setType] = useState<WikiEntry['type']>('character')
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [metadata, setMetadata] = useState<WikiMetadata>({})
    const [isSaving, setIsSaving] = useState(false)

    // Reset form when entry changes
    useEffect(() => {
        if (entry) {
            setType(entry.type)
            setName(entry.name)
            setDescription(entry.description)
            setMetadata(entry.metadata)
        } else {
            setType('character')
            setName('')
            setDescription('')
            setMetadata({})
        }
    }, [entry, isOpen])

    const handleSave = async () => {
        if (!name.trim()) return

        setIsSaving(true)
        try {
            if (entry) {
                await wikiStore.updateEntry(entry.id, {
                    type,
                    name,
                    description,
                    metadata,
                })
            } else {
                await wikiStore.createEntry({
                    folder_id: folderId,
                    user_id: userId,
                    type,
                    name,
                    description,
                    metadata,
                })
            }
            onClose()
        } finally {
            setIsSaving(false)
        }
    }

    const updateMetadata = (key: keyof WikiMetadata, value: any) => {
        setMetadata(prev => ({ ...prev, [key]: value }))
    }

    const addToArray = (key: keyof WikiMetadata, value: string) => {
        if (!value.trim()) return
        const arr = (metadata[key] as string[]) || []
        updateMetadata(key, [...arr, value.trim()])
    }

    const removeFromArray = (key: keyof WikiMetadata, index: number) => {
        const arr = (metadata[key] as string[]) || []
        updateMetadata(key, arr.filter((_, i) => i !== index))
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-2xl max-h-[85vh] bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                        <h2 className="text-lg font-semibold text-white">
                            {entry ? 'Edit Entry' : 'New Wiki Entry'}
                        </h2>
                        <button onClick={onClose} className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(85vh-130px)] space-y-6">
                        {/* Type Selection */}
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Type</label>
                            <div className="flex gap-2 flex-wrap">
                                {typeOptions.map(opt => {
                                    const Icon = opt.icon
                                    const isSelected = type === opt.value
                                    return (
                                        <button
                                            key={opt.value}
                                            onClick={() => setType(opt.value)}
                                            className={cn(
                                                'px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all',
                                                isSelected
                                                    ? `bg-${opt.color}-500/20 text-${opt.color}-400 border border-${opt.color}-500/30`
                                                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                                            )}
                                            style={isSelected ? {
                                                backgroundColor: `rgb(var(--${opt.color}-500) / 0.2)`,
                                                borderColor: `rgb(var(--${opt.color}-500) / 0.3)`,
                                            } : undefined}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {opt.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Name */}
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Name *</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter name..."
                                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Add a description..."
                                rows={4}
                                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 resize-none"
                            />
                        </div>

                        {/* Type-Specific Fields */}
                        {type === 'character' && (
                            <CharacterFields metadata={metadata} updateMetadata={updateMetadata} addToArray={addToArray} removeFromArray={removeFromArray} />
                        )}
                        {type === 'location' && (
                            <LocationFields metadata={metadata} updateMetadata={updateMetadata} />
                        )}
                        {type === 'timeline' && (
                            <TimelineFields metadata={metadata} updateMetadata={updateMetadata} />
                        )}
                        {type === 'item' && (
                            <ItemFields metadata={metadata} updateMetadata={updateMetadata} addToArray={addToArray} removeFromArray={removeFromArray} />
                        )}
                        {type === 'lore' && (
                            <LoreFields metadata={metadata} updateMetadata={updateMetadata} />
                        )}

                        {/* Tags */}
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Tags</label>
                            <TagInput
                                tags={metadata.tags || []}
                                onAdd={(tag) => addToArray('tags', tag)}
                                onRemove={(idx) => removeFromArray('tags', idx)}
                            />
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Private Notes</label>
                            <textarea
                                value={metadata.notes || ''}
                                onChange={(e) => updateMetadata('notes', e.target.value)}
                                placeholder="Additional notes (not shared with AI)..."
                                rows={2}
                                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 resize-none"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!name.trim() || isSaving}
                            className="px-4 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {isSaving ? 'Saving...' : entry ? 'Update' : 'Create'}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}

// Character-specific fields
function CharacterFields({ metadata, updateMetadata, addToArray, removeFromArray }: FieldProps) {
    return (
        <div className="space-y-4 p-4 bg-violet-500/5 border border-violet-500/10 rounded-lg">
            <h3 className="text-sm font-medium text-violet-400">Character Details</h3>

            <div>
                <label className="block text-xs text-zinc-500 mb-1">Aliases</label>
                <TagInput
                    tags={metadata.aliases || []}
                    onAdd={(alias) => addToArray('aliases', alias)}
                    onRemove={(idx) => removeFromArray('aliases', idx)}
                    placeholder="Add alias..."
                />
            </div>

            <div>
                <label className="block text-xs text-zinc-500 mb-1">Traits</label>
                <TagInput
                    tags={metadata.traits || []}
                    onAdd={(trait) => addToArray('traits', trait)}
                    onRemove={(idx) => removeFromArray('traits', idx)}
                    placeholder="Add trait..."
                />
            </div>

            <div>
                <label className="block text-xs text-zinc-500 mb-1">Appearance</label>
                <textarea
                    value={metadata.appearance || ''}
                    onChange={(e) => updateMetadata('appearance', e.target.value)}
                    placeholder="Physical description..."
                    rows={2}
                    className="w-full px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 resize-none"
                />
            </div>

            <div>
                <label className="block text-xs text-zinc-500 mb-1">Backstory</label>
                <textarea
                    value={metadata.backstory || ''}
                    onChange={(e) => updateMetadata('backstory', e.target.value)}
                    placeholder="Character background..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 resize-none"
                />
            </div>
        </div>
    )
}

// Location-specific fields
function LocationFields({ metadata, updateMetadata }: Omit<FieldProps, 'addToArray' | 'removeFromArray'>) {
    return (
        <div className="space-y-4 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
            <h3 className="text-sm font-medium text-emerald-400">Location Details</h3>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs text-zinc-500 mb-1">Climate</label>
                    <input
                        type="text"
                        value={metadata.climate || ''}
                        onChange={(e) => updateMetadata('climate', e.target.value)}
                        placeholder="e.g., Tropical"
                        className="w-full px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                </div>
                <div>
                    <label className="block text-xs text-zinc-500 mb-1">Population</label>
                    <input
                        type="text"
                        value={metadata.population || ''}
                        onChange={(e) => updateMetadata('population', e.target.value)}
                        placeholder="e.g., 10,000"
                        className="w-full px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs text-zinc-500 mb-1">Significance</label>
                <input
                    type="text"
                    value={metadata.significance || ''}
                    onChange={(e) => updateMetadata('significance', e.target.value)}
                    placeholder="Why is this place important?"
                    className="w-full px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
                />
            </div>
        </div>
    )
}

// Timeline-specific fields
function TimelineFields({ metadata, updateMetadata }: Omit<FieldProps, 'addToArray' | 'removeFromArray'>) {
    return (
        <div className="space-y-4 p-4 bg-amber-500/5 border border-amber-500/10 rounded-lg">
            <h3 className="text-sm font-medium text-amber-400">Timeline Details</h3>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs text-zinc-500 mb-1">Date/Period</label>
                    <input
                        type="text"
                        value={metadata.date || ''}
                        onChange={(e) => updateMetadata('date', e.target.value)}
                        placeholder="e.g., Year 1042"
                        className="w-full px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
                    />
                </div>
                <div>
                    <label className="block text-xs text-zinc-500 mb-1">Era</label>
                    <input
                        type="text"
                        value={metadata.era || ''}
                        onChange={(e) => updateMetadata('era', e.target.value)}
                        placeholder="e.g., Golden Age"
                        className="w-full px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs text-zinc-500 mb-1">Duration</label>
                <input
                    type="text"
                    value={metadata.duration || ''}
                    onChange={(e) => updateMetadata('duration', e.target.value)}
                    placeholder="How long did this last?"
                    className="w-full px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
                />
            </div>
        </div>
    )
}

// Item-specific fields
function ItemFields({ metadata, updateMetadata, addToArray, removeFromArray }: FieldProps) {
    return (
        <div className="space-y-4 p-4 bg-rose-500/5 border border-rose-500/10 rounded-lg">
            <h3 className="text-sm font-medium text-rose-400">Item Details</h3>

            <div>
                <label className="block text-xs text-zinc-500 mb-1">Owner</label>
                <input
                    type="text"
                    value={metadata.owner || ''}
                    onChange={(e) => updateMetadata('owner', e.target.value)}
                    placeholder="Current or last known owner"
                    className="w-full px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-rose-500"
                />
            </div>

            <div>
                <label className="block text-xs text-zinc-500 mb-1">Powers/Abilities</label>
                <TagInput
                    tags={metadata.powers || []}
                    onAdd={(power) => addToArray('powers', power)}
                    onRemove={(idx) => removeFromArray('powers', idx)}
                    placeholder="Add power..."
                />
            </div>

            <div>
                <label className="block text-xs text-zinc-500 mb-1">History</label>
                <textarea
                    value={metadata.history || ''}
                    onChange={(e) => updateMetadata('history', e.target.value)}
                    placeholder="Item's history and origins..."
                    rows={2}
                    className="w-full px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-rose-500 resize-none"
                />
            </div>
        </div>
    )
}

// Lore-specific fields
function LoreFields({ metadata, updateMetadata }: Omit<FieldProps, 'addToArray' | 'removeFromArray'>) {
    return (
        <div className="space-y-4 p-4 bg-blue-500/5 border border-blue-500/10 rounded-lg">
            <h3 className="text-sm font-medium text-blue-400">Lore Details</h3>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs text-zinc-500 mb-1">Category</label>
                    <input
                        type="text"
                        value={metadata.category || ''}
                        onChange={(e) => updateMetadata('category', e.target.value)}
                        placeholder="e.g., Magic System"
                        className="w-full px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-xs text-zinc-500 mb-1">Source</label>
                    <input
                        type="text"
                        value={metadata.source || ''}
                        onChange={(e) => updateMetadata('source', e.target.value)}
                        placeholder="Where is this from?"
                        className="w-full px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500"
                    />
                </div>
            </div>
        </div>
    )
}

// Tag input component
interface TagInputProps {
    tags: string[]
    onAdd: (tag: string) => void
    onRemove: (index: number) => void
    placeholder?: string
}

function TagInput({ tags, onAdd, onRemove, placeholder = 'Add...' }: TagInputProps) {
    const [input, setInput] = useState('')

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && input.trim()) {
            e.preventDefault()
            onAdd(input)
            setInput('')
        }
    }

    return (
        <div className="flex flex-wrap gap-2 p-2 bg-zinc-800 border border-zinc-700 rounded-lg min-h-[42px]">
            {tags.map((tag, idx) => (
                <span key={idx} className="flex items-center gap-1 px-2 py-1 bg-zinc-700 rounded text-xs text-zinc-300">
                    {tag}
                    <button onClick={() => onRemove(idx)} className="text-zinc-500 hover:text-red-400">
                        <X className="w-3 h-3" />
                    </button>
                </span>
            ))}
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={tags.length === 0 ? placeholder : ''}
                className="flex-1 min-w-[100px] bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none"
            />
        </div>
    )
}

interface FieldProps {
    metadata: WikiMetadata
    updateMetadata: (key: keyof WikiMetadata, value: any) => void
    addToArray: (key: keyof WikiMetadata, value: string) => void
    removeFromArray: (key: keyof WikiMetadata, index: number) => void
}
