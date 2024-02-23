const { contextBridge, ipcRenderer } = require("electron")

window.addEventListener('DOMContentLoaded', () => {
})

contextBridge.exposeInMainWorld("API", {
    setDir: (args) => ipcRenderer.invoke("set-dir", args),
    selectFolder: () => ipcRenderer.invoke('dialog:openDirectory')
})