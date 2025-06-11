const { app, BrowserWindow, dialog, ipcMain } = require('electron')
const { promisify } = require('util')
const path = require("path")
const fs = require("fs").promises
//const readdir = promisify(fs.readdir)
//const stat = promisify(fs.stat)
const ExifReader = require('exifreader')

const { main: data } = require('./data.js')

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

    result = {
        options: options,
        total: { count: 0, size: 0 }
    }

    // list of exif tags to look for
    let searchTags = []
    // for every attribute the user has selected, add its corresponding exif tags from data.js
    for (attr in options.attributes) {
        if (options.attributes[attr]) {
            searchTags = searchTags.concat(data.attributeTags[attr])
            result[attr] = {}
        }
    }
    console.log(searchTags)
    
    for (dir of dirs) {
        promises.push(new Promise((resolve, reject) => {
            getFiles(dir)
                .then(async files => {
                    const fileCount = files.length
                    for await (const [index, file] of files.entries()) {
                        try {
                            let tags // exif tags

                            // if extra exif data is not requested
                            if (options.extraData == false) {
                                // length option loads first 128kb of the file which is likely to contain necessary metadata
                                tags = await ExifReader.load(file, {length: 128 * 1024})
    
                                // if any tags to look for are missing, try loading the entire file
                                if (searchTags.some((i) => !tags[i])) {
                                    tags = await ExifReader.load(file)
                                }
                            }
                            // else load the full file
                            else {
                                tags = await ExifReader.load(file)
                            }

                            /*
                            const etags = await ExifReader.load(file, {expanded: true});
                            fs.writeFile('./samples/'+file.replace(/^.*[\\/]/, '')+'.json', JSON.stringify(etags), 'utf8', (err) => {
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
                            result.total.count++
                            result.total.size += stat.size
    
                            if (options.attributes.makes) {
                                // ?. is optional chaining,  it causes the value to default to undefined if
                                // the property succeeding ?. doesn't exist.
                                make = tags.Make?.value[0] || "Unknown"
                                // if make is not a property, add it with count 1, otherwise increase count
                                if (result.makes[make]) {
                                    result.makes[make].count++
                                    result.makes[make].size += stat.size
                                } else {
                                    result.makes[make] = { count: 1, size: stat.size, models: {} }
                                }
                            
                                model = tags.Model?.value[0] || "Unknown"
                                if (result.makes[make].models[model]) {
                                    result.makes[make].models[model].count++
                                    result.makes[make].models[model].size += stat.size
                                } else {
                                    result.makes[make].models[model] = { count: 1, size: stat.size }
                                }
                            }

                            if (options.attributes.fLengths35) {
                                fLength35 = tags.FocalLengthIn35mmFilm?.value || "Unknown"
                                if (result.fLengths35[fLength35]) {
                                    result.fLengths35[fLength35].count++
                                    result.fLengths35[fLength35].size += stat.size
                                } else {
                                    result.fLengths35[fLength35] = { count: 1, size: stat.size }
                                }
                            }

                            if (options.attributes.apertures) {
                                aperture = tags.ApertureValue?.description || "Unknown"
                                if (result.apertures[aperture]) {
                                    result.apertures[aperture].count++
                                    result.apertures[aperture].size += stat.size
                                } else {
                                    result.apertures[aperture] = { count: 1, size: stat.size }
                                }
                            }


                            console.log(stat.size)
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
    console.log(result)
    return result
}