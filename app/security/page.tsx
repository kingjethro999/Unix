'use client'

import Link from 'next/link'
import { ArrowLeft, Shield, Lock, Server, Eye, Key, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { Footer } from '@/components/landing/Footer'

const features = [
    { icon: Lock, title: 'End-to-End Encryption', description: 'All data transmitted between your device and our servers is encrypted using TLS 1.3.' },
    { icon: Server, title: 'Secure Infrastructure', description: 'Our servers are hosted in SOC 2 compliant data centers with 24/7 monitoring.' },
    { icon: Eye, title: 'Access Controls', description: 'Strict role-based access controls ensure only authorized personnel can access systems.' },
    { icon: Key, title: 'Authentication', description: 'Support for strong passwords, two-factor authentication, and SSO integration.' },
    { icon: RefreshCw, title: 'Regular Audits', description: 'We conduct regular security audits and penetration testing to identify vulnerabilities.' },
    { icon: Shield, title: 'Data Backup', description: 'Automated encrypted backups ensure your work is never lost.' },
]

const practices = [
    'All employee access requires multi-factor authentication',
    'Regular security training for all team members',
    'Immediate incident response protocols',
    'Continuous monitoring for suspicious activity',
    'Regular software updates and patch management',
    'Encrypted database storage at rest',
]

export default function SecurityPage() {
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
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
                            <Shield className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm text-emerald-400 font-medium">Enterprise-Grade Security</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent">Security</h1>
                        <p className="text-xl text-zinc-400 max-w-2xl mx-auto">Your creative work deserves the highest level of protection. Here's how we keep it safe.</p>
                    </motion.div>

                    {/* Security Features */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                        {features.map((feature, i) => (
                            <div key={i} className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-colors">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600/20 to-teal-600/20 flex items-center justify-center mb-4">
                                    <feature.icon className="w-6 h-6 text-emerald-400" />
                                </div>
                                <h3 className="font-semibold mb-2">{feature.title}</h3>
                                <p className="text-sm text-zinc-400">{feature.description}</p>
                            </div>
                        ))}
                    </motion.div>

                    {/* Security Practices */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 mb-16">
                        <h2 className="text-2xl font-semibold mb-6">Our Security Practices</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {practices.map((practice, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full shrink-0" />
                                    <span className="text-zinc-300">{practice}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Report Section */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-gradient-to-r from-violet-600/10 to-purple-600/10 border border-violet-500/20 rounded-2xl p-8 text-center">
                        <h2 className="text-xl font-semibold mb-4">Report a Vulnerability</h2>
                        <p className="text-zinc-400 mb-6">Found a security issue? We appreciate responsible disclosure and will respond promptly.</p>
                        <a href="mailto:security@unix.app" className="inline-flex px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl font-medium hover:from-violet-500 hover:to-purple-500 transition-all">security@unix.app</a>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
