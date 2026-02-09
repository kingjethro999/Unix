'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, X, ChevronDown, ChevronUp, Replace, CaseSensitive, Regex } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FindReplaceProps {
    content: string
    onReplace: (newContent: string) => void
    onClose: () => void
    onNavigateToMatch: (position: number) => void
}

interface Match {
    start: number
    end: number
    text: string
}

export function FindReplaceDialog({ content, onReplace, onClose, onNavigateToMatch }: FindReplaceProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [replaceTerm, setReplaceTerm] = useState('')
    const [matches, setMatches] = useState<Match[]>([])
    const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
    const [showReplace, setShowReplace] = useState(false)
    const [caseSensitive, setCaseSensitive] = useState(false)
    const [useRegex, setUseRegex] = useState(false)
    const searchInputRef = useRef<HTMLInputElement>(null)

    // Focus search input on mount
    useEffect(() => {
        searchInputRef.current?.focus()
    }, [])

    // Find all matches when search term changes
    useEffect(() => {
        if (!searchTerm) {
            setMatches([])
            setCurrentMatchIndex(0)
            return
        }

        try {
            const foundMatches: Match[] = []
            let searchPattern: RegExp

            if (useRegex) {
                searchPattern = new RegExp(searchTerm, caseSensitive ? 'g' : 'gi')
            } else {
                const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                searchPattern = new RegExp(escaped, caseSensitive ? 'g' : 'gi')
            }

            let match
            while ((match = searchPattern.exec(content)) !== null) {
                foundMatches.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    text: match[0]
                })
                // Prevent infinite loop for zero-length matches
                if (match.index === searchPattern.lastIndex) {
                    searchPattern.lastIndex++
                }
            }

            setMatches(foundMatches)
            setCurrentMatchIndex(0)

            // Navigate to first match if found
            if (foundMatches.length > 0) {
                onNavigateToMatch(foundMatches[0].start)
            }
        } catch {
            // Invalid regex, ignore
            setMatches([])
        }
    }, [searchTerm, content, caseSensitive, useRegex, onNavigateToMatch])

    const navigateToMatch = useCallback((index: number) => {
        if (matches.length === 0) return
        const newIndex = ((index % matches.length) + matches.length) % matches.length
        setCurrentMatchIndex(newIndex)
        onNavigateToMatch(matches[newIndex].start)
    }, [matches, onNavigateToMatch])

    const goToNextMatch = useCallback(() => {
        navigateToMatch(currentMatchIndex + 1)
    }, [currentMatchIndex, navigateToMatch])

    const goToPrevMatch = useCallback(() => {
        navigateToMatch(currentMatchIndex - 1)
    }, [currentMatchIndex, navigateToMatch])

    const replaceCurrentMatch = useCallback(() => {
        if (matches.length === 0) return

        const match = matches[currentMatchIndex]
        const newContent =
            content.substring(0, match.start) +
            replaceTerm +
            content.substring(match.end)

        onReplace(newContent)
    }, [matches, currentMatchIndex, content, replaceTerm, onReplace])

    const replaceAllMatches = useCallback(() => {
        if (matches.length === 0 || !searchTerm) return

        let searchPattern: RegExp

        if (useRegex) {
            searchPattern = new RegExp(searchTerm, caseSensitive ? 'g' : 'gi')
        } else {
            const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            searchPattern = new RegExp(escaped, caseSensitive ? 'g' : 'gi')
        }

        const newContent = content.replace(searchPattern, replaceTerm)
        onReplace(newContent)
    }, [matches, searchTerm, replaceTerm, content, caseSensitive, useRegex, onReplace])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault()
                onClose()
            } else if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                goToNextMatch()
            } else if (e.key === 'Enter' && e.shiftKey) {
                e.preventDefault()
                goToPrevMatch()
            } else if (e.key === 'h' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setShowReplace(prev => !prev)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onClose, goToNextMatch, goToPrevMatch])

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-2 right-4 z-50 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden"
            style={{ minWidth: '320px' }}
        >
            {/* Search row */}
            <div className="flex items-center gap-2 p-2 border-b border-zinc-800">
                <button
                    onClick={() => setShowReplace(prev => !prev)}
                    className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-500 hover:text-zinc-300"
                    title="Toggle Replace (Ctrl+H)"
                >
                    {showReplace ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                <div className="flex-1 relative">
                    <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Find..."
                        className="w-full pl-7 pr-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50"
                    />
                </div>

                {/* Match counter */}
                <span className="text-xs text-zinc-500 min-w-[60px] text-center">
                    {matches.length > 0 ? `${currentMatchIndex + 1}/${matches.length}` : 'No results'}
                </span>

                {/* Navigation buttons */}
                <div className="flex items-center gap-0.5">
                    <button
                        onClick={goToPrevMatch}
                        disabled={matches.length === 0}
                        className="p-1.5 hover:bg-zinc-800 rounded transition-colors text-zinc-500 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Previous (Shift+Enter)"
                    >
                        <ChevronUp size={14} />
                    </button>
                    <button
                        onClick={goToNextMatch}
                        disabled={matches.length === 0}
                        className="p-1.5 hover:bg-zinc-800 rounded transition-colors text-zinc-500 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Next (Enter)"
                    >
                        <ChevronDown size={14} />
                    </button>
                </div>

                {/* Options */}
                <div className="flex items-center gap-0.5 border-l border-zinc-700 pl-2">
                    <button
                        onClick={() => setCaseSensitive(prev => !prev)}
                        className={cn(
                            "p-1.5 rounded transition-colors",
                            caseSensitive ? "bg-cyan-500/20 text-cyan-400" : "hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300"
                        )}
                        title="Match Case"
                    >
                        <CaseSensitive size={14} />
                    </button>
                    <button
                        onClick={() => setUseRegex(prev => !prev)}
                        className={cn(
                            "p-1.5 rounded transition-colors",
                            useRegex ? "bg-cyan-500/20 text-cyan-400" : "hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300"
                        )}
                        title="Use Regular Expression"
                    >
                        <Regex size={14} />
                    </button>
                </div>

                <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-zinc-800 rounded transition-colors text-zinc-500 hover:text-zinc-300"
                    title="Close (Esc)"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Replace row */}
            <AnimatePresence>
                {showReplace && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="flex items-center gap-2 p-2 border-b border-zinc-800">
                            <div className="w-6" /> {/* Spacer for alignment */}

                            <div className="flex-1 relative">
                                <Replace size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" />
                                <input
                                    type="text"
                                    value={replaceTerm}
                                    onChange={(e) => setReplaceTerm(e.target.value)}
                                    placeholder="Replace..."
                                    className="w-full pl-7 pr-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50"
                                />
                            </div>

                            <button
                                onClick={replaceCurrentMatch}
                                disabled={matches.length === 0}
                                className="px-2.5 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Replace"
                            >
                                Replace
                            </button>

                            <button
                                onClick={replaceAllMatches}
                                disabled={matches.length === 0}
                                className="px-2.5 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Replace All"
                            >
                                All
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
