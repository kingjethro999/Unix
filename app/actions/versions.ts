"use server";

import type { JSONContent } from "@tiptap/core";
import { requireUser } from "@/lib/auth";
import { query, transaction } from "@/lib/db";
import { documentToText, normalizeDocument } from "@/lib/document";

export async function listVersions(documentId: string) {
  const user = await requireUser();
  const access = await query(
    "SELECT 1 FROM documents d JOIN workspace_members wm ON wm.workspace_id=d.workspace_id WHERE d.id=$1 AND wm.user_id=$2",
    [documentId, user.id],
  );
  if (!access.rows[0]) throw new Error("Document access denied");
  return (
    await query(
      `SELECT r.id,r.revision,r.content_json,r.content_text,r.reason,r.created_at,u.full_name,u.email FROM document_revisions r JOIN users u ON u.id=r.created_by WHERE r.document_id=$1 ORDER BY r.revision DESC LIMIT 100`,
      [documentId],
    )
  ).rows;
}

export async function listBranches(documentId: string) {
  const user = await requireUser();
  const access = await query(
    "SELECT 1 FROM documents d JOIN workspace_members wm ON wm.workspace_id=d.workspace_id WHERE d.id=$1 AND wm.user_id=$2",
    [documentId, user.id],
  );
  if (!access.rows[0]) throw new Error("Document access denied");
  return (
    await query(
      `SELECT b.id,b.name,b.content_text,b.source_revision,b.created_at,b.updated_at,u.full_name,u.email,(d.active_branch_id=b.id) AS active
    FROM document_branches b JOIN users u ON u.id=b.created_by JOIN documents d ON d.id=b.document_id WHERE b.document_id=$1 ORDER BY b.updated_at DESC`,
      [documentId],
    )
  ).rows;
}

export async function createBranch(input: {
  documentId: string;
  name: string;
  document: JSONContent;
  revision: number;
}) {
  const user = await requireUser();
  const access = await query<{ workspace_id: string; role: string }>(
    "SELECT d.workspace_id,wm.role FROM documents d JOIN workspace_members wm ON wm.workspace_id=d.workspace_id WHERE d.id=$1 AND wm.user_id=$2",
    [input.documentId, user.id],
  );
  if (!access.rows[0] || !["owner", "editor"].includes(access.rows[0].role))
    throw new Error("Document access denied");
  const document = normalizeDocument(input.document);
  return (
    await query(
      `INSERT INTO document_branches (workspace_id,document_id,created_by,name,content_json,content_text,source_revision) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id,name,source_revision,created_at`,
      [
        access.rows[0].workspace_id,
        input.documentId,
        user.id,
        input.name.trim(),
        JSON.stringify(document),
        documentToText(document),
        input.revision,
      ],
    )
  ).rows[0];
}

export async function restoreVersion(input: {
  documentId: string;
  revision: number;
  expectedRevision: number;
}) {
  const user = await requireUser();
  const access = await query<{ workspace_id: string; role: string }>(
    "SELECT d.workspace_id,wm.role FROM documents d JOIN workspace_members wm ON wm.workspace_id=d.workspace_id WHERE d.id=$1 AND wm.user_id=$2",
    [input.documentId, user.id],
  );
  if (!access.rows[0] || !["owner", "editor"].includes(access.rows[0].role))
    throw new Error("Document access denied");
  const target = await query<{
    content_json: JSONContent;
    content_text: string;
  }>(
    "SELECT content_json,content_text FROM document_revisions WHERE document_id=$1 AND revision=$2",
    [input.documentId, input.revision],
  );
  const current = await query<{
    revision: number;
    content_json: JSONContent;
    content_text: string;
  }>("SELECT revision,content_json,content_text FROM documents WHERE id=$1", [
    input.documentId,
  ]);
  if (!target.rows[0] || !current.rows[0]) throw new Error("Version not found");
  if (current.rows[0].revision !== input.expectedRevision)
    throw new Error("Document changed; reload before restoring.");
  await query(
    `INSERT INTO document_revisions (document_id,revision,content_json,content_text,created_by,reason) VALUES ($1,$2,$3,$4,$5,'restore') ON CONFLICT DO NOTHING`,
    [
      input.documentId,
      current.rows[0].revision,
      current.rows[0].content_json,
      current.rows[0].content_text,
      user.id,
    ],
  );
  const updated = await query<{ revision: number }>(
    "UPDATE documents SET content_json=$2,content_text=$3,revision=revision+1,updated_at=now() WHERE id=$1 RETURNING revision",
    [
      input.documentId,
      target.rows[0].content_json,
      target.rows[0].content_text,
    ],
  );
  return {
    revision: updated.rows[0].revision,
    document: target.rows[0].content_json,
    text: target.rows[0].content_text,
  };
}

export async function switchBranch(input: {
  documentId: string;
  branchId: string;
  expectedRevision: number;
}) {
  const user = await requireUser();
  return transaction(async (client) => {
    const current = await client.query<{
      workspace_id: string;
      revision: number;
      content_json: JSONContent;
      content_text: string;
      active_branch_id: string | null;
      role: string;
    }>(
      `SELECT d.workspace_id,d.revision,d.content_json,d.content_text,d.active_branch_id,wm.role FROM documents d JOIN workspace_members wm ON wm.workspace_id=d.workspace_id WHERE d.id=$1 AND wm.user_id=$2 FOR UPDATE`,
      [input.documentId, user.id],
    );
    const row = current.rows[0];
    if (!row || !["owner", "editor"].includes(row.role))
      throw new Error("Document access denied");
    if (row.revision !== input.expectedRevision)
      throw new Error("Document changed; reload before switching drafts.");
    const target = await client.query<{
      content_json: JSONContent;
      content_text: string;
    }>(
      "SELECT content_json,content_text FROM document_branches WHERE id=$1 AND document_id=$2",
      [input.branchId, input.documentId],
    );
    if (!target.rows[0]) throw new Error("Draft branch not found");
    if (row.active_branch_id)
      await client.query(
        "UPDATE document_branches SET content_json=$2,content_text=$3,source_revision=$4,updated_at=now() WHERE id=$1",
        [
          row.active_branch_id,
          row.content_json,
          row.content_text,
          row.revision,
        ],
      );
    await client.query(
      `INSERT INTO document_revisions(document_id,revision,content_json,content_text,created_by,reason) VALUES($1,$2,$3,$4,$5,'branch switch') ON CONFLICT DO NOTHING`,
      [
        input.documentId,
        row.revision,
        row.content_json,
        row.content_text,
        user.id,
      ],
    );
    const updated = await client.query<{ revision: number }>(
      "UPDATE documents SET content_json=$2,content_text=$3,active_branch_id=$4,revision=revision+1,updated_at=now() WHERE id=$1 RETURNING revision",
      [
        input.documentId,
        target.rows[0].content_json,
        target.rows[0].content_text,
        input.branchId,
      ],
    );
    return {
      revision: updated.rows[0].revision,
      document: target.rows[0].content_json,
      text: target.rows[0].content_text,
    };
  });
}

export async function mergeBranch(input: {
  documentId: string;
  branchId: string;
  expectedRevision: number;
}) {
  const result = await switchBranch(input);
  await query("UPDATE documents SET active_branch_id=NULL WHERE id=$1", [
    input.documentId,
  ]);
  return result;
}
