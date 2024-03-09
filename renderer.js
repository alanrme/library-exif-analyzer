dirButton = document.getElementById("openpicker")
statusH = document.getElementById("status")
makeModelData = document.getElementById("makemodeldata")
modelData = document.getElementById("modeldata")
lengths35Data = document.getElementById("flength35data")
lengths35Canvas = document.getElementById('flength35chart').getContext('2d')

let lengths35Chart

dirButton.addEventListener("click", async e => {
    statusH.innerText = "Loading photos..."
    data = await window.API.selectFolder()
    console.log(data)
    
    // clear any existing progress bars
    // only if anything was returned (i.e. a folder was actually selected vs clicking cancel)
    if (data) {
        makeModelData.replaceChildren()
        modelData.replaceChildren()
        lengths35Data.replaceChildren()
        statusH.innerText = data.total + " photos/videos"
    } else {
        statusH.innerText = "Selection cancelled."
    }

    if (lengths35Chart) lengths35Chart.destroy()
    
    makes = data.makes
    for (makeName of Object.keys(makes)) {
        make = makes[makeName]
        // get the contents of the <template> for camera make and make>model cards
        maketmpl = document.getElementById("makeprog").content.cloneNode(1).firstElementChild
        
        maketmpl.getElementsByTagName("progress")[0].value = 100*(make.count/data.total)
        count = document.createTextNode(make.count)
        maketmpl.getElementsByClassName("count")[0].appendChild(count)
        makeTxt = document.createTextNode(makeName)
        maketmpl.getElementsByClassName("make")[0].appendChild(makeTxt)
        
        console.log(make.models, Object.keys(make.models))
        for (model of Object.keys(make.models)) {
            modelCount = make.models[model]
            
            mmodeltmpl = document.getElementById("mmodelprog").content.cloneNode(1).firstElementChild
            
            mmodeltmpl.getElementsByTagName("progress")[0].value = 100*(modelCount/make.count)
            count = document.createTextNode(modelCount)
            mmodeltmpl.getElementsByClassName("count")[0].appendChild(count)
            modelNameTxt = document.createTextNode(model)
            mmodeltmpl.getElementsByClassName("model")[0].appendChild(modelNameTxt)
            // add this model progress bar to the make
            maketmpl.getElementsByClassName("models")[0].appendChild(mmodeltmpl)
            
            
            modeltmpl = document.getElementById("modelprog").content.cloneNode(1).firstElementChild
            
            modeltmpl.getElementsByTagName("progress")[0].value = 100*(modelCount/data.total)
            count = document.createTextNode(modelCount)
            modeltmpl.getElementsByClassName("count")[0].appendChild(count)
            makeAndModelNameTxt = document.createTextNode(makeName + " " + model)
            modeltmpl.getElementsByClassName("model")[0].appendChild(makeAndModelNameTxt)
            // add this make&model progress bar to the models
            modelData.appendChild(modeltmpl)
        }
        
        makeModelData.appendChild(maketmpl)
    }
    
    fLengths35 = data.focalLengths35
    for (length of Object.keys(fLengths35)) {
        lengthCount = fLengths35[length]
        lentmpl = document.getElementById("flength35prog").content.cloneNode(1).firstElementChild
        
        lentmpl.getElementsByTagName("progress")[0].value = 100*(lengthCount/data.total)
        count = document.createTextNode(lengthCount)
        lentmpl.getElementsByClassName("count")[0].appendChild(count)
        lenTxt = document.createTextNode(length + " mm")
        lentmpl.getElementsByClassName("flength35")[0].appendChild(lenTxt)
        
        lengths35Data.appendChild(lentmpl)
    }
    
    // remove "Unknown" or other string lengths that can't be on the graph
    // this array is for the graph "labels"/X axis
    lengthNamesKnown = Object.keys(fLengths35).filter(l => !isNaN(l)).map(l => { return parseFloat(l) })
    // push photo count to another array (graph Y axis)
    lengthCountsKnown = []
    lengthNamesKnown.forEach(l => lengthCountsKnown.push(fLengths35[l]))
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
                        text: 'Focal length (35mm eq.)'
                    },
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Photos taken'
                    },
                    suggestedMin: 0
                }
            }
        }
    }
    lengths35Chart = new Chart(lengths35Canvas, config)
        
    lenses = data.lenses
})