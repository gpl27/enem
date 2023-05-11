/*!
 * TODO:
 *      Sanitize text input
 *      Implement Linguagens input
 *      Determine PARAM_B intervals
 *      Implement results card
 *      Add favicon.ico
 *      Dados de 2017 estao com problema
 */

const areasDict = {
    "CH": "Ciências Humanas",
    "CN": "Ciências da Natureza",
    "LC": "Linguagens",
    "MT": "Matemática"
}

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

document.addEventListener("DOMContentLoaded", async function () {

    const anoDropdown = document.getElementById("ano");
    const areaDropdown = document.getElementById("area");
    const provaDropdown = document.getElementById("prova");
    const linguaRadio = document.getElementById("lingua");
    const respostasSection = document.getElementById("respostas");
    const resultadosSection = document.getElementById("resultados");
    const gradeDiv = document.getElementById("grade");
    const submitButton = document.getElementById("submit")

    const PROVAS = await fetchPROVASJSON();

    const CONTEXT = {
        "anoDropdown": anoDropdown,
        "areaDropdown": areaDropdown,
        "linguaRadio": linguaRadio,
        "provaDropdown": provaDropdown,
        "respostasSection": respostasSection,
        "resultadosSection": resultadosSection,
        "gradeDiv": gradeDiv,
        "PROVAS": PROVAS,
        "dataProva": {}
    };

    // Fetch years for anoDropdown
    let years = Object.keys(PROVAS);
    years.forEach(element => createOption(anoDropdown, element));
    
    anoDropdown.addEventListener("change", e => anoDropdownListener(CONTEXT));
    areaDropdown.addEventListener("change", e => areaDropdownListener(CONTEXT));
    provaDropdown.addEventListener("change", async (e) => await provaDropdownListener(CONTEXT));
    submitButton.addEventListener("click", async (e) => await submitButtonListener(CONTEXT));
    
})


function anoDropdownListener(CONTEXT) {
    const anoDropdown = CONTEXT["anoDropdown"];
    const areaDropdown = CONTEXT["areaDropdown"];
    const provaDropdown = CONTEXT["provaDropdown"];
    const linguaRadio = CONTEXT["linguaRadio"];
    const respostasSection = CONTEXT["respostasSection"];

    const selectedYear = anoDropdown.value;
    const dataSelectedYear = CONTEXT["PROVAS"][selectedYear];
    if (dataSelectedYear) {
        areaDropdown.innerHTML = '<option value="">AREA</option>';
        provaDropdown.innerHTML = '<option value="">PROVA</option>';
        let areas = Object.keys(dataSelectedYear);
        areas.forEach(element => {
            let option = document.createElement("option");
            option.value = element;
            option.textContent = areasDict[element];
            areaDropdown.appendChild(option)
        });
        areaDropdown.disabled = false;
        provaDropdown.disabled = true;
        respostasSection.hidden = true;
        linguaRadio.classList.add("hidden");
    } else {
        areaDropdown.innerHTML = '<option value="">AREA</option>';
        provaDropdown.innerHTML = '<option value="">PROVA</option>';
        areaDropdown.disabled = true;
        provaDropdown.disabled = true;
        respostasSection.hidden = true;
        linguaRadio.classList.add("hidden");
    }
}

function areaDropdownListener(CONTEXT) {
    const anoDropdown = CONTEXT["anoDropdown"];
    const areaDropdown = CONTEXT["areaDropdown"];
    const provaDropdown = CONTEXT["provaDropdown"];
    const linguaRadio = CONTEXT["linguaRadio"];
    const PROVAS = CONTEXT["PROVAS"];
    const respostasSection = CONTEXT["respostasSection"];

    const selectedArea = areaDropdown.value;
    const dataSelectedArea = PROVAS[anoDropdown.value][selectedArea];
    if (dataSelectedArea) {
        if (selectedArea === "LC")
            linguaRadio.classList.remove("hidden");
        else
            linguaRadio.classList.add("hidden");
        provaDropdown.innerHTML = '<option value="">PROVA</option>';
        let provas = Object.keys(dataSelectedArea);
        provas.forEach(element => createOption(provaDropdown, element));
        provaDropdown.disabled = false;
        respostasSection.hidden = true;

    } else {
        provaDropdown.innerHTML = '<option value="">PROVA</option>';
        areaDropdown.disabled = true;
        provaDropdown.disabled = true;
        respostasSection.hidden = true;
        linguaRadio.classList.add("hidden");
    }
}

async function provaDropdownListener(CONTEXT) {
    const anoDropdown = CONTEXT["anoDropdown"];
    const areaDropdown = CONTEXT["areaDropdown"];
    const provaDropdown = CONTEXT["provaDropdown"];
    const PROVAS = CONTEXT["PROVAS"];
    const respostasSection = CONTEXT["respostasSection"];
    const gradeDiv = CONTEXT["gradeDiv"];

    const selectedProva = provaDropdown.value;
    const dataSelectedProva = PROVAS[anoDropdown.value][areaDropdown.value][selectedProva];
    if (dataSelectedProva) {
        // Temos uma prova selecionada
        let dataProva = await fetchProva(anoDropdown.value, areaDropdown.value, dataSelectedProva);
        console.log(Object.keys(dataProva));
        CONTEXT["dataProva"] = dataProva;
        let numItens = Object.keys(dataProva)
                            .filter(q => q.substring(1) !== '-1')
                            .map(q => Number(q.split('-')[0]))
                            .sort((a, b) => a - b);
        gradeDiv.innerHTML = "";
        numItens.forEach(item => gradeDiv.appendChild(createQuestao(item)));
        // TODO
        // Add click events to the spans
        addInputListeners();
        
        respostasSection.hidden = false;
    } else {
        // Nao temos uma prova selecionada
        respostasSection.hidden = true;
    }
    
}

async function submitButtonListener(CONTEXT) {
    const gradeDiv = CONTEXT["gradeDiv"];
    // Form validation
    const questoes = gradeDiv.children;
    let gabarito = "";

    for (const q of questoes) {
        let qInput = q.lastElementChild.value;
        if (qInput) {
            gabarito += qInput;
        } else {
            console.log("Finish filling out form");
            return;
        }
    }
    gabarito = gabarito.toUpperCase();

    // Sanitize input
    // TODO

    // Calculate results
    const anoDropdown = CONTEXT["anoDropdown"];
    const areaDropdown = CONTEXT["areaDropdown"]
    const dataProva = CONTEXT["dataProva"];
    if (dataProva) {
        // Clean questoes
        document.getElementById("questoes-similares").innerHTML = '';
        let results = await calculateResults({
            "respostas": gabarito,
            "dataProva": dataProva,
            "ano": anoDropdown.value,
            "area": areaDropdown.value
        });
        // Display results
        await displayResults(results, CONTEXT);
        CONTEXT["resultadosSection"].hidden = false;

    } else {
        console.log("Something went wrong...");
        CONTEXT["resultadosSection"].hidden = true;
    }
}

function createOption(dropdown, element) {
    let option = document.createElement("option");
    option.value = element;
    option.textContent = element;
    dropdown.appendChild(option)
}

function createQuestao(num) {
    const questao = document.createElement("div");
    questao.classList.add("flex");
    questao.classList.add("w-fit");
    questao.id = `q-${num}`;
    questao.innerHTML = `
        <span class="w-10 h-9 flex justify-center items-center shadow rounded-l-md bg-indigo-50" id="q-${num}-t">${num}</span>
        <input class="w-7 h-9 shadow rounded-r-md" type="text" maxlength="1" name="q-${num}-i" id="q-${num}-i">
    
    `
    return questao;
}

// Generated by ChatGPT
function addInputListeners() {
    // Get all text input elements within the 'grade' container
    const textInputs = document.querySelectorAll('#grade input[type="text"]');

    // Attach input event listener to each text input
    textInputs.forEach((textInput, index) => {
        textInput.addEventListener('input', () => {
            const maxLength = parseInt(textInput.getAttribute('maxlength'), 10);
            const currentLength = textInput.value.length;

            if (currentLength >= maxLength) {
                // Focus on the next text input if available
                if (index < textInputs.length - 1) {
                    textInputs[index + 1].focus();
                }
            }
        });

        textInput.addEventListener('paste', (event) => {
            event.preventDefault();

            const pastedText = event.clipboardData.getData('text');
            const maxLength = parseInt(textInput.getAttribute('maxlength'), 10);
            const currentLength = textInput.value.length;
            const remainingLength = maxLength - currentLength;

            // If pasted text is longer than the remaining length, split it into multiple inputs
            if (pastedText.length > remainingLength) {
                let startIndex = 0;
                let endIndex = 0;

                for (let i = index; i < textInputs.length; i++) {
                    const input = textInputs[i];
                    const inputMaxLength = parseInt(input.getAttribute('maxlength'), 10);

                    if (pastedText.length - endIndex > inputMaxLength) {
                        input.value = pastedText.substring(startIndex, startIndex + inputMaxLength);
                        startIndex += inputMaxLength;
                        endIndex += inputMaxLength;
                    } else {
                        input.value = pastedText.substring(startIndex + currentLength);
                        break;
                    }
                }

                // Focus on the next text input if available
                if (index < textInputs.length - 1) {
                    textInputs[index + 1].focus();
                }
            } else {
                textInput.value += pastedText;
            }
        });
    });

}

async function displayResults(results, CONTEXT) {
    const areaDropdown = CONTEXT["areaDropdown"];
    const PROVAS = CONTEXT["PROVAS"];
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
    const questoesCard = document.getElementById("questoes-similares");
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