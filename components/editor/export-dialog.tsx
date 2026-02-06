import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { FileText, Download, Loader2 } from 'lucide-react'
import { exportService, type ExportOptions, type ExportFile } from './export-service'
import { useEditorState } from './editor-store'
import { toast } from 'sonner'

interface ExportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
    const editorState = useEditorState()
    const [isExporting, setIsExporting] = useState(false)
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(
        new Set(editorState.files.map((f) => f.id))
    )

    const [options, setOptions] = useState<ExportOptions>({
        format: 'pdf',
        title: 'My Novel',
        author: '',
        fontSize: 12,
        fontFamily: 'Georgia',
        lineSpacing: 1.5,
        pageSize: 'A4',
        margins: { top: 25, right: 25, bottom: 25, left: 25 },
        includeTableOfContents: true,
    })

    const toggleFile = (fileId: string) => {
        const newSelected = new Set(selectedFiles)
        if (newSelected.has(fileId)) {
            newSelected.delete(fileId)
        } else {
            newSelected.add(fileId)
        }
        setSelectedFiles(newSelected)
    }

    const toggleAll = () => {
        if (selectedFiles.size === editorState.files.length) {
            setSelectedFiles(new Set())
        } else {
            setSelectedFiles(new Set(editorState.files.map((f) => f.id)))
        }
    }

    const handleExport = async () => {
        if (selectedFiles.size === 0) {
            toast.error('Please select at least one file to export')
            return
        }

        setIsExporting(true)

        try {
            const filesToExport: ExportFile[] = editorState.files
                .filter((f) => selectedFiles.has(f.id))
                .map((f) => ({
                    id: f.id,
                    title: f.title,
                    content: f.content,
                }))

            const blob = await exportService.export(filesToExport, options)

            const extension = options.format === 'docx' ? 'docx' : options.format
            const filename = `${options.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.${extension}`

            exportService.download(blob, filename)

            toast.success(`Successfully exported as ${options.format.toUpperCase()}!`)
            onOpenChange(false)
        } catch (error) {
            console.error('Export failed:', error)
            toast.error('Export failed. Please try again.')
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-950 border-zinc-800 text-zinc-100">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-zinc-100">
                        <FileText size={20} className="text-cyan-400" />
                        Export Manuscript
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Export your work to professional formats (PDF, DOCX)
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Format Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="format" className="text-zinc-300">Export Format</Label>
                        <Select
                            value={options.format}
                            onValueChange={(value) =>
                                setOptions({ ...options, format: value as 'pdf' | 'epub' | 'docx' })
                            }
                        >
                            <SelectTrigger id="format" className="bg-zinc-900 border-zinc-800 text-zinc-300">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                                <SelectItem value="pdf">PDF - Portable Document Format</SelectItem>
                                {/* EPUB not fully integrated yet, keeping in enum but handling as error in service if used */}
                                <SelectItem value="epub">EPUB - Electronic Publication</SelectItem>
                                <SelectItem value="docx">DOCX - Microsoft Word</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-zinc-300">Title</Label>
                            <Input
                                id="title"
                                value={options.title}
                                onChange={(e) => setOptions({ ...options, title: e.target.value })}
                                placeholder="My Novel"
                                className="bg-zinc-900 border-zinc-800 text-zinc-300"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="author" className="text-zinc-300">Author</Label>
                            <Input
                                id="author"
                                value={options.author || ''}
                                onChange={(e) => setOptions({ ...options, author: e.target.value })}
                                placeholder="Author Name"
                                className="bg-zinc-900 border-zinc-800 text-zinc-300"
                            />
                        </div>
                    </div>

                    {/* File Selection */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-zinc-300">Select Chapters</Label>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleAll}
                                className="h-8 text-xs text-zinc-400 hover:text-zinc-200"
                            >
                                {selectedFiles.size === editorState.files.length
                                    ? 'Deselect All'
                                    : 'Select All'}
                            </Button>
                        </div>
                        <div className="border border-zinc-800 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto bg-zinc-900/50">
                            {editorState.files.map((file) => (
                                <div key={file.id} className="flex items-center gap-2">
                                    <Checkbox
                                        id={`file-${file.id}`}
                                        checked={selectedFiles.has(file.id)}
                                        onCheckedChange={() => toggleFile(file.id)}
                                        className="border-zinc-700 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                                    />
                                    <Label
                                        htmlFor={`file-${file.id}`}
                                        className="flex-1 cursor-pointer text-sm font-normal text-zinc-300"
                                    >
                                        {file.title}
                                    </Label>
                                    <span className="text-xs text-zinc-600">
                                        {file.content.split(/\s+/).filter(Boolean).length} words
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Formatting Options */}
                    <div className="space-y-4 border-t border-zinc-800 pt-4">
                        <h4 className="text-sm font-medium text-zinc-300">Formatting Options</h4>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fontSize" className="text-zinc-300">Font Size</Label>
                                <Input
                                    id="fontSize"
                                    type="number"
                                    min="8"
                                    max="18"
                                    value={options.fontSize}
                                    onChange={(e) =>
                                        setOptions({ ...options, fontSize: parseInt(e.target.value) })
                                    }
                                    className="bg-zinc-900 border-zinc-800 text-zinc-300"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lineSpacing" className="text-zinc-300">Line Spacing</Label>
                                <Select
                                    value={options.lineSpacing?.toString()}
                                    onValueChange={(value) =>
                                        setOptions({ ...options, lineSpacing: parseFloat(value) })
                                    }
                                >
                                    <SelectTrigger id="lineSpacing" className="bg-zinc-900 border-zinc-800 text-zinc-300">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                                        <SelectItem value="1">Single</SelectItem>
                                        <SelectItem value="1.15">1.15</SelectItem>
                                        <SelectItem value="1.5">1.5</SelectItem>
                                        <SelectItem value="2">Double</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pageSize" className="text-zinc-300">Page Size</Label>
                                <Select
                                    value={options.pageSize}
                                    onValueChange={(value) =>
                                        setOptions({
                                            ...options,
                                            pageSize: value as 'A4' | 'Letter' | 'Legal',
                                        })
                                    }
                                >
                                    <SelectTrigger id="pageSize" className="bg-zinc-900 border-zinc-800 text-zinc-300">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                                        <SelectItem value="A4">A4</SelectItem>
                                        <SelectItem value="Letter">Letter</SelectItem>
                                        <SelectItem value="Legal">Legal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="toc"
                                checked={options.includeTableOfContents}
                                onCheckedChange={(checked) =>
                                    setOptions({ ...options, includeTableOfContents: !!checked })
                                }
                                className="border-zinc-700 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                            />
                            <Label htmlFor="toc" className="font-normal cursor-pointer text-zinc-300">
                                Include Table of Contents
                            </Label>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 border-t border-zinc-800 pt-4">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isExporting}
                        className="border-zinc-700 text-zinc-300 hover:bg-zinc-900 hover:text-white"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleExport}
                        disabled={isExporting || selectedFiles.size === 0}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white"
                    >
                        {isExporting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Exporting...
                            </>
                        ) : (
                            <>
                                <Download className="mr-2 h-4 w-4" />
                                Export {options.format.toUpperCase()}
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
