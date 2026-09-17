import type { JSONContent } from "@tiptap/core";

export const EMPTY_DOCUMENT: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export function textToDocument(text: string): JSONContent {
  return {
    type: "doc",
    content: text
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((line) => {
        const heading = /^(#{1,3})\s+(.*)$/.exec(line);
        if (heading) {
          return {
            type: "heading",
            attrs: { level: heading[1].length },
            content: heading[2]
              ? [{ type: "text", text: heading[2] }]
              : undefined,
          };
        }
        return {
          type: "paragraph",
          content: line ? [{ type: "text", text: line }] : undefined,
        };
      }),
  };
}

export function documentToText(node: JSONContent | null | undefined): string {
  if (!node) return "";
  if (node.type === "text") return node.text || "";
  return (node.content || [])
    .map(documentToText)
    .join(node.type === "doc" ? "\n" : "");
}

export function normalizeDocument(value: unknown): JSONContent {
  if (
    value &&
    typeof value === "object" &&
    (value as JSONContent).type === "doc"
  )
    return value as JSONContent;
  if (typeof value === "string") return textToDocument(value);
  return EMPTY_DOCUMENT;
}
