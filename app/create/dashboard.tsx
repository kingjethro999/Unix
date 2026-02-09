'use client'

import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, FileText, MoreVertical, LayoutGrid, List as ListIcon, ArrowDownAZ, ArrowUpZA } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { createFolderAction, getFolders } from './actions'
import { ErrorState } from '@/components/ErrorState'
import { useRealtimeSubscription } from '@/hooks/use-realtime'

type SortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc'
type ViewMode = 'grid' | 'list'

interface DashboardProps {
    initialFolders: any[]
    userId: string
}

export function Dashboard({ initialFolders, userId }: DashboardProps) {
    const router = useRouter()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [newDocName, setNewDocName] = useState('Untitled document')
    const [filter, setFilter] = useState('owned-by-anyone')
    const [viewMode, setViewMode] = useState<ViewMode>('grid')
    const [sortOrder, setSortOrder] = useState<SortOption>('date-desc')
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [folders, setFolders] = useState(initialFolders)

    // Listen to changes in the 'folders' table
    useRealtimeSubscription({
        table: 'folders',
        callback: async () => {
            // Simplest approach: re-fetch the list when any change happens
            // Optimization: manually update local state based on payload (INSERT/DELETE/UPDATE)
            const updatedFolders = await getFolders()
            setFolders(updatedFolders)
        }
    })

    const filteredAndSortedFolders = folders
        ?.filter(folder => {
            if (filter === 'owned-by-me') return folder.user_id === userId
            if (filter === 'not-owned-by-me') return folder.user_id !== userId
            return true
        })
        ?.sort((a, b) => {
            switch (sortOrder) {
                case 'date-desc':
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                case 'date-asc':
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                case 'name-asc':
                    return a.name.localeCompare(b.name)
                case 'name-desc':
                    return b.name.localeCompare(a.name)
                default:
                    return 0
            }
        })

    const handleCreate = () => {
        if (!newDocName.trim()) return
        setError(null)

        startTransition(async () => {
            const result = await createFolderAction({ name: newDocName })
            if (result.error) {
                toast.error('Failed to create document')
                setError(result.error)
            } else if (result.folder) {
                toast.success('Document created!')
                setIsDialogOpen(false)
                router.push(`/workspace/${result.folder.id}`)
            }
        })
    }

    const toggleSort = () => {
        if (sortOrder.startsWith('name')) {
            setSortOrder(sortOrder === 'name-asc' ? 'name-desc' : 'name-asc')
        } else {
            setSortOrder('name-asc')
        }
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-200">
            {/* Header / Top Section */}
            <div className="bg-zinc-900 border-b border-zinc-800 py-8">
                <div className="container max-w-5xl mx-auto px-4">
                    <h2 className="text-lg font-medium mb-4 text-zinc-400">Start a new document</h2>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <button className="relative group">
                                <div className="w-32 h-40 bg-zinc-900 border border-zinc-800 hover:border-blue-500 transition-colors rounded-lg flex items-center justify-center shadow-sm hover:shadow-md hover:shadow-blue-500/10 cursor-pointer">
                                    <Plus className="h-12 w-12 text-blue-500" />
                                </div>
                                <span className="mt-2 block text-sm font-medium text-left text-zinc-300 group-hover:text-white transition-colors">Blank</span>
                            </button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Name your new document</DialogTitle>
                                <DialogDescription>
                                    Give your new document a name to get started.
                                </DialogDescription>
                            </DialogHeader>
                            {error && <ErrorState message={error} />}
                            <div className="py-4">
                                <Input
                                    value={newDocName}
                                    onChange={(e) => setNewDocName(e.target.value)}
                                    placeholder="Document Name"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleCreate()
                                    }}
                                />
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreate} disabled={isPending}>
                                    {isPending ? 'Creating...' : 'Create'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Recent Documents Section */}
            <div className="container max-w-5xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-medium text-zinc-200">Recent documents</h2>
                    <div className="flex items-center gap-4">
                        <div className="w-48">
                            <Select value={filter} onValueChange={setFilter}>
                                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-300">
                                    <SelectValue placeholder="Filter" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                                    <SelectItem value="owned-by-anyone" className="focus:bg-zinc-800 focus:text-white">Owned by anyone</SelectItem>
                                    <SelectItem value="owned-by-me" className="focus:bg-zinc-800 focus:text-white">Owned by me</SelectItem>
                                    <SelectItem value="not-owned-by-me" className="focus:bg-zinc-800 focus:text-white">Not owned by me</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center border border-zinc-800 rounded-md bg-zinc-900 overflow-hidden">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setViewMode('list')}
                                className={cn("h-9 w-9 rounded-none border-r border-zinc-800 hover:bg-zinc-800 hover:text-white", viewMode === 'list' ? "bg-zinc-800 text-white" : "text-zinc-400")}
                                title="List view"
                            >
                                <ListIcon className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setViewMode('grid')}
                                className={cn("h-9 w-9 rounded-none hover:bg-zinc-800 hover:text-white", viewMode === 'grid' ? "bg-zinc-800 text-white" : "text-zinc-400")}
                                title="Grid view"
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleSort}
                            title="Sort by name"
                            className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:text-white text-zinc-400"
                        >
                            {sortOrder === 'name-asc' ? <ArrowDownAZ className="h-4 w-4 text-blue-500" /> :
                                sortOrder === 'name-desc' ? <ArrowUpZA className="h-4 w-4 text-blue-500" /> :
                                    <ArrowDownAZ className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>

                {filteredAndSortedFolders && filteredAndSortedFolders.length > 0 ? (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                            {filteredAndSortedFolders.map((folder) => (
                                <Link
                                    key={folder.id}
                                    href={`/workspace/${folder.id}`}
                                    className="group block"
                                >
                                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg h-40 relative flex flex-col justify-between hover:border-blue-500/50 transition-colors cursor-pointer shadow-sm hover:shadow-lg hover:shadow-blue-500/5 overflow-hidden">
                                        <div className="flex-1 p-4 bg-zinc-950/30 flex items-center justify-center">
                                            <FileText className="h-8 w-8 text-zinc-700 group-hover:text-blue-500/50 transition-colors" />
                                        </div>

                                        <div className="p-3 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between">
                                            <div className="truncate w-full">
                                                <h3 className="font-medium text-sm truncate text-zinc-300 group-hover:text-white transition-colors" title={folder.name}>{folder.name}</h3>
                                                <div className="flex items-center gap-1 text-xs text-zinc-500 mt-1">
                                                    <FileText className="h-3 w-3 sm:hidden" />
                                                    <span>Opened {new Date(folder.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-white hover:bg-zinc-800">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col border border-zinc-800 rounded-md bg-zinc-900 overflow-hidden">
                            {filteredAndSortedFolders.map((folder) => (
                                <Link
                                    key={folder.id}
                                    href={`/workspace/${folder.id}`}
                                    className="group flex items-center justify-between p-3 border-b border-zinc-800 last:border-0 hover:bg-zinc-800/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-5 w-5 text-zinc-500 group-hover:text-blue-500 transition-colors" />
                                        <span className="font-medium text-sm text-zinc-300 group-hover:text-white">{folder.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-zinc-500">
                                        <span>{new Date(folder.created_at).toLocaleDateString()}</span>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-white hover:bg-zinc-800">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )
                ) : (
                    <div className="text-center py-12 text-zinc-600">
                        <p>No documents found.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
