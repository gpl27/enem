document.addEventListener("DOMContentLoaded", function() {

    const anoDropdown = document.getElementById("ano");
    const areaDropdown = document.getElementById("area");
    const provaDropdown = document.getElementById("prova");
    const gabaritoInput = document.getElementById("gabarito");
    const submitButton = document.getElementById("submit");
    const scoreCard = document.getElementById("score-card");

    const areasDict = {
        "CH": "Ciências Humanas",
        "CN": "Ciências da Natureza",
        "LC": "Linguagens",
        "MT": "Matemática"
    }

    var dataProva = {};

    // Add options for ano
    fetch("https://github.com/gpl27/enem/blob/main/data/PROVAS.json")
        .then(response => response.json())
        .then(data => {
            // Fetch years for dropdown
            let years = Object.keys(data);
            years.forEach(element => createOption(anoDropdown, element));
        
            // Add event listener to dropdown
            anoDropdown.addEventListener("change", function() {
                const selectedYear = this.value;
                const dataSelectedYear = data[selectedYear]
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
                const dataSelectedArea = data[anoDropdown.value][selectedArea];
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
            provaDropdown.addEventListener("change", function () {
                const selectedProva = this.value;
                const dataSelectedProva = data[anoDropdown.value][areaDropdown.value][selectedProva];
                if (dataSelectedProva) {
                    provaPath = "https://github.com/gpl27/enem/blob/main/data/provas/"+ anoDropdown.value + '-' + areaDropdown.value + '-' + dataSelectedProva + ".json";
                    fetch(provaPath)
                        .then(response => response.json())
                        .then(data => {
                            dataProva = data;
                        })
                        .catch(error => console.log(error));
                    console.log(provaPath);
                } else {
                    gabaritoProva = {}
                    submitButton.disabled = true;
                }
            })
            // Add event listener to text input
            gabaritoInput.addEventListener("input", function () {
                if (this.value.length == 45) {
                    submitButton.disabled = false;
                } else {
                    submitButton.disabled = true;
                }

            })
            // Add event listener to submit button
            submitButton.addEventListener("click", function () {
                if (dataProva) {
                    let gabaritoProva = createGabarito(dataProva);
                    let rawScore = scoreGabarito(gabaritoInput.value, gabaritoProva);
                    fetch(`https://github.com/gpl27/enem/blob/main/data/notas/${anoDropdown.value}-NOTA.json`)
                        .then(response => response.json())
                        .then(data => {
                            let keyMin = `NU_NOTA_MIN_${areaDropdown.value}`;
                            let keyMean = `NU_NOTA_MEAN_${areaDropdown.value}`;
                            let keyMax = `NU_NOTA_MAX_${areaDropdown.value}`;
                            let minScore = Math.round((data[rawScore][keyMin] + Number.EPSILON) * 100) / 100;
                            let meanScore = Math.round((data[rawScore][keyMean] + Number.EPSILON) * 100) / 100;
                            let maxScore = Math.round((data[rawScore][keyMax] + Number.EPSILON) * 100) / 100;
                            scoreCard.innerHTML = `${rawScore}: ${minScore} - ${meanScore} - ${maxScore}`;
                        })
                        .catch(error => console.log(error));
                } else {
                    console.log("Something went wrong...");
                }
            })

        })
        .catch(error => console.log(error));
});

function createOption(dropdown, element) {
    let option = document.createElement("option");
    option.value = element;
    option.textContent = element;
    dropdown.appendChild(option)
}

function createGabarito(data) {
    let gabarito = ""
    for (let key in data) {
        gabarito += data[key]['TX_GABARITO'];
    }
    return gabarito;
}

function scoreGabarito(respostas, gabarito) {
    let score = 0
    for (let i = 0; i < gabarito.length; i++) {
        if (respostas[i] == gabarito[i])
            score++;
    }
    return score;
}

// TODO: create function that createsGabarito, scoreGabarito, getHabilidades etc...
// return in object
