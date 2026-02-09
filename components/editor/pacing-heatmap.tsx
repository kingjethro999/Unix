'use client'

import { cn } from '@/lib/utils'
import { editorStore } from './editor-store'
import type { PacingData } from './analysis-store'

interface PacingHeatmapProps {
    data: PacingData[]
}

// Get color based on pacing score
function getPacingColor(score: number): string {
    if (score <= 3) return 'bg-blue-500' // Slow
    if (score <= 6) return 'bg-emerald-500' // Balanced
    return 'bg-orange-500' // Fast
}

function getPacingGradient(score: number): string {
    if (score <= 3) return 'from-blue-500/20 to-blue-500/5'
    if (score <= 6) return 'from-emerald-500/20 to-emerald-500/5'
    return 'from-orange-500/20 to-orange-500/5'
}

function getPacingTextColor(score: number): string {
    if (score <= 3) return 'text-blue-400'
    if (score <= 6) return 'text-emerald-400'
    return 'text-orange-400'
}

export function PacingHeatmap({ data }: PacingHeatmapProps) {
    if (data.length === 0) {
        return (
            <div className="text-center py-6 text-zinc-500 text-sm">
                Click "Analyze" to visualize pacing
            </div>
        )
    }

    const handleClick = (fileId: string) => {
        if (fileId) {
            editorStore.openFile(fileId)
        }
    }

    return (
        <div className="space-y-2">
            {/* Legend */}
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-3">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Slow</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Balanced</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    <span>Fast</span>
                </div>
            </div>

            {/* Bars */}
            {data.map((item, index) => (
                <button
                    key={item.fileId || index}
                    onClick={() => handleClick(item.fileId)}
                    className={cn(
                        'w-full p-3 rounded-lg border border-zinc-800/50 hover:border-zinc-700/50 transition-all text-left',
                        'bg-gradient-to-r',
                        getPacingGradient(item.score)
                    )}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-zinc-200 truncate max-w-[140px]">
                            {item.fileName}
                        </span>
                        <span className={cn('text-xs font-medium', getPacingTextColor(item.score))}>
                            {item.label.charAt(0).toUpperCase() + item.label.slice(1)}
                        </span>
                    </div>

                    {/* Progress bar showing score */}
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className={cn('h-full rounded-full transition-all', getPacingColor(item.score))}
                            style={{ width: `${item.score * 10}%` }}
                        />
                    </div>

                    {/* Details */}
                    {item.details && (
                        <div className="flex gap-3 mt-2 text-xs text-zinc-500">
                            {item.details.avgSentenceLength && (
                                <span>~{Math.round(item.details.avgSentenceLength)} words/sentence</span>
                            )}
                            {item.details.dialogueRatio !== undefined && (
                                <span>{Math.round(item.details.dialogueRatio)}% dialogue</span>
                            )}
                        </div>
                    )}
                </button>
            ))}

            {/* Overall summary */}
            {data.length > 1 && (
                <div className="pt-3 border-t border-zinc-800/50">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500">Average pacing:</span>
                        {(() => {
                            const avg = data.reduce((sum, d) => sum + d.score, 0) / data.length
                            return (
                                <span className={cn('font-medium', getPacingTextColor(avg))}>
                                    {avg.toFixed(1)}/10 ({avg <= 3 ? 'Slow' : avg <= 6 ? 'Balanced' : 'Fast'})
                                </span>
                            )
                        })()}
                    </div>
                </div>
            )}
        </div>
    )
}
