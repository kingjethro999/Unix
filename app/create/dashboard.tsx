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
        <div className="min-h-screen bg-background">
            {/* Header / Top Section */}
            <div className="bg-muted/30 py-8 border-b">
                <div className="container max-w-5xl mx-auto px-4">
                    <h2 className="text-lg font-medium mb-4 text-muted-foreground">Start a new document</h2>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <button className="relative group">
                                <div className="w-32 h-40 bg-white border hover:border-primary transition-colors rounded-lg flex items-center justify-center shadow-sm hover:shadow-md cursor-pointer">
                                    <Plus className="h-12 w-12 text-blue-600" />
                                </div>
                                <span className="mt-2 block text-sm font-medium text-left">Blank</span>
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
                    <h2 className="text-lg font-medium">Recent documents</h2>
                    <div className="flex items-center gap-4">
                        <div className="w-48">
                            <Select value={filter} onValueChange={setFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="owned-by-anyone">Owned by anyone</SelectItem>
                                    <SelectItem value="owned-by-me">Owned by me</SelectItem>
                                    <SelectItem value="not-owned-by-me">Not owned by me</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center border rounded-md bg-white">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setViewMode('list')}
                                className={cn("h-9 w-9 rounded-none border-r", viewMode === 'list' && "bg-muted")}
                                title="List view"
                            >
                                <ListIcon className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setViewMode('grid')}
                                className={cn("h-9 w-9 rounded-none", viewMode === 'grid' && "bg-muted")}
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
                            className="bg-white border hover:bg-muted"
                        >
                            {sortOrder === 'name-asc' ? <ArrowDownAZ className="h-4 w-4" /> :
                                sortOrder === 'name-desc' ? <ArrowUpZA className="h-4 w-4" /> :
                                    <ArrowDownAZ className="h-4 w-4 text-muted-foreground" />}
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
                                    <div className="bg-white border rounded-lg h-40 relative flex flex-col justify-between hover:border-primary transition-colors cursor-pointer shadow-sm hover:shadow-md overflow-hidden">
                                        <div className="flex-1 p-4 bg-gray-50 flex items-center justify-center">
                                            <FileText className="h-8 w-8 text-gray-300" />
                                        </div>

                                        <div className="p-3 bg-white border-t flex items-center justify-between">
                                            <div className="truncate">
                                                <h3 className="font-medium text-sm truncate" title={folder.name}>{folder.name}</h3>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                                    <FileText className="h-3 w-3 sm:hidden" />
                                                    <span>Opened {new Date(folder.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col border rounded-md bg-white overflow-hidden">
                            {filteredAndSortedFolders.map((folder) => (
                                <Link
                                    key={folder.id}
                                    href={`/workspace/${folder.id}`}
                                    className="group flex items-center justify-between p-3 border-b last:border-0 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-5 w-5 text-muted-foreground" />
                                        <span className="font-medium text-sm">{folder.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span>{new Date(folder.created_at).toLocaleDateString()}</span>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No documents found.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
