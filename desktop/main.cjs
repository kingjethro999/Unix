const { app, BrowserWindow, shell } = require("electron");
const { spawn } = require("node:child_process");
const path = require("node:path");
const net = require("node:net");
const fs = require("node:fs");

const port = Number(process.env.UNIX_DESKTOP_PORT || 3100);
const developmentUrl = process.env.UNIX_DESKTOP_URL || "http://127.0.0.1:3000";
let server;

function configuredServerUrl() {
  if (!app.isPackaged) return process.env.UNIX_DESKTOP_URL || null;
  try {
    const config = JSON.parse(
      fs.readFileSync(path.join(process.resourcesPath, "runtime.json"), "utf8"),
    );
    return typeof config.serverUrl === "string" && config.serverUrl
      ? config.serverUrl
      : null;
  } catch {
    return null;
  }
}

function waitForPort() {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + 30_000;
    const attempt = () => {
      const socket = net.connect(port, "127.0.0.1");
      socket.once("connect", () => {
        socket.destroy();
        resolve();
      });
      socket.once("error", () => {
        socket.destroy();
        if (Date.now() >= deadline)
          reject(new Error("Unix server did not start"));
        else setTimeout(attempt, 250);
      });
    };
    attempt();
  });
}

async function localUrl() {
  if (!app.isPackaged) return developmentUrl;
  const configuredUrl = configuredServerUrl();
  if (configuredUrl) return configuredUrl;
  const serverPath = path.join(process.resourcesPath, "server", "server.js");
  server = spawn(process.execPath, [serverPath], {
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      HOSTNAME: "127.0.0.1",
      PORT: String(port),
    },
    stdio: "ignore",
  });
  await waitForPort();
  return `http://127.0.0.1:${port}`;
}

async function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: "#09090b",
    title: "Unix",
    icon: app.isPackaged
      ? path.join(process.resourcesPath, "unix-logo.png")
      : path.join(__dirname, "..", "public", "images", "unix-logo.png"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });
  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });
  const baseUrl = await localUrl();
  await window.loadURL(new URL("/desktop", baseUrl).toString());
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
app.on("before-quit", () => server?.kill());
app.on("activate", () => {
  if (!BrowserWindow.getAllWindows().length) void createWindow();
});
