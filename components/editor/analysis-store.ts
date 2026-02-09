'use client'

import { useSyncExternalStore } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

// Types
export type AnalysisType = 'plot_holes' | 'character_voice' | 'pacing'
export type IssueSeverity = 'error' | 'warning' | 'info'

export interface AnalysisIssue {
    id: string
    type: AnalysisType
    severity: IssueSeverity
    fileId: string
    fileName: string
    excerpt: string
    message: string
    suggestion?: string
    lineHint?: string // e.g., "near paragraph 3"
    isIgnored: boolean
}

export interface PacingData {
    fileId: string
    fileName: string
    score: number // 1-10 scale
    label: 'slow' | 'balanced' | 'fast'
    details: {
        avgSentenceLength: number
        dialogueRatio: number
        actionVerbDensity: number
    }
}

export interface AnalysisState {
    issues: AnalysisIssue[]
    pacingData: PacingData[]
    isAnalyzing: boolean
    lastAnalyzedAt: Date | null
    activeType: AnalysisType | 'all'
    folderId: string | null
}

// Initial state
let state: AnalysisState = {
    issues: [],
    pacingData: [],
    isAnalyzing: false,
    lastAnalyzedAt: null,
    activeType: 'all',
    folderId: null,
}

const listeners: Set<() => void> = new Set()

function emitChange() {
    listeners.forEach(listener => listener())
}

const getSupabase = () => createClient()

export const analysisStore = {
    getState() {
        return state
    },

    subscribe(listener: () => void) {
        listeners.add(listener)
        return () => listeners.delete(listener)
    },

    // Initialize for a folder
    async initForFolder(folderId: string) {
        state = { ...state, folderId }
        emitChange()

        // Load previous analysis results from database
        try {
            const supabase = getSupabase()
            const { data, error } = await supabase
                .from('analysis_results')
                .select('*')
                .eq('folder_id', folderId)
                .order('created_at', { ascending: false })
                .limit(1)

            if (error) throw error

            if (data && data.length > 0) {
                const latest = data[0]
                const results = latest.results as any

                state = {
                    ...state,
                    issues: results.issues || [],
                    pacingData: results.pacingData || [],
                    lastAnalyzedAt: new Date(latest.created_at),
                }
                emitChange()
            }
        } catch (error) {
            console.error('Error loading analysis results:', error)
        }
    },

    // Run analysis via API
    async runAnalysis(
        type: AnalysisType | 'all',
        files: Array<{ id: string; title: string; content: string }>
    ) {
        if (!state.folderId) {
            toast.error('No workspace selected')
            return
        }

        state = { ...state, isAnalyzing: true }
        emitChange()

        try {
            const response = await fetch('/api/ai/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    folderId: state.folderId,
                    type,
                    files,
                }),
            })

            if (!response.ok) {
                throw new Error(`Analysis failed: ${response.statusText}`)
            }

            const result = await response.json()

            // Merge new results
            const newIssues: AnalysisIssue[] = result.issues || []
            const newPacingData: PacingData[] = result.pacingData || []

            // If analyzing specific type, only replace that type
            let updatedIssues = state.issues
            let updatedPacing = state.pacingData

            if (type === 'all') {
                updatedIssues = newIssues
                updatedPacing = newPacingData
            } else if (type === 'pacing') {
                updatedPacing = newPacingData
            } else {
                // Replace issues of specific type
                updatedIssues = [
                    ...state.issues.filter(i => i.type !== type),
                    ...newIssues.filter(i => i.type === type),
                ]
            }

            state = {
                ...state,
                issues: updatedIssues,
                pacingData: updatedPacing,
                isAnalyzing: false,
                lastAnalyzedAt: new Date(),
            }
            emitChange()

            // Save to database
            await analysisStore.saveToDatabase()

            const issueCount = newIssues.length
            toast.success(`Analysis complete`, {
                description: issueCount > 0
                    ? `Found ${issueCount} potential issue${issueCount === 1 ? '' : 's'}`
                    : 'No issues found!',
            })
        } catch (error) {
            console.error('Analysis error:', error)
            state = { ...state, isAnalyzing: false }
            emitChange()
            toast.error('Analysis failed', {
                description: error instanceof Error ? error.message : 'Unknown error',
            })
        }
    },

    // Save results to database
    async saveToDatabase() {
        if (!state.folderId) return

        try {
            const supabase = getSupabase()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) return

            await supabase.from('analysis_results').insert({
                folder_id: state.folderId,
                user_id: user.id,
                type: state.activeType === 'all' ? 'plot_holes' : state.activeType,
                results: {
                    issues: state.issues,
                    pacingData: state.pacingData,
                },
            })
        } catch (error) {
            console.error('Failed to save analysis results:', error)
        }
    },

    // Set active filter
    setActiveType(type: AnalysisType | 'all') {
        state = { ...state, activeType: type }
        emitChange()
    },

    // Ignore an issue
    ignoreIssue(issueId: string) {
        state = {
            ...state,
            issues: state.issues.map(issue =>
                issue.id === issueId ? { ...issue, isIgnored: true } : issue
            ),
        }
        emitChange()
    },

    // Unignore an issue
    unignoreIssue(issueId: string) {
        state = {
            ...state,
            issues: state.issues.map(issue =>
                issue.id === issueId ? { ...issue, isIgnored: false } : issue
            ),
        }
        emitChange()
    },

    // Get filtered issues
    getFilteredIssues(): AnalysisIssue[] {
        let filtered = state.issues.filter(i => !i.isIgnored)

        if (state.activeType !== 'all') {
            filtered = filtered.filter(i => i.type === state.activeType)
        }

        return filtered
    },

    // Get issues by type
    getIssuesByType(type: AnalysisType): AnalysisIssue[] {
        return state.issues.filter(i => i.type === type && !i.isIgnored)
    },

    // Get issue counts by severity
    getIssueCounts(): { error: number; warning: number; info: number; total: number } {
        const issues = state.issues.filter(i => !i.isIgnored)
        return {
            error: issues.filter(i => i.severity === 'error').length,
            warning: issues.filter(i => i.severity === 'warning').length,
            info: issues.filter(i => i.severity === 'info').length,
            total: issues.length,
        }
    },

    // Clear all results
    clear() {
        state = {
            issues: [],
            pacingData: [],
            isAnalyzing: false,
            lastAnalyzedAt: null,
            activeType: 'all',
            folderId: null,
        }
        emitChange()
    },
}

// React hooks
export function useAnalysisState() {
    return useSyncExternalStore(
        analysisStore.subscribe,
        analysisStore.getState,
        analysisStore.getState
    )
}

export function useAnalysisIssues() {
    useAnalysisState() // Subscribe to updates
    return analysisStore.getFilteredIssues()
}

export function useIssueCounts() {
    useAnalysisState()
    return analysisStore.getIssueCounts()
}
