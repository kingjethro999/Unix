'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { ArrowRight, Sparkles, FileText, MessageSquare } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-zinc-950 pt-16">
      {/* Background Effects */}
      <div className="absolute inset-0">
        {/* Gradient Mesh */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-600/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px]" />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                         linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '64px 64px',
          }}
        />

        {/* Noise Texture */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 mb-8"
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-zinc-300 font-medium">
              Powered by Gemini AI
            </span>
          </motion.div>

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex justify-center mb-8"
          >
            <img
              src="/images/unix-logo.png"
              alt="UNIX"
              className="h-20 md:h-28 w-auto"
            />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-mono text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight"
          >
            The Foundational
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-emerald-400 bg-clip-text text-transparent">
              Workspace for Writers
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            A high-performance writing environment with context-aware AI. Drag
            pages into chat, get intelligent suggestions, and collaborate in
            real-time.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link
              href="/sign-up"
              className="group flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5"
            >
              Start Writing Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#features"
              className="px-8 py-4 text-zinc-300 hover:text-white font-semibold transition-colors"
            >
              See How It Works
            </a>
          </motion.div>

          {/* Feature Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            {[
              { icon: FileText, label: 'Multi-tab Editor' },
              { icon: MessageSquare, label: '@Mention Context' },
              { icon: Sparkles, label: 'Accept/Reject Diffs' },
            ].map((feature, index) => (
              <div
                key={feature.label}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800/50"
              >
                <feature.icon className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-zinc-400">{feature.label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Editor Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-20 relative"
        >
          <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm shadow-2xl shadow-black/50">
            {/* Window Chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border-b border-zinc-800">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-md bg-zinc-800 text-xs text-zinc-500 font-mono">
                  unix.app/workspace
                </div>
              </div>
            </div>

            {/* Editor Layout Preview */}
            <div className="flex h-[400px] md:h-[500px]">
              {/* Left Sidebar */}
              <div className="hidden md:block w-56 bg-zinc-950 border-r border-zinc-800 p-4">
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">
                  Pages
                </div>
                <div className="space-y-2">
                  {[
                    'Chapter One',
                    'Character Bible',
                    'Plot Outline',
                    'Research Notes',
                  ].map((page, i) => (
                    <div
                      key={page}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${i === 0 ? 'bg-blue-600/20 text-blue-400' : 'text-zinc-400 hover:bg-zinc-800'}`}
                    >
                      <FileText className="w-4 h-4" />
                      {page}
                    </div>
                  ))}
                </div>
              </div>

              {/* Main Editor */}
              <div className="flex-1 bg-zinc-950 p-8 overflow-hidden">
                <div className="max-w-2xl mx-auto">
                  <h2 className="text-2xl font-serif text-white mb-4">
                    Chapter One
                  </h2>
                  <p className="text-zinc-400 leading-relaxed mb-4">
                    The morning sun cast long shadows across the empty streets.
                    Sarah pulled her coat tighter, her breath forming small
                    clouds in the crisp autumn air.
                  </p>
                  <p className="text-zinc-400 leading-relaxed">
                    She had been walking for hours, lost in thought about the
                    letter she'd received...
                  </p>
                  <div className="mt-6 h-1 w-16 bg-blue-500 animate-pulse" />
                </div>
              </div>

              {/* Right Sidebar - AI Chat */}
              <div className="hidden lg:flex w-72 bg-zinc-950 border-l border-zinc-800 flex-col">
                <div className="p-4 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-bold text-zinc-300">
                      Unix AI
                    </span>
                  </div>
                </div>
                <div className="flex-1 p-4 space-y-4">
                  <div className="p-3 rounded-lg bg-zinc-800/50 text-sm text-zinc-400">
                    Based on @Character Bible, Sarah's eyes should be blue, not
                    brown.
                  </div>
                  <div className="p-3 rounded-lg bg-blue-600/20 text-sm text-blue-300 border border-blue-500/30">
                    Make this paragraph more suspenseful?
                  </div>
                </div>
                <div className="p-4 border-t border-zinc-800">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 text-zinc-500 text-sm">
                    <MessageSquare className="w-4 h-4" />
                    Ask Unix AI...
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Glow Effect */}
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 via-transparent to-emerald-600/20 rounded-3xl blur-3xl -z-10" />
        </motion.div>
      </div>
    </section>
  )
}
