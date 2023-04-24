/*!
 * TODO:
 *      Sanitize text input
 *      Implement Linguagens input
 *      Determine PARAM_B intervals
 */
async function fetchProva(ano, area, co_prova) {
    const path = `./data/provas/${ano}-${area}-${co_prova}.json`;
    return await fetch(path).then(response => response.json());
}

async function fetchNotas(ano) {
    const path = `./data/notas/${ano}-NOTA.json`;
    return await fetch(path).then(response => response.json());
}

async function fetchPROVASJSON() {
    const path = "./data/PROVAS.json";
    return await fetch(path).then(response => response.json());
}

async function fetchITENSJSON() {
    const path = "./data/ITENS.json";
    return await fetch(path).then(response => response.json());
}

document.addEventListener("DOMContentLoaded", async function() {

    const anoDropdown = document.getElementById("ano");
    const areaDropdown = document.getElementById("area");
    const provaDropdown = document.getElementById("prova");
    const gabaritoInput = document.getElementById("gabarito");
    const submitButton = document.getElementById("submit");
    const questoesCard = document.getElementById("questoes-card");

    const areasDict = {
        "CH": "Ciências Humanas",
        "CN": "Ciências da Natureza",
        "LC": "Linguagens",
        "MT": "Matemática"
    }

    var dataProva = {};

    const PROVAS = await fetchPROVASJSON();

    // Fetch years for anoDropdown
    let years = Object.keys(PROVAS);
    years.forEach(element => createOption(anoDropdown, element));
    
    anoDropdown.addEventListener("change", function() {
        const selectedYear = this.value;
        const dataSelectedYear = PROVAS[selectedYear]
        if (dataSelectedYear) {
            areaDropdown.innerHTML = '<option value="">AREA</option>';
            areas = Object.keys(dataSelectedYear);
            areas.forEach(element => {
                let option = document.createElement("option");
                option.value = element;
                option.textContent = areasDict[element];
                areaDropdown.appendChild(option)
            });
            areaDropdown.disabled = false;
            provaDropdown.dispabled = true;
            submitButton.disabled = true;
        } else {
            areaDropdown.innerHTML = '<option value="">AREA</option>';
            provaDropdown.innerHTML = '<option value="">PROVA</option>';
            areaDropdown.disabled = true;
            provaDropdown.disabled = true;
            submitButton.disabled = true;
        }
    })

    areaDropdown.addEventListener("change", function() {
        const selectedArea = this.value;
        const dataSelectedArea = PROVAS[anoDropdown.value][selectedArea];
        if (dataSelectedArea) {
            provaDropdown.innerHTML = '<option value="">PROVA</option>';
            provas = Object.keys(dataSelectedArea);
            provas.forEach(element => createOption(provaDropdown, element));
            provaDropdown.disabled = false;
            submitButton.disabled = true;

        } else {
            provaDropdown.innerHTML = '<option value="">PROVA</option>';
            areaDropdown.disabled = true;
            provaDropdown.disabled = true;
            submitButton.disabled = true;
        }

    })

    provaDropdown.addEventListener("change", async function () {
        const selectedProva = this.value;
        const dataSelectedProva = PROVAS[anoDropdown.value][areaDropdown.value][selectedProva];
        if (dataSelectedProva) {
            dataProva = await fetchProva(anoDropdown.value, areaDropdown.value, dataSelectedProva);
            if (gabaritoInput.value.length == 45) {
                submitButton.disabled = false;
            } else {
                submitButton.disabled = true;
            }
        } else {
            dataProva = {}
            submitButton.disabled = true;
        }
    })
    
    gabaritoInput.addEventListener("input", function () {
        if (this.value.length == 45) {
            submitButton.disabled = false;
        } else {
            submitButton.disabled = true;
        }

    })
    
    submitButton.addEventListener("click", async function () {
        if (dataProva) {
            // Clean questoes
            questoesCard.innerHTML = '<span class="m-6">QUESTÕES SIMILARES</span>';
            let results = await calculateResults({
                "respostas": gabaritoInput.value,
                "dataProva": dataProva,
                "ano": anoDropdown.value,
                "area": areaDropdown.value
            });
            document.getElementById("min-score").textContent = results["nota-min"];
            document.getElementById("mean-score").textContent = results["nota-mean"];
            document.getElementById("max-score").textContent = results["nota-max"];
            document.getElementById("raw-score").textContent = results["acertos"];
            document.getElementById("acertos-facil").textContent = results["acertos-facil"];
            document.getElementById("acertos-medio").textContent = results["acertos-medio"];
            document.getElementById("acertos-dificil").textContent = results["acertos-dificil"];
            document.getElementById("raw-erros").textContent = results["erros"];
            document.getElementById("erros-facil").textContent = results["erros-facil"];
            document.getElementById("erros-medio").textContent = results["erros-medio"];
            document.getElementById("erros-dificil").textContent = results["erros-dificil"];
            results["erros-habilidades"].forEach(async function (hab) {
                let itensSimilares = await getItensSimilares(areaDropdown.value, hab);
                let itens = [];
                for (let key in itensSimilares) {
                    let itensAno = itensSimilares[key];
                    for (let item in itensAno) {
                        let firstProva = Object.keys(itensAno[item])[0];
                        let provaName = getProvaName(firstProva, PROVAS[key][areaDropdown.value]);
                        if (provaName)
                            itens.push(`${key} ${provaName} ${itensAno[item][firstProva]}`);
                    }
                }
                addHabilidade(hab, itens);
            })
        } else {
            console.log("Something went wrong...");
        }
    })

});

function createOption(dropdown, element) {
    let option = document.createElement("option");
    option.value = element;
    option.textContent = element;
    dropdown.appendChild(option)
}

async function calculateResults(data) {
    let dataProva = data["dataProva"];
    let respostas = data["respostas"];
    let results = {
        "acertos": 0,
        "acertos-facil": 0,
        "acertos-medio": 0,
        "acertos-dificil": 0,
        "erros": 0,
        "erros-facil": 0,
        "erros-medio": 0,
        "erros-dificil": 0,
        "erros-habilidades": new Set()
    }
    let i = 0;
    let dificuldade = "";
    let param_B = 0;
    for (let key in dataProva) {
        param_B = dataProva[key]['NU_PARAM_B'];
        dificuldade = (param_B < 1.5) ? "facil" : (param_B < 2) ? "medio" : "dificil"
        if (dataProva[key]['TX_GABARITO'] == 'X') {
            i++;
            continue;
        }
        if (respostas[i] === dataProva[key]['TX_GABARITO']){
            results["acertos"]++;
            results[`acertos-${dificuldade}`]++;
        } else {
            results["erros"]++;
            results[`erros-${dificuldade}`]++;
            results["erros-habilidades"].add(dataProva[key]['CO_HABILIDADE']);
        }
        i++;
    }
    const NOTAS = await fetchNotas(data["ano"]);
    let rawScore = results["acertos"];
    let keyMin = `NU_NOTA_MIN_${data["area"]}`;
    let keyMean = `NU_NOTA_MEAN_${data["area"]}`;
    let keyMax = `NU_NOTA_MAX_${data["area"]}`;
    results["nota-min"] = Math.round((NOTAS[rawScore][keyMin] + Number.EPSILON) * 100) / 100;
    results["nota-mean"] = Math.round((NOTAS[rawScore][keyMean] + Number.EPSILON) * 100) / 100;
    results["nota-max"] = Math.round((NOTAS[rawScore][keyMax] + Number.EPSILON) * 100) / 100;
    return results;
}

async function getItensSimilares(area, hab) {
    const ITENS = await fetchITENSJSON();
    return ITENS[area][hab];
}

function getProvaName(co_prova, data) {
    const invertedData = Object.entries(data).reduce((acc, [key, value]) => {
        acc[value] = key;
        return acc;
    }, {});
    return invertedData[co_prova];
}

function addHabilidade(hab, itens) {
    const questoesCard = document.getElementById("questoes-card");
    const ul = document.createElement("ul");
    ul.innerText = `H${hab}`;
    ul.className = "list-disc my-4 mx-10"
    itens.forEach(item => {
        let li = document.createElement("li")
        li.innerText = item
        ul.appendChild(li);
    })
    questoesCard.appendChild(ul);
}