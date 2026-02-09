'use client'

import Link from 'next/link'
import { ArrowLeft, Sparkles, Bug, Zap, Shield } from 'lucide-react'
import { motion } from 'framer-motion'
import { Footer } from '@/components/landing/Footer'

const changelog = [
    {
        version: '1.0.0',
        date: 'February 2026',
        title: 'Initial Release',
        type: 'major',
        changes: [
            { icon: Sparkles, text: 'AI-powered writing assistant with context awareness' },
            { icon: Sparkles, text: 'Rich text editor with modern formatting options' },
            { icon: Sparkles, text: 'Project management and organization system' },
            { icon: Sparkles, text: 'Real-time collaboration features' },
            { icon: Sparkles, text: 'Custom style guide support (.unixrc)' },
        ]
    },
    {
        version: '0.9.0',
        date: 'January 2026',
        title: 'Beta Release',
        type: 'minor',
        changes: [
            { icon: Zap, text: 'Performance improvements across the editor' },
            { icon: Sparkles, text: 'Added export functionality for PDF, EPUB, DOCX' },
            { icon: Bug, text: 'Fixed various text rendering issues' },
            { icon: Shield, text: 'Enhanced data security measures' },
        ]
    },
    {
        version: '0.8.0',
        date: 'December 2025',
        title: 'Alpha Preview',
        type: 'minor',
        changes: [
            { icon: Sparkles, text: 'Initial AI chat integration' },
            { icon: Sparkles, text: 'Basic project structure' },
            { icon: Sparkles, text: 'User authentication system' },
            { icon: Bug, text: 'Multiple bug fixes and stability improvements' },
        ]
    },
]

export default function ChangelogPage() {
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
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-16"
                    >
                        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent">
                            Changelog
                        </h1>
                        <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                            Track our progress and see what's new in UNIX. We're constantly improving
                            to make your writing experience better.
                        </p>
                    </motion.div>

                    {/* Timeline */}
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-violet-600 via-purple-600 to-zinc-800" />

                        {changelog.map((release, index) => (
                            <motion.div
                                key={release.version}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="relative pl-20 pb-12"
                            >
                                {/* Timeline dot */}
                                <div className={`absolute left-6 w-5 h-5 rounded-full border-4 ${release.type === 'major'
                                    ? 'bg-violet-600 border-violet-400'
                                    : 'bg-zinc-800 border-zinc-600'
                                    }`} />

                                {/* Version badge */}
                                <div className="flex items-center gap-4 mb-4">
                                    <span className={`px-3 py-1 rounded-full text-sm font-mono font-semibold ${release.type === 'major'
                                        ? 'bg-violet-600/20 text-violet-400'
                                        : 'bg-zinc-800 text-zinc-400'
                                        }`}>
                                        v{release.version}
                                    </span>
                                    <span className="text-sm text-zinc-500">{release.date}</span>
                                </div>

                                {/* Release content */}
                                <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6">
                                    <h3 className="text-xl font-semibold mb-4">{release.title}</h3>
                                    <ul className="space-y-3">
                                        {release.changes.map((change, i) => (
                                            <li key={i} className="flex items-start gap-3">
                                                <change.icon className="w-5 h-5 text-violet-400 mt-0.5 shrink-0" />
                                                <span className="text-zinc-300">{change.text}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* CTA */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        className="text-center mt-12"
                    >
                        <p className="text-zinc-500 mb-4">Want to stay updated?</p>
                        <Link
                            href="/sign-up"
                            className="inline-flex px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl font-medium hover:from-violet-500 hover:to-purple-500 transition-all"
                        >
                            Join UNIX Today
                        </Link>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
