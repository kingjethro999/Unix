import Link from "next/link";
import {
  Apple,
  ArrowLeft,
  Download,
  Laptop,
  Monitor,
  Package,
} from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";

export const dynamic = "force-dynamic";

type DesktopDownload = {
  platform: string;
  detail: string;
  icon: typeof Monitor;
  href?: string;
};

const downloads: DesktopDownload[] = [
  {
    platform: "Windows",
    detail: "Installer for 64-bit Windows",
    icon: Monitor,
    href:
      process.env.UNIX_DOWNLOAD_WINDOWS_URL ||
      "https://github.com/kingjethro999/Unix/releases/latest/download/Unix-Setup-x64.exe",
  },
  {
    platform: "macOS",
    detail: "Apple silicon and Intel disk image",
    icon: Apple,
    href:
      process.env.UNIX_DOWNLOAD_MAC_URL ||
      "https://github.com/kingjethro999/Unix/releases/latest/download/Unix-x64.dmg",
  },
  {
    platform: "Linux",
    detail: "AppImage and Debian package",
    icon: Package,
    href:
      process.env.UNIX_DOWNLOAD_LINUX_URL ||
      "https://github.com/kingjethro999/Unix/releases/latest/download/Unix-x86_64.AppImage",
  },
];

export default function DownloadPage() {
  const published = downloads.filter((download) => download.href);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />
      <section className="mx-auto max-w-5xl px-5 pb-20 pt-36 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
        >
          <ArrowLeft size={16} aria-hidden="true" /> Back to Unix
        </Link>

        <div className="mt-12 max-w-2xl">
          <div className="mb-5 inline-flex size-12 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
            <Laptop size={23} aria-hidden="true" />
          </div>
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Unix for your desktop
          </h1>
          <p className="mt-5 text-pretty text-lg leading-8 text-zinc-400">
            A dedicated writing desk that keeps an open draft available through
            connection changes and resumes syncing when you are back online.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {downloads.map((download) => {
            const Icon = download.icon;
            const card = (
              <>
                <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-800 text-zinc-200">
                  <Icon size={20} aria-hidden="true" />
                </div>
                <h2 className="mt-7 text-lg font-medium text-white">
                  {download.platform}
                </h2>
                <p className="mt-2 min-h-12 text-sm leading-6 text-zinc-500">
                  {download.detail}
                </p>
                <span className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-cyan-300">
                  <Download size={16} aria-hidden="true" />
                  Download for {download.platform}
                </span>
              </>
            );
            return download.href ? (
              <a
                key={download.platform}
                href={download.href}
                className="group rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition-colors hover:border-cyan-400/40 hover:bg-zinc-900"
              >
                {card}
              </a>
            ) : (
              <div
                key={download.platform}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 opacity-65"
              >
                {card}
                <p className="mt-3 text-xs text-zinc-500">
                  Installer not published yet.
                </p>
              </div>
            );
          })}
        </div>

        <aside className="mt-10 rounded-xl border border-zinc-800 bg-zinc-900/50 px-5 py-4 text-sm leading-6 text-zinc-400">
          Writing and local drafts remain usable during a connection loss. AI
          assistance and first-time workspace loading require a connection.
          {!published.length && (
            <span className="block pt-2 text-zinc-500">
              Installers will become active here when release artifacts are
              published.
            </span>
          )}
        </aside>
      </section>
    </main>
  );
}
