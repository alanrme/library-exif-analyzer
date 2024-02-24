dirButton = document.getElementById("openpicker")

dirButton.addEventListener("click", async e => {
    data = await window.API.selectFolder()
    console.log(data)
    document.getElementById("data").innerHTML = data;
})