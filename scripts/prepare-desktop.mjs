import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const standalone = join(process.cwd(), ".next", "standalone");
await rm(join(standalone, ".next", "static"), { recursive: true, force: true });
await mkdir(join(standalone, ".next"), { recursive: true });
await cp(
  join(process.cwd(), ".next", "static"),
  join(standalone, ".next", "static"),
  { recursive: true },
);
await cp(join(process.cwd(), "public"), join(standalone, "public"), {
  recursive: true,
});

const serverUrl = process.env.UNIX_DESKTOP_URL?.replace(/\/$/, "") || "";
if (serverUrl && !/^https?:\/\//.test(serverUrl)) {
  throw new Error("UNIX_DESKTOP_URL must start with http:// or https://");
}
await writeFile(
  join(process.cwd(), "desktop", "runtime.json"),
  `${JSON.stringify({ serverUrl }, null, 2)}\n`,
);
