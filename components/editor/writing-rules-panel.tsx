"use client";

import { useEffect, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  createRule,
  deleteRule,
  getUnixrc,
  listRules,
  saveUnixrc,
  updateRule,
} from "@/app/actions/rules";
import { useActiveFile, useEditorState } from "./editor-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface Rule {
  id: string;
  document_id: string | null;
  name: string;
  instruction: string;
  enabled: boolean;
}

export function WritingRulesPanel() {
  const state = useEditorState();
  const activeFile = useActiveFile();
  const [rules, setRules] = useState<Rule[]>([]);
  const [name, setName] = useState("");
  const [instruction, setInstruction] = useState("");
  const [scope, setScope] = useState<"workspace" | "document">("workspace");
  const [pending, startTransition] = useTransition();
  const [unixrc, setUnixrc] = useState("");

  const reload = () => {
    if (!state.workspaceId) return;
    void listRules(state.workspaceId, activeFile?.id).then((items) =>
      setRules((items as Rule[]).filter((rule) => rule.name !== ".unixrc")),
    );
    void getUnixrc(state.workspaceId).then((rule) =>
      setUnixrc(rule?.instruction || ""),
    );
  };
  useEffect(reload, [state.workspaceId, activeFile?.id]);

  const add = () =>
    startTransition(async () => {
      if (!state.workspaceId || !name.trim() || !instruction.trim()) return;
      await createRule({
        workspaceId: state.workspaceId,
        documentId: scope === "document" ? activeFile?.id : null,
        name,
        instruction,
        enabled: true,
      });
      setName("");
      setInstruction("");
      reload();
    });

  return (
    <div className="h-full overflow-y-auto border-l border-zinc-800/50 bg-zinc-950 p-4">
      <h2 className="text-sm font-semibold text-zinc-100">.unixrc</h2>
      <p className="mt-1 text-xs text-zinc-500">
        Use plain English to tell Unix how writing across this workspace should
        sound and behave.
      </p>
      <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
        <Textarea
          value={unixrc}
          onChange={(event) => setUnixrc(event.target.value)}
          placeholder="Use British spelling. Write in close third person. Keep dialogue dry and understated."
          className="min-h-36"
        />
        <div className="mt-2 flex justify-end">
          <Button
            size="sm"
            disabled={pending || !state.workspaceId}
            onClick={() =>
              startTransition(async () => {
                if (state.workspaceId) {
                  await saveUnixrc(state.workspaceId, unixrc);
                  reload();
                }
              })
            }
          >
            Save .unixrc
          </Button>
        </div>
      </div>
      <h3 className="mt-6 text-xs font-medium text-zinc-300">Focused rules</h3>
      <p className="mt-1 text-[11px] text-zinc-600">
        Add optional instructions for one document or the whole workspace.
      </p>
      <div className="mt-4 space-y-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Rule name"
        />
        <Textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="Example: Use British spelling."
          className="min-h-20"
        />
        <div className="flex gap-2">
          <Select
            value={scope}
            onValueChange={(value) => setScope(value as typeof scope)}
          >
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="workspace">Workspace</SelectItem>
              <SelectItem value="document" disabled={!activeFile}>
                This document
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="icon"
            aria-label="Add rule"
            disabled={pending}
            onClick={add}
          >
            <Plus size={14} />
          </Button>
        </div>
      </div>
      <div className="mt-5 space-y-2">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="rounded border border-zinc-800 bg-zinc-900/60 p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-zinc-200">{rule.name}</p>
                <p className="text-[10px] text-zinc-600">
                  {rule.document_id ? "Document" : "Workspace"}
                </p>
              </div>
              <div className="flex gap-2">
                <Switch
                  aria-label={`Enable ${rule.name}`}
                  checked={rule.enabled}
                  onCheckedChange={(checked) =>
                    startTransition(async () => {
                      await updateRule(rule.id, { enabled: checked });
                      reload();
                    })
                  }
                />
                <button
                  aria-label={`Delete ${rule.name}`}
                  onClick={() =>
                    startTransition(async () => {
                      await deleteRule(rule.id);
                      reload();
                    })
                  }
                >
                  <Trash2
                    size={13}
                    className="text-zinc-600 hover:text-red-400"
                  />
                </button>
              </div>
            </div>
            <p
              className={`mt-2 text-xs ${rule.enabled ? "text-zinc-400" : "text-zinc-700 line-through"}`}
            >
              {rule.instruction}
            </p>
          </div>
        ))}
        {!rules.length && (
          <p className="py-8 text-center text-xs text-zinc-600">
            No rules yet.
          </p>
        )}
      </div>
    </div>
  );
}
