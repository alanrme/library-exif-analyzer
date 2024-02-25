const { app, BrowserWindow, dialog, ipcMain } = require('electron')
const { promisify } = require('util')
const path = require("path")
const fs = require("fs")
const readdir = promisify(fs.readdir)
const stat = promisify(fs.stat)
const ExifReader = require('exifreader')

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
    
    ipcMain.handle('dialog:openDirectory', async (event) => {
        const { canceled, filePaths } = await dialog.showOpenDialog(win, {
            properties: ['openDirectory']
        })
        if (canceled) return
        return await loadData(filePaths)
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
      return (await stat(res)).isDirectory() ? getFiles(res) : res
    }))
    return files.reduce((a, f) => a.concat(f), []);
}

loadData = async (dirs) => {
    // make a list of promises for each iteration of the for loop
    promises = []

    makes = {}
    lenses = {}
    focalLengths = {}
    total = 0
    for (dir of dirs) {
        promises.push(new Promise((resolve, reject) => {
            getFiles(dir)
                .then(async files => {
                    for await (file of files) {
                        try {
                            // length option loads first 128kb of the file which is likely to contain necessary metadata
                            tags = await ExifReader.load(file, {length: 128 * 1024})

                            // if any tags that this program uses are missing, try loading the entire file
                            if (["Make", "Model", "FocalLength"].some((i) => !tags[i])) {
                                tags = await ExifReader.load(file)
                                make = tags.Make.value[0]
                                model = tags.Model.value[0]
                            }

                            make = tags.Make.value[0]
                            if (!make) make = "Unknown"
                            // if make not in object, add it with count 1, otherwise increase count
                            if (makes[make]) {
                                makes[make].count++
                            } else {
                                makes[make] = { count: 1, models: {} }
                            }

                            model = tags.Model.value[0]
                            if (!model) model = "Unknown"
                            // if model not in object, add it with count 1, otherwise increase count
                            if (makes[make].models[model]) {
                                makes[make].models[model]++
                            } else {
                                makes[make].models[model] = 1
                            }

                            total++
                        } catch (e) {
                            console.log(e)
                        }
                    }
                }).then(() => resolve())
        }))
    }

    await Promise.all(promises)
    console.log("aaaaaaaaaaaaaaaaaaaaaaaaghghhghgh")
    return {
        makes: makes,
        lenses: lenses,
        total: total,
    }
}