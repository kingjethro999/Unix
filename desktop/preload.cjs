const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("unixDesktop", {
  isDesktop: true,
  platform: process.platform,
});
