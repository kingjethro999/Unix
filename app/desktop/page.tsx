"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Check } from "lucide-react";

export default function DesktopWelcomePage() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-zinc-950 px-6 text-zinc-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(8,145,178,0.16),transparent_35%),radial-gradient(circle_at_15%_85%,rgba(124,58,237,0.12),transparent_35%)]" />
      <section className="relative w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="rounded-[28px] border border-white/10 bg-zinc-900/75 p-7 shadow-2xl shadow-black/40 backdrop-blur xl:p-9">
          <div className="mb-10 flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-xl border border-white/10 bg-zinc-800/80">
              <Image
                src="/images/unix-logo.png"
                alt="Unix"
                width={28}
                height={28}
                priority
              />
            </div>
            <span className="font-mono text-sm font-semibold tracking-[0.2em] text-zinc-200">
              UNIX
            </span>
          </div>

          <div className="animate-in slide-in-from-bottom-2 fade-in duration-500 delay-150">
            <p className="mb-3 text-sm font-medium text-cyan-300">
              Your writing desk is ready.
            </p>
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-white">
              A calmer place to finish important work.
            </h1>
            <p className="mt-4 text-pretty leading-7 text-zinc-400">
              Keep your manuscripts, research, and drafts together. Your work
              stays available when a connection drops and resumes syncing when
              it returns.
            </p>
          </div>

          <div className="mt-8 grid gap-3 animate-in slide-in-from-bottom-2 fade-in duration-500 delay-300">
            <Link
              href="/sign-up?desktop=1"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-cyan-400 px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            >
              Create your workspace <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              href="/sign-in?desktop=1"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/80 px-4 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            >
              Sign in
            </Link>
          </div>

          <div className="mt-8 flex items-center gap-2 border-t border-white/8 pt-5 text-xs text-zinc-500">
            <BookOpen size={15} className="text-zinc-400" aria-hidden="true" />
            <span className="flex-1">Built for long-form writing</span>
            <Check size={15} className="text-cyan-300" aria-hidden="true" />
          </div>
        </div>
      </section>
    </main>
  );
}
