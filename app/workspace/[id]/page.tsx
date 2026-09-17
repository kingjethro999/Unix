import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { EditorLayout } from "@/components/editor";
import { getFolder, getPages } from "@/app/workspace/actions";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?redirect=/workspace/${id}`);
  const folder = await getFolder(id);
  if (!folder) return <div className="p-8">Workspace not found</div>;
  return (
    <EditorLayout
      folder={folder}
      initialPages={await getPages(id)}
      userId={user.id}
    />
  );
}
