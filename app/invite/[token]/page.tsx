import { redirect } from "next/navigation";
import Link from "next/link";
import { acceptWorkspaceInvitation } from "@/app/actions/members";
import { getCurrentUser } from "@/lib/auth";

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const user = await getCurrentUser();
  if (!user)
    redirect(`/sign-in?redirect=${encodeURIComponent(`/invite/${token}`)}`);
  async function accept() {
    "use server";
    const result = await acceptWorkspaceInvitation(token);
    redirect(`/workspace/${result.workspaceId}`);
  }
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 grid place-items-center p-6">
      <section className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-7 shadow-2xl">
        <h1 className="text-xl font-semibold">Workspace invitation</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Accept this invitation to add the shared workspace to your account.
        </p>
        <form action={accept} className="mt-6">
          <button className="w-full rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-medium hover:bg-cyan-500">
            Accept invitation
          </button>
        </form>
        <Link
          href="/create"
          className="mt-3 block text-center text-xs text-zinc-500 hover:text-zinc-300"
        >
          Return to workspaces
        </Link>
      </section>
    </main>
  );
}
