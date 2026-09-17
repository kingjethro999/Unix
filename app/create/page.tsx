import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getFolders } from "./actions";
import { Dashboard } from "./dashboard";

export default async function CreatePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return <Dashboard initialFolders={await getFolders()} userId={user.id} />;
}
