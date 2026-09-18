"use client";

import { ArrowUp, Check, RotateCcw, Sparkles, X } from "lucide-react";
import { useEffect, useRef } from "react";

interface InlineAIComposerProps {
  position: { left: number; top: number };
  selectedText?: string;
  value: string;
  onChange: (value: string) => void;
  isWorking?: boolean;
  suggestion?: string | null;
  error?: string | null;
  onSubmit: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  onRetry?: () => void;
  onClose: () => void;
  onQuickAction: (action: string) => void;
}

export function InlineAIComposer({
  position,
  selectedText,
  value,
  onChange,
  isWorking = false,
  suggestion,
  error,
  onSubmit,
  onAccept,
  onReject,
  onRetry,
  onClose,
  onQuickAction,
}: InlineAIComposerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => inputRef.current?.focus(), []);

  return (
    <section
      className="fixed z-50 w-[420px] max-w-[calc(100vw-24px)] overflow-hidden rounded-xl border border-white/[0.1] bg-[#19191c] shadow-[0_18px_60px_rgba(0,0,0,0.45)]"
      style={{
        left: position.left,
        top: position.top,
      }}
      aria-label="Inline Unix request"
    >
      {selectedText && !suggestion && (
        <div className="border-b border-white/[0.055] px-3 py-2">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-600">
            <Sparkles className="h-3 w-3" /> Selection
          </div>
          <p className="line-clamp-2 text-[11.5px] leading-5 text-zinc-500">
            {selectedText}
          </p>
        </div>
      )}

      {!suggestion ? (
        <>
          <div className="flex items-center gap-2 px-3 py-2.5">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
            <input
              ref={inputRef}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  onClose();
                }
                if (event.key === "Enter" && value.trim() && !isWorking) {
                  event.preventDefault();
                  onSubmit();
                }
              }}
              placeholder={
                selectedText
                  ? "Ask Unix to change this..."
                  : "Ask Unix to write here..."
              }
              className="min-w-0 flex-1 bg-transparent text-[12.5px] text-zinc-200 outline-none placeholder:text-zinc-600"
            />
            <button
              type="button"
              aria-label="Send inline request"
              disabled={!value.trim() || isWorking}
              onClick={onSubmit}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-950 transition hover:bg-white disabled:bg-white/[0.06] disabled:text-zinc-600"
            >
              {isWorking ? (
                <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
              ) : (
                <ArrowUp className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
          <div className="flex items-center border-t border-white/[0.05] px-2 py-1.5">
            {["Rewrite", "Shorten", "Improve"].map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => onQuickAction(action)}
                className="rounded-md px-2 py-1 text-[10.5px] text-zinc-500 transition hover:bg-white/[0.05] hover:text-zinc-300"
              >
                {action}
              </button>
            ))}
            <button
              type="button"
              onClick={onClose}
              className="ml-auto flex h-6 w-6 items-center justify-center rounded-md text-zinc-600 hover:bg-white/[0.05] hover:text-zinc-300"
              aria-label="Close inline request"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {error && (
            <p className="border-t border-white/[0.05] px-3 py-2 text-[10.5px] leading-4 text-amber-300">
              {error}
            </p>
          )}
        </>
      ) : (
        <>
          <div className="px-3 py-3">
            <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-600">
              Unix suggestion
            </div>
            <p className="max-h-[240px] overflow-y-auto whitespace-pre-wrap text-[12.5px] leading-[1.65] text-zinc-300">
              {suggestion}
            </p>
          </div>
          <div className="flex items-center border-t border-white/[0.055] px-2 py-1.5">
            <button
              type="button"
              onClick={onAccept}
              className="flex h-7 items-center gap-1.5 rounded-md bg-zinc-100 px-2.5 text-[10.5px] font-medium text-zinc-950 hover:bg-white"
            >
              <Check className="h-3 w-3" /> Accept
            </button>
            <button
              type="button"
              onClick={onReject}
              className="ml-1 flex h-7 items-center gap-1.5 rounded-md px-2 text-[10.5px] text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-300"
            >
              <X className="h-3 w-3" /> Reject
            </button>
            <button
              type="button"
              onClick={onRetry}
              className="ml-1 flex h-7 items-center gap-1.5 rounded-md px-2 text-[10.5px] text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-300"
            >
              <RotateCcw className="h-3 w-3" /> Retry
            </button>
          </div>
        </>
      )}
    </section>
  );
}
