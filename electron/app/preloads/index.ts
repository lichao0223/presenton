import { contextBridge, ipcRenderer } from 'electron';
import type { IpcRendererEvent } from 'electron';

contextBridge.exposeInMainWorld('env', {
  NEXT_PUBLIC_FAST_API: process.env.NEXT_PUBLIC_FAST_API || '',
  NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL || '',
  TEMP_DIRECTORY: process.env.TEMP_DIRECTORY || '',
  NEXT_PUBLIC_USER_CONFIG_PATH: process.env.NEXT_PUBLIC_USER_CONFIG_PATH || '',
  APP_VERSION: process.env.APP_VERSION || '',
});


contextBridge.exposeInMainWorld('electron', {
  fileDownloaded: (filePath: string) => ipcRenderer.invoke("file-downloaded", filePath),
  exportPresentation: (id: string, title: string, format: "pptx" | "pdf") =>
    ipcRenderer.invoke("export-presentation", id, title, format),
  getUserConfig: () => ipcRenderer.invoke("get-user-config"),
  setUserConfig: (userConfig: UserConfig) => ipcRenderer.invoke("set-user-config", userConfig),
  getCanChangeKeys: () => ipcRenderer.invoke("get-can-change-keys"),
  readFile: (filePath: string) => ipcRenderer.invoke("read-file", filePath),
  getSlideMetadata: (url: string, theme: string, customColors?: any, tempDirectory?: string) =>
    ipcRenderer.invoke("get-slide-metadata", url, theme, customColors, tempDirectory),
  getFooter: (userId: string) => ipcRenderer.invoke("get-footer", userId),
  setFooter: (userId: string, properties: any) => ipcRenderer.invoke("set-footer", userId, properties),
  getTheme: (userId: string) => ipcRenderer.invoke("get-theme", userId),
  setTheme: (userId: string, themeData: any) => ipcRenderer.invoke("set-theme", userId, themeData),
  uploadImage: (file: Buffer) => ipcRenderer.invoke("upload-image", file),
  writeNextjsLog: (logData: string) => ipcRenderer.invoke("write-nextjs-log", logData),
  clearNextjsLogs: () => ipcRenderer.invoke("clear-nextjs-logs"),
  checkLibreOffice: () => ipcRenderer.invoke("lo:check-installed"),
  installLibreOffice: () => ipcRenderer.invoke("lo:start-install"),
  cancelLibreOfficeInstall: () => ipcRenderer.invoke("lo:cancel-install"),
  onLibreOfficeProgress: (
    callback: (payload: { phase: string; percent?: number; message?: string }) => void
  ) => {
    const listener = (
      _event: IpcRendererEvent,
      payload: { phase: string; percent?: number; message?: string }
    ) => callback(payload);
    ipcRenderer.on("lo:progress", listener);
    return () => ipcRenderer.removeListener("lo:progress", listener);
  },
  onLibreOfficeLog: (callback: (payload: { level: string; text: string }) => void) => {
    const listener = (_event: IpcRendererEvent, payload: { level: string; text: string }) =>
      callback(payload);
    ipcRenderer.on("lo:log", listener);
    return () => ipcRenderer.removeListener("lo:log", listener);
  },
  // API handlers
  hasRequiredKey: () => ipcRenderer.invoke("api:has-required-key"),
  telemetryStatus: () => ipcRenderer.invoke("api:telemetry-status"),
  getTemplates: () => ipcRenderer.invoke("api:templates"),
});
