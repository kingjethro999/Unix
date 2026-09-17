import type { JSONContent } from "@tiptap/core";

export const UNIXRC_TEMPLATE: JSONContent = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Rules" }],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Write clearly and preserve the author’s voice.",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Focused rules" }],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Add a focused rule here." }],
            },
          ],
        },
      ],
    },
  ],
};

function text(node: JSONContent | undefined): string {
  return (node?.content || [])
    .map((child) => (child.type === "text" ? child.text || "" : text(child)))
    .join("");
}
function listItems(node: JSONContent): string[] {
  return (node.content || [])
    .filter((child) => child.type === "listItem")
    .map((item) => text(item).trim())
    .filter(Boolean);
}

export function parseUnixrc(document: JSONContent) {
  let section = "";
  const rules: string[] = [];
  const focused: string[] = [];
  for (const node of document.content || []) {
    if (node.type === "heading") {
      section = text(node).trim().toLowerCase();
      continue;
    }
    const items =
      node.type === "bulletList" || node.type === "orderedList"
        ? listItems(node)
        : [text(node).trim()].filter(Boolean);
    if (section === "rules") rules.push(...items);
    if (section === "focused rules")
      focused.push(
        ...items.filter(
          (value) => value.toLowerCase() !== "add a focused rule here.",
        ),
      );
  }
  return {
    workspaceInstruction:
      rules.join("\n") || "Write clearly and preserve the author’s voice.",
    focused,
  };
}
