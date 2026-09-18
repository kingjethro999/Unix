"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  Download,
  Sparkles,
  FileText,
  MessageSquare,
  Send,
  SlidersHorizontal,
} from "lucide-react";

export function Hero() {
  const pages = [
    "Chapter One",
    "Chapter Four",
    "Character Bible",
    "Research Notes",
  ];
  const initialDrafts: Record<string, string> = {
    "Chapter One":
      "The morning sun cast long shadows across the empty streets. Sarah pulled her coat tighter, her breath forming small clouds in the crisp autumn air.",
    "Chapter Four":
      "The letter had been waiting beneath the door, folded once and marked with a blue wax seal.",
    "Character Bible":
      "Sarah Vale: observant, guarded, and stubbornly kind. Her eyes are blue, not brown.",
    "Research Notes":
      "Autumn light fades early at this latitude, leaving street lamps to define the route home.",
  };
  const [activePage, setActivePage] = useState("Chapter One");
  const [drafts, setDrafts] = useState(initialDrafts);
  const [prompt, setPrompt] = useState("");
  const [chat, setChat] = useState<
    Array<{ role: "user" | "assistant"; text: string }>
  >([
    {
      role: "assistant",
      text: "I have Character Bible and Unixrc in context. Try asking me to continue, rewrite, or ask a question.",
    },
  ]);
  const [leftWidth, setLeftWidth] = useState(190);
  const [rightWidth, setRightWidth] = useState(265);
  const sendDemo = () => {
    const request = prompt.trim();
    if (!request) return;
    setChat((items) => [...items, { role: "user", text: request }]);
    const lower = request.toLowerCase();
    if (/continue|write|rewrite|suspense|expand|add/.test(lower)) {
      const addition = lower.includes("suspense")
        ? " A blue light moved behind the upstairs window. Sarah stopped breathing, because nobody should have been inside."
        : " She unfolded the letter again and followed the only instruction it contained: do not go home.";
      setDrafts((items) => ({
        ...items,
        [activePage]: `${items[activePage]}${addition}`,
      }));
      setChat((items) => [
        ...items,
        {
          role: "assistant",
          text: `Updated ${activePage} in the preview. The new passage is ready to review.`,
        },
      ]);
    } else {
      setChat((items) => [
        ...items,
        {
          role: "assistant",
          text: "In Ask mode, I answer here without changing the page. Switch to Write when you want a manuscript edit.",
        },
      ]);
    }
    setPrompt("");
  };
  return (
    <section className="relative min-h-screen overflow-hidden bg-zinc-950 pt-16">
      <div className="absolute inset-0">
        <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-blue-600/20 blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-emerald-600/10 blur-[100px]" />
      </div>
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2">
            <Sparkles className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-zinc-300">
              Built for focused writing
            </span>
          </div>
          <div className="mb-8 flex justify-center">
            <img
              src="/images/unix-logo.png"
              alt="UNIX"
              className="h-20 w-auto md:h-28"
            />
          </div>
          <h1 className="mb-6 font-mono text-4xl font-bold tracking-tight text-white md:text-6xl lg:text-7xl">
            The Foundational
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-emerald-400 bg-clip-text text-transparent">
              Workspace for Writers
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-zinc-400 md:text-xl">
            A structured writing environment with reviewable assistance.
            Preserve formatting, apply focused suggestions, and keep reusable
            writing rules beside your manuscript.
          </p>
          <div className="mb-16 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/sign-up"
              className="group flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-4 font-semibold text-white transition-all hover:bg-blue-500"
            >
              <span>Start Writing Free</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/download"
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-zinc-300"
            >
              <Download size={16} />
              Download desktop app
            </Link>
          </div>
        </div>
        <div className="relative mt-10 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 shadow-2xl shadow-black/50">
          <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900 px-4 py-3">
            <i className="h-3 w-3 rounded-full bg-red-500/80" />
            <i className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <i className="h-3 w-3 rounded-full bg-green-500/80" />
            <span className="mx-auto rounded-md bg-zinc-800 px-4 py-1 font-mono text-xs text-zinc-500">
              unix.app/workspace · interactive preview
            </span>
          </div>
          <div className="flex h-[430px] md:h-[520px]">
            <aside
              style={{ width: leftWidth }}
              className="hidden shrink-0 border-r border-zinc-800 bg-zinc-950 p-3 md:block"
            >
              <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Pages
              </p>
              {pages.map((page) => (
                <button
                  key={page}
                  onClick={() => setActivePage(page)}
                  className={`mb-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs ${activePage === page ? "bg-blue-600/20 text-blue-400" : "text-zinc-400 hover:bg-zinc-800"}`}
                >
                  <FileText size={14} />
                  {page}
                </button>
              ))}
              <div className="mt-5 border-t border-zinc-800 pt-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Unixrc
                </p>
                <p className="text-[11px] leading-5 text-zinc-400">
                  Keep Sarah observant. British spelling. Tense: past.
                </p>
              </div>
            </aside>
            <div
              className="hidden w-1 cursor-col-resize bg-transparent hover:bg-blue-500/50 md:block"
              onMouseDown={(e) => {
                const startX = e.clientX,
                  start = leftWidth;
                const move = (m: MouseEvent) =>
                  setLeftWidth(
                    Math.max(150, Math.min(260, start + m.clientX - startX)),
                  );
                const up = () => {
                  window.removeEventListener("mousemove", move);
                  window.removeEventListener("mouseup", up);
                };
                window.addEventListener("mousemove", move);
                window.addEventListener("mouseup", up);
              }}
            />
            <main className="min-w-0 flex-1 overflow-y-auto bg-zinc-950 p-7 md:p-10">
              <h2 className="mb-5 font-serif text-2xl text-white">
                {activePage}
              </h2>
              <textarea
                aria-label="Preview manuscript"
                value={drafts[activePage]}
                onChange={(e) =>
                  setDrafts((items) => ({
                    ...items,
                    [activePage]: e.target.value,
                  }))
                }
                className="min-h-[280px] w-full resize-none bg-transparent font-serif text-base leading-8 text-zinc-400 outline-none"
              />
            </main>
            <div
              className="hidden w-1 cursor-col-resize bg-transparent hover:bg-blue-500/50 lg:block"
              onMouseDown={(e) => {
                const startX = e.clientX,
                  start = rightWidth;
                const move = (m: MouseEvent) =>
                  setRightWidth(
                    Math.max(220, Math.min(360, start - m.clientX)),
                  );
                const up = () => {
                  window.removeEventListener("mousemove", move);
                  window.removeEventListener("mouseup", up);
                };
                window.addEventListener("mousemove", move);
                window.addEventListener("mouseup", up);
              }}
            />
            <aside
              style={{ width: rightWidth }}
              className="hidden min-w-0 flex-col border-l border-zinc-800 bg-zinc-950 lg:flex"
            >
              <header className="flex items-center gap-2 border-b border-zinc-800 p-3">
                <Sparkles size={15} className="text-blue-400" />
                <b className="text-xs text-zinc-300">Unix AI</b>
                <SlidersHorizontal
                  size={14}
                  className="ml-auto text-zinc-500"
                />
              </header>
              <div className="flex-1 space-y-3 overflow-y-auto p-3">
                {chat.map((item, index) => (
                  <p
                    key={index}
                    className={`rounded-lg p-2.5 text-xs leading-5 ${item.role === "user" ? "ml-4 bg-blue-600/20 text-blue-300" : "mr-2 bg-zinc-800/50 text-zinc-400"}`}
                  >
                    {item.text}
                  </p>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendDemo();
                }}
                className="border-t border-zinc-800 p-3"
              >
                <div className="flex rounded-lg bg-zinc-800 p-1">
                  <input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ask or write in preview…"
                    className="min-w-0 flex-1 bg-transparent px-2 text-xs text-zinc-300 outline-none placeholder:text-zinc-500"
                  />
                  <button
                    aria-label="Send preview request"
                    className="rounded-md bg-blue-600 p-1.5 text-white"
                  >
                    <Send size={13} />
                  </button>
                </div>
              </form>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
