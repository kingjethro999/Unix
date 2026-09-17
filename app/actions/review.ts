"use server";

import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";

async function access(documentId: string, userId: string, write = false) {
  const result = await query<{ workspace_id: string; role: string }>(
    `SELECT d.workspace_id,wm.role FROM documents d JOIN workspace_members wm ON wm.workspace_id=d.workspace_id WHERE d.id=$1 AND wm.user_id=$2`,
    [documentId, userId],
  );
  const row = result.rows[0];
  if (!row || (write && !["owner", "editor"].includes(row.role)))
    throw new Error("Document access denied");
  return row;
}

export async function listComments(documentId: string) {
  const user = await requireUser();
  await access(documentId, user.id);
  return (
    await query(
      `SELECT c.id,c.parent_id,c.body,c.range_from,c.range_to,c.base_revision,c.expected_text,c.suggestion_text,c.suggestion_status,c.resolved,c.created_at,u.full_name,u.email FROM document_comments c JOIN users u ON u.id=c.author_id WHERE c.document_id=$1 ORDER BY c.created_at`,
      [documentId],
    )
  ).rows;
}

export async function addComment(input: {
  documentId: string;
  body: string;
  from?: number;
  to?: number;
  suggestionText?: string;
  parentId?: string;
  baseRevision?: number;
  expectedText?: string;
}) {
  const user = await requireUser();
  const row = await access(input.documentId, user.id, true);
  const result = await query(
    `INSERT INTO document_comments (document_id,workspace_id,author_id,parent_id,body,range_from,range_to,suggestion_text,base_revision,expected_text) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
    [
      input.documentId,
      row.workspace_id,
      user.id,
      input.parentId || null,
      input.body.trim(),
      input.from ?? null,
      input.to ?? null,
      input.suggestionText?.trim() || null,
      input.baseRevision ?? null,
      input.expectedText?.trim() || null,
    ],
  );
  return result.rows[0];
}

export async function setSuggestionStatus(
  commentId: string,
  status: "accepted" | "rejected",
) {
  const user = await requireUser();
  const result = await query<{ workspace_id: string }>(
    "SELECT workspace_id FROM document_comments WHERE id=$1",
    [commentId],
  );
  const comment = result.rows[0];
  if (!comment) throw new Error("Comment not found");
  const membership = await query(
    "SELECT 1 FROM workspace_members WHERE workspace_id=$1 AND user_id=$2 AND role IN ('owner','editor')",
    [comment.workspace_id, user.id],
  );
  if (!membership.rows[0]) throw new Error("Document access denied");
  await query(
    "UPDATE document_comments SET suggestion_status=$2,updated_at=now() WHERE id=$1",
    [commentId, status],
  );
}

export async function resolveComment(commentId: string, resolved: boolean) {
  const user = await requireUser();
  const result = await query<{ workspace_id: string }>(
    "SELECT workspace_id FROM document_comments WHERE id=$1",
    [commentId],
  );
  if (!result.rows[0]) throw new Error("Comment not found");
  await query(
    "SELECT 1 FROM workspace_members WHERE workspace_id=$1 AND user_id=$2 AND role IN ('owner','editor')",
    [result.rows[0].workspace_id, user.id],
  );
  await query(
    "UPDATE document_comments SET resolved=$2,updated_at=now() WHERE id=$1",
    [commentId, resolved],
  );
}
