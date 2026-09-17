import { spawnSync } from "node:child_process";
import { join } from "node:path";

const target = process.argv[2];
const targetArgs =
  target === "--win"
    ? ["--win", "nsis", "--publish", "never"]
    : target === "--mac"
      ? ["--mac", "dmg", "zip", "--publish", "never"]
      : target === "--linux"
        ? ["--linux", "AppImage", "deb", "--publish", "never"]
        : null;

if (!targetArgs) {
  throw new Error("Choose one desktop target: --linux, --win, or --mac.");
}

const executable = (name) =>
  join(
    process.cwd(),
    "node_modules",
    ".bin",
    process.platform === "win32" ? `${name}.cmd` : name,
  );

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(executable("next"), ["build"]);
run(process.execPath, ["scripts/prepare-desktop.mjs"]);
run(executable("electron-builder"), targetArgs);
