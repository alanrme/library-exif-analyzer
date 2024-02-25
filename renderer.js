dirButton = document.getElementById("openpicker")
makeModelData = document.getElementById("makemodeldata")
modelData = document.getElementById("modeldata")

dirButton.addEventListener("click", async e => {
    data = await window.API.selectFolder()
    console.log(data)

    // clear any existing progress bars
    // only if anything was returned (i.e. a folder was actually selected vs clicking cancel)
    if (data) {
        makeModelData.replaceChildren()
        modelData.replaceChildren()
    }

    makes = data.makes
    lenses = data.lenses

    for (makeName of Object.keys(makes)) {
        make = makes[makeName]
        // get the contents of the <template> for a camera make and make>model cards
        maketmpl = document.getElementById("makeprog").content.cloneNode(1).firstElementChild

        maketmpl.getElementsByTagName("progress")[0].value = 100*(make.count/data.total)
        count = document.createTextNode(make.count)
        maketmpl.getElementsByClassName("count")[0].appendChild(count)
        makeTxt = document.createTextNode(makeName)
        maketmpl.getElementsByClassName("make")[0].appendChild(makeTxt)

        console.log(make.models, Object.keys(make.models))
        for (modelName of Object.keys(make.models)) {
            model = make.models[modelName]

            mmodeltmpl = document.getElementById("mmodelprog").content.cloneNode(1).firstElementChild

            mmodeltmpl.getElementsByTagName("progress")[0].value = 100*(model/make.count)
            count = document.createTextNode(model)
            mmodeltmpl.getElementsByClassName("count")[0].appendChild(count)
            modelNameTxt = document.createTextNode(modelName)
            mmodeltmpl.getElementsByClassName("model")[0].appendChild(modelNameTxt)
            // add this model progress bar to the make
            maketmpl.getElementsByClassName("models")[0].appendChild(mmodeltmpl)
            

            modeltmpl = document.getElementById("modelprog").content.cloneNode(1).firstElementChild

            modeltmpl.getElementsByTagName("progress")[0].value = 100*(model/data.total)
            count = document.createTextNode(model)
            modeltmpl.getElementsByClassName("count")[0].appendChild(count)
            makeAndModelNameTxt = document.createTextNode(makeName + " " + modelName)
            modeltmpl.getElementsByClassName("model")[0].appendChild(makeAndModelNameTxt)
            // add this make&model progress bar to the models
            modelData.appendChild(modeltmpl)
        }

        makeModelData.appendChild(maketmpl)
    }
})