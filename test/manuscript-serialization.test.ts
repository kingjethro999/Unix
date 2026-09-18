import test from "node:test";
import assert from "node:assert/strict";
import {
  manuscriptToHtml,
  manuscriptToMarkdown,
  manuscriptToText,
} from "../lib/manuscript-serialization.ts";

const document = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Chapter" }],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Bold", marks: [{ type: "bold" }] },
        { type: "text", text: " and " },
        {
          type: "text",
          text: "linked",
          marks: [{ type: "link", attrs: { href: "https://example.test" } }],
        },
      ],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "Item" }] },
          ],
        },
      ],
    },
  ],
};

test("serializes only canonical manuscript structures", () => {
  const markdown = manuscriptToMarkdown(document);
  const html = manuscriptToHtml(document);
  assert.match(markdown, /^## Chapter/m);
  assert.match(markdown, /\*\*Bold\*\*/);
  assert.match(markdown, /- Item/);
  assert.match(html, /<h2>Chapter<\/h2>/);
  assert.match(html, /<strong>Bold<\/strong>/);
  assert.match(html, /rel="noopener noreferrer"/);
  assert.equal(manuscriptToText(document), "Chapter\nBold and linked\nItem");
  assert.doesNotMatch(
    `${markdown}${html}`,
    /writing_rules|prompt|chat_messages/,
  );
});

import {
  documentToText,
  normalizeProse,
  textToDocument,
} from "../lib/document.ts";

test("converts AI prose into ordinary paragraphs without spacer blocks", () => {
  const document = textToDocument(
    "First paragraph.\n\n\n\nSecond paragraph.\n\nThird paragraph.",
  );
  assert.equal(document.content?.length, 3);
  assert.equal(
    documentToText(document),
    "First paragraph.\nSecond paragraph.\nThird paragraph.",
  );
});

test("removes malformed leading AI metadata from manuscript prose", () => {
  assert.equal(normalizeProse("{}:@\n\nA real opening."), "A real opening.");
});
