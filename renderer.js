dirButton = document.getElementById("openpicker")
statusH = document.getElementById("status")
makeModelData = document.getElementById("makemodeldata")
modelData = document.getElementById("modeldata")
lengths35Data = document.getElementById("flength35data")

dirButton.addEventListener("click", async e => {
    statusH.innerText = "Loading photos..."
    data = await window.API.selectFolder()
    console.log(data)

    // clear any existing progress bars
    // only if anything was returned (i.e. a folder was actually selected vs clicking cancel)
    if (data) {
        makeModelData.replaceChildren()
        modelData.replaceChildren()
        statusH.innerText = data.total + " photos/videos"
    } else {
        statusH.innerText = "Selection cancelled."
    }

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
    
    lenses = data.lenses
})