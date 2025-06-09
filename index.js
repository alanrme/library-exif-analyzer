const { app, BrowserWindow, dialog, ipcMain } = require('electron')
const { promisify } = require('util')
const path = require("path")
const fs = require("fs").promises
//const readdir = promisify(fs.readdir)
//const stat = promisify(fs.stat)
const ExifReader = require('exifreader')

let win

const createWindow = () => {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            autoHideMenuBar: true,
            nodeIntegration: false,
            contextIsolation: true
        }
    })
    
    win.loadFile('index.html')
    
    ipcMain.handle('dialog:openDirectory', async (event, options) => {
        const { canceled, filePaths } = await dialog.showOpenDialog(win, {
            properties: ['openDirectory']
        })
        if (canceled) return
        return await loadData(filePaths, options)
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
    const subdirs = await fs.readdir(dir)
    const files = await Promise.all(subdirs.map(async (subdir) => {
        try {
            const res = path.resolve(dir, subdir)
            return (await fs.stat(res)).isDirectory() ? getFiles(res) : res
        } catch (e) {
            console.error(e)
        }
    }))
    return files.reduce((a, f) => a.concat(f), []);
}

loadData = async (dirs, options) => {
    // make a list of promises for each iteration of the for loop
    promises = []

    makes = {}
    lenses = {}
    fLengths35 = {}
    total = { count: 0, size: 0 }
    
    for (dir of dirs) {
        promises.push(new Promise((resolve, reject) => {
            getFiles(dir)
                .then(async files => {
                    const fileCount = files.length
                    for await (const [index, file] of files.entries()) {
                        try {
                            let tags // exif tags

                            // if extra exif data is not requested
                            if (options.extraData == "false") {
                                // length option loads first 128kb of the file which is likely to contain necessary metadata
                                tags = await ExifReader.load(file, {length: 128 * 1024})
    
                                // if any tags that this program uses are missing, try loading the entire file
                                if (["Make", "Model", "FocalLengthIn35mmFilm"].some((i) => !tags[i])) {
                                    tags = await ExifReader.load(file)
                                }
                            }
                            // else load the full file
                            else {
                                tags = await ExifReader.load(file)
                            }

                            /*
                            fs.writeFile('./samples/'+file.replace(/^.*[\\/]/, ''), JSON.stringify(tags), 'utf8', (err) => {
                                if (err) {
                                  console.error('Error writing file:', err);
                                  return;
                                }
                                console.log('File written successfully!');
                            });
                            */

                            // read file stats and get size property (in byes)
                            const stat = await fs.stat(file)

                            // increment total after file has successfully loaded
                            total.count++
                            total.size += stat.size
    
                            // ?. is optional chaining,  it causes the value to default to undefined if
                            // the property succeeding ?. doesn't exist.
                            make = tags.Make?.value[0] || "Unknown"
                            // if make not in object, add it with count 1, otherwise increase count
                            if (makes[make]) {
                                makes[make].count++
                                makes[make].size += stat.size
                            } else {
                                makes[make] = { count: 1, size: stat.size, models: {} }
                            }
    
                            model = tags.Model?.value[0] || "Unknown"
                            if (makes[make].models[model]) {
                                makes[make].models[model].count++
                                makes[make].models[model].size += stat.size
                            } else {
                                makes[make].models[model] = { count: 1, size: stat.size }
                            }
    
                            fLength35 = tags.FocalLengthIn35mmFilm?.value || "Unknown"
                            if (fLengths35[fLength35]) {
                                fLengths35[fLength35].count++
                                fLengths35[fLength35].size += stat.size
                            } else {
                                fLengths35[fLength35] = { count: 1, size: stat.size }
                            }
                            console.log(make, model, fLength35, stat.size)
                        } catch (e) {
                            console.error(e)
                            continue
                        }

                        win.webContents.send('loading-progress', 100*(index/fileCount))
                    }
                })
                .then(() => resolve())
        }))
    }

    await Promise.all(promises)
    console.log({
        makes: makes,
        lenses: lenses,
        focalLengths35: fLengths35,
        total: total
    })
    console.log(JSON.stringify(makes))
    return {
        makes: makes,
        lenses: lenses,
        focalLengths35: fLengths35,
        total: total
    }
}