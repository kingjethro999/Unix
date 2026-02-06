'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { ArrowRight, Sparkles } from 'lucide-react'

export function CTA() {
  return (
    <section className="relative py-24 bg-zinc-900 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[150px]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/5 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Icon */}
          <div className="inline-flex p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-8">
            <Sparkles className="w-8 h-8 text-blue-400" />
          </div>

          {/* Headline */}
          <h2 className="font-mono text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Ready to Transform
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              Your Writing?
            </span>
          </h2>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
            Join thousands of writers who've made Unix their foundational
            workspace. Start free, upgrade when you're ready.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="group flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/sign-in"
              className="px-8 py-4 text-zinc-300 hover:text-white font-semibold border border-zinc-700 hover:border-zinc-600 rounded-xl transition-all"
            >
              Sign In
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              Free forever plan
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              Cancel anytime
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
