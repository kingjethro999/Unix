import type { Mark, Node as ProseMirrorNode } from "@tiptap/pm/model";

export interface TextEditProposal {
  baseRevision: number;
  from: number;
  to: number;
  expectedText: string;
  replacementText: string;
}

export type ProposalValidation =
  | { ok: true; marks: readonly Mark[] }
  | {
      ok: false;
      reason:
        | "stale-revision"
        | "invalid-range"
        | "text-mismatch"
        | "mixed-formatting";
    };

export function validateTextProposal(
  doc: ProseMirrorNode,
  proposal: TextEditProposal,
  currentRevision: number,
): ProposalValidation {
  if (proposal.baseRevision !== currentRevision)
    return { ok: false, reason: "stale-revision" };
  if (
    proposal.from < 0 ||
    proposal.to <= proposal.from ||
    proposal.to > doc.content.size
  )
    return { ok: false, reason: "invalid-range" };
  if (
    doc.textBetween(proposal.from, proposal.to, "\n", "\n") !==
    proposal.expectedText
  )
    return { ok: false, reason: "text-mismatch" };

  const marks = new Map<string, readonly Mark[]>();
  doc.nodesBetween(proposal.from, proposal.to, (node) => {
    if (!node.isText) return;
    const signature = JSON.stringify(
      node.marks.map((mark) => ({ type: mark.type.name, attrs: mark.attrs })),
    );
    marks.set(signature, node.marks);
  });
  const substantialRewrite =
    proposal.replacementText.length >
    Math.max(24, proposal.expectedText.length * 1.5);
  if (marks.size > 1 && substantialRewrite)
    return { ok: false, reason: "mixed-formatting" };
  return { ok: true, marks: marks.values().next().value || [] };
}
