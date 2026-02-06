import { useMemo } from 'react'
import { diffLines } from 'diff'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DiffViewerProps {
    original: string
    modified: string
    title?: string
    onAccept?: () => void
    onReject?: () => void
}

export function DiffViewer({
    original,
    modified,
    title,
    onAccept,
    onReject,
}: DiffViewerProps) {
    const changes = useMemo(() => diffLines(original, modified), [original, modified])

    const stats = useMemo(() => {
        let additions = 0
        let deletions = 0

        changes.forEach((change) => {
            if (change.added) {
                additions += change.count || 0
            } else if (change.removed) {
                deletions += change.count || 0
            }
        })

        return { additions, deletions }
    }, [changes])

    return (
        <div className="flex flex-col h-full border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-zinc-800 bg-zinc-900/50">
                <div>
                    {title && <h3 className="text-sm font-medium text-zinc-200">{title}</h3>}
                    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                        <span className="flex items-center gap-1">
                            <span className="text-emerald-400">+{stats.additions}</span>
                            <span>additions</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="text-red-400">-{stats.deletions}</span>
                            <span>deletions</span>
                        </span>
                    </div>
                </div>
                {(onAccept || onReject) && (
                    <div className="flex items-center gap-2">
                        {onReject && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onReject}
                                className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                            >
                                <X size={14} className="mr-1" />
                                Reject
                            </Button>
                        )}
                        {onAccept && (
                            <Button
                                size="sm"
                                onClick={onAccept}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white"
                            >
                                <Check size={14} className="mr-1" />
                                Accept
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Side-by-side diff view */}
            <div className="flex-1 flex overflow-hidden">
                {/* Original (left) */}
                <div className="flex-1 border-r border-zinc-800">
                    <div className="bg-zinc-900/30 p-2 border-b border-zinc-800">
                        <h4 className="text-xs font-medium text-zinc-400">Original</h4>
                    </div>
                    <ScrollArea className="h-[calc(100%-32px)]">
                        <div className="font-mono text-xs p-2">
                            {changes.map((change, index) => {
                                if (change.added) return null // Skip added lines in original view

                                const lines = change.value.split('\n')
                                // Handle trailing newline issues in split
                                if (lines.length > 0 && lines[lines.length - 1] === '') {
                                    lines.pop()
                                }

                                return lines.map((line, lineIndex) => (
                                    <div
                                        key={`orig-${index}-${lineIndex}`}
                                        className={cn(
                                            'px-1 py-0.5 flex items-start gap-2 min-h-[20px]',
                                            change.removed && 'bg-red-500/10 text-red-300'
                                        )}
                                    >
                                        <span className={cn(change.removed && 'line-through opacity-70')}>
                                            {line || ' '}
                                        </span>
                                    </div>
                                ))
                            })}
                        </div>
                    </ScrollArea>
                </div>

                {/* Modified (right) */}
                <div className="flex-1">
                    <div className="bg-zinc-900/30 p-2 border-b border-zinc-800">
                        <h4 className="text-xs font-medium text-zinc-400">Modified</h4>
                    </div>
                    <ScrollArea className="h-[calc(100%-32px)]">
                        <div className="font-mono text-xs p-2">
                            {changes.map((change, index) => {
                                if (change.removed) return null // Skip removed lines in modified view

                                const lines = change.value.split('\n')
                                if (lines.length > 0 && lines[lines.length - 1] === '') {
                                    lines.pop()
                                }

                                return lines.map((line, lineIndex) => (
                                    <div
                                        key={`mod-${index}-${lineIndex}`}
                                        className={cn(
                                            'px-1 py-0.5 flex items-start gap-2 min-h-[20px]',
                                            change.added && 'bg-emerald-500/10 text-emerald-300'
                                        )}
                                    >
                                        <span>{line || ' '}</span>
                                    </div>
                                ))
                            })}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </div>
    )
}

/**
 * Unified diff view (simpler, single column)
 */
export function UnifiedDiffViewer({
    original,
    modified,
    title,
}: {
    original: string
    modified: string
    title?: string
}) {
    const changes = useMemo(() => diffLines(original, modified), [original, modified])

    return (
        <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950">
            {title && (
                <div className="p-3 border-b border-zinc-800 bg-zinc-900/50">
                    <h3 className="text-sm font-medium text-zinc-200">{title}</h3>
                </div>
            )}
            <ScrollArea className="max-h-96">
                <div className="font-mono text-xs">
                    {changes.map((change, index) => {
                        const lines = change.value.split('\n')
                        if (lines.length > 0 && lines[lines.length - 1] === '') {
                            lines.pop()
                        }

                        return lines.map((line, lineIndex) => (
                            <div
                                key={`${index}-${lineIndex}`}
                                className={cn(
                                    'px-3 py-0.5 flex items-start gap-2',
                                    change.added && 'bg-emerald-500/10 text-emerald-300',
                                    change.removed && 'bg-red-500/10 text-red-300'
                                )}
                            >
                                <span className="text-zinc-600 select-none min-w-4 text-center">
                                    {change.added ? '+' : change.removed ? '-' : ' '}
                                </span>
                                <span className={cn(change.removed && 'line-through')}>
                                    {line || ' '}
                                </span>
                            </div>
                        ))
                    })}
                </div>
            </ScrollArea>
        </div>
    )
}
