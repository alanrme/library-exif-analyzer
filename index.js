const { app, BrowserWindow, dialog, ipcMain } = require('electron')
const { promisify } = require('util')
const path = require("path")
const fs = require("fs")
const readdir = promisify(fs.readdir)
const stat = promisify(fs.stat);

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    })
    
    win.loadFile('index.html')
    
    ipcMain.handle('dialog:openDirectory', async () => {
        const { canceled, filePaths } = await dialog.showOpenDialog(win, {
            properties: ['openDirectory']
        })
        if (canceled) {
            return
        } else {
            return loadData(filePaths)
        }
    })
}

app.whenReady().then(() => {
    createWindow()
    
    // if the app is activated on mac while all windows closed, reopen the window
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

// quit app when windows are closed (except on mac)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

getFiles = async (dir) => {
    const subdirs = await readdir(dir)
    const files = await Promise.all(subdirs.map(async (subdir) => {
      const res = path.resolve(dir, subdir)
      return (await stat(res)).isDirectory() ? getFiles(res) : res;
    }))
    return files.reduce((a, f) => a.concat(f), []); 
}

loadData = async (dirs) => {
    dirs.forEach(dir => {
        getFiles(dir)
            .then(files => console.log(files))
    })
}