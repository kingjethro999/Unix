'use client'

import Link from 'next/link'
import { ArrowLeft, Shield } from 'lucide-react'
import { motion } from 'framer-motion'
import { Footer } from '@/components/landing/Footer'

const sections = [
    { title: 'Information We Collect', content: 'We collect information you provide directly, such as your name, email address, and content you create. We also collect usage data to improve our services, including how you interact with UNIX features.' },
    { title: 'How We Use Your Information', content: 'Your information is used to provide and improve UNIX services, communicate with you about updates and support, personalize your experience, and ensure the security of our platform.' },
    { title: 'Data Storage & Security', content: 'Your data is stored securely using industry-standard encryption. We implement technical and organizational measures to protect your information from unauthorized access, alteration, or destruction.' },
    { title: 'Your Content Ownership', content: 'You retain full ownership of all content you create in UNIX. We do not claim any intellectual property rights over your manuscripts, notes, or other creative works.' },
    { title: 'AI & Your Data', content: 'Your creative content is never used to train our AI models without your explicit consent. AI features process your content only to provide real-time assistance and suggestions.' },
    { title: 'Third-Party Services', content: 'We may use third-party services for authentication, analytics, and infrastructure. These providers are bound by strict data processing agreements and privacy standards.' },
    { title: 'Data Retention', content: 'We retain your data for as long as your account is active. Upon account deletion, your data is permanently removed from our systems within 30 days.' },
    { title: 'Your Rights', content: 'You have the right to access, correct, export, or delete your personal data at any time. Contact us at privacy@unix.app to exercise these rights.' },
]

export default function PrivacyPage() {
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
                <div className="max-w-3xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
                            <Shield className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm text-emerald-400 font-medium">Your Privacy Matters</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent">Privacy Policy</h1>
                        <p className="text-zinc-400">Last updated: February 2026</p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 md:p-8 mb-8">
                        <p className="text-zinc-300 leading-relaxed">
                            At UNIX, we take your privacy seriously. This policy explains how we collect, use, and protect your personal information. We believe in transparency and giving you control over your data.
                        </p>
                    </motion.div>

                    <div className="space-y-6">
                        {sections.map((section, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }} className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-6">
                                <h2 className="text-lg font-semibold mb-3">{section.title}</h2>
                                <p className="text-zinc-400 leading-relaxed">{section.content}</p>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-12 text-center">
                        <p className="text-zinc-500 mb-4">Questions about our privacy practices?</p>
                        <Link href="/contact" className="inline-flex px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl font-medium hover:from-violet-500 hover:to-purple-500 transition-all">Contact Us</Link>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
