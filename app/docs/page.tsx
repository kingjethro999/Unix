'use client'

import Link from 'next/link'
import { ArrowLeft, Book, Rocket, Sparkles, Settings, FileText, Share2, Bot } from 'lucide-react'
import { motion } from 'framer-motion'
import { Footer } from '@/components/landing/Footer'

const docSections = [
    {
        icon: Rocket,
        title: 'Getting Started',
        description: 'Learn the basics and set up your first project',
        href: '/docs/getting-started',
        articles: ['Quick Start Guide', 'Creating Your First Project', 'Understanding the Editor']
    },
    {
        icon: Sparkles,
        title: 'Editor Features',
        description: 'Master the rich text editor and formatting tools',
        href: '/docs/editor',
        articles: ['Text Formatting', 'Keyboard Shortcuts', 'Custom Styles']
    },
    {
        icon: Bot,
        title: 'AI Assistant',
        description: 'Leverage AI to enhance your writing workflow',
        href: '/docs/ai',
        articles: ['Chat Commands', 'Context Awareness', 'Style Guide Integration']
    },
    {
        icon: FileText,
        title: 'Projects & Files',
        description: 'Organize and manage your writing projects',
        href: '/docs/projects',
        articles: ['Project Structure', 'File Management', 'Importing Content']
    },
    {
        icon: Share2,
        title: 'Export & Share',
        description: 'Export your work in various formats',
        href: '/docs/export',
        articles: ['PDF Export', 'EPUB for E-readers', 'DOCX for Publishers']
    },
    {
        icon: Settings,
        title: 'Configuration',
        description: 'Customize UNIX to match your workflow',
        href: '/docs/config',
        articles: ['.unixrc File', 'Editor Preferences', 'Theme Customization']
    },
]

export default function DocsPage() {
    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <img src="/images/unix-logo.png" alt="UNIX" className="h-8 w-auto" />
                        <span className="font-mono font-bold text-xl">UNIX</span>
                    </Link>
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="pt-32 pb-24 px-4">
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-16"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6">
                            <Book className="w-4 h-4 text-violet-400" />
                            <span className="text-sm text-violet-400 font-medium">Documentation</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent">
                            Learn UNIX
                        </h1>
                        <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                            Everything you need to know about using UNIX effectively.
                            From basics to advanced features.
                        </p>
                    </motion.div>

                    {/* Search */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="max-w-xl mx-auto mb-12"
                    >
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search documentation..."
                                className="w-full px-5 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50 transition-colors"
                            />
                            <kbd className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-500">
                                ⌘K
                            </kbd>
                        </div>
                    </motion.div>

                    {/* Documentation Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {docSections.map((section, index) => (
                            <motion.div
                                key={section.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.05 }}
                            >
                                <div className="h-full p-6 bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-colors group">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600/20 to-purple-600/20 flex items-center justify-center mb-4 group-hover:from-violet-600/30 group-hover:to-purple-600/30 transition-colors">
                                        <section.icon className="w-6 h-6 text-violet-400" />
                                    </div>

                                    <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
                                    <p className="text-sm text-zinc-500 mb-4">{section.description}</p>

                                    <ul className="space-y-2">
                                        {section.articles.map((article, i) => (
                                            <li key={i}>
                                                <a
                                                    href="#"
                                                    className="text-sm text-zinc-400 hover:text-violet-400 transition-colors flex items-center gap-2"
                                                >
                                                    <span className="w-1 h-1 bg-zinc-600 rounded-full" />
                                                    {article}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Help Section */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="mt-16 text-center"
                    >
                        <div className="inline-flex flex-col sm:flex-row gap-4 items-center p-6 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl">
                            <span className="text-zinc-400">Can't find what you're looking for?</span>
                            <Link
                                href="/contact"
                                className="px-5 py-2 bg-violet-600 rounded-xl font-medium hover:bg-violet-500 transition-colors"
                            >
                                Contact Support
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
