"use client";

import { useEffect, useState, useTransition } from "react";
import { GitBranch, History, Merge, RotateCcw } from "lucide-react";
import {
  createBranch,
  listBranches,
  listVersions,
  mergeBranch,
  restoreVersion,
  switchBranch,
} from "@/app/actions/versions";
import { editorStore, useActiveFile } from "./editor-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Version = {
  id: string;
  revision: number;
  content_text: string;
  reason: string;
  created_at: string;
  email: string;
};
type Branch = {
  id: string;
  name: string;
  content_text: string;
  source_revision: number;
  active: boolean;
  updated_at: string;
};
export function VersionsPanel() {
  const file = useActiveFile();
  const [versions, setVersions] = useState<Version[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [newName, setNewName] = useState("");
  const [pending, startTransition] = useTransition();
  const reload = () => {
    if (file) {
      void listVersions(file.id)
        .then((items) => setVersions(items as Version[]))
        .catch(() => setVersions([]));
      void listBranches(file.id)
        .then((items) => setBranches(items as Branch[]))
        .catch(() => setBranches([]));
    }
  };
  useEffect(reload, [file?.id, file?.revision]);
  if (!file)
    return (
      <div className="p-4 text-xs text-zinc-500">
        Select a document to view versions.
      </div>
    );
  const restore = (version: Version) =>
    startTransition(async () => {
      try {
        const result = await restoreVersion({
          documentId: file.id,
          revision: version.revision,
          expectedRevision: file.revision,
        });
        editorStore.replaceLoadedFile(
          file.id,
          result.document,
          result.text,
          result.revision,
        );
        reload();
      } catch {
        /* Keep the current draft when a version is stale. */
      }
    });
  const branch = () => {
    if (!newName.trim()) return;
    startTransition(async () => {
      await createBranch({
        documentId: file.id,
        name: newName,
        document: file.document,
        revision: file.revision,
      });
      setNewName("");
      reload();
    });
  };
  const apply = (item: Branch, merge: boolean) =>
    startTransition(async () => {
      const result = merge
        ? await mergeBranch({
            documentId: file.id,
            branchId: item.id,
            expectedRevision: file.revision,
          })
        : await switchBranch({
            documentId: file.id,
            branchId: item.id,
            expectedRevision: file.revision,
          });
      editorStore.replaceLoadedFile(
        file.id,
        result.document,
        result.text,
        result.revision,
      );
      reload();
    });
  return (
    <div className="h-full overflow-y-auto bg-zinc-950 p-4">
      <div className="flex items-center gap-2">
        <History size={16} className="text-cyan-400" />
        <h2 className="text-sm font-semibold text-zinc-100">Draft history</h2>
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        Explore alternate drafts, return to an earlier version, or bring a draft
        into the main manuscript.
      </p>
      <section className="mt-4 rounded-lg border border-zinc-800 p-3">
        <p className="mb-2 text-xs font-medium">Create an alternate draft</p>
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="A quieter ending"
          />
          <Button
            size="sm"
            disabled={pending || !newName.trim()}
            onClick={branch}
          >
            <GitBranch />
            Create
          </Button>
        </div>
      </section>
      <div className="mt-4 space-y-2">
        {branches.map((item) => (
          <article
            key={item.id}
            className={`rounded border p-3 ${item.active ? "border-violet-500/50 bg-violet-500/5" : "border-zinc-800 bg-zinc-900/60"}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-200">
                  {item.name}
                  {item.active && (
                    <span className="ml-2 text-[10px] text-violet-400">
                      Open draft
                    </span>
                  )}
                </p>
                <p className="text-[10px] text-zinc-600">
                  Started from revision {item.source_revision}
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  title="Open this draft"
                  disabled={pending || item.active}
                  onClick={() => apply(item, false)}
                >
                  <GitBranch />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Use this draft as the manuscript"
                  disabled={pending}
                  onClick={() => apply(item, true)}
                >
                  <Merge />
                </Button>
              </div>
            </div>
            <p className="mt-2 line-clamp-2 text-xs text-zinc-500">
              {item.content_text || "Empty draft"}
            </p>
          </article>
        ))}
      </div>
      <p className="mt-6 text-[10px] uppercase tracking-wider text-zinc-600">
        Saved versions
      </p>
      <div className="mt-2 space-y-2">
        {versions.map((version) => (
          <article
            key={version.id}
            className="rounded border border-zinc-800 bg-zinc-900/60 p-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-200">
                  Revision {version.revision}
                </p>
                <p className="text-[10px] text-zinc-600">
                  {version.reason} ·{" "}
                  {new Date(version.created_at).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Restore revision ${version.revision}`}
                disabled={pending || version.revision >= file.revision}
                onClick={() => restore(version)}
                className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-cyan-300 disabled:opacity-30"
              >
                <RotateCcw size={14} />
              </button>
            </div>
            <p className="mt-2 line-clamp-3 text-xs text-zinc-400">
              {version.content_text}
            </p>
          </article>
        ))}
        {!versions.length && (
          <p className="py-8 text-center text-xs text-zinc-600">
            No earlier versions yet.
          </p>
        )}
      </div>
    </div>
  );
}
