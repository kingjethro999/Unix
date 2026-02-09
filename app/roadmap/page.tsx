'use client'

import Link from 'next/link'
import { ArrowLeft, Check, Clock, Sparkles, Brain, Globe, Users, Smartphone } from 'lucide-react'
import { motion } from 'framer-motion'
import { Footer } from '@/components/landing/Footer'

const roadmapItems = [
    {
        quarter: 'Q1 2026',
        status: 'completed',
        title: 'Foundation',
        items: [
            { text: 'Core editor with rich text formatting', done: true },
            { text: 'AI writing assistant integration', done: true },
            { text: 'Project management system', done: true },
            { text: 'User authentication & profiles', done: true },
        ]
    },
    {
        quarter: 'Q2 2026',
        status: 'in-progress',
        title: 'Enhancement',
        items: [
            { text: 'Advanced AI analysis tools', done: true },
            { text: 'Export to PDF, EPUB, DOCX', done: true },
            { text: 'Custom style guides (.unixrc)', done: true },
            { text: 'World-building wiki system', done: true },
        ]
    },
    {
        quarter: 'Q3 2026',
        status: 'planned',
        title: 'Collaboration',
        items: [
            { text: 'Real-time multi-user editing', done: false },
            { text: 'Comments and suggestions', done: false },
            { text: 'Team workspaces', done: false },
            { text: 'Version history & branching', done: false },
        ]
    },
    {
        quarter: 'Q4 2026',
        status: 'planned',
        title: 'Platform Expansion',
        items: [
            { text: 'Mobile apps (iOS & Android)', done: false },
            { text: 'Desktop apps (Windows, Mac, Linux)', done: false },
            { text: 'Offline mode support', done: false },
            { text: 'API for integrations', done: false },
        ]
    },
]

const futureVision = [
    { icon: Brain, title: 'Advanced AI', desc: 'Deeper character and plot analysis' },
    { icon: Globe, title: 'Localization', desc: 'Support for 20+ languages' },
    { icon: Users, title: 'Community', desc: 'Writer forums and critique groups' },
    { icon: Smartphone, title: 'Everywhere', desc: 'Write on any device, anytime' },
]

export default function RoadmapPage() {
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
                        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent">
                            Roadmap
                        </h1>
                        <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                            See where we've been and where we're headed. Our vision for UNIX
                            is constantly evolving based on your feedback.
                        </p>
                    </motion.div>

                    {/* Roadmap Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                        {roadmapItems.map((phase, index) => (
                            <motion.div
                                key={phase.quarter}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className={`relative bg-zinc-900/50 backdrop-blur-xl border rounded-2xl p-6 ${phase.status === 'completed'
                                    ? 'border-emerald-500/30'
                                    : phase.status === 'in-progress'
                                        ? 'border-violet-500/30'
                                        : 'border-zinc-800'
                                    }`}
                            >
                                {/* Status badge */}
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm font-mono text-zinc-500">{phase.quarter}</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${phase.status === 'completed'
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : phase.status === 'in-progress'
                                            ? 'bg-violet-500/20 text-violet-400'
                                            : 'bg-zinc-800 text-zinc-400'
                                        }`}>
                                        {phase.status === 'completed' ? 'Completed' : phase.status === 'in-progress' ? 'In Progress' : 'Planned'}
                                    </span>
                                </div>

                                <h3 className="text-xl font-semibold mb-4">{phase.title}</h3>

                                <ul className="space-y-3">
                                    {phase.items.map((item, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${item.done ? 'bg-emerald-500/20' : 'bg-zinc-800'
                                                }`}>
                                                {item.done ? (
                                                    <Check className="w-3 h-3 text-emerald-400" />
                                                ) : (
                                                    <Clock className="w-3 h-3 text-zinc-500" />
                                                )}
                                            </div>
                                            <span className={item.done ? 'text-zinc-300' : 'text-zinc-500'}>
                                                {item.text}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>

                    {/* Future Vision */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        <h2 className="text-2xl font-semibold text-center mb-8">The Future Vision</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {futureVision.map((item, index) => (
                                <div
                                    key={index}
                                    className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 text-center"
                                >
                                    <item.icon className="w-8 h-8 text-violet-400 mx-auto mb-3" />
                                    <h4 className="font-medium mb-1">{item.title}</h4>
                                    <p className="text-sm text-zinc-500">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* CTA */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        className="text-center mt-16"
                    >
                        <p className="text-zinc-500 mb-4">Have feature requests?</p>
                        <Link
                            href="/contact"
                            className="inline-flex px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl font-medium hover:from-violet-500 hover:to-purple-500 transition-all"
                        >
                            Share Your Ideas
                        </Link>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
