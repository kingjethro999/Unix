'use client'

import Link from 'next/link'
import { ArrowLeft, Heart, Zap, Target, Shield } from 'lucide-react'
import { motion } from 'framer-motion'
import { Footer } from '@/components/landing/Footer'

const values = [
    { icon: Heart, title: 'Writer-First', description: 'Every feature helps writers create better work.' },
    { icon: Zap, title: 'Powerful Simplicity', description: 'Best tools are invisible and stay out of your way.' },
    { icon: Shield, title: 'Privacy First', description: 'Your words belong to you. Strong privacy measures.' },
]

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <img src="/images/unix-logo.png" alt="UNIX" className="h-8 w-auto" />
                        <span className="font-mono font-bold text-xl">UNIX</span>
                    </Link>
                    <Link href="/" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4" />Back to Home
                    </Link>
                </div>
            </nav>

            <main className="pt-32 pb-24 px-4">
                <div className="max-w-4xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
                        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent">About UNIX</h1>
                        <p className="text-xl text-zinc-400 max-w-2xl mx-auto">Building the future of creative writing—where AI amplifies human creativity.</p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative mb-16">
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 to-purple-600/10 blur-3xl" />
                        <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 md:p-12">
                            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
                                <Target className="w-6 h-6 text-violet-400" />Our Mission
                            </h2>
                            <p className="text-lg text-zinc-300 leading-relaxed">
                                UNIX was born from a simple observation: writers deserve better tools. We set out to create the most thoughtful, powerful, and beautiful writing environment ever made—one that understands your work and helps you achieve your creative vision.
                            </p>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
                        {[{ v: '10K+', l: 'Writers' }, { v: '50K+', l: 'Projects' }, { v: '1M+', l: 'Words Written' }, { v: '99.9%', l: 'Uptime' }].map((s, i) => (
                            <div key={i} className="p-6 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl text-center">
                                <div className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">{s.v}</div>
                                <div className="text-sm text-zinc-500 mt-1">{s.l}</div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                        {values.map((v, i) => (
                            <div key={i} className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                                <v.icon className="w-8 h-8 text-violet-400 mb-4" />
                                <h3 className="font-semibold mb-2">{v.title}</h3>
                                <p className="text-zinc-400 text-sm">{v.description}</p>
                            </div>
                        ))}
                    </div>

                    <div className="text-center">
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/careers" className="px-6 py-3 bg-zinc-800 rounded-xl font-medium hover:bg-zinc-700 transition-colors">Join Our Team</Link>
                            <Link href="/contact" className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl font-medium hover:from-violet-500 hover:to-purple-500 transition-all">Get in Touch</Link>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
