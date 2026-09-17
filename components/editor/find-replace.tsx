"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { Search, X } from "lucide-react";

/** Transaction-based find/replace. It never serializes or rebuilds the document. */
export function FindReplace({
  editor,
  onClose,
}: {
  editor: Editor;
  onClose: () => void;
}) {
  const [find, setFind] = useState("");
  const [replace, setReplace] = useState("");
  const [message, setMessage] = useState("");
  const run = (all: boolean) => {
    if (!find) return;
    const { doc } = editor.state;
    const ranges: Array<{ from: number; to: number }> = [];
    doc.descendants((node, pos) => {
      if (!node.isText || !node.text) return;
      let offset = 0;
      while (true) {
        const index = node.text.indexOf(find, offset);
        if (index < 0) break;
        ranges.push({ from: pos + index, to: pos + index + find.length });
        offset = index + find.length;
        if (!all) break;
      }
      return false;
    });
    if (!ranges.length) {
      setMessage("No matches found");
      return;
    }
    const transaction = editor.state.tr;
    for (const range of all ? [...ranges].reverse() : [ranges[0]])
      transaction.insertText(replace, range.from, range.to);
    editor.view.dispatch(transaction);
    setMessage(
      `${all ? ranges.length : 1} replacement${ranges.length === 1 ? "" : "s"} applied`,
    );
  };
  return (
    <div className="absolute right-4 top-12 z-20 w-72 rounded-lg border border-zinc-700 bg-zinc-900 p-3 shadow-xl">
      <div className="mb-2 flex items-center justify-between text-xs text-zinc-300">
        <span className="flex items-center gap-1">
          <Search size={13} />
          Find and replace
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close find and replace"
        >
          <X size={14} />
        </button>
      </div>
      <input
        autoFocus
        value={find}
        onChange={(e) => setFind(e.target.value)}
        placeholder="Find"
        className="mb-2 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs"
      />
      <input
        value={replace}
        onChange={(e) => setReplace(e.target.value)}
        placeholder="Replace with"
        className="mb-2 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => run(false)}
          className="flex-1 rounded bg-zinc-800 px-2 py-1.5 text-[11px]"
        >
          Replace
        </button>
        <button
          type="button"
          onClick={() => run(true)}
          className="flex-1 rounded bg-cyan-700 px-2 py-1.5 text-[11px]"
        >
          Replace all
        </button>
      </div>
      {message && <p className="mt-2 text-[10px] text-zinc-500">{message}</p>}
    </div>
  );
}
