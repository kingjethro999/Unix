'use client'

import { motion } from 'motion/react'
import { Star } from 'lucide-react'

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Novelist',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    content:
      'The @mention system is a game-changer. I can reference my character bible while writing and the AI keeps everything consistent across 200+ pages.',
    rating: 5,
  },
  {
    name: 'Marcus Williams',
    role: 'Technical Writer',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    content:
      'Finally, a writing tool that thinks like a developer. The diff view for AI suggestions is exactly what I needed. Accept or reject with confidence.',
    rating: 5,
  },
  {
    name: 'Elena Rodriguez',
    role: 'Screenwriter',
    avatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    content:
      'Collaborating with my writing partner has never been smoother. Real-time sync, shared context, and an AI that understands our story.',
    rating: 5,
  },
  {
    name: 'James Park',
    role: 'Content Strategist',
    avatar:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    content:
      'I manage 50+ content pieces. The nested folders and instant search make Unix feel like a second brain for my entire content library.',
    rating: 5,
  },
  {
    name: 'Aisha Patel',
    role: 'Academic Researcher',
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
    content:
      'The context-aware AI helped me maintain consistency across my 300-page dissertation. It caught contradictions I would have missed.',
    rating: 5,
  },
  {
    name: 'David Kim',
    role: 'Indie Game Writer',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    content:
      'Writing branching narratives is complex. Unix lets me keep all story paths organized and the AI helps maintain character voice across branches.',
    rating: 5,
  },
]

export function Testimonials() {
  return (
    <section id="testimonials" className="relative py-24 bg-zinc-900 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/5 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-600/5 rounded-full blur-[100px]" />
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
          <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium mb-4">
            Testimonials
          </span>
          <h2 className="font-mono text-3xl md:text-5xl font-bold text-white mb-4">
            Loved by Writers
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            From novelists to technical writers, Unix is the workspace
            professionals trust.
          </p>
        </motion.div>

        {/* Testimonial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-6 rounded-2xl bg-zinc-950/50 border border-zinc-800/50 hover:border-zinc-700/50 transition-all"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              {/* Content */}
              <p className="text-zinc-300 mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <div className="font-medium text-white">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-zinc-500">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
