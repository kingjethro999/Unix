'use client'

import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'
import { motion } from 'framer-motion'
import { Footer } from '@/components/landing/Footer'

const sections = [
    { title: '1. Acceptance of Terms', content: 'By accessing or using UNIX, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.' },
    { title: '2. Description of Service', content: 'UNIX is an AI-powered writing platform designed for creative writers. We provide tools for writing, editing, organizing, and exporting creative content.' },
    { title: '3. Account Registration', content: 'You must provide accurate information when creating an account. You are responsible for maintaining the security of your account credentials and for all activities under your account.' },
    { title: '4. User Content', content: 'You retain all rights to content you create using UNIX. By using our service, you grant us a limited license to store and process your content solely to provide our services to you.' },
    { title: '5. Acceptable Use', content: 'You agree not to use UNIX for any illegal purposes, to harass others, to distribute malware, or to attempt to gain unauthorized access to our systems or other users\' accounts.' },
    { title: '6. AI Features', content: 'Our AI features are provided as writing assistance tools. You are responsible for reviewing and editing AI-generated suggestions. We do not guarantee the accuracy or appropriateness of AI output.' },
    { title: '7. Intellectual Property', content: 'UNIX and its original content, features, and functionality are owned by UNIX and are protected by international copyright, trademark, and other intellectual property laws.' },
    { title: '8. Termination', content: 'We may terminate or suspend your account at any time for violations of these terms. You may also delete your account at any time through your account settings.' },
    { title: '9. Limitation of Liability', content: 'UNIX is provided "as is" without warranties. We shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services.' },
    { title: '10. Changes to Terms', content: 'We reserve the right to modify these terms at any time. We will notify users of significant changes via email or through the platform.' },
]

export default function TermsPage() {
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
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6">
                            <FileText className="w-4 h-4 text-violet-400" />
                            <span className="text-sm text-violet-400 font-medium">Legal</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent">Terms of Service</h1>
                        <p className="text-zinc-400">Last updated: February 2026</p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 md:p-8 mb-8">
                        <p className="text-zinc-300 leading-relaxed">
                            Welcome to UNIX. These Terms of Service govern your use of our platform and services. Please read them carefully before using UNIX.
                        </p>
                    </motion.div>

                    <div className="space-y-6">
                        {sections.map((section, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.03 }} className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-6">
                                <h2 className="text-lg font-semibold mb-3">{section.title}</h2>
                                <p className="text-zinc-400 leading-relaxed">{section.content}</p>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-12 text-center">
                        <p className="text-zinc-500 mb-4">Have questions about our terms?</p>
                        <Link href="/contact" className="inline-flex px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl font-medium hover:from-violet-500 hover:to-purple-500 transition-all">Contact Us</Link>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
