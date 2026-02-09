'use client'

import { useState, useEffect } from 'react'
import {
    Search,
    Users,
    BarChart3,
    AlertTriangle,
    AlertCircle,
    Info,
    Play,
    Loader2,
    Clock,
    ChevronRight,
    Eye,
    EyeOff,
    RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
    analysisStore,
    useAnalysisState,
    useAnalysisIssues,
    useIssueCounts,
    type AnalysisType,
    type AnalysisIssue,
} from './analysis-store'
import { useEditorState, editorStore } from './editor-store'
import { PacingHeatmap } from './pacing-heatmap'

const analysisTypes = [
    {
        id: 'plot_holes' as AnalysisType,
        label: 'Plot Holes',
        icon: Search,
        color: 'text-pink-400',
        bgColor: 'bg-pink-500/10',
    },
    {
        id: 'character_voice' as AnalysisType,
        label: 'Voices',
        icon: Users,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
    },
    {
        id: 'pacing' as AnalysisType,
        label: 'Pacing',
        icon: BarChart3,
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10',
    },
]

const severityConfig = {
    error: {
        icon: AlertCircle,
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
    },
    warning: {
        icon: AlertTriangle,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
    },
    info: {
        icon: Info,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
    },
}

function IssueCard({ issue, onNavigate }: { issue: AnalysisIssue; onNavigate: () => void }) {
    const config = severityConfig[issue.severity]
    const Icon = config.icon
    const [isExpanded, setIsExpanded] = useState(false)

    return (
        <div
            className={cn(
                'p-3 rounded-lg border transition-all',
                config.bgColor,
                config.borderColor,
                issue.isIgnored && 'opacity-50'
            )}
        >
            <div className="flex items-start gap-2">
                <Icon className={cn('w-4 h-4 mt-0.5 shrink-0', config.color)} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-zinc-500">{issue.fileName}</span>
                        <button
                            onClick={() => analysisStore.ignoreIssue(issue.id)}
                            className="ml-auto text-zinc-500 hover:text-zinc-300"
                            title="Ignore this issue"
                        >
                            <EyeOff className="w-3 h-3" />
                        </button>
                    </div>

                    <p className="text-sm text-zinc-200 mb-2">{issue.message}</p>

                    {issue.excerpt && (
                        <div className="text-xs text-zinc-400 bg-zinc-900/50 rounded px-2 py-1 mb-2 font-mono">
                            "{issue.excerpt}"
                        </div>
                    )}

                    {issue.suggestion && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                            <ChevronRight className={cn('w-3 h-3 transition-transform', isExpanded && 'rotate-90')} />
                            {isExpanded ? 'Hide suggestion' : 'Show suggestion'}
                        </button>
                    )}

                    {isExpanded && issue.suggestion && (
                        <div className="mt-2 text-xs text-zinc-300 bg-zinc-800/50 rounded px-2 py-1.5">
                            💡 {issue.suggestion}
                        </div>
                    )}

                    {issue.fileId && (
                        <button
                            onClick={onNavigate}
                            className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                        >
                            <Eye className="w-3 h-3" />
                            Go to file
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export function AnalysisSidebar() {
    const analysisState = useAnalysisState()
    const issues = useAnalysisIssues()
    const counts = useIssueCounts()
    const editorState = useEditorState()
    const [activeTab, setActiveTab] = useState<'plot_holes' | 'character_voice' | 'pacing'>('plot_holes')

    // Initialize analysis store when workspace loads
    useEffect(() => {
        if (editorState.workspaceId) {
            analysisStore.initForFolder(editorState.workspaceId)
        }
    }, [editorState.workspaceId])

    const handleRunAnalysis = async (type: AnalysisType | 'all') => {
        // Get all files with content
        const files = editorState.files
            .filter(f => f.content && !f.title.startsWith('.'))
            .map(f => ({
                id: f.id,
                title: f.title,
                content: f.content,
            }))

        if (files.length === 0) {
            return
        }

        await analysisStore.runAnalysis(type, files)
    }

    const handleNavigateToFile = (fileId: string) => {
        if (fileId) {
            editorStore.openFile(fileId)
        }
    }

    const filteredIssues = issues.filter(i =>
        activeTab === 'plot_holes' ? i.type === 'plot_holes' :
            activeTab === 'character_voice' ? i.type === 'character_voice' :
                i.type === 'pacing'
    )

    const plotHoleCount = issues.filter(i => i.type === 'plot_holes').length
    const voiceCount = issues.filter(i => i.type === 'character_voice').length
    const pacingIssueCount = issues.filter(i => i.type === 'pacing').length

    return (
        <div className="flex flex-col h-full bg-zinc-950">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800/50">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-medium text-zinc-200">AI Analysis</h2>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRunAnalysis('all')}
                        disabled={analysisState.isAnalyzing}
                        className="h-7 text-xs bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
                    >
                        {analysisState.isAnalyzing ? (
                            <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Play className="w-3 h-3 mr-1" />
                                Run All
                            </>
                        )}
                    </Button>
                </div>

                {/* Summary badges */}
                <div className="flex gap-2 flex-wrap">
                    {counts.error > 0 && (
                        <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
                            {counts.error} error{counts.error !== 1 && 's'}
                        </Badge>
                    )}
                    {counts.warning > 0 && (
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                            {counts.warning} warning{counts.warning !== 1 && 's'}
                        </Badge>
                    )}
                    {counts.info > 0 && (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                            {counts.info} info
                        </Badge>
                    )}
                    {counts.total === 0 && !analysisState.isAnalyzing && analysisState.lastAnalyzedAt && (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                            ✓ No issues
                        </Badge>
                    )}
                </div>

                {analysisState.lastAnalyzedAt && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-zinc-500">
                        <Clock className="w-3 h-3" />
                        Last analyzed: {new Date(analysisState.lastAnalyzedAt).toLocaleTimeString()}
                    </div>
                )}
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col">
                <TabsList className="grid grid-cols-3 mx-4 mt-3 bg-zinc-900/50">
                    <TabsTrigger value="plot_holes" className="text-xs data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-400">
                        <Search className="w-3 h-3 mr-1" />
                        Holes {plotHoleCount > 0 && `(${plotHoleCount})`}
                    </TabsTrigger>
                    <TabsTrigger value="character_voice" className="text-xs data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
                        <Users className="w-3 h-3 mr-1" />
                        Voice {voiceCount > 0 && `(${voiceCount})`}
                    </TabsTrigger>
                    <TabsTrigger value="pacing" className="text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                        <BarChart3 className="w-3 h-3 mr-1" />
                        Pace
                    </TabsTrigger>
                </TabsList>

                <ScrollArea className="flex-1">
                    <TabsContent value="plot_holes" className="p-4 pt-3 space-y-3 m-0">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-zinc-500">
                                Detects contradictions with your wiki
                            </p>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRunAnalysis('plot_holes')}
                                disabled={analysisState.isAnalyzing}
                                className="h-6 text-xs text-pink-400 hover:text-pink-300 hover:bg-pink-500/10"
                            >
                                <RefreshCw className={cn('w-3 h-3 mr-1', analysisState.isAnalyzing && 'animate-spin')} />
                                Scan
                            </Button>
                        </div>

                        {filteredIssues.length === 0 ? (
                            <div className="text-center py-8 text-zinc-500 text-sm">
                                {analysisState.lastAnalyzedAt
                                    ? 'No plot holes detected! ✨'
                                    : 'Click "Scan" to check for inconsistencies'}
                            </div>
                        ) : (
                            filteredIssues.map(issue => (
                                <IssueCard
                                    key={issue.id}
                                    issue={issue}
                                    onNavigate={() => handleNavigateToFile(issue.fileId)}
                                />
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="character_voice" className="p-4 pt-3 space-y-3 m-0">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-zinc-500">
                                Ensures distinct character voices
                            </p>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRunAnalysis('character_voice')}
                                disabled={analysisState.isAnalyzing}
                                className="h-6 text-xs text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                            >
                                <RefreshCw className={cn('w-3 h-3 mr-1', analysisState.isAnalyzing && 'animate-spin')} />
                                Scan
                            </Button>
                        </div>

                        {filteredIssues.length === 0 ? (
                            <div className="text-center py-8 text-zinc-500 text-sm">
                                {analysisState.lastAnalyzedAt
                                    ? 'All characters have distinct voices! ✨'
                                    : 'Click "Scan" to analyze dialogue'}
                            </div>
                        ) : (
                            filteredIssues.map(issue => (
                                <IssueCard
                                    key={issue.id}
                                    issue={issue}
                                    onNavigate={() => handleNavigateToFile(issue.fileId)}
                                />
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="pacing" className="p-4 pt-3 space-y-3 m-0">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-zinc-500">
                                Visualize story rhythm
                            </p>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRunAnalysis('pacing')}
                                disabled={analysisState.isAnalyzing}
                                className="h-6 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                            >
                                <RefreshCw className={cn('w-3 h-3 mr-1', analysisState.isAnalyzing && 'animate-spin')} />
                                Analyze
                            </Button>
                        </div>

                        {/* Pacing Heatmap */}
                        <PacingHeatmap data={analysisState.pacingData} />

                        {/* Pacing issues */}
                        {filteredIssues.length > 0 && (
                            <div className="pt-2 border-t border-zinc-800/50">
                                <h4 className="text-xs text-zinc-400 mb-2">Pacing Issues</h4>
                                {filteredIssues.map(issue => (
                                    <IssueCard
                                        key={issue.id}
                                        issue={issue}
                                        onNavigate={() => handleNavigateToFile(issue.fileId)}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </ScrollArea>
            </Tabs>
        </div>
    )
}
