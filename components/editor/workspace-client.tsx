"use client";

import dynamic from "next/dynamic";

const EditorLayout = dynamic(
  () => import("./editor-layout").then((module) => module.EditorLayout),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-screen place-items-center bg-[#0e0e10] text-[12px] text-zinc-500">
        Opening workspace…
      </div>
    ),
  },
);

export function WorkspaceClient(props: {
  folder: { id: string; name: string };
  initialPages: Array<{ id: string; title: string; folder_id: string }>;
  userId: string;
}) {
  return <EditorLayout {...props} />;
}
