'use client'

import Link from 'next/link'
import { ArrowLeft, Clock, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { Footer } from '@/components/landing/Footer'

export default function PricingPage() {
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
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 mb-8">
                            <Clock className="w-4 h-4 text-amber-400" />
                            <span className="text-sm text-amber-400 font-medium">Coming Soon</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent">
                            Pricing
                        </h1>

                        <p className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                            We're crafting the perfect pricing plans to match every writer's journey.
                            From hobbyists to professional authors, we'll have something for everyone.
                        </p>
                    </motion.div>

                    {/* Coming Soon Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 via-purple-600/20 to-fuchsia-600/20 blur-3xl" />
                        <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-12">
                            <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
                                <Sparkles className="w-10 h-10 text-white" />
                            </div>

                            <h2 className="text-2xl font-semibold mb-4">Something Amazing is Brewing</h2>
                            <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                                Our team is working hard to bring you flexible and fair pricing options.
                                Stay tuned for exciting announcements!
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    href="/sign-up"
                                    className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl font-medium hover:from-violet-500 hover:to-purple-500 transition-all"
                                >
                                    Join the Waitlist
                                </Link>
                                <Link
                                    href="/"
                                    className="px-6 py-3 bg-zinc-800 rounded-xl font-medium hover:bg-zinc-700 transition-colors"
                                >
                                    Explore Features
                                </Link>
                            </div>
                        </div>
                    </motion.div>

                    {/* Teaser */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                        {[
                            { title: 'Free Tier', desc: 'Perfect for getting started with UNIX' },
                            { title: 'Pro Plan', desc: 'For serious writers and authors' },
                            { title: 'Team Plan', desc: 'Collaborate with your writing team' },
                        ].map((plan, i) => (
                            <div
                                key={i}
                                className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 backdrop-blur"
                            >
                                <h3 className="font-semibold mb-2">{plan.title}</h3>
                                <p className="text-sm text-zinc-500">{plan.desc}</p>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
