'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, BookOpen, Pen, Sparkles, FolderOpen } from 'lucide-react'
import { motion } from 'framer-motion'
import { Footer } from '@/components/landing/Footer'

const steps = [
    {
        number: '01',
        icon: BookOpen,
        title: 'Create an Account',
        description: 'Sign up for UNIX with your email or connect with your favorite authentication provider. Your account gives you access to all features and syncs across devices.',
        action: 'Sign Up Now',
        href: '/sign-up'
    },
    {
        number: '02',
        icon: FolderOpen,
        title: 'Start a New Project',
        description: 'Create your first writing project. Choose from templates like novels, short stories, screenplays, or start with a blank canvas tailored to your needs.',
        action: 'Create Project',
        href: '/create'
    },
    {
        number: '03',
        icon: Pen,
        title: 'Write with Power',
        description: 'Use our rich text editor to write your content. Enjoy features like auto-save, version history, and seamless formatting that stays out of your way.',
        action: 'Learn Editor Basics',
        href: '/docs'
    },
    {
        number: '04',
        icon: Sparkles,
        title: 'Unleash AI Assistance',
        description: 'Open the AI sidebar to get writing suggestions, overcome blocks, analyze your text, and maintain consistency throughout your manuscript.',
        action: 'Explore AI Features',
        href: '/docs'
    },
]

const tips = [
    'Use the keyboard shortcut Cmd/Ctrl + K to quickly access AI assistance',
    'Create a .unixrc file to define your writing style guide',
    'Export your work anytime as PDF, EPUB, or DOCX',
    'Use focus mode for distraction-free writing sessions',
]

export default function GettingStartedPage() {
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
                            Getting Started
                        </h1>
                        <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                            Begin your journey with UNIX in just a few simple steps.
                            You'll be writing with AI-powered assistance in no time.
                        </p>
                    </motion.div>

                    {/* Steps */}
                    <div className="space-y-8 mb-16">
                        {steps.map((step, index) => (
                            <motion.div
                                key={step.number}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 hover:border-zinc-700 transition-colors"
                            >
                                <div className="flex flex-col md:flex-row gap-6">
                                    {/* Number */}
                                    <div className="shrink-0">
                                        <span className="text-5xl font-bold text-zinc-800">{step.number}</span>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/20 to-purple-600/20 flex items-center justify-center">
                                                <step.icon className="w-5 h-5 text-violet-400" />
                                            </div>
                                            <h3 className="text-xl font-semibold">{step.title}</h3>
                                        </div>
                                        <p className="text-zinc-400 mb-4">{step.description}</p>
                                        <Link
                                            href={step.href}
                                            className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 transition-colors"
                                        >
                                            {step.action}
                                            <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Quick Tips */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="bg-gradient-to-r from-violet-600/10 to-purple-600/10 border border-violet-500/20 rounded-2xl p-8"
                    >
                        <h2 className="text-xl font-semibold mb-6">💡 Quick Tips</h2>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {tips.map((tip, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                                    <span className="text-zinc-300">{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Next Steps */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        className="mt-12 text-center"
                    >
                        <p className="text-zinc-500 mb-4">Ready to dive deeper?</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/docs"
                                className="px-6 py-3 bg-zinc-800 rounded-xl font-medium hover:bg-zinc-700 transition-colors"
                            >
                                Browse Documentation
                            </Link>
                            <Link
                                href="/sign-up"
                                className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl font-medium hover:from-violet-500 hover:to-purple-500 transition-all"
                            >
                                Start Writing Now
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
