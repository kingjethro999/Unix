import { notFound } from "next/navigation";
import type { JSONContent } from "@tiptap/core";
import { query } from "@/lib/db";
import { ViewLayout } from "./view-layout";

export default async function PublicWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspace = await query<{ id: string; name: string }>(
    `SELECT w.id,w.name FROM workspaces w JOIN workspace_shares s ON s.workspace_id=w.id WHERE w.id=$1 AND s.enabled=true`,
    [id],
  );
  if (!workspace.rows[0]) notFound();
  const documents = await query<{
    id: string;
    title: string;
    folder_id: string;
    revision: number;
    document: JSONContent;
    content: string;
  }>(
    `SELECT id,title,workspace_id AS folder_id,revision,content_json AS document,content_text AS content
       FROM documents
      WHERE workspace_id=$1
      ORDER BY CASE WHEN document_type = 'unixrc' THEN 1 ELSE 0 END, created_at, id`,
    [id],
  );
  return (
    <ViewLayout folder={workspace.rows[0]} initialPages={documents.rows} />
  );
}
