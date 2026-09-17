"use server";

import type { JSONContent } from "@tiptap/core";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { query, transaction } from "@/lib/db";
import { documentToText, normalizeDocument } from "@/lib/document";
import { parseUnixrc } from "@/lib/unixrc";

async function membership(userId: string, workspaceId: string, write = false) {
  const roles = write ? ["owner", "editor"] : ["owner", "editor", "viewer"];
  const result = await query<{ role: string }>(
    "SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2 AND role = ANY($3::text[])",
    [workspaceId, userId, roles],
  );
  if (!result.rows[0]) throw new Error("Workspace not found or access denied");
  return result.rows[0];
}

export async function getFolder(folderId: string) {
  const user = await requireUser();
  await membership(user.id, folderId);
  return (
    (
      await query<{ id: string; name: string }>(
        "SELECT id, name FROM workspaces WHERE id = $1",
        [folderId],
      )
    ).rows[0] || null
  );
}

export async function getPages(folderId: string) {
  const user = await requireUser();
  await membership(user.id, folderId);
  return (
    await query<{
      id: string;
      title: string;
      folder_id: string;
      revision: number;
      schema_version: number;
      document_type: "manuscript" | "unixrc";
    }>(
      `SELECT id, title, workspace_id AS folder_id, revision, schema_version, document_type
       FROM documents
      WHERE workspace_id = $1
      ORDER BY CASE WHEN document_type = 'unixrc' THEN 1 ELSE 0 END, created_at, id`,
      [folderId],
    )
  ).rows;
}

export async function createPage(folderId: string, title = "Untitled Page") {
  const user = await requireUser();
  await membership(user.id, folderId, true);
  return (
    await query<{
      id: string;
      title: string;
      folder_id: string;
      revision: number;
    }>(
      `INSERT INTO documents (workspace_id, owner_id, title, document_type) VALUES ($1, $2, $3, 'manuscript')
     RETURNING id, title, workspace_id AS folder_id, revision`,
      [folderId, user.id, title.trim() || "Untitled Page"],
    )
  ).rows[0];
}

export async function deletePage(pageId: string) {
  const user = await requireUser();
  const found = await query<{ workspace_id: string; document_type: string }>(
    "SELECT workspace_id, document_type FROM documents WHERE id = $1",
    [pageId],
  );
  if (!found.rows[0]) return;
  await membership(user.id, found.rows[0].workspace_id, true);
  if (found.rows[0].document_type === "unixrc")
    throw new Error(".unixrc is a protected workspace note");
  await query("DELETE FROM documents WHERE id = $1", [pageId]);
}

export async function renamePage(pageId: string, title: string) {
  const user = await requireUser();
  const found = await query<{ workspace_id: string; document_type: string }>(
    "SELECT workspace_id, document_type FROM documents WHERE id = $1",
    [pageId],
  );
  if (!found.rows[0]) throw new Error("Document not found");
  await membership(user.id, found.rows[0].workspace_id, true);
  if (found.rows[0].document_type === "unixrc")
    throw new Error(".unixrc cannot be renamed");
  await query(
    "UPDATE documents SET title = $2, updated_at = now() WHERE id = $1",
    [pageId, title.trim()],
  );
}

export async function renameFolder(folderId: string, name: string) {
  const user = await requireUser();
  await membership(user.id, folderId, true);
  await query(
    "UPDATE workspaces SET name = $2, updated_at = now() WHERE id = $1",
    [folderId, name.trim()],
  );
  revalidatePath("/create");
}

export interface SaveDocumentInput {
  document: JSONContent;
  expectedRevision: number;
  reason?: "save" | "ai-edit" | "restore";
}

export async function saveDocument(pageId: string, input: SaveDocumentInput) {
  const user = await requireUser();
  const document = normalizeDocument(input.document);
  const contentText = documentToText(document);
  return transaction(async (client) => {
    const found = await client.query<{
      workspace_id: string;
      revision: number;
      content_json: JSONContent;
      content_text: string;
      document_type: string;
    }>(
      "SELECT workspace_id, revision, content_json, content_text, document_type FROM documents WHERE id = $1 FOR UPDATE",
      [pageId],
    );
    const current = found.rows[0];
    if (!current) throw new Error("Document not found");
    const access = await client.query(
      "SELECT 1 FROM workspace_members WHERE workspace_id = $1 AND user_id = $2 AND role IN ('owner', 'editor')",
      [current.workspace_id, user.id],
    );
    if (!access.rows[0]) throw new Error("Access denied");
    if (current.revision !== input.expectedRevision) {
      return {
        ok: false as const,
        conflict: true as const,
        revision: current.revision,
        document: current.content_json,
        text: current.content_text,
      };
    }
    await client.query(
      `INSERT INTO document_revisions (document_id, revision, content_json, content_text, created_by, reason)
       VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING`,
      [
        pageId,
        current.revision,
        current.content_json,
        current.content_text,
        user.id,
        input.reason || "save",
      ],
    );
    const next = await client.query<{ revision: number }>(
      `UPDATE documents SET content_json = $2, content_text = $3, revision = revision + 1, updated_at = now()
        WHERE id = $1 RETURNING revision`,
      [pageId, JSON.stringify(document), contentText],
    );
    if (current.document_type === "unixrc") {
      const parsed = parseUnixrc(document);
      await client.query(
        "DELETE FROM writing_rules WHERE workspace_id=$1 AND document_id IS NULL AND name LIKE 'Focused rule %'",
        [current.workspace_id],
      );
      const existing = await client.query<{ id: string }>(
        "SELECT id FROM writing_rules WHERE workspace_id=$1 AND document_id IS NULL AND name='.unixrc' LIMIT 1",
        [current.workspace_id],
      );
      if (existing.rows[0])
        await client.query(
          "UPDATE writing_rules SET instruction=$2,enabled=true,updated_at=now() WHERE id=$1",
          [existing.rows[0].id, parsed.workspaceInstruction],
        );
      else
        await client.query(
          "INSERT INTO writing_rules(workspace_id,owner_id,name,instruction,enabled) VALUES($1,$2,'.unixrc',$3,true)",
          [current.workspace_id, user.id, parsed.workspaceInstruction],
        );
      for (const [index, instruction] of parsed.focused.entries())
        await client.query(
          "INSERT INTO writing_rules(workspace_id,owner_id,name,instruction,enabled) VALUES($1,$2,$3,$4,true)",
          [
            current.workspace_id,
            user.id,
            `Focused rule ${index + 1}`,
            instruction,
          ],
        );
    }
    return {
      ok: true as const,
      conflict: false as const,
      revision: next.rows[0].revision,
    };
  });
}

// Compatibility for older callers while the workspace store migrates.
export async function updatePageContent(
  pageId: string,
  body: { content?: string; document?: JSONContent; expectedRevision?: number },
  bodyText?: string,
) {
  const current = await getPageContent(pageId);
  if (!current) throw new Error("Document not found");
  return saveDocument(pageId, {
    document:
      body.document || normalizeDocument(body.content || bodyText || ""),
    expectedRevision: body.expectedRevision ?? current.revision,
  });
}

export async function getPageContent(pageId: string) {
  const user = await requireUser();
  const result = await query<{
    id: string;
    workspace_id: string;
    content_json: JSONContent;
    content_text: string;
    revision: number;
    schema_version: number;
  }>(
    `SELECT d.id, d.workspace_id, d.content_json, d.content_text, d.revision, d.schema_version
       FROM documents d JOIN workspace_members wm ON wm.workspace_id = d.workspace_id
      WHERE d.id = $1 AND wm.user_id = $2`,
    [pageId, user.id],
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    ...row,
    document: normalizeDocument(row.content_json),
    text: row.content_text,
  };
}

export const getPagesForFolder = getPages;
