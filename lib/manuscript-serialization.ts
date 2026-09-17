import type { JSONContent } from "@tiptap/core";

function children(node?: JSONContent) {
  return node?.content || [];
}
function text(node?: JSONContent): string {
  return children(node)
    .map((child) => child.text || text(child))
    .join("");
}
function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function inlineMarkdown(node: JSONContent): string {
  if (node.type === "hardBreak") return "  \n";
  let value = node.text || children(node).map(inlineMarkdown).join("");
  for (const mark of node.marks || []) {
    if (mark.type === "bold") value = `**${value}**`;
    else if (mark.type === "italic") value = `*${value}*`;
    else if (mark.type === "strike") value = `~~${value}~~`;
    else if (mark.type === "code") value = `\`${value}\``;
    else if (mark.type === "link" && mark.attrs?.href)
      value = `[${value}](${mark.attrs.href})`;
  }
  return value;
}

function markdownBlock(node: JSONContent, depth = 0, orderedIndex = 1): string {
  const inline = children(node).map(inlineMarkdown).join("");
  if (node.type === "paragraph") return inline;
  if (node.type === "heading")
    return `${"#".repeat(Math.min(6, Number(node.attrs?.level) || 1))} ${inline}`;
  if (node.type === "blockquote")
    return children(node)
      .map((child) => markdownBlock(child, depth))
      .join("\n")
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n");
  if (node.type === "codeBlock")
    return `\`\`\`${node.attrs?.language || ""}\n${text(node)}\n\`\`\``;
  if (node.type === "horizontalRule") return "---";
  if (node.type === "image")
    return `![${String(node.attrs?.alt || "")}](${String(node.attrs?.src || "")})`;
  if (node.type === "bulletList" || node.type === "orderedList") {
    return children(node)
      .map((item, index) =>
        markdownBlock(item, depth, node.type === "orderedList" ? index + 1 : 0),
      )
      .join("\n");
  }
  if (node.type === "listItem") {
    const [first, ...rest] = children(node);
    const prefix = orderedIndex ? `${orderedIndex}. ` : "- ";
    const tail = rest
      .map((child) => markdownBlock(child, depth + 1))
      .join("\n");
    return `${"  ".repeat(depth)}${prefix}${first ? markdownBlock(first, depth + 1) : ""}${tail ? `\n${tail}` : ""}`;
  }
  if (node.type === "table") {
    const rows = children(node).map((row) =>
      children(row).map((cell) => text(cell).replaceAll("|", "\\|")),
    );
    if (!rows.length) return "";
    return [rows[0], rows[0].map(() => "---"), ...rows.slice(1)]
      .map((row) => `| ${row.join(" | ")} |`)
      .join("\n");
  }
  return children(node)
    .map((child) => markdownBlock(child, depth))
    .join("\n");
}

function inlineHtml(node: JSONContent): string {
  if (node.type === "hardBreak") return "<br>";
  let value = escapeHtml(node.text || children(node).map(inlineHtml).join(""));
  for (const mark of node.marks || []) {
    if (mark.type === "bold") value = `<strong>${value}</strong>`;
    else if (mark.type === "italic") value = `<em>${value}</em>`;
    else if (mark.type === "strike") value = `<s>${value}</s>`;
    else if (mark.type === "code") value = `<code>${value}</code>`;
    else if (mark.type === "link" && mark.attrs?.href)
      value = `<a href="${escapeHtml(String(mark.attrs.href))}" rel="noopener noreferrer">${value}</a>`;
    else if (mark.type === "textStyle" && mark.attrs?.fontFamily)
      value = `<span style="font-family:${escapeHtml(String(mark.attrs.fontFamily))}">${value}</span>`;
  }
  return value;
}

function htmlBlock(node: JSONContent): string {
  const inline = children(node).map(inlineHtml).join("");
  if (node.type === "paragraph") return `<p>${inline}</p>`;
  if (node.type === "heading") {
    const level = Math.min(6, Number(node.attrs?.level) || 1);
    return `<h${level}>${inline}</h${level}>`;
  }
  if (node.type === "blockquote")
    return `<blockquote>${children(node).map(htmlBlock).join("")}</blockquote>`;
  if (node.type === "codeBlock")
    return `<pre><code>${escapeHtml(text(node))}</code></pre>`;
  if (node.type === "horizontalRule") return "<hr>";
  if (node.type === "image")
    return `<img src="${escapeHtml(String(node.attrs?.src || ""))}" alt="${escapeHtml(String(node.attrs?.alt || ""))}">`;
  if (node.type === "bulletList")
    return `<ul>${children(node).map(htmlBlock).join("")}</ul>`;
  if (node.type === "orderedList")
    return `<ol>${children(node).map(htmlBlock).join("")}</ol>`;
  if (node.type === "listItem")
    return `<li>${children(node).map(htmlBlock).join("")}</li>`;
  if (node.type === "table")
    return `<table><tbody>${children(node).map(htmlBlock).join("")}</tbody></table>`;
  if (node.type === "tableRow")
    return `<tr>${children(node).map(htmlBlock).join("")}</tr>`;
  if (node.type === "tableHeader")
    return `<th>${children(node).map(htmlBlock).join("")}</th>`;
  if (node.type === "tableCell")
    return `<td>${children(node).map(htmlBlock).join("")}</td>`;
  return children(node).map(htmlBlock).join("");
}

export function manuscriptToMarkdown(document: JSONContent) {
  return children(document)
    .map((node) => markdownBlock(node))
    .join("\n\n");
}
export function manuscriptToHtml(document: JSONContent) {
  return children(document).map(htmlBlock).join("\n");
}
export function manuscriptToText(document: JSONContent) {
  return children(document)
    .map((node) => text(node))
    .join("\n");
}
