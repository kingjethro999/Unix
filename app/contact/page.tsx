'use client'

import Link from 'next/link'
import { ArrowLeft, Mail, MessageSquare, MapPin, Send } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Footer } from '@/components/landing/Footer'

export default function ContactPage() {
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setSubmitStatus('idle')

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (!response.ok) throw new Error('Failed to send')

            setSubmitStatus('success')
            setFormData({ name: '', email: '', subject: '', message: '' })
        } catch {
            setSubmitStatus('error')
        } finally {
            setIsSubmitting(false)
        }
    }


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
                <div className="max-w-5xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
                        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent">Contact Us</h1>
                        <p className="text-xl text-zinc-400 max-w-2xl mx-auto">Have questions or feedback? We'd love to hear from you.</p>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Contact Info */}
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                            <h2 className="text-2xl font-semibold mb-6">Get in Touch</h2>
                            <div className="space-y-6">
                                {[
                                    { icon: Mail, title: 'Email', value: 'jethrojerrybj@gmail.com', href: 'mailto:jethrojerrybj@gmail.com' },
                                    { icon: MessageSquare, title: 'Support', value: 'jethrojerrybj@gmail.com', href: 'mailto:jethrojerrybj@gmail.com' },
                                    { icon: MapPin, title: 'Location', value: 'Abuja, Nigeria', href: null },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                                        <div className="w-10 h-10 rounded-lg bg-violet-600/20 flex items-center justify-center shrink-0">
                                            <item.icon className="w-5 h-5 text-violet-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-zinc-500">{item.title}</p>
                                            {item.href ? (
                                                <a href={item.href} className="text-white hover:text-violet-400 transition-colors">{item.value}</a>
                                            ) : (
                                                <p className="text-white">{item.value}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 p-6 bg-gradient-to-r from-violet-600/10 to-purple-600/10 border border-violet-500/20 rounded-2xl">
                                <h3 className="font-semibold mb-2">Response Time</h3>
                                <p className="text-zinc-400 text-sm">We typically respond within 24-48 hours during business days.</p>
                            </div>
                        </motion.div>

                        {/* Contact Form */}
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                            <form onSubmit={handleSubmit} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 md:p-8">
                                <h2 className="text-2xl font-semibold mb-6">Send a Message</h2>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-2">Name</label>
                                            <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-violet-500" placeholder="Your name" />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-2">Email</label>
                                            <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-violet-500" placeholder="you@example.com" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-zinc-400 mb-2">Subject</label>
                                        <input type="text" required value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-violet-500" placeholder="How can we help?" />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-zinc-400 mb-2">Message</label>
                                        <textarea required rows={5} value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-violet-500 resize-none" placeholder="Tell us more..." />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl font-medium hover:from-violet-500 hover:to-purple-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4" />
                                                Send Message
                                            </>
                                        )}
                                    </button>
                                    {submitStatus === 'success' && (
                                        <p className="text-emerald-400 text-sm text-center mt-4">
                                            ✓ Message sent successfully! We'll get back to you soon.
                                        </p>
                                    )}
                                    {submitStatus === 'error' && (
                                        <p className="text-red-400 text-sm text-center mt-4">
                                            ✕ Failed to send message. Please try again or email us directly.
                                        </p>
                                    )}
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
