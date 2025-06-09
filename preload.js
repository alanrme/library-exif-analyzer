const { contextBridge, ipcRenderer } = require("electron")

window.addEventListener('DOMContentLoaded', () => {
})

contextBridge.exposeInMainWorld("API", {
    setDir: (args) => ipcRenderer.invoke("set-dir", args),
    selectFolder: (options) => ipcRenderer.invoke('dialog:openDirectory', options),
    onLoadingProgress: (callback) => ipcRenderer.on('loading-progress', (_event, value) => callback(value))
})