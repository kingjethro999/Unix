'use client'

import { useState } from 'react'
import {
  Download,
  FileText,
  Code,
  Globe,
  FileType,
  X,
  Check,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { type EditorFile } from './editor-store'
import { marked } from 'marked'
import jsPDF from 'jspdf'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  file?: EditorFile | null
  files?: EditorFile[] | null
}

type ExportFormat = 'markdown' | 'txt' | 'html' | 'pdf'

interface FormatOption {
  id: ExportFormat
  name: string
  description: string
  icon: React.ReactNode
  extension: string
}

const formats: FormatOption[] = [
  {
    id: 'markdown',
    name: 'Markdown',
    description: 'Original markdown format (.md)',
    icon: <Code size={20} />,
    extension: '.md',
  },
  {
    id: 'txt',
    name: 'Plain Text',
    description: 'Simple text file (.txt)',
    icon: <FileText size={20} />,
    extension: '.txt',
  },
  {
    id: 'html',
    name: 'HTML',
    description: 'Web page format (.html)',
    icon: <Globe size={20} />,
    extension: '.html',
  },
  {
    id: 'pdf',
    name: 'PDF',
    description: 'Portable document format (.pdf)',
    icon: <FileType size={20} />,
    extension: '.pdf',
  },
]

export function ExportModal({ isOpen, onClose, file, files }: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('markdown')
  const [isExporting, setIsExporting] = useState(false)

  // Determine mode: Single file or Bulk (multiple files)
  const isBulk = !!files && files.length > 0
  const title = isBulk ? 'Bulk Export' : file?.title || 'Export'
  const subTitle = isBulk ? `Export all ${files?.length} files` : `Export "${file?.title}"`

  const handleExport = async () => {
    if (!file && !files) return

    setIsExporting(true)

    try {
      // Prepare content and filename
      let content = ''
      let filename = ''

      if (isBulk && files) {
        filename = 'project_export'
        if (selectedFormat === 'markdown' || selectedFormat === 'txt') {
          content = files.map(f => `# ${f.title}\n\n${f.content}`).join('\n\n---\n\n')
        } else {
          // For HTML/PDF, we might process differently below, but basic text concatenation is a start
          content = files.map(f => `# ${f.title}\n\n${f.content}`).join('\n\n')
        }
      } else if (file) {
        filename = file.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()
        content = file.content
      }

      switch (selectedFormat) {
        case 'markdown':
          downloadFile(content, `${filename}.md`, 'text/markdown')
          break

        case 'txt':
          // Strip markdown formatting for plain text
          const plainText = content
            .replace(/#{1,6}\s/g, '') // Remove headers
            .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
            .replace(/\*(.+?)\*/g, '$1') // Remove italic
            .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove links
            .replace(/^---\n/gm, '----------------------------------------\n') // Replace separators
          downloadFile(plainText, `${filename}.txt`, 'text/plain')
          break

        case 'html':
          const htmlBody = await marked(content)
          const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${isBulk ? 'Project Export' : file?.title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            color: #333;
        }
        h1, h2, h3, h4, h5, h6 {
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            font-weight: 600;
        }
        code {
            background: #f4f4f4;
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        pre {
            background: #f4f4f4;
            padding: 1em;
            border-radius: 5px;
            overflow-x: auto;
        }
        blockquote {
            border-left: 4px solid #ddd;
            padding-left: 1em;
            margin-left: 0;
            color: #666;
        }
        hr {
            border: 0;
            border-top: 1px solid #ccc;
            margin: 2em 0;
        }
    </style>
</head>
<body>
    ${htmlBody}
</body>
</html>`
          downloadFile(fullHtml, `${filename}.html`, 'text/html')
          break

        case 'pdf':
          const pdf = new jsPDF()
          const pageWidth = pdf.internal.pageSize.getWidth()
          const margin = 20
          const maxWidth = pageWidth - margin * 2

          // Add title
          pdf.setFontSize(20)
          pdf.setFont('helvetica', 'bold')
          pdf.text(isBulk ? 'Project Export' : file!.title, margin, margin)

          // Add content
          pdf.setFontSize(12)
          pdf.setFont('helvetica', 'normal')

          // Simple text wrapping - for bulk, we might want page breaks, but simple split for now
          // If bulk, we could iterate and add pages.
          if (isBulk && files) {
            let yPos = margin + 15
            files.forEach((f, i) => {
              if (i > 0) {
                pdf.addPage()
                yPos = margin
              }
              pdf.setFontSize(16)
              pdf.setFont('helvetica', 'bold')
              pdf.text(f.title, margin, yPos)
              yPos += 10

              pdf.setFontSize(12)
              pdf.setFont('helvetica', 'normal')
              const lines = pdf.splitTextToSize(f.content, maxWidth)
              // Note: jsPDF text handling is basic here. For a truly robust PDF export of long content,
              // complex pagination logic is needed. This is a simplified "print" version.
              pdf.text(lines, margin, yPos)
            })
          } else {
            const lines = pdf.splitTextToSize(content, maxWidth)
            pdf.text(lines, margin, margin + 15)
          }

          pdf.save(`${filename}.pdf`)
          break
      }

      // Close modal after short delay
      setTimeout(() => {
        setIsExporting(false)
        onClose()
      }, 500)
    } catch (error) {
      console.error('Export failed:', error)
      setIsExporting(false)
    }
  }

  const downloadFile = (
    content: string,
    filename: string,
    mimeType: string,
  ) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <AnimatePresence>
      {isOpen && (file || files) && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="w-full max-w-lg mx-4 pointer-events-auto"
            >
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                      <Download size={20} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        {title}
                      </h2>
                      <p className="text-xs text-zinc-500">
                        {subTitle}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Format Selection */}
                <div className="p-6">
                  <label className="block text-sm font-medium text-zinc-400 mb-3">
                    Choose Format
                  </label>
                  <div className="space-y-2">
                    {formats.map((format) => (
                      <button
                        key={format.id}
                        onClick={() => setSelectedFormat(format.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${selectedFormat === format.id
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950'
                          }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedFormat === format.id
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-zinc-800 text-zinc-500'
                            }`}
                        >
                          {format.icon}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-medium ${selectedFormat === format.id
                                  ? 'text-white'
                                  : 'text-zinc-300'
                                }`}
                            >
                              {format.name}
                            </span>
                            <span className="text-xs text-zinc-600 font-mono">
                              {format.extension}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {format.description}
                          </p>
                        </div>
                        {selectedFormat === format.id && (
                          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                            <Check size={14} className="text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 mt-6">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isExporting}
                      className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleExport}
                      disabled={isExporting}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isExporting ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: 'linear',
                            }}
                          >
                            <Download size={16} />
                          </motion.div>
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download size={16} />
                          Export
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
