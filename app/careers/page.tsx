'use client'

import Link from 'next/link'
import { ArrowLeft, Clock, Users, Heart, Rocket } from 'lucide-react'
import { motion } from 'framer-motion'
import { Footer } from '@/components/landing/Footer'

export default function CareersPage() {
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
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 mb-8">
                            <Clock className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm text-emerald-400 font-medium">Coming Soon</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent">
                            Careers
                        </h1>

                        <p className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                            We're building the future of creative writing tools. Soon, we'll be looking for
                            passionate individuals to join our mission.
                        </p>
                    </motion.div>

                    {/* Coming Soon Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-teal-600/20 to-cyan-600/20 blur-3xl" />
                        <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-12">
                            <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center">
                                <Users className="w-10 h-10 text-white" />
                            </div>

                            <h2 className="text-2xl font-semibold mb-4">Join Our Growing Team</h2>
                            <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                                We're not hiring just yet, but we're excited about the future.
                                Check back soon for open positions!
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    href="/contact"
                                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl font-medium hover:from-emerald-500 hover:to-teal-500 transition-all"
                                >
                                    Get in Touch
                                </Link>
                                <Link
                                    href="/about"
                                    className="px-6 py-3 bg-zinc-800 rounded-xl font-medium hover:bg-zinc-700 transition-colors"
                                >
                                    Learn About Us
                                </Link>
                            </div>
                        </div>
                    </motion.div>

                    {/* Values Preview */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                        {[
                            { icon: Heart, title: 'Passion First', desc: 'We love what we build' },
                            { icon: Rocket, title: 'Innovation', desc: 'Pushing boundaries daily' },
                            { icon: Users, title: 'Team Spirit', desc: 'Growing together' },
                        ].map((value, i) => (
                            <div
                                key={i}
                                className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 backdrop-blur"
                            >
                                <value.icon className="w-8 h-8 text-emerald-400 mb-4 mx-auto" />
                                <h3 className="font-semibold mb-2">{value.title}</h3>
                                <p className="text-sm text-zinc-500">{value.desc}</p>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
