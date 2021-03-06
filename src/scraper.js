const projectsPage = await fetch('https://pirvi.univ-lille.fr/pages/projects/',{mode: "no-cors"})
const projectsPageAsText = await projectsPage.text()


const equipementsPage = await fetch('https://pirvi.univ-lille.fr/pages/equipment/',{mode: "no-cors"})
const equipementsPageAsText = await equipementsPage.text()

export function getProjectsImgs() {
    const regex = new RegExp(/https:\/\/cristal\.univ-lille\.fr\/pirvi\/images\/projects\/.*\.png/g)
    return projectsPageAsText.match(regex)
}

export function getEquipementsImgs(){
    const regex = new RegExp(/https:\/\/cristal\.univ-lille\.fr\/pirvi\/images\/equipment\/.*\.png/g)
    return equipementsPageAsText.match(regex)
}

export async function getProjectText() {
    const findReg = new RegExp(/onclick="window\.location='.*'/g)
    const matches = projectsPageAsText.match(findReg)
    let projetcsUrls = []
    const replaceReg = new RegExp(/onclick="window\.location=/g)
    matches.forEach(e => {
        e = e.replaceAll(replaceReg, "")
        e = e.replaceAll(new RegExp(/'/g), "")
        projetcsUrls.push(e)
    })
    let projectsText = []
    for (const u of projetcsUrls) {
        const resp = await fetch(u)
        const t = await resp.text()
        const findReg = new RegExp(/<div class="page-content">.*?<\/div>/gms)
        const found = t.match(findReg)
        projectsText.push(stripHtml(found))
    }
    return projectsText
}

export async function getEquipmentsText(){
    const findReg = new RegExp(/onclick="window\.location='.*'/g)
    const matches = equipementsPageAsText.match(findReg)
    let equipmentsUrls = []
    const replaceReg = new RegExp(/onclick="window\.location=/g)
    matches.forEach(e => {
        e = e.replaceAll(replaceReg, "")
        e = e.replaceAll(new RegExp(/'/g), "")
        equipmentsUrls.push(e)
    })
    let equipmentText = []
    for (const u of equipmentsUrls) {
        const resp = await fetch(u)
        let t = await resp.text()
        const removeShitDiv = new RegExp(/<div class="pirvi-right-illus">.*?<\/div>/gms)
        t = t.replaceAll(removeShitDiv,"")
        const removeWtfChar = new RegExp(/(~|??|??|\[|\]|??)/gms)
        t = t.replaceAll(removeWtfChar,"")
        const findReg = new RegExp(/<div class="page-content">.*?<\/div>/gms)
        const found = t.match(findReg)
        equipmentText.push(stripHtml(found))
    }
    return equipmentText
}

function stripHtml(html)
{
    let tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

//https://cristal.univ-lille.fr/pirvi/images/projects/vairdraw/thumbnail.png
//https://cristal.univ-lille.fr/pirvi/projects/VAirDraw/