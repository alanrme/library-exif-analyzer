loadingProgBar = document.getElementById('loadingprog')
window.API.onLoadingProgress((progress) => {
    loadingProgBar.value = progress
})

dirButton = document.getElementById("openpicker")
statusH = document.getElementById("status")
makeModelData = document.getElementById("makemodeldata")
modelData = document.getElementById("modeldata")
lengths35Data = document.getElementById("flength35data")
lengths35Canvas = document.getElementById('flength35chart').getContext('2d')

attributeButtons = document.getElementsByName("attributes")
metricButtons = document.getElementsByName("metric")
extraDataButtons = document.getElementsByName("extradata")

// labels for the graph axis depending on what metric is selected
const axisLabels = {
    "count": "Photos taken",
    "size": "Size (Bytes)"
}

let lengths35Chart
let data
let metric = "count"

dirButton.addEventListener("click", async e => {
    statusH.innerText = "Loading photos..."

    options = {
        attributes: {},
        extraData: false
    }

    for (button of extraDataButtons) {
        if (button.checked)
            options.extraData = Boolean(button.value)
    }
    for (button of attributeButtons) {
        options.attributes[button.value] = button.checked
    }
    
    console.log(options)
    data = await window.API.selectFolder(options)
    console.log(data)
    console.log(JSON.stringify(data))
    
    updateGraphs(data, metric)
})

for (button of metricButtons) {
    button.addEventListener("click", event => {
        metric = event.target.value
        updateGraphs(data, metric)
    })
}

extraDataInfo = document.getElementById("extradatainfo")
extraDataInfo.addEventListener("click", () => {
    alert(`
This program usually only scans the beginning of each file as the required EXIF tags are usually present in this area.
The EXIF tags for features such as motion photos is often entirely missing when the feature does not exist (i.e. there is no motion photo tag on a static photo)
To know whether the photo truly is not a motion photo, the entire file needs to be scanned to check whether the tag is missing. This heavily slows down the scanning process.
Detecting motion photos is also hit or miss due to various implementations by various brands, so it's probably better to turn this off.
    `)
})

function updateGraphs(data, metric) {
    // clear any existing progress bars
    // only if anything was returned (i.e. a folder was actually selected vs clicking cancel)
    if (data) {
        makeModelData.replaceChildren()
        modelData.replaceChildren()
        lengths35Data.replaceChildren()
        statusH.innerText = data.total.count + " photos/videos"
    } else {
        statusH.innerText = "Selection cancelled."
    }

    if (lengths35Chart) lengths35Chart.destroy()
    
    if (data.options.attributes.makes) {
        makes = data.makes
        for (makeName of Object.keys(makes)) {
            make = makes[makeName]
            // get the contents of the <template> for camera make and make>model cards
            maketmpl = document.getElementById("makeprog").content.cloneNode(1).firstElementChild
            
            maketmpl.getElementsByTagName("progress")[0].value = 100*(make[metric]/data.total[metric])
            // if metric being viewed is file size, parse size into a readable format, else don't
            countLabel = metric == "size" ? parseSize(make[metric]) : make[metric]
            countLabel = document.createTextNode(countLabel)
            maketmpl.getElementsByClassName("count")[0].appendChild(countLabel)
            makeTxt = document.createTextNode(makeName)
            maketmpl.getElementsByClassName("make")[0].appendChild(makeTxt)
            
            //console.log(make.models, Object.keys(make.models))
            for (model of Object.keys(make.models)) {
                modelCount = make.models[model][metric]
                
                mmodeltmpl = document.getElementById("mmodelprog").content.cloneNode(1).firstElementChild
                
                mmodeltmpl.getElementsByTagName("progress")[0].value = 100*(modelCount/make[metric])
                countLabel = metric == "size" ? parseSize(modelCount) : modelCount
                countLabel = document.createTextNode(countLabel)
                mmodeltmpl.getElementsByClassName("count")[0].appendChild(countLabel)
                modelNameTxt = document.createTextNode(model)
                mmodeltmpl.getElementsByClassName("model")[0].appendChild(modelNameTxt)
                // add this model progress bar to the make
                maketmpl.getElementsByClassName("models")[0].appendChild(mmodeltmpl)
                
                
                modeltmpl = document.getElementById("modelprog").content.cloneNode(1).firstElementChild
                
                modeltmpl.getElementsByTagName("progress")[0].value = 100*(modelCount/data.total[metric])
                countLabel = metric == "size" ? parseSize(modelCount) : modelCount
                countLabel = document.createTextNode(countLabel)
                modeltmpl.getElementsByClassName("count")[0].appendChild(countLabel)
                makeAndModelNameTxt = document.createTextNode(makeName + " " + model)
                modeltmpl.getElementsByClassName("model")[0].appendChild(makeAndModelNameTxt)
                // add this make&model progress bar to the models
                modelData.appendChild(modeltmpl)
            }
            
            makeModelData.appendChild(maketmpl)
        }
    }
    
    if (data.options.attributes.fLengths35) {
        fLengths35 = data.fLengths35
        for (length of Object.keys(fLengths35)) {
            lengthCount = fLengths35[length][metric]
            lentmpl = document.getElementById("flength35prog").content.cloneNode(1).firstElementChild
            
            lentmpl.getElementsByTagName("progress")[0].value = 100*(lengthCount/data.total[metric])
            countLabel = metric == "size" ? parseSize(lengthCount) : lengthCount
            countLabel = document.createTextNode(countLabel)
            lentmpl.getElementsByClassName("count")[0].appendChild(countLabel)
            lenTxt = document.createTextNode(length + " mm")
            lentmpl.getElementsByClassName("flength35")[0].appendChild(lenTxt)
            
            lengths35Data.appendChild(lentmpl)
        }
        
        // remove "Unknown" or other string lengths that can't be on the graph
        // this array is for the graph "labels"/X axis
        lengthNamesKnown = Object.keys(fLengths35).filter(l => !isNaN(l)).map(l => { return parseFloat(l) })
        // push photo count to another array (graph Y axis)
        lengthCountsKnown = []
        lengthNamesKnown.forEach(l => lengthCountsKnown.push(fLengths35[l][metric]))
        const config = {
            type: 'bar',
            data: {
                labels: lengthNamesKnown,
                datasets: [
                    {
                        data: lengthCountsKnown
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Focal length (35mm eq.) (mm)'
                        },
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: axisLabels[metric]
                        },
                        suggestedMin: 0
                    }
                }
            }
        }
        lengths35Chart = new Chart(lengths35Canvas, config)
    }


    lMakes = data.lMakes

    
    apertures = data.apertures
}

function parseSize(bytes) {
    if (bytes > 1073741824) {
        return (bytes/1073741824).toFixed(2) + " GiB"
    } else if (bytes > 1048576) {
        return (bytes/1048576).toFixed(2) + " MiB"
    } else if (bytes > 1024) {
        return (bytes/1024).toFixed(2) + " KiB"
    } else {
        return bytes + " B"
    }
}