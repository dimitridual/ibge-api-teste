// API: https://servicodados.ibge.gov.br/api/v3/agregados/4714/periodos/2022/variaveis/93|6318|614?localidades=N6[localidades]

const municipiosID = {
    "frontin": 3301801,
    "mendes": 3302809,
    "mpereira": 3302908,
    "paracambi": 3303609,
    "paty": 3303856,
    "vassouras": 3306206
}

addEventListener('DOMContentLoaded', () => {
    const municipios = document.querySelectorAll('.municipio-checkbox');
    const totalCheckbox = document.getElementById('all');
    const popResSpan = document.getElementById('populacao');
    const areaSpan = document.getElementById('area');
    const densidadeSpan = document.getElementById('densidade');

    const indicadorSelect = document.getElementById('indicador');
    const resultsPopulacao = document.getElementById('results-populacao');
    const resultsEconomia = document.getElementById('results-economia');

    municipios.forEach(municipio => {
        municipio.addEventListener('change', () => {
            let selectedMunicipios = Array.from(municipios)
                .filter(m => m.checked)
                .map(m => municipiosID[m.value]);

            if (totalCheckbox.checked) selectedMunicipios = Object.values(municipiosID);

            updateResults(selectedMunicipios, [popResSpan, areaSpan, densidadeSpan]);
        });
    });
    indicadorSelect.addEventListener('change', () => {
        if (indicadorSelect.value === 'populacao') {
            resultsPopulacao.hidden = false;
            resultsEconomia.hidden = true;
        } else if (indicadorSelect.value === 'economia') {
            resultsPopulacao.hidden = true;
            resultsEconomia.hidden = false;
        }
    });

    buildChart(document.getElementById('populacao-chart'), {
        labels: [],
        label: 'População residente',
        values: []
    });
});

function updateResults(data, [popResSpan, areaSpan, densidadeSpan]) {
    popResults(data).then(results => {
        if (data.length === 0) {
            popResSpan.textContent = '';
            areaSpan.textContent = '';
            densidadeSpan.textContent = '';
        } else if (data.length === 1) {
            popResSpan.textContent = results.popRes[0].serie["2022"];
            areaSpan.textContent = results.area[0].serie["2022"];
            densidadeSpan.textContent = results.densidade;
        } else {
            const totalPop = results.popRes.reduce((total, current) => total + Number(current.serie["2022"]), 0);
            const totalArea = results.area.reduce((total, current) => total + Number(current.serie["2022"]), 0);
            const totalDensidade = totalPop / totalArea;
            popResSpan.textContent = totalPop;
            areaSpan.textContent = Math.round(totalArea * 100) / 100;
            densidadeSpan.textContent = Math.round(totalDensidade * 100) / 100;
        }
        
        buildChart(document.getElementById('populacao-chart'), {
            labels: results.nomes.map(nome => nome.split(' (RJ)')[0]),
            label: 'População residente',
            values: results.popRes.map(item => item.serie["2022"])
        });
    });
}

async function popResults(localIDs) {
    if (localIDs.length === 0) return { popRes: [], area: [], densidade: 0 };
    const response = await fetch(`https://servicodados.ibge.gov.br/api/v3/agregados/4714/periodos/2022/variaveis/93|6318|614?localidades=N6[${localIDs}]`);
    const data = await response.json();
    const nomes = data[0].resultados[0].series.map(item => item.localidade.nome);
    const popRes = data[0].resultados[0].series;
    const area = data[1].resultados[0].series;
    const densidade = data[2].resultados[0].series[0].serie["2022"];
    return { nomes, popRes, area, densidade };
}

function buildChart(html, data) {
    if (Chart.getChart(html)) Chart.getChart(html).destroy();
    new Chart(html, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [{
                label: data.label,
                data: data.values,
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        }
    });
}