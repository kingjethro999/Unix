import { jsPDF } from 'jspdf'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'

export interface ExportOptions {
    format: 'pdf' | 'epub' | 'docx'
    title: string
    author?: string
    fontSize?: number
    fontFamily?: string
    lineSpacing?: number
    pageSize?: 'A4' | 'Letter' | 'Legal'
    margins?: { top: number; right: number; bottom: number; left: number }
    includeTableOfContents?: boolean
}

export interface ExportFile {
    id: string
    title: string
    content: string
}

export class ExportService {
    /**
     * Export files to PDF format
     */
    async exportToPDF(files: ExportFile[], options: ExportOptions): Promise<Blob> {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: options.pageSize?.toLowerCase() || 'a4',
        })

        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()
        const margins = options.margins || { top: 20, right: 20, bottom: 20, left: 20 }
        const contentWidth = pageWidth - margins.left - margins.right
        const fontSize = options.fontSize || 12
        const lineHeight = (options.lineSpacing || 1.5) * fontSize * 0.352778 // Convert to mm

        let currentY = margins.top

        // Add title page
        doc.setFontSize(24)
        doc.text(options.title, pageWidth / 2, currentY, { align: 'center' })
        currentY += 15

        if (options.author) {
            doc.setFontSize(14)
            doc.text(`by ${options.author}`, pageWidth / 2, currentY, { align: 'center' })
            currentY += 10
        }

        doc.addPage()
        currentY = margins.top

        // Add table of contents if requested
        if (options.includeTableOfContents) {
            doc.setFontSize(18)
            doc.text('Table of Contents', margins.left, currentY)
            currentY += 10

            doc.setFontSize(12)
            files.forEach((file, index) => {
                if (currentY > pageHeight - margins.bottom) {
                    doc.addPage()
                    currentY = margins.top
                }
                doc.text(`${index + 1}. ${file.title}`, margins.left + 5, currentY)
                currentY += lineHeight
            })

            doc.addPage()
            currentY = margins.top
        }

        // Add content
        files.forEach((file, fileIndex) => {
            // Chapter title
            doc.setFontSize(18)
            doc.setFont('helvetica', 'bold')

            if (currentY > pageHeight - margins.bottom - 20) {
                doc.addPage()
                currentY = margins.top
            }

            doc.text(file.title, margins.left, currentY)
            currentY += lineHeight * 1.5

            // Chapter content
            doc.setFontSize(fontSize)
            doc.setFont('helvetica', 'normal')

            // Parse markdown-like content
            const lines = file.content.split('\n')

            lines.forEach((line) => {
                // Check for page break
                if (currentY > pageHeight - margins.bottom) {
                    doc.addPage()
                    currentY = margins.top
                }

                // Handle headings
                if (line.startsWith('# ')) {
                    doc.setFontSize(18)
                    doc.setFont('helvetica', 'bold')
                    const text = line.substring(2)
                    const splitText = doc.splitTextToSize(text, contentWidth)
                    doc.text(splitText, margins.left, currentY)
                    currentY += lineHeight * splitText.length * 1.2
                    doc.setFontSize(fontSize)
                    doc.setFont('helvetica', 'normal')
                } else if (line.startsWith('## ')) {
                    doc.setFontSize(14)
                    doc.setFont('helvetica', 'bold')
                    const text = line.substring(3)
                    const splitText = doc.splitTextToSize(text, contentWidth)
                    doc.text(splitText, margins.left, currentY)
                    currentY += lineHeight * splitText.length * 1.1
                    doc.setFontSize(fontSize)
                    doc.setFont('helvetica', 'normal')
                } else if (line.startsWith('### ')) {
                    doc.setFontSize(12)
                    doc.setFont('helvetica', 'bold')
                    const text = line.substring(4)
                    const splitText = doc.splitTextToSize(text, contentWidth)
                    doc.text(splitText, margins.left, currentY)
                    currentY += lineHeight * splitText.length * 1.05
                    doc.setFontSize(fontSize)
                    doc.setFont('helvetica', 'normal')
                } else if (line.trim() === '') {
                    // Empty line
                    currentY += lineHeight * 0.5
                } else {
                    // Regular paragraph
                    const splitText = doc.splitTextToSize(line, contentWidth)
                    doc.text(splitText, margins.left, currentY)
                    currentY += lineHeight * splitText.length
                }
            })

            // Add page break between chapters (except last)
            if (fileIndex < files.length - 1) {
                doc.addPage()
                currentY = margins.top
            }
        })

        return doc.output('blob')
    }

    /**
     * Export files to EPUB format
     */
    async exportToEPUB(_files: ExportFile[], _options: ExportOptions): Promise<Blob> {
        throw new Error('EPUB export is not yet supported in the web version.')
    }

    /**
     * Export files to DOCX format
     */
    async exportToDOCX(files: ExportFile[], options: ExportOptions): Promise<Blob> {
        const children: Paragraph[] = []

        // Title page
        children.push(
            new Paragraph({
                text: options.title,
                heading: HeadingLevel.TITLE,
                spacing: { after: 400 },
                alignment: 'center',
            })
        )

        if (options.author) {
            children.push(
                new Paragraph({
                    text: `by ${options.author}`,
                    spacing: { after: 400 },
                    alignment: 'center',
                })
            )
        }

        // Page break
        children.push(new Paragraph({ pageBreakBefore: true }))

        // Table of contents
        if (options.includeTableOfContents) {
            children.push(
                new Paragraph({
                    text: 'Table of Contents',
                    heading: HeadingLevel.HEADING_1,
                    spacing: { after: 200 },
                })
            )

            files.forEach((file, index) => {
                children.push(
                    new Paragraph({
                        text: `${index + 1}. ${file.title}`,
                        spacing: { after: 100 },
                    })
                )
            })

            children.push(new Paragraph({ pageBreakBefore: true }))
        }

        // Content
        files.forEach((file, fileIndex) => {
            // Chapter title
            children.push(
                new Paragraph({
                    text: file.title,
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 400, after: 200 },
                })
            )

            // Chapter content
            const lines = file.content.split('\n')

            lines.forEach((line) => {
                if (line.startsWith('# ')) {
                    children.push(
                        new Paragraph({
                            text: line.substring(2),
                            heading: HeadingLevel.HEADING_1,
                            spacing: { before: 300, after: 150 },
                        })
                    )
                } else if (line.startsWith('## ')) {
                    children.push(
                        new Paragraph({
                            text: line.substring(3),
                            heading: HeadingLevel.HEADING_2,
                            spacing: { before: 250, after: 120 },
                        })
                    )
                } else if (line.startsWith('### ')) {
                    children.push(
                        new Paragraph({
                            text: line.substring(4),
                            heading: HeadingLevel.HEADING_3,
                            spacing: { before: 200, after: 100 },
                        })
                    )
                } else if (line.trim() === '') {
                    children.push(new Paragraph({ text: '' }))
                } else {
                    children.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: line,
                                    font: options.fontFamily || 'Calibri',
                                    size: (options.fontSize || 12) * 2, // Half-points
                                }),
                            ],
                            spacing: { after: 120 },
                        })
                    )
                }
            })

            // Page break between chapters (except last)
            if (fileIndex < files.length - 1) {
                children.push(new Paragraph({ pageBreakBefore: true }))
            }
        })

        const doc = new Document({
            sections: [
                {
                    properties: {
                        page: {
                            margin: {
                                top: (options.margins?.top || 20) * 56.7, // Convert mm to twips
                                right: (options.margins?.right || 20) * 56.7,
                                bottom: (options.margins?.bottom || 20) * 56.7,
                                left: (options.margins?.left || 20) * 56.7,
                            },
                        },
                    },
                    children,
                },
            ],
        })

        const buffer = await Packer.toBlob(doc)
        return buffer
    }


    /**
     * Main export function
     */
    async export(files: ExportFile[], options: ExportOptions): Promise<Blob> {
        switch (options.format) {
            case 'pdf':
                return this.exportToPDF(files, options)
            case 'epub':
                return this.exportToEPUB(files, options)
            case 'docx':
                return this.exportToDOCX(files, options)
            default:
                throw new Error(`Unsupported export format: ${options.format}`)
        }
    }

    /**
     * Download exported file
     */
    download(blob: Blob, filename: string) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }
}

export const exportService = new ExportService()
