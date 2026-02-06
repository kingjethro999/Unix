'use client'

import { motion } from 'motion/react'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: 'How does the context-aware AI work?',
    answer:
      "Unix AI automatically reads the content of your active tab. When you ask a question or request an edit, it uses that context to provide relevant responses. You can also @mention other pages to include them in the AI's context, perfect for maintaining consistency across your entire project.",
  },
  {
    question: 'What is the @mention system?',
    answer:
      'You can drag any page from your sidebar into the AI chat, or type @ to see a list of your pages. When you mention a page, its content is included in the AI\'s context. For example, you can ask "Based on @CharacterBible, what color are Sarah\'s eyes?" and get accurate answers.',
  },
  {
    question: 'How does the Accept/Reject workflow work?',
    answer:
      "When the AI suggests edits, you'll see them as a visual diff: red strikethrough for deletions, green highlights for additions. A floating toolbar appears with Accept (checkmark) and Decline (X) buttons. Only when you click Accept does the change become permanent.",
  },
  {
    question: 'Can I collaborate with others in real-time?',
    answer:
      'Yes! You can share folders with three privacy levels: Private (only you), Link Access (anyone with the link can view or edit), or Request Access (visitors must request permission). Collaborators see changes in real-time and can use the AI features too.',
  },
  {
    question: 'Is my writing data secure?',
    answer:
      'Absolutely. Your data is stored securely with row-level security policies. Only you (and people you explicitly share with) can access your folders. We never train AI models on your content. Your creative work remains yours.',
  },
  {
    question: 'What file formats can I export to?',
    answer:
      'Unix supports export to clean Markdown (for web publishing) and formatted PDF/Docx (for manuscript submission). The export engine preserves your formatting including headings, bold, italics, and more.',
  },
  {
    question: 'Is there a free plan?',
    answer:
      'Yes! You can start writing for free with generous limits. Our free tier includes unlimited pages, basic AI features, and collaboration with up to 2 people. Upgrade to Pro for unlimited AI requests, advanced features, and priority support.',
  },
  {
    question: 'Which AI model powers Unix?',
    answer:
      "Unix is powered by Google's Gemini 1.5 Pro/Flash models. These models excel at understanding long-form content and maintaining context across large documents—perfect for novels, research papers, and complex writing projects.",
  },
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="relative py-24 bg-zinc-950">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-[128px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-purple-500/10 text-purple-400 text-sm font-medium mb-4">
            FAQ
          </span>
          <h2 className="font-mono text-3xl md:text-5xl font-bold text-white mb-4">
            Common Questions
          </h2>
          <p className="text-lg text-zinc-400">
            Everything you need to know about Unix.
          </p>
        </motion.div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="rounded-xl border border-zinc-800 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-5 text-left bg-zinc-900/50 hover:bg-zinc-900 transition-colors"
              >
                <span className="font-medium text-white pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-zinc-400 flex-shrink-0 transition-transform ${openIndex === index ? 'rotate-180' : ''}`}
                />
              </button>
              <motion.div
                initial={false}
                animate={{
                  height: openIndex === index ? 'auto' : 0,
                  opacity: openIndex === index ? 1 : 0,
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="p-5 pt-0 text-zinc-400 leading-relaxed">
                  {faq.answer}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
