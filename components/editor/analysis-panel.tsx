"use client";

import { useState } from "react";
import { AlertCircle, BarChart3, CheckCircle2, Play } from "lucide-react";
import { useActiveFile, useEditorState } from "./editor-store";

type Finding = {
  type: string;
  severity: "suggestion" | "attention" | "strength";
  passage: string;
  suggestion: string;
};
export function AnalysisPanel() {
  const file = useActiveFile();
  const state = useEditorState();
  const [types, setTypes] = useState([
    "writing",
    "structure",
    "tone",
    "readability",
  ]);
  const [summary, setSummary] = useState("");
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const run = async () => {
    if (!file || !state.workspaceId) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: state.workspaceId,
          documentId: file.id,
          types,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Analysis failed");
      setSummary(data.summary);
      setFindings(data.findings || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };
  const toggle = (type: string) =>
    setTypes((current) =>
      current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type],
    );
  return (
    <div className="h-full overflow-y-auto bg-zinc-950 p-4">
      <div className="flex items-center gap-2">
        <BarChart3 size={16} className="text-pink-400" />
        <h2 className="text-sm font-semibold text-zinc-100">Analysis</h2>
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        Review the active document for focused, actionable suggestions.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {["writing", "structure", "tone", "readability"].map((type) => (
          <label
            key={type}
            className="flex items-center gap-2 rounded border border-zinc-800 bg-zinc-900 px-2 py-2 text-xs text-zinc-300"
          >
            <input
              type="checkbox"
              checked={types.includes(type)}
              onChange={() => toggle(type)}
            />
            {type[0].toUpperCase() + type.slice(1)}
          </label>
        ))}
      </div>
      <button
        type="button"
        disabled={loading || !types.length || !file}
        onClick={() => void run()}
        className="mt-3 flex items-center gap-2 rounded bg-pink-600 px-3 py-2 text-xs text-white disabled:opacity-50"
      >
        <Play size={13} />
        {loading ? "Analyzing…" : "Run analysis"}
      </button>
      {error && (
        <p className="mt-3 flex gap-2 text-xs text-red-400">
          <AlertCircle size={14} />
          {error}
        </p>
      )}
      {summary && (
        <p className="mt-5 rounded border border-zinc-800 bg-zinc-900/60 p-3 text-xs leading-relaxed text-zinc-300">
          {summary}
        </p>
      )}
      <div className="mt-4 space-y-2">
        {findings.map((finding, index) => (
          <article
            key={`${finding.type}-${index}`}
            className="rounded border border-zinc-800 bg-zinc-900/60 p-3"
          >
            <p className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-zinc-500">
              {finding.severity === "strength" ? (
                <CheckCircle2 size={13} className="text-emerald-400" />
              ) : (
                <AlertCircle size={13} className="text-amber-400" />
              )}
              {finding.type}
            </p>
            <p className="mt-2 text-xs text-zinc-300">{finding.passage}</p>
            <p className="mt-2 text-xs text-zinc-500">{finding.suggestion}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
