"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "How does the context-aware AI work?",
    answer:
      "Unix AI automatically reads the content of your active tab. When you ask a question or request an edit, it uses that context to provide relevant responses. You can also @mention other pages to include them in the AI's context, perfect for maintaining consistency across your entire project.",
  },
  {
    question: "What is the @mention system?",
    answer:
      "Drag a page from the document sidebar into the assistant panel to include it as explicit context. Unix sends only the attached pages and the active page for that request.",
  },
  {
    question: "How does the Accept/Reject workflow work?",
    answer:
      "When the AI suggests edits, you'll see them as a visual diff: red strikethrough for deletions, green highlights for additions. A floating toolbar appears with Accept (checkmark) and Decline (X) buttons. Only when you click Accept does the change become permanent.",
  },
  {
    question: "Can I collaborate with others in real-time?",
    answer:
      "Unix currently supports a read-only sharing link. Live simultaneous editing is planned after revision and access safeguards are complete.",
  },
  {
    question: "Is my writing data secure?",
    answer:
      "Workspace membership is checked on server endpoints, credentials stay on the server, and shared links are explicit. Review your selected service settings for its data-handling terms.",
  },
  {
    question: "What file formats can I export to?",
    answer:
      "Unix exports PDF and DOCX. Rich formats preserve the structures they support; plain-text conversions have natural formatting limits.",
  },
  {
    question: "Is there a free plan?",
    answer:
      "Local development has no payment requirement. Commercial plans will be introduced only after usage limits and manuscript-access protections are ready.",
  },
  {
    question: "Which assistant mode should I use?",
    answer:
      "Use Fast for routine proofreading and short rewrites, Reasoning for difficult edits, Extensive research for source-heavy questions, and Logic for tasks with several constraints.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-24 bg-zinc-950 overflow-hidden">
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
                  className={`w-5 h-5 text-zinc-400 flex-shrink-0 transition-transform ${openIndex === index ? "rotate-180" : ""}`}
                />
              </button>
              <motion.div
                initial={false}
                animate={{
                  height: openIndex === index ? "auto" : 0,
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
  );
}
