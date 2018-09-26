$(document).ready(function () {
    //gestione della navigazione mobile
    var menuButton = document.querySelector(".nav-button");
    menuButton.addEventListener("click", function () {
        document.querySelector(".page-nav").classList.toggle("nav-opened");
    }, false);
    //chiusura della nav. mobile per vw > 768
    $(window).on('resize', function () {
        var win = $(this);
        if (win.width() > 768) {
            $('.page-nav').removeClass('nav-opened');
        }
    });
    //pulsante, torna alla navigazione
    window.onscroll = function () { scrollFunction() };
    function scrollFunction() {
        if (document.body.scrollTop > 50 || document.documentElement.scrollTop > 50) {
            document.getElementById("topNav").style.display = "block";
        } else {
            document.getElementById("topNav").style.display = "none";
        }
    }

    function topFunction() {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    }

    var topButton = document.getElementById("topNav");
    topButton.addEventListener("click", topFunction);

    /* REFACTOR es6/7 (partial) fixed broken parts due to transfer from mysql database to json format with data formatting in javascript instead of serving 
    desired format from php backend */
    const endpoint = 'https://raw.githubusercontent.com/lukasd2/Software-Piracy-Project/master/mergedDatabase.json';   
    //Dataset: array of objects containing statistics of 116 countries for years: 2009, 2011, 2013, 2015 -> 116 x 4 = 464
    const dataset = [];
    //Array of objects containing each country proprieties -> length: 116
    let countriesName = [];
    //Json formatted dataset
    fetch(endpoint)
        .then(res => res.json())
        .then(data => {
            dataset.push(...data);
            countriesName.push(...removeDuplicatesBy(x => x.Codice, dataset)); //remove duplicates by Code property 464 / 4 = 116
            //Remove object proprieties by copying only relevant proprieties
            for (let i = 0; i < countriesName.length; i++) {
                countriesName[i] = { 
                    Codice: countriesName[i].Codice, Nazione: countriesName[i].Nazione,
                    longitude: countriesName[i].longitude, latitude: countriesName[i].latitude
                }
            }
            //map generator function
            mappy(dataset);
            //chart generation functions
            generateCharts(dataset);
        })
        .catch(error => console.error(error));

    //Stack overflow: https://stackoverflow.com/questions/32238602/javascript-remove-duplicates-of-objects-sharing-same-property-value
    function removeDuplicatesBy(keyFn, array) {
        var mySet = new Set();
        return array.filter(function (x) {
            var key = keyFn(x), isNew = !mySet.has(key);
            if (isNew) mySet.add(key);
            return isNew;
        });
    }
    //Input field suggestions 
    function findMatches(wordToMatch, countriesName) {
        return countriesName.filter(place => {
            //if the city or state matches what was searched
            const regex = new RegExp(wordToMatch, 'gi');
            return place.Nazione.match(regex);
        });
    }
    //Append and update suggested countries based on input 
    function displayMatches() {
        suggestions.classList.remove('hidden');
        const matchArray = findMatches(this.value, countriesName);
        if (this.value.length > 1) {
            const html = matchArray.map(place => {
                const regex = new RegExp(this.value, 'gi');
                const countryName = place.Nazione.replace(regex, `<span class="hl">${this.value}</span>`);
                return `
                <li>
                    <span class="name">${countryName}</span>
                </li>
                  `;
            }).join('');
            suggestions.innerHTML = html;
        }
    }
    const searchInput = document.querySelector('.search-bar');
    searchInput.addEventListener('keyup', displayMatches);
    const suggestions = document.querySelector('.suggestions');
    //Formatting and removing list when clicked 
    suggestions.addEventListener('click', function (event) {
        if (event.target.tagName.toLowerCase() === 'li') {
            searchInput.value = event.target.textContent.trim();;
            mapAddProprieties(event.target.textContent);
            while (suggestions.firstChild) {
                suggestions.removeChild(suggestions.firstChild);
            }
        }
    });

    function mapAddProprieties(value) {
        var flag = false;
        let text = value;
        text = value.trim().toLowerCase();
        for (let i = 0; i < countriesName.length; i++) {
            if (text == countriesName[i].Nazione.toLowerCase()) {
                flag = true;
            }
            if (flag) {
                $(".container").addClass("active");
                $(".first").remove();
                $(".f32").remove();
                $(".graph-container").removeClass("hidden");
                $("#description").append("<p class='first f32' style='font-weight:bold; font-size: 1.2em; margin-left: 20px;'>" + value + " " +
                    "<span class='flag " + countriesName[i].Codice.toLowerCase() + "'></span></p>");
                $("#description").append("<p class='first' style='font-size:18px; margin-left: 20px;'>É possibile confrontare fino a cinque paesi, da notare " +
                    "la tendenza inversamente proporzionale tra i valori dei due grafici</p>");
                $(".container").trigger('zoom', { level: 8, latitude: countriesName[i].latitude, longitude: countriesName[i].longitude });
                creategraph(dataset, countriesName[i].Codice);
                creategraphalt(dataset, countriesName[i].Codice);
                break;
            }
        }
    }

    //variabili globale controlla i grafici, controllo che un paese gia selezionato non generi un nuovo grafico etc.
    var myfunCalls = 0;
    var check = [];

    function creategraph(data, cod) {
        if (check.length > 0) {
            for (i = 0; i < check.length; i++) {
                if (cod == check[i]) {
                    return
                }
            }
        }
        check.push(cod);
        var limit = false;
        if (myfunCalls > 5) {
            limit = true;
        }
        if (limit) {
            graphLimit();
        }
        var cat = {};
        cat.data = [];
        $.each(data, function (key, val) {
            if (val["Codice"] == cod) {
                cat.name = val["Nazione"];
                cat.data.push(Number(val["Tasso"]));
            }
        });
        if (myfunCalls == 0) {
            var opzioni = {
                chart: {
                    renderTo: 'gcontainer',
                    backgroundColor: 'rgba(0,0,0,0)',
                    type: 'line'
                },
                title: { text: 'Tasso di software illegale' },
                series: [cat],
                xAxis: {
                    categories: ["2009", "2011", "2013", "2015"]
                },
                yAxis: {
                    title: {
                        text: '% totale di software illegale'
                    }
                }
            };
            chart1 = new Highcharts.Chart(opzioni);
        } else if (myfunCalls > 0 && !limit) {
            chart1.addSeries({
                name: cat.name,
                data: cat.data
            }, false);
            chart1.redraw();
            myfunCalls++;
        }
    }

    var checkalt = [];
    //this is the graph generator on the side of the map (when a country is selected from input list or clicked directly on map)
    function creategraphalt(data, cod) {
        if (checkalt.length > 0) {
            for (i = 0; i < checkalt.length; i++) {
                if (cod == checkalt[i]) {
                    return
                }
            }
        }
        checkalt.push(cod);
        var limit = false;
        if (myfunCalls > 6) {
            limit = true;
        }
        if (limit) {
            graphLimit(); //max number of comparisions set to 5, here we can reset the graph
        }
        var cat = {};
        cat.data = [];
        $.each(data, function (key, val) {
            if (val["Codice"] == cod) {
                cat.name = val["Nazione"];
                cat.data.push(Number(val["GDP_per_capita"]));
            }
        });
        if (myfunCalls == 0) {
            var opzionialt = {
                chart: {
                    renderTo: 'gcontaineralt',
                    backgroundColor: 'rgba(0,0,0,0)',
                    type: 'line'
                },
                title: { text: 'Reddito per persona' },
                series: [cat],
                xAxis: { categories: ["2009", "2011", "2013", "2015"] }
            };
            chart2 = new Highcharts.Chart(opzionialt);
        } else if (myfunCalls > 1 && !limit) {
            chart2.addSeries({
                name: cat.name,
                data: cat.data
            }, false);
            chart2.redraw();
        }
        myfunCalls++;
    }
    //
    function graphLimit() {
        $(".first").remove();
        $("#description").append("<p class='first' style='font-weight:bold; margin-left: 20px;'>Limite raggiunto, ricarica il grafico per un nuovo confronto!</p>");
        $("#limit").css("display", "block");
        $("#limit").click(function () {
            //flush all
            $(".container").removeClass("active");
            $(".graph-container").addClass("hidden");
            $(".container").trigger('zoom', { level: 0 });
            myfunCalls = 0;
            check = [];
            checkalt = [];
            $("#limit").css("display", "none");
        });
    }
    //data for mapael jquery map with properties
    function mappy(dataset) {
        var newAreas = {};
        dataset.forEach(key => {
            let area = {};
            area.value = key.Tasso;
            area.tooltip = {
                content: "<span style='font-weight:bold;'>" + key.Nazione + " " + "</span>" + "<br/>" +
                    "Software illegale: " + area.value + "%" + "<br>Valore: " + key.Valore + "$ milioni"
            };
            area.eventHandlers = {
                click: function (e, id, mapElem, textElem) {
                    $(".first").remove();
                    $(".f32").remove();
                    $(".graph-container").removeClass("hidden");
                    $("#description").append("<p class='first f32' style='font-weight:bold; font-size: 1.2em; margin-left: 20px;'>" + key.Nazione + " " +
                        "<span class='flag " + key.Codice.toLowerCase() + "'></span></p>");
                    $("#description").append("<p class='first' style='font-size:18px; margin-left: 20px;'>É possibile confrontare fino a quattro paesi, da notare " +
                        "la tendenza inversamente proporzionale tra i valori dei due grafici</p>");
                    creategraph(dataset, key.Codice);
                    creategraphalt(dataset, key.Codice);
                    $(".container").trigger('zoom', { level: 8, latitude: key.latitude, longitude: key.longitude });
                    $(".container").addClass("active");
                    $(".container").trigger('tooltip.css', { display: "block" });
                }
            };
            newAreas[key.Codice] = area;
        });
        $(".container").mapael({
            map: {
                name: "world_countries",
                //width: 500,
                zoom: {
                    enabled: true,
                    step: 0.25,
                    maxLevel: 20
                },
                defaultArea: {
                    attrs: {
                        fill: "#666666",
                        stroke: "#ced8d0",
                        "stroke-width": 0.3,
                        cursor: "pointer"
                    },
                    attrsHover: {
                        "stroke-width": 1.5
                    }
                },
                defaultPlot: {
                    text: {
                        attrs: {
                            fill: "#b4b4b4"
                        },
                        attrsHover: {
                            fill: "#fff",
                            "font-weight": "bold"
                        }
                    }
                }
            },
            text: {
                attrs: {
                    cursor: "pointer",
                    "font-size": 10,
                    fill: "#666"
                }
            },
            areas: newAreas,
            legend: {
                area: {
                    display: true,
                    //mode: "horizontal",
                    title: "Percentuale di software illegale scaricato",
                    marginBottom: 6,
                    slices: [
                        {
                            max: 25,
                            attrs: {
                                fill: "#6aafe1"
                            },
                            legendSpecificAttrs: {
                                stroke: '#505050'
                                /*"stroke-width": 2,
                                 width: 40,
                                 height: 25*/
                            },
                            label: "Tasso < 25%"
                        },
                        {
                            min: 26,
                            max: 50,
                            attrs: {
                                fill: "#459bd9"
                            },
                            label: "Tasso compreso tra 25 e 50 %"
                        },
                        {
                            min: 51,
                            max: 75,
                            attrs: {
                                fill: "#2579b5"
                            },
                            label: "Tasso compreso tra 50 e 75 %"
                        },
                        {
                            min: 76,
                            attrs: {
                                fill: "#1a527b"
                            },
                            label: "Tasso > 75%"
                        }
                    ]
                }
            }
        });
        $(".zoomReset").click(function () {
            //flush all
            $(".container").removeClass("active");
            $(".graph-container").addClass("hidden");
            myfunCalls = 0;
            check = [];
            checkalt = [];
            $("#limit").css("display", "none");
        });
    }
    //Fasce di ricchezza http://api.worldbank.org/incomeLevels?format=json
    //HIC -> highIncome, UMC -> UpperMiddleIncome, LMC -> LowerMiddleIncome, LIC -> LowIncome
    //passing formatted data to each chart 
    function generateCharts(data, totalHIC, totalUMC, totalLMC) {
        var countries = {};
        countries.HIC = {}, countries.UMC = {}, countries.LMC = {};
        var continents = {};
        continents.AP = [], continents.EU = [], continents.LA = [], continents.ME = [], continents.NA = [];
        var mediaAP = 0, mediaEU = 0, mediaLA = 0, mediaME = 0, mediaNA = 0;
        var mediaUMC = [], mediaHIC = [], mediaLMC = [];
        var ap = 0, eu = 0, la = 0, me = 0, na = 0;
        var apVal = 0, euVal = 0, laVal = 0, meVal = 0, naVal = 0;
        const year2009 = data.filter(key => key.Anno == 2009);
        const year2011 = data.filter(key => key.Anno == 2011);
        const year2013 = data.filter(key => key.Anno == 2013);
        const year2015 = data.filter(key => key.Anno == 2015);
        function filterByIncome(yearArray, income) {
            return yearArray.filter(key => {
                return key.incomeLevel == income;
            });
        }
        //organize countries by year and income level in array of objects
        countries.HIC[2009] = filterByIncome(year2009, "HIC");
        countries.HIC[2011] = filterByIncome(year2011, "HIC");
        countries.HIC[2013] = filterByIncome(year2013, "HIC");
        countries.HIC[2015] = filterByIncome(year2015, "HIC");
        countries.UMC[2009] = filterByIncome(year2009, "UMC");
        countries.UMC[2011] = filterByIncome(year2011, "UMC");
        countries.UMC[2013] = filterByIncome(year2013, "UMC");
        countries.UMC[2015] = filterByIncome(year2015, "UMC");
        countries.LMC[2009] = filterByIncome(year2009, "LMC");
        countries.LMC[2011] = filterByIncome(year2011, "LMC");
        countries.LMC[2013] = filterByIncome(year2013, "LMC");
        countries.LMC[2015] = filterByIncome(year2015, "LMC");
        //console.log(countries.LMC[2015]);
        function sumByYear(year) {
            return year.reduce((total, key) => {
                return total + Number(key.Tasso);
            }, 0);
        }
        mediaHIC.push(sumByYear(countries.HIC[2009]), sumByYear(countries.HIC[2011]), sumByYear(countries.HIC[2013]), sumByYear(countries.HIC[2015]));
        mediaUMC.push(sumByYear(countries.UMC[2009]), sumByYear(countries.UMC[2011]), sumByYear(countries.UMC[2013]), sumByYear(countries.UMC[2015]));
        mediaLMC.push(sumByYear(countries.LMC[2009]), sumByYear(countries.LMC[2011]), sumByYear(countries.LMC[2013]), sumByYear(countries.LMC[2015]));
        year2015.forEach(key => {
            switch (key.Posizione) {
                case "AP":
                    ap += Number(key.Tasso);
                    apVal += Number(key.Valore);
                    continents.AP.push(Number(key.Tasso));
                    break;
                case "CEE":
                case "WE":
                    eu += Number(key.Tasso);
                    euVal += Number(key.Valore);
                    continents.EU.push(Number(key.Tasso));
                    break;
                case "LA":
                    la += Number(key.Tasso);
                    laVal += Number(key.Valore);
                    continents.LA.push(Number(key.Tasso));
                    break;
                case "MEA":
                    me += Number(key.Tasso);
                    meVal += Number(key.Valore);
                    continents.ME.push(Number(key.Tasso));
                    break;
                case "NA":
                    na += Number(key.Tasso);
                    naVal += Number(key.Valore);
                    continents.NA.push(Number(key.Tasso));
                    break;
            }
        });
        //HIC
        mediaHIC[0] = Math.round(mediaHIC[0] / countries.HIC[2009].length), mediaHIC[1] = Math.round(mediaHIC[1] / countries.HIC[2011].length);
        mediaHIC[2] = Math.round(mediaHIC[2] / countries.HIC[2013].length), mediaHIC[3] = Math.round(mediaHIC[3] / countries.HIC[2015].length);
        //UMC
        mediaUMC[0] = Math.round(mediaUMC[0] / countries.UMC[2009].length), mediaUMC[1] = Math.round(mediaUMC[1] / countries.UMC[2011].length);
        mediaUMC[2] = Math.round(mediaUMC[2] / countries.UMC[2013].length), mediaUMC[3] = Math.round(mediaUMC[3] / countries.UMC[2015].length);
        //LMC
        mediaLMC[0] = Math.round(mediaLMC[0] / countries.LMC[2009].length), mediaLMC[1] = Math.round(mediaLMC[1] / countries.LMC[2011].length);
        mediaLMC[2] = Math.round(mediaLMC[2] / countries.LMC[2013].length), mediaLMC[3] = Math.round(mediaLMC[3] / countries.LMC[2015].length);
        //per continents
        mediaAP = Math.round(ap / continents.AP.length);
        mediaEU = Math.round(eu / continents.EU.length);
        mediaLA = Math.round(la / continents.LA.length);
        mediaME = Math.round(me / continents.ME.length);
        mediaNA = Math.round(na / continents.NA.length);
        computeWealthCorrelation(year2015); //in this case only with data related to 2015 (latest)
        tassoMedioFasceGraph(mediaHIC, mediaUMC, mediaLMC);
        tassoMedioPercGraph(mediaAP, mediaEU, mediaLA, mediaME, mediaNA);
        valoreTotaleGraph(apVal, euVal, laVal, meVal, naVal);
    }
    //Data formatting for first Highcharts graph 
    function computeWealthCorrelation(data) {
        var countries = {};
        countries.HIC = [], countries.UMC = [], countries.LMC = [], countries.name = [];
        data.forEach(key => {
            var tuple = {};
            if (key.incomeLevel == "HIC") {
                countries.name.push(key.Nazione);
                tuple = { "name": key.Nazione, "x": Number(key.Tasso), "y": Number(key.GDP_per_capita) };
                countries.HIC = countries.HIC.concat(tuple);
            } else if (key.incomeLevel == "UMC") {
                tuple = { "name": key.Nazione, "x": Number(key.Tasso), "y": Number(key.GDP_per_capita) };
                countries.UMC = countries.UMC.concat([tuple]);
            } else if (key.incomeLevel == "LMC" || key.incomeLevel == "LIC") {
                tuple = { "name": key.Nazione, "x": Number(key.Tasso), "y": Number(key.GDP_per_capita) };
                countries.LMC = countries.LMC.concat([tuple]);
            }
        });
        generateWealthCorrelationGraph(countries.HIC, countries.UMC, countries.LMC, countries.name);
    }
    //fasce di ricchezza http://api.worldbank.org/incomeLevels?format=json
    //First Graph: "Correlazione tra il reddito per capita e il tasso totale del software illegale"
    function generateWealthCorrelationGraph(HIC, UMC, LMC, name) {
        var opzioni = {
            chart: {
                type: 'scatter',
                zoomType: 'xy'
            },
            title: {
                text: "Correlazione tra il reddito per capita e il tasso totale del software illegale"
            },
            subtitle: {
                text: null
            },
            xAxis: {
                categories: ["Asia e Pacifico", "Europa", "America Latina", "Medio Oriente", "Nord America"],
                crosshair: true,
                title: {
                    text: 'Tasso totale del software illegale in %'
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'Reddito pro capite in $'
                }
            },
            tooltip: {
                headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                    '<td style="padding:0"><b>{point.y:.1f} %</b></td></tr>',
                footerFormat: '</table>',
                shared: true,
                useHTML: true
            },
            plotOptions: {
                scatter: {
                    tooltip: {
                        crosshairs: true,
                        headerFormat: '<b>{point.key}</b><br>',
                        pointFormat: 'Tasso: {point.x} %,<br> Reddito: {point.y} $'
                    }
                }
            },
            series: [{
                name: 'Paesi ad alto reddito',
                color: 'rgb(124, 181, 236)',
                data: HIC
            }, {
                name: 'Paesi a medio reddito',
                color: 'rgb(0, 153, 0)',
                data: UMC
            }, {
                name: 'Paesi a basso reddito',
                color: 'rgb(204, 102, 0)',
                data: LMC
            }]
        };

        Highcharts.chart('wealthgraph', opzioni);
    }
    //Second Graph: Tasso medio per fasce di reddito e per anno"
    function tassoMedioFasceGraph(mediaHIC, mediaUMC, mediaLMC) {
        var opzioni = {
            chart: {
                type: 'spline'
            },
            title: {
                text: "Tasso medio per fasce di reddito e per anno"
            },
            subtitle: {
                text: null
            },
            xAxis: {
                categories: ["2009", "2011", "2013", "2015"],
                crosshair: true,
                title: { text: 'Anno di riferimento' }
            },
            yAxis: {
                min: 0,
                title: {
                    text: '% media per fasce di reddito'
                }
            },
            tooltip: {
                headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                    '<td style="padding:0"><b>{point.y:.1f} %</b></td></tr>',
                footerFormat: '</table>',
                shared: true,
                useHTML: true
            },
            plotOptions: {
                column: {
                    pointPadding: 0.2,
                    borderWidth: 0
                }
            },
            series: [{
                name: 'Paesi ad alto reddito',
                color: 'rgb(124, 181, 236)',
                data: mediaHIC
            }, {
                name: 'Paesi a medio reddito',
                color: 'rgb(0, 153, 0)',
                data: mediaUMC
            }, {
                name: 'Paesi a basso reddito',
                color: 'rgb(204, 102, 0)',
                data: mediaLMC
            }]
        };
        Highcharts.chart('wealthmedgraph', opzioni);
    }
     //Third Graph - left, "Tasso medio percentuale del software illegale scaricato nel 2015 per area"
    function tassoMedioPercGraph(mediaAP, mediaEU, mediaLA, mediaME, mediaNA) {
        var opzioni = {
            chart: {
                type: 'bar',
                backgroundColor: 'rgba(0,0,0,0)'
            },
            title: {
                text: "Tasso medio percentuale del software illegale scaricato nel 2015 per area"
            },
            subtitle: {
                text: null
            },
            xAxis: {
                categories: [""]
            },
            yAxis: {
                min: 0,
                title: {
                    text: '%'
                }
            },
            tooltip: {
                valueSuffix: ' %'
            },
            plotOptions: {
                bar: {
                    dataLabels: {
                        enabled: true,
                        format: '<b>{series.name}</b>: {point.y} %'
                    }
                }
            },
            series: [{
                name: 'Nord America',
                data: [mediaNA]
            }, {
                name: 'Europa',
                data: [mediaEU]
            }, {
                name: 'Asia e Pacifico',
                data: [mediaAP]
            }, {
                name: 'Medio Oriente',
                data: [mediaME]
            }, {
                name: 'America Latina',
                data: [mediaLA]
            }]
        };
        Highcharts.chart('areagraph', opzioni);
    }
    //Fourth graph - right, "Valore totale in milioni del software illegale scaricato nel 2015 per area"
    function valoreTotaleGraph(apVal, euVal, laVal, meVal, naVal) {
        var opzioni = {
            chart: {
                type: 'bar',
                backgroundColor: 'rgba(0,0,0,0)'
            },
            title: {
                text: "Valore totale in milioni del software illegale scaricato nel 2015 per area"
            },
            subtitle: {
                text: null
            },
            xAxis: {
                reversed: true,
                categories: [""]
            },
            yAxis: {
                reversed: true,
                min: 0,
                title: {
                    text: '$'
                }
            },
            tooltip: {
                valueSuffix: ' $'
            },
            plotOptions: {
                bar: {
                    dataLabels: {
                        enabled: true,
                        format: '<b>{series.name}</b>: {point.y} $'
                    }
                }
            },
            series: [{
                name: 'Medio Oriente',
                data: [meVal]

            }, {
                name: 'America Latina',
                data: [laVal]

            }, {
                name: 'Nord America',
                data: [naVal]

            }, {
                name: 'Europa',
                data: [euVal]

            }, {
                name: 'Asia e Pacifico',
                data: [apVal]
            }]
        };
        Highcharts.chart('valuegraph', opzioni);
    }
});
