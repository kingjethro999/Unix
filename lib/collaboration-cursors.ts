import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Collaborator } from "@/hooks/use-presence";

export const collaborationCursorKey = new PluginKey<DecorationSet>(
  "unixCollaborationCursors",
);
export const CollaborationCursors = Extension.create({
  name: "unixCollaborationCursors",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: collaborationCursorKey,
        state: {
          init: () => DecorationSet.empty,
          apply(transaction, current) {
            const collaborators = transaction.getMeta(
              collaborationCursorKey,
            ) as Collaborator[] | undefined;
            if (!collaborators)
              return current.map(transaction.mapping, transaction.doc);
            const decorations: Decoration[] = [];
            for (const person of collaborators) {
              const from = Math.max(
                1,
                Math.min(person.from ?? 1, transaction.doc.content.size),
              );
              const to = Math.max(
                from,
                Math.min(person.to ?? from, transaction.doc.content.size),
              );
              if (to > from)
                decorations.push(
                  Decoration.inline(from, to, {
                    style: `background:${person.color}22`,
                  }),
                );
              decorations.push(
                Decoration.widget(
                  to,
                  () => {
                    const marker = document.createElement("span");
                    marker.className = "unix-remote-cursor";
                    marker.style.borderColor = person.color;
                    marker.title = person.name;
                    const label = document.createElement("span");
                    label.textContent = person.name;
                    label.style.background = person.color;
                    marker.append(label);
                    return marker;
                  },
                  { side: 1 },
                ),
              );
            }
            return DecorationSet.create(transaction.doc, decorations);
          },
        },
        props: {
          decorations: (state) => collaborationCursorKey.getState(state),
        },
      }),
    ];
  },
});
