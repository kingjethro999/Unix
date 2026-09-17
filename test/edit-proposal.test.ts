import assert from "node:assert/strict";
import test from "node:test";
import { getSchema } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { validateTextProposal } from "../lib/edit-proposal.ts";

const schema = getSchema([StarterKit]);

function doc(content: object[]) {
  return schema.nodeFromJSON({ type: "doc", content });
}

test("targets the selected repeated occurrence by native range", () => {
  const value = doc([
    {
      type: "paragraph",
      content: [{ type: "text", text: "same middle same" }],
    },
  ]);
  const proposal = {
    baseRevision: 4,
    from: 13,
    to: 17,
    expectedText: "same",
    replacementText: "different",
  };
  const result = validateTextProposal(value, proposal, 4);
  assert.equal(result.ok, true);
  const transaction = (
    value.type.schema as typeof schema
  ).topNodeType.createAndFill();
  assert.ok(transaction);
  assert.equal(value.textBetween(1, 5), "same");
  assert.equal(value.textBetween(13, 17), "same");
});

test("rejects stale revisions and changed Unicode text", () => {
  const value = doc([
    { type: "paragraph", content: [{ type: "text", text: "Café — déjà vu" }] },
  ]);
  assert.deepEqual(
    validateTextProposal(
      value,
      {
        baseRevision: 1,
        from: 1,
        to: 5,
        expectedText: "Café",
        replacementText: "Cafe",
      },
      2,
    ),
    { ok: false, reason: "stale-revision" },
  );
  assert.deepEqual(
    validateTextProposal(
      value,
      {
        baseRevision: 2,
        from: 1,
        to: 5,
        expectedText: "Cafe",
        replacementText: "Café",
      },
      2,
    ),
    { ok: false, reason: "text-mismatch" },
  );
});

test("allows uniform formatting and blocks ambiguous mixed-style expansion", () => {
  const uniform = doc([
    {
      type: "paragraph",
      content: [
        { type: "text", marks: [{ type: "bold" }], text: "quiet words" },
      ],
    },
  ]);
  assert.equal(
    validateTextProposal(
      uniform,
      {
        baseRevision: 3,
        from: 1,
        to: 12,
        expectedText: "quiet words",
        replacementText: "clear words",
      },
      3,
    ).ok,
    true,
  );
  const mixed = doc([
    {
      type: "paragraph",
      content: [
        { type: "text", marks: [{ type: "bold" }], text: "Bold" },
        { type: "text", marks: [{ type: "italic" }], text: " italic" },
      ],
    },
  ]);
  assert.deepEqual(
    validateTextProposal(
      mixed,
      {
        baseRevision: 3,
        from: 1,
        to: 12,
        expectedText: "Bold italic",
        replacementText:
          "A substantially longer rewrite that would make mark placement ambiguous.",
      },
      3,
    ),
    { ok: false, reason: "mixed-formatting" },
  );
});
