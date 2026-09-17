"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, MessageSquare, Reply, RotateCcw, Send, X } from "lucide-react";
import {
  addComment,
  listComments,
  resolveComment,
  setSuggestionStatus,
} from "@/app/actions/review";
import {
  editorStore,
  useActiveFile,
  useEditorState,
  type EditProposal,
} from "./editor-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type CommentRow = {
  id: string;
  parent_id?: string | null;
  body: string;
  resolved: boolean;
  full_name?: string;
  email: string;
  created_at: string;
  range_from?: number | null;
  range_to?: number | null;
  base_revision?: number | null;
  expected_text?: string | null;
  suggestion_text?: string | null;
  suggestion_status?: "pending" | "accepted" | "rejected";
};

export function ReviewPanel() {
  const state = useEditorState();
  const file = useActiveFile();
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [body, setBody] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const reload = () => {
    if (file)
      void listComments(file.id)
        .then((rows) => setComments(rows as CommentRow[]))
        .catch(() => setComments([]));
  };
  useEffect(reload, [file?.id]);
  const selection = state.activeSelection;
  const selectedText =
    selection && selection.fileId === file?.id ? selection.text : null;
  const add = () => {
    if (!file || !body.trim()) return;
    startTransition(async () => {
      await addComment({
        documentId: file.id,
        body,
        parentId: replyingTo || undefined,
        from:
          replyingTo || selection?.fileId !== file.id
            ? undefined
            : selection.start,
        to:
          replyingTo || selection?.fileId !== file.id
            ? undefined
            : selection.end,
        baseRevision:
          replyingTo || selection?.fileId !== file.id
            ? undefined
            : selection.baseRevision,
        expectedText:
          replyingTo || selection?.fileId !== file.id
            ? undefined
            : selection.text || undefined,
        suggestionText: replyingTo ? undefined : suggestion || undefined,
      });
      setBody("");
      setSuggestion("");
      setReplyingTo(null);
      reload();
    });
  };
  const applySuggestion = (comment: CommentRow) => {
    if (
      !file ||
      !comment.suggestion_text ||
      !comment.expected_text ||
      comment.range_from == null ||
      comment.range_to == null ||
      comment.base_revision == null
    )
      return;
    const proposal: EditProposal = {
      id: comment.id,
      fileId: file.id,
      baseRevision: comment.base_revision,
      from: comment.range_from,
      to: comment.range_to,
      expectedText: comment.expected_text,
      replacementText: comment.suggestion_text,
      contextBefore: "",
      contextAfter: "",
      description: "Accepted review suggestion",
      kind: "selection",
    };
    if (!editorStore.proposeStoredEdit(proposal)) return;
    if (!editorStore.acceptChange(file.id)) return;
    startTransition(async () => {
      await setSuggestionStatus(comment.id, "accepted");
      await resolveComment(comment.id, true);
      reload();
    });
  };
  const topLevel = comments.filter((comment) => !comment.parent_id);
  const replies = (id: string) =>
    comments.filter((comment) => comment.parent_id === id);
  return (
    <div className="h-full overflow-y-auto bg-zinc-950 p-5">
      <div className="flex items-center gap-2">
        <MessageSquare size={16} className="text-cyan-400" />
        <h2 className="text-sm font-semibold text-zinc-100">Review</h2>
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        Discuss a passage, propose a replacement, then apply it safely.
      </p>
      {selectedText && !replyingTo && (
        <p className="mt-3 rounded-md border border-cyan-500/20 bg-cyan-500/5 p-2 text-xs text-cyan-200">
          Selected: {selectedText.slice(0, 140)}
        </p>
      )}
      <div className="mt-4 space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-zinc-200">
            {replyingTo ? "Reply to comment" : "New review item"}
          </p>
          {replyingTo && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Cancel reply"
              onClick={() => setReplyingTo(null)}
            >
              <X size={14} />
            </Button>
          )}
        </div>
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={replyingTo ? "Write a reply" : "Write a review comment"}
          className="min-h-20 border-zinc-800 bg-zinc-950 text-xs"
        />
        {!replyingTo && (
          <Input
            value={suggestion}
            onChange={(event) => setSuggestion(event.target.value)}
            placeholder="Optional suggested replacement"
            className="border-zinc-800 bg-zinc-950 text-xs"
          />
        )}
        <Button size="sm" disabled={pending || !body.trim()} onClick={add}>
          <Send size={13} />
          {replyingTo ? "Reply" : "Add review"}
        </Button>
      </div>
      <div className="mt-6 space-y-3">
        {topLevel.map((comment) => (
          <article
            key={comment.id}
            className={`rounded-lg border p-3 ${comment.resolved ? "border-zinc-800 bg-zinc-950 opacity-70" : "border-zinc-800 bg-zinc-900/60"}`}
          >
            <CommentCard
              comment={comment}
              pending={pending}
              onReply={() => setReplyingTo(comment.id)}
              onResolve={() =>
                startTransition(async () => {
                  await resolveComment(comment.id, !comment.resolved);
                  reload();
                })
              }
              onAccept={() => applySuggestion(comment)}
              onReject={() =>
                startTransition(async () => {
                  await setSuggestionStatus(comment.id, "rejected");
                  reload();
                })
              }
            />
            {replies(comment.id).map((reply) => (
              <div
                key={reply.id}
                className="ml-4 mt-3 border-l border-zinc-800 pl-3"
              >
                <CommentCard
                  comment={reply}
                  pending={pending}
                  onResolve={() =>
                    startTransition(async () => {
                      await resolveComment(reply.id, !reply.resolved);
                      reload();
                    })
                  }
                />
              </div>
            ))}
          </article>
        ))}
        {!topLevel.length && (
          <p className="py-8 text-center text-xs text-zinc-600">
            No review items yet.
          </p>
        )}
      </div>
    </div>
  );
}

function CommentCard({
  comment,
  pending,
  onReply,
  onResolve,
  onAccept,
  onReject,
}: {
  comment: CommentRow;
  pending: boolean;
  onReply?: () => void;
  onResolve: () => void;
  onAccept?: () => void;
  onReject?: () => void;
}) {
  const suggestionPending =
    comment.suggestion_text &&
    (comment.suggestion_status || "pending") === "pending";
  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-zinc-300">
            {comment.full_name || comment.email}
          </p>
          <time className="text-[10px] text-zinc-600">
            {new Date(comment.created_at).toLocaleString()}
          </time>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label={comment.resolved ? "Reopen comment" : "Resolve comment"}
          disabled={pending}
          onClick={onResolve}
        >
          {comment.resolved ? <RotateCcw size={14} /> : <Check size={14} />}
        </Button>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-zinc-300">
        {comment.body}
      </p>
      {comment.suggestion_text && (
        <div className="mt-2 rounded border-l-2 border-amber-500/50 bg-amber-500/5 p-2 text-xs text-amber-200">
          <p>{comment.suggestion_text}</p>
          {suggestionPending ? (
            <div className="mt-2 flex gap-2">
              <Button size="sm" disabled={pending} onClick={onAccept}>
                Accept change
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={onReject}
              >
                Reject
              </Button>
            </div>
          ) : (
            <p className="mt-1 text-[10px] uppercase tracking-wide text-zinc-500">
              {comment.suggestion_status}
            </p>
          )}
        </div>
      )}
      {onReply && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 text-zinc-400"
          onClick={onReply}
        >
          <Reply size={13} />
          Reply
        </Button>
      )}
    </div>
  );
}
