'use client'

import { motion } from 'motion/react'
import {
  Sparkles,
  FileText,
  GitCompare,
  Users,
  Zap,
  Shield,
  Layers,
  MessageSquare,
} from 'lucide-react'

const features = [
  {
    icon: Sparkles,
    title: 'Context-Aware AI',
    description:
      'Gemini 1.5 reads your active page and understands your entire notebook. Ask questions, get edits, maintain continuity.',
    color: 'blue',
  },
  {
    icon: MessageSquare,
    title: '@Mention System',
    description:
      'Drag pages into chat or type @ to reference specific chapters. The AI uses that context for accurate responses.',
    color: 'emerald',
  },
  {
    icon: GitCompare,
    title: 'Accept/Reject Diffs',
    description:
      'See AI suggestions as red/green diffs. Review changes line-by-line before committing. Never lose your voice.',
    color: 'purple',
  },
  {
    icon: Layers,
    title: 'Multi-Tab Editor',
    description:
      'Keep your character bible open in one tab, your chapter in another. Switch instantly like a code editor.',
    color: 'orange',
  },
  {
    icon: Users,
    title: 'Real-Time Collaboration',
    description:
      'Share folders with view or edit access. See collaborator cursors. Work together on the same document.',
    color: 'pink',
  },
  {
    icon: Zap,
    title: 'Instant Sync',
    description:
      'Every keystroke is debounced and synced. Your work is always saved. Never lose a single word.',
    color: 'yellow',
  },
  {
    icon: FileText,
    title: 'Nested Folders',
    description:
      'Organize your novel with infinite nesting. Drag and drop to restructure. Search across all pages instantly.',
    color: 'cyan',
  },
  {
    icon: Shield,
    title: 'Privacy Controls',
    description:
      'Keep folders private, share via link, or require approval. You control who sees your work.',
    color: 'red',
  },
]

const colorClasses = {
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  pink: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  red: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export function Features() {
  return (
    <section id="features" className="relative py-24 bg-zinc-950">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-blue-600/5 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium mb-4">
            Features
          </span>
          <h2 className="font-mono text-3xl md:text-5xl font-bold text-white mb-4">
            Built for Serious Writers
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Every feature designed to keep you in flow. No distractions, just
            powerful tools that understand your craft.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700/50 transition-all hover:-translate-y-1"
            >
              {/* Icon */}
              <div
                className={`inline-flex p-3 rounded-xl border ${colorClasses[feature.color as keyof typeof colorClasses]} mb-4`}
              >
                <feature.icon className="w-6 h-6" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {feature.description}
              </p>

              {/* Hover Glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <p className="text-zinc-500 mb-4">
            And much more: keyboard shortcuts, focus mode, export to
            Markdown/PDF...
          </p>
        </motion.div>
      </div>
    </section>
  )
}
