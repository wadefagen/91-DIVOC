var _rawData = null;
var _popData = null;
var dateColumns = [];
var _client_width = -1;
var _intial_load = true;
var _dateObj_today, _dateObj_today_time;
var _additionalHighlight_index = 0;

// Resize
$(window).resize(function () {
  if (_rawData != null) {
    var new_width = $("#sizer").width();
    if (_client_width != new_width) {
      render( charts['countries'] );
      render( charts['states'] );
      render( charts['countries-normalized'] );
      render( charts['states-normalized'] );
    }
  }
});


// reducers
var reducer_sum_with_key = function(result, value, key) {
  if (!result[key]) { result[key] = {} }
  let obj = result[key];

  let date = value["Date"];

  if (!obj[date]) { obj[date] = { active: 0, recovered: 0, deaths: 0, cases: 0, tests: 0, hospitalized: 0 } }
  obj[date].active += value["Active"];
  obj[date].recovered += value["Recovered"];
  obj[date].deaths += value["Deaths"];
  obj[date].cases += value["Confirmed"];
  obj[date].tests += value["People_Tested"];
  obj[date].hospitalized += value["People_Hospitalized"];

  return result;
};

var reducer_byUSstate = function(result, value, key) {
  country = value["Country_Region"];
  state = value["Province_State"];

  if (state == "") { return result; }
  if (country != "United States") { return result; }
  if (state.indexOf("Princess") != -1) { return result; }

  // Use the state name as key
  key = state;
  return reducer_sum_with_key(result, value, key);
};

var reducer_byCountry = function(result, value, key) {
  state = value["Province_State"];
  if (state != "") { return result; }

  key = value["Country_Region"];
  return reducer_sum_with_key(result, value, key);
};



// use a cookie to store country data
// - src: https://www.w3schools.com/js/js_cookies.asp
function setCookie(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  var expires = "expires="+d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for(var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') { c = c.substring(1); }
    if (c.indexOf(name) == 0) { return c.substring(name.length, c.length); }
  }
  return "";
}

// find default state value
var stored;

var defaultState = "New York";
if ((stored = getCookie("state")) != "") { defaultState = stored; }

var defaultCountry = "United States";
if ((stored = getCookie("country")) != "") { defaultCountry = stored; }


// chart metadata
var charts = {
  'countries': {
    self: 'countries',
    reducer: reducer_byCountry,
    reducer2: reducer_byUSstate,
    scale: "log",
    highlight: defaultCountry,
    defaultHighlight: defaultCountry,
    y0: 100,
    xCap: 25,
    id: "chart-countries",
    normalizePopulation: false,
    show: "25",
    dataSelection: 'cases',
    showDelta: true,
    avgData: 7,
    dataSelection_y0: { 'active': 100, 'cases': 100, 'deaths': 10, 'recovered': 100, 'new-cases': 1, 'mortalityRate': 10},
    yAxisScale: 'fixed',
    xMax: null, yMax: null, data: null,
    trendline: "default",
    dataRawSelection: "cases-daily-7",
  },
  'states': {
    self: 'states',
    reducer: reducer_byUSstate,
    highlight: defaultState,
    defaultHighlight: defaultState,
    xCap: 40,
    id: "chart-states",
    normalizePopulation: false,
    show: "us-states",
    dataSelection: 'cases',
    showDelta: true,
    avgData: 7,
    y0: 20,
    scale: "log",

    dataSelection_y0: { 'active': 20, 'cases': 20, 'deaths': 5, 'recovered': 20, 'hospitalized': 1, 'tests': 1, 'testPositivity': 10, 'mortalityRate': 5},
    yAxisScale: 'fixed',

    xMax: null, yMax: null, data: null,
    trendline: "default",
    dataRawSelection: "cases-daily-7"
  },

  'countries-normalized': {
    self: 'countries-normalized',
    reducer: reducer_byCountry,
    reducer2: reducer_byUSstate,
    scale: "log",
    highlight: defaultCountry,
    defaultHighlight: defaultCountry,
    y0: 1,
    xCap: 25,
    id: "chart-countries-normalized",
    normalizePopulation: "country",
    show: "25",
    dataSelection: 'cases',
    showDelta: true,
    avgData: 7,
    dataSelection_y0: { 'active': 1, 'cases': 1, 'deaths': 1, 'recovered': 1, 'mortalityRate': 10 },
    yAxisScale: 'fixed',
    xMax: null, yMax: null, data: null,
    trendline: "default",
    dataRawSelection: "cases-daily-7"
  },
  'states-normalized': {
    self: 'states-normalized',
    reducer: reducer_byUSstate,
    scale: "log",
    highlight: defaultState,
    defaultHighlight: defaultState,
    y0: 1,
    xCap: 40,
    id: "chart-states-normalized",
    normalizePopulation: "state",
    show: "us-states",
    dataSelection: 'cases',
    showDelta: true,
    avgData: 7,
    dataSelection_y0: { 'active': 1, 'cases': 1, 'deaths': 1, 'recovered': 1, 'hospitalized': 1, 'tests': 1, 'testPositivity': 10, 'mortalityRate': 10 },
    yAxisScale: 'fixed',
    xMax: null, yMax: null, data: null,
    trendline: "default",
    dataRawSelection: "cases-daily-7"
  },
};


var findNextExp = function(x) {
  return x * 1.3;
};


var transformToTrailingAverage2 = function (data, period) {
  var largest = -1;
  var sum = 0, ct = 0;

  for (var i = 0; i < data.length; i++) {
    val = ('rawcases' in data[i]) ? (data[i].rawcases) : (data[i].cases);
    if (val > 0) { sum += val; } 

    var j = i - period;
    if (j >= 0) {
      val = ('rawcases' in data[j]) ? (data[j].rawcases) : (data[j].cases);
      if (val > 0) { sum -= val; }
    } else {
      ct++;
    }

    avg = sum / ct;
    if (avg > largest) { largest = avg; }

    if ( !('rawcases' in data[i]) ) { data[i].rawcases = data[i].cases; }
    data[i].cases = avg;
  }

  return largest;
};

var transformToTrailingAverage = function (casesData, period) {
  for (var countryData of casesData) {
    countryData.maxCases = transformToTrailingAverage2(countryData.data, period);
  }
}

var getHTMLCountryOptionsToSelect = function(allCountries, selectedCountry) {
  var html = "";
  allCountries.unshift("(None)");
  for (var country of allCountries) {
    var el_option = $("<option />").val(country).text(country);
    if (selectedCountry == country) { el_option.attr("selected", true); }
    html += el_option.wrap('<p/>').parent().html();
  }
  return html;
}

var prep_data = function(chart) {
  var caseData = chart.fullData;
  var allCountries = _.map(caseData, 'country').sort();
  var highlights = [ chart.highlight ];
  if (chart.extraHighlights) { highlights = highlights.concat( chart.extraHighlights ); }


  let retain = [], retain_f = null, exclude = [];
  switch (chart.show) {
    case "highlight-only":
      retain = highlights;
      break;
    
    case "northeast":
      retain = ["Connecticut", "Maine", "Massachusetts", "New Hampshire", "Rhode Island", "Vermont", "New Jersey", "New York", "Pennsylvania"];
      retain = retain.concat(highlights);
      break;

    case "midwest":
      retain = ["Illinois", "Indiana", "Michigan", "Ohio", "Wisconsin", "Iowa", "Kansas", "Minnesota", "Missouri", "Nebraska", "North Dakota", "South Dakota"];
      retain = retain.concat(highlights);
      break;

    case "south":
      retain = [
        "Delaware", "Florida", "Georgia", "Maryland", "North Carolina", "South Carolina", "Virginia", "District of Columbia", "West Virginia",
        "Alabama", "Kentucky", "Mississippi", "Tennessee", "Arkansas", "Louisiana", "Oklahoma", "Texas"
      ];        
      retain = retain.concat(highlights);
      break;

    case "west":
      retain = ["Arizona", "Colorado", "Idaho", "Montana", "Nevada", "New Mexico", "Utah", "Wyoming", "Alaska", "California", "Hawaii", "Oregon", "Washington"];
      retain = retain.concat(highlights);
      break;

    case "pop-small":
      retain_f = function(d) { return (d.pop <= 5e6) || (highlights.indexOf(d.country) != -1); }
      break;

    case "pop-large":
      retain_f = function(d) { return (d.pop > 5e6) || (highlights.indexOf(d.country) != -1); }
      break;

    case "us-states":
      exclude = ["Puerto Rico", "Northern Mariana Islands", "Guam", "Virgin Islands"];
      break;
  }


  if (retain.length > 0) {
    caseData = _.filter(caseData, function(d) { return (retain.indexOf(d.country) != -1 || highlights.indexOf(d.country) != -1); });
  } else if (exclude.length > 0) {
    caseData = _.filter(caseData, function(d) { return (exclude.indexOf(d.country) == -1 || highlights.indexOf(d.country) != -1); });
  } else if (retain_f) {
    caseData = _.filter(caseData, retain_f);
  } else if (chart.show != "all") {
    let numShow = parseInt(chart.show);

    if (chart.id == "chart-countries-normalized") {
      caseData = _.filter(caseData, function(d) { return (d.pop > 1e7) || (highlights.indexOf(d.country) != -1); });
    }

    highlight_data = _.filter(caseData, function(d) { return highlights.indexOf(d.country) != -1; });


    if (numShow > 0) { caseData = _.take(caseData, numShow); }
    else { caseData = _.takeRight(caseData, -numShow); }
    for (var hd of highlight_data) {
      if ( !_.find(caseData, function (d) { return d.country == hd.country } ) ) {
        caseData.push(hd);
      }
    }
  }

  var $highlight = $("#highlight-" + chart.id);
  if ($highlight.html().length < 100) { 
    $highlight.html(getHTMLCountryOptionsToSelect(allCountries, chart.highlight));
  }

  if (chart.avgData && chart.avgData > 1) { transformToTrailingAverage(caseData, chart.avgData); }
  chart.data = caseData;
  
  casesMax = _.sortBy(chart.data, function(d) { return -d.maxCases; } )[0];

  if (casesMax) {
    chart.yMax = findNextExp(casesMax.maxCases);
  } else {
    chart.yMax = -1;
  }

  return chart;
};


var process_data = function(data, chart) {
  var agg = _.reduce(data, chart.reducer, {});

  var caseData = [];
  var maxDayCounter = 0;

  let popData;
  if (chart.normalizePopulation) {
    popData = _popData[chart.normalizePopulation]; 
  } else if (chart.self == "countries") {
    popData = _popData["country"];
  } else if (chart.self == "states") {
    popData = _popData["state"];
  }

  let isRatio = chart.isRatio;

  let fetchCasesValue, fetchRawCasesValue, fetchCasesDelta;

  switch (chart.dataSelection) {
    case 'testPositivity':
      fetchCasesValue = function (country, date) {
        if (agg[country][date]['tests'] == 0) { return 0; }
        return (agg[country][date]['cases'] / agg[country][date]['tests']);
      };

      fetchRawCasesValue = function (country, date) {
        return agg[country][date]['tests'];
      };

      fetchCasesDelta = function(country, date_cur, date_prev) {
        if ((agg[country][date_cur]['tests'] - agg[country][date_prev]['tests']) == 0) { return 0; }
        return (agg[country][date_cur]['cases'] - agg[country][date_prev]['cases']) /
               (agg[country][date_cur]['tests'] - agg[country][date_prev]['tests']);
      }
      break;

      case 'mortalityRate':
        fetchCasesValue = function (country, date) {
          if (agg[country][date]['cases'] == 0) { return 0; }
          return (agg[country][date]['deaths'] / agg[country][date]['cases']);
        };
  
        fetchRawCasesValue = function (country, date) {
          return agg[country][date]['deaths'];
        };
  
        fetchCasesDelta = function(country, date_cur, date_prev) {
          if ((agg[country][date_cur]['cases'] - agg[country][date_prev]['cases']) == 0) { return 0; }
          return (agg[country][date_cur]['deaths'] - agg[country][date_prev]['deaths']) /
                 (agg[country][date_cur]['cases'] - agg[country][date_prev]['cases']);
        }
        break;
  
    default:
      fetchCasesValue = fetchRawCasesValue = function(country, date) {
        return agg[country][date][chart.dataSelection];
      };

      fetchCasesDelta = function(country, date_cur, date_prev) {
        return agg[country][date_cur][chart.dataSelection] - agg[country][date_prev][chart.dataSelection];
      };
      break;
  }  

  
  for (var country in agg) {
    var popSize = -1;

    popSize = popData[country];
    if (!popSize && location.hostname === "localhost") {
      console.log("Missing " + chart.normalizePopulation + ": " + country);
    }

    dayCounter = -1;
    maxCases = 0;
    maxDay = -1;
    let totalDays = -1;
    lastDayCases = -1;
    countryData = [];
    var dataIndex = 0;
    var dates = Object.keys(agg[country]);

    for (var i = 0; i < dates.length; i++) {
      date = dates[i];

      let dateParts = date.split("-");
      let dateObj = new Date(parseInt(dateParts[2]), parseInt(dateParts[0]) - 1, parseInt(dateParts[1]));
      let daysAgo = (_dateObj_today_time - dateObj.getTime()) / (1000 * 3600 * 24);
      // TODO: 
      daysAgo = Math.ceil(daysAgo);
  
      // Start counting days only after the first day w/ 100 cases:
      //console.log(agg[country][date]);


      let cases = fetchCasesValue(country, date);
      var rawCaseValue = fetchRawCasesValue(country, date);

      if (chart.showDelta) {
        if (i == 0) {
          cases = 0;
        } else {
          date_prev = dates[i - 1];
          cases = fetchCasesDelta(country, date, date_prev);
        }
      }

      if (chart.normalizePopulation && !chart.isRatio) {
        cases = (cases / popSize) * 1e6;
        rawCaseValue = (rawCaseValue / popSize) * 1e6;
      }

      if (dayCounter == -1) {
        if (
          (cases >= chart.y0) ||
          ((chart.showDelta || isRatio) && rawCaseValue >= chart.y0)
        ) {
          dayCounter = 0;
        }
      }
      
      // Once we start counting days, add data
      if (dayCounter > -1) {

        var recordData = true;
        if ( (chart.dataSelection == "tests" || chart.dataSelection == "hospitalized") && dayCounter == 0 && chart.showDelta ) {
          recordData = false;
        } else if (chart.showDelta || isRatio) {
          // Always record, except when the raw data is 0.
          if (rawCaseValue == 0) { recordData = false; }
        } else if (cases < chart.y0) {
          recordData = false;
        }

        if (recordData) {
          let record = {
            pop: popSize,
            country: country,
            dayCounter: dayCounter,
            date: date,
            cases: cases,
            daysAgo: daysAgo
          };

          switch (chart.dataSelection) {
            case "testPositivity":
              record.n = agg[country][date]['cases'];
              record.d = agg[country][date]['tests'];
              break;

            case "mortalityRate":
              record.n = agg[country][date]['deaths'];
              record.d = agg[country][date]['cases'];
              break;  
          }

          countryData.push(record);
          lastDayCases = cases;
          maxDay = dayCounter;

          if (cases > maxCases) { maxCases = cases; }
        }
        totalDays = dayCounter;

        dayCounter++;
      }
    }

    if (maxDay > 0) {
      caseData.push({
        pop: popSize,
        country: country,
        data: countryData,
        maxCases: maxCases,
        maxDay: maxDay,
        totalDays: totalDays,
        lastDayCases: lastDayCases
      });

      if (dayCounter > maxDayCounter) {
        maxDayCounter = dayCounter + 4;
      }
    }
  }

  caseData = _.sortBy(caseData, function (d) {
    return -d.lastDayCases;
  });
  chart.fullData = caseData;

  chart.xMax = maxDayCounter;
  if (chart.xMax > 100) { chart.xMax = 100; }

  prep_data(chart);
};


var covidData_promise = d3.csv("../../jhu-data.csv?d=" + _reqStr, function (row) {
  row["Active"] = +row["Active"];
  row["Confirmed"] = +row["Confirmed"];
  row["Recovered"] = +row["Recovered"];
  row["Deaths"] = +row["Deaths"];
  row["People_Tested"] = +row["People_Tested"];
  row["People_Hospitalized"] = +row["People_Hospitalized"];
  return row;
});

var populationData_promise = d3.csv("../../wikipedia-population.csv", function (row) {
  row["Population"] = (+row["Population"]);
  return row;
});


var _dataReady = false, _pageReady = false, _chartIdFirst;


var tryRender = function () {
  if (_dataReady && _pageReady) {
    process_query_string();
    _chartIdFirst = Object.keys(charts)[0];

    process_data(_rawData, charts[_chartIdFirst]);
    doRender(charts[_chartIdFirst]);

    setTimeout(initialRender2, 100);
  }
}

var initialRender2 = function() {
  for (let chartid of Object.keys(charts)) {
    if (_chartIdFirst == chartid) { continue; }

    process_data(_rawData, charts[chartid]);
    doRender(charts[chartid]);
  }

  process_query_string_ui();
  _intial_load = false;
};



Promise.all([covidData_promise, populationData_promise])
  .then(function(result) {
    data = result[0];
    populationData = result[1];

    let dateParts = data[data.length - 1].Date.split("-");
    _dateObj_today = new Date(parseInt(dateParts[2]), parseInt(dateParts[0]) - 1, parseInt(dateParts[1]));
    _dateObj_today_time = _dateObj_today.getTime();
    
    _rawData = data;

    _popData = {country: {}, state: {}};
    for (var pop of populationData) {
      if (pop.Country) { _popData.country[pop.Country] = pop.Population; }
      if (pop.State) { _popData.state[pop.State] = pop.Population; }
    }

    _dataReady = true;
    tryRender();
  })
  .catch(function (err) {
    console.error(err);

    for (let chartid of Object.keys(charts)) {
      $("#" + charts[chartid].id).html(`
        <div class="alert alert-danger" style="margin: 20px; border: 1px solid red;">
          <p><b>Failed to load COVID-19 data.</b></p>
          <ul>
            <li>This is usually caused by either your device losing internet or the 91-DIVOC server having problems.</li>
            <li>You can try refreshing in a few seconds and it should work (I hope!).</li>
            <li>If you continue to get the error, feel free to reach out and let me know about the error message below. Thanks! :)</li>
          </ul>
          <hr>
          <pre>${err}</pre>
        </div>
      `);
    }

    gtag("event", "data-loading-error");
  });


var updateAdditionalHighlight = function(e) {
  var chartId = $(e.target).data("chart");
  var chart = charts[chartId];

  var allAdditionalHighlights = $(`.additional-highlight-select[data-chart="${chartId}"]`);
  chart.extraHighlights = _.map( allAdditionalHighlights.toArray(), function (e) { return $(e).val(); } )

  prep_data(chart);
  render(chart);
  updateQueryString(chart);
  gtag("event", "change-additional-highlight", {event_category: chart.self, event_label: chart.extraHighlights.toString()});
};


var _cssData = null;

var saveGraphImage = function(format, e) {
  e.preventDefault();
  const chart = getChart(e.target);

  if (!_cssData) {
    $.get("css.css", function (cssData) {
      _cssData = cssData;

      switch (format) {
        case 'svg': saveAsSVG(chart); break;
        case 'png': saveAsPNG(chart); break;
      }
    });
  } else {
    switch (format) {
      case 'svg': saveAsSVG(chart); break;
      case 'png': saveAsPNG(chart); break;
    }
  }

  gtag("event", "saveAs", {event_category: chart.self, event_label: format});
  return false;
}


var saveAsSVG = function(chart) {
  var chartXML = $(`#chart-${chart.self}`).html();
  chartXML = chartXML.replace(`<style></style>`, `<style>${_cssData}</style>`);
  chartXML = chartXML.replace(`<style />`, `<style>${_cssData}</style>`);

  var hrefData = "data:image/svg+xml," + encodeURIComponent(chartXML);
  saveAs(hrefData, "91-DIVOC-" + chart.self + "-" + chart.highlight.replace(" ", "") + ".svg");

  gtag("event", "saveAs-SVG", {event_category: chart.self});
}

var saveAsPNG = function(chart) {
  var chartSVG = $(`#chart-${chart.self} svg`);
  var chartXML = $(`#chart-${chart.self}`).html();
  chartXML = chartXML.replace(`<style></style>`, `<style>${_cssData}</style>`);
  chartXML = chartXML.replace(`<style />`, `<style>${_cssData}</style>`);

  var hrefData = "data:image/svg+xml," + encodeURIComponent(chartXML);

  var canvas = $(`<canvas height="${chartSVG.height()}" width="${chartSVG.width()}" />`).get(0);
  var ctx = canvas.getContext('2d');

  var img = new Image(chartSVG.width(), chartSVG.height());
  img.onload = function () {
    ctx.drawImage(img, 0, 0, chartSVG.width(), chartSVG.height());

    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
    if (!canvas.toBlob) {
      if (!HTMLCanvasElement.prototype.toBlob) {
        Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
          value: function (callback, type, quality) {
            var dataURL = this.toDataURL(type, quality).split(',')[1];
            setTimeout(function() {
      
              var binStr = atob( dataURL ),
                  len = binStr.length,
                  arr = new Uint8Array(len);
      
              for (var i = 0; i < len; i++ ) {
                arr[i] = binStr.charCodeAt(i);
              }
      
              callback( new Blob( [arr], {type: type || 'image/png'} ) );
            });
          }
        });
      }
    }

    canvas.toBlob(function (blob) {
      saveAs(blob, "91-DIVOC-" + chart.self + "-" + chart.highlight.replace(" ", "") + ".png");
    });      
  }

  img.src = hrefData;
  gtag("event", "saveAs-PNG", {event_category: chart.self});
};

var _update_graph = function(chart, value, attr, selector) {
  chart[attr] = value;

  // UI Update:
  if (attr == "scale") {
    $(`.${selector}[data-chart="${chart.self}"][data-scale="${value}"]`).click();
  } else if (attr == "extraHighlights") {
    value = value.split(",");
    chart[attr] = value;
  } else {
    let el = $(`.${selector}[data-chart="${chart.self}"] option[value="${value}"]`);
    el.prop('selected', true);
  }

  // Backend Update:
  if (attr == "dataSelection") {
    updateDataSelectionOptions(chart, value);
  }
};

var _qs_update_graph = function(chart, urlParams, qs, attr, selector) {
  let qs_value = urlParams.get(qs);
  if (qs_value) {
    _update_graph(chart, qs_value, attr, selector);
  }
}

var process_query_string_ui = function() {
  const urlParams = new URLSearchParams(window.location.search);
  
  let chartId = urlParams.get("chart");
  if (!chartId) { return; }

  let chart = charts[chartId];
  if (!chart) { return; }

  if (chart.extraHighlights) {
    for (let selectedOption of chart.extraHighlights) {
      ui_add_highlight(chart, chartId, _additionalHighlight_index, selectedOption);
      _additionalHighlight_index++;
    }
  }
}

var process_query_string = function() {
  const urlParams = new URLSearchParams(window.location.search);
  
  let chartId = urlParams.get("chart");
  if (!chartId) { return; }

  let chart = charts[chartId];
  if (!chart) { return; }

  _qs_update_graph(chart, urlParams, "highlight", "highlight", "highlight-select");
  _qs_update_graph(chart, urlParams, "show", "show", "filter-select");
  _qs_update_graph(chart, urlParams, "xaxis", "xaxis", "xaxis-select");
  _qs_update_graph(chart, urlParams, "y", "yAxisScale", "yaxis-select");
  _qs_update_graph(chart, urlParams, "data", "dataSelection", "data-select");
  _qs_update_graph(chart, urlParams, "scale", "scale", "scaleSelection");
  _qs_update_graph(chart, urlParams, "extra", "extraHighlights", "extra-highlights");
  updateQueryString(chart);
};


var generateUrl = function(chart) {
  var dataattr = chart.id.substring( chart.id.indexOf("-") + 1 );
  var options = {
    chart: dataattr,
    highlight: chart.highlight,
    show: chart.show,
    y: chart.yAxisScale,
    scale: chart.scale,
    data: (chart.dataRawSelection) ? chart.dataRawSelection : chart.dataSelection
  }

  if (chart.xaxis) { options.xaxis = chart.xaxis; }
  if (chart.extraHighlights) { options.extra = chart.extraHighlights; }

  var qs = Object.keys(options).map(function(key) {
    return key + '=' + encodeURIComponent(options[key])
  }).join('&');

  var url = [location.protocol, '//', location.host, location.pathname].join('');
  return url + "?" + qs + "#" + dataattr;
};

var additionalHighlight_rerender = function(chart) {
  $(`.extra-highlights[data-chart="${chart.self}"]`).html("");
  _additionalHighlight_index = 0;
  for (let selectedOption of chart.extraHighlights) {
    ui_add_highlight(chart, chart.self, _additionalHighlight_index, selectedOption);
    _additionalHighlight_index++;
  }
};


var scaleToHighlight = function(e) {
  e.preventDefault();

  const chart = getChart(e.target);
  _update_graph(chart, "highlight", "yAxisScale", "yaxis-select");
  render(chart);

  gtag("event", "scaleToHighlight-helper", {event_category: chart.self});
};


var additionalHighlightRemove = function(e) {
  let el = $(e.target);
  let indexToRemove = el.data("index");
  let chartId = el.data("chart");
  let chart = charts[chartId];

  chart.extraHighlights.splice(indexToRemove, 1);
  additionalHighlight_rerender(chart);

  prep_data(chart);
  render(chart);
  updateQueryString(chart);

  e.preventDefault();
  return false;
}

var ui_add_highlight = function(chart, chartId, index, selectedOption=null) {
  var el_add = $(`.extra-highlights[data-chart="${chartId}"]`);
  var allCountries = _.map(chart.fullData, 'country').sort();
  if (!selectedOption) { selectedOption = chart.defaultHighlight; }

  var html =
    `<div class="btn-group btn-group-toggle" data-toggle="buttons" style="padding-bottom: 3px;">
        <div class="input-group-prepend">
          <span class="input-group-text">[<a href="#" data-index="${index}" data-chart="${chartId}" onclick="additionalHighlightRemove(event)">X</a>] Additional Highlight:</span>
        </div>
        <select class="form-control additional-highlight-select" onchange="updateAdditionalHighlight(event)" data-chart="${chartId}">
          ${getHTMLCountryOptionsToSelect(allCountries, selectedOption)}
        </select>
      </div><br>`;

  el_add.append( html );
};

var updateQueryString = function(chart) {
  var dataattr = chart.id.substring(6);
  var url = generateUrl(chart);
  var html = `Direct Link w/ Your Options: <a href="${url}">${url}</a>`;
  $(`.query-string[data-chart="${dataattr}"]`).show();
  $(`.query-string[data-chart="${dataattr}"]`).html(html);
};

var updateDataSelectionOptions = function(chart, value) {
  chart.dataRawSelection = value;
  chart.showDelta = false;
  delete chart.avgData;

  let valuePieces = value.split('-');

  if (valuePieces.length >= 2) {
    // eg: cases-daily
    value = valuePieces[0];
    chart.showDelta = true;

    if (valuePieces.length == 3) {
      chart.avgData = parseInt(valuePieces[2]);
    }
  }

  chart.isRatio = false;
  if (value == 'testPositivity' || value == 'mortalityRate') {
    chart.isRatio = true;
    chart.forceLinear = true;

    $(`section[data-chart="${chart.self}"] .scaleSelectionArea`).hide();
  } else if (chart.forceLinear) {
    chart.forceLinear = false;
    $(`section[data-chart="${chart.self}"] .scaleSelectionArea`).show();    
  }


  chart.dataSelection = value;
  chart.y0 = chart.dataSelection_y0[value];

  $("#" + chart.id.substring(6)).html("<h2>" + generateDataLabel(chart, true) + "</h2>");
};

var getChart = function (el) {
  q = $(el);
  while (!q.data("chart")) { q = q.parent(); }
  return charts[q.data("chart")];
};

$(function() {
  // Check if all charts are present:
  for (let chartid of Object.keys(charts)) {
    var el = $("#" + chartid);
    if (el.length == 0) {
      delete charts[chartid];
    }
  }


  $(".highlight-select").change(function (e) {
    var chartId = $(e.target).data("chart");
    var chart = charts[chartId];
    var val = $(e.target).val();

    chart.highlight = val;

    if (chart.id.indexOf("countries") != -1) { setCookie('country', val, 30); }
    if (chart.id.indexOf("states") != -1) { setCookie('state', val, 30); }

    if ( chart.avgData || _.map(chart.data, "country").indexOf(val) == -1 ) {
      prep_data(chart);
    }
    render(chart);
    updateQueryString(chart);
    gtag("event", "change-main-highlight", {event_category: chartId, event_label: val});
  });

  $(".trendline-select").change(function(e) {
    const chart = getChart(e.target);
    
    chart.trendline = $(e.target).val();
    if ( chart.avgData ) { prep_data(chart); }
    render(chart);
    updateQueryString(chart);
    gtag("event", "change-trendline", {event_category: chart.self, event_label: chart.trendline});
  });

  $(".xaxis-select").change(function(e) {
    var chartId = $(e.target).data("chart");
    var chart = charts[chartId];    
    
    chart.xaxis = $(e.target).val();

    render(chart);
    updateQueryString(chart);
    gtag("event", "change-xaxis", {event_category: chartId, event_label: chart.xaxis});
  });

  $(".yaxis-select").change(function(e) {
    var chartId = $(e.target).data("chart");
    var chart = charts[chartId];
    
    chart.yAxisScale = $(e.target).val();
    //prep_data(chart);
    if ( chart.avgData ) { prep_data(chart); }
    render(chart);
    updateQueryString(chart);
    gtag("event", "change-yaxis", {event_category: chartId, event_label: chart.yAxisScale});
  });

  $(".scaleSelection").click(function(e) {
    var value = $(e.target).data("scale");
    var chartId = $(e.target).data("chart");
    var chart = charts[chartId];

    $(`.scaleSelection[data-chart="${chartId}"]`).removeClass('active').prop('checked', false);
    $(e.target).prop('checked', true);
    $(e.target).addClass('active');

    if (chart && chart.scale != value) {
      chart.scale = value;
      render(chart);
    }

    updateQueryString(chart);
    e.preventDefault();
    gtag("event", "change-scale", {event_category: chartId, event_label: chart.scale});
    return false;
  });

  $(".filter-select").change(function (e) {
    var chartId = $(e.target).data("chart");
    var chart = charts[chartId];
    
    chart.show = $(e.target).val();
    prep_data(chart);
    render(chart);
    updateQueryString(chart);
    gtag("event", "change-filter", {event_category: chartId, event_label: chart.show});
  });

  $(".data-select").change(function (e) {
    var chartId = $(e.target).data("chart");
    var chart = charts[chartId];
    var value = $(e.target).val();

    updateDataSelectionOptions(chart, value);

    process_data(_rawData, chart);
    render(chart);
    updateQueryString(chart);
    gtag("event", "change-data", {event_category: chartId, event_label: value});
  });

  $(".add-highlight").click(function (e) {
    e.preventDefault();

    var chartId = $(e.target).data("chart");
    var chart = charts[chartId];

    ui_add_highlight(chart, chartId, _additionalHighlight_index);
    _additionalHighlight_index++;

    if (!chart.extraHighlights) { chart.extraHighlights = []; }
    chart.extraHighlights.push(chart.defaultHighlight);

    prep_data(chart);
    render(chart);
    updateQueryString(chart);
    gtag("event", "add-highlight", {event_category: chartId, event_label: chart.extraHighlights.length});
  });

  $(".show-lesser-used-options").click(function (e) {
    const chart = getChart(e.target);

    $(e.target).hide();

    const el = $(`section[data-chart="${chart.self}"] .lesser-used-options`);
    el.show();

    gtag("event", "show-lesser-used-options", {event_category: chart.self});
    e.preventDefault();
  });

  $(".animate-button"). click(function (e) {
    var chartId = $(e.target).data("chart");
    var chart = charts[chartId];
    animate(chart);
  });

  _pageReady = true;
  tryRender();
});


var generateDataLabel = function(chart, title = false) {
  var dataLabel = "";

  if (title) {
    if (chart.isRatio) {
      if (chart.showDelta) { dataLabel = "Daily "; }
      else { dataLabel = "Cumulative "; }      
    } 
    else if (chart.showDelta) { dataLabel = "New "; }

    if (chart.dataSelection == 'cases') { dataLabel += "Confirmed COVID-19 Cases"; }
    else if (chart.dataSelection == 'active') { dataLabel += "Active COVID-19 Cases"; }
    else if (chart.dataSelection == 'deaths') { dataLabel += "Deaths from COVID-19"; }
    else if (chart.dataSelection == 'recovered') { dataLabel += "Recoveries from COVID-19"; }
    else if (chart.dataSelection == 'hospitalized') { dataLabel += "Total hospitalized with COVID-19"; }
    else if (chart.dataSelection == 'tests') { dataLabel += "COVID-19 Tests Performed"; }  
    else if (chart.dataSelection == 'testPositivity') { dataLabel += "COVID-19 Test Positivity Rate"; }  
    else if (chart.dataSelection == 'mortalityRate') { dataLabel += "COVID-19 Confirmed Mortality Rate"; }  


    if (chart.showDelta) { dataLabel += " per Day"; }

    if (chart.id.indexOf("state") != -1) { dataLabel += " by US States/Territories"; }
    if (chart.normalizePopulation) { dataLabel += ", normalized by population"; }


  } else {
    if (chart.isRatio) {
      if (!chart.showDelta) { dataLabel = "cumulative "; }      
    } 
    else if (chart.showDelta) { dataLabel = "new "; }

    if (chart.dataSelection == 'cases') { dataLabel += "confirmed cases"; }
    else if (chart.dataSelection == 'active') { dataLabel += "active cases"; }
    else if (chart.dataSelection == 'deaths') { dataLabel += "deaths from COVID-19"; }
    else if (chart.dataSelection == 'recovered') { dataLabel += "recoveries"; }
    else if (chart.dataSelection == 'hospitalized') { dataLabel += "total hospitalizations"; }
    else if (chart.dataSelection == 'tests') { dataLabel += "COVID-19 tests performed"; }  
    else if (chart.dataSelection == 'testPositivity') { dataLabel += "test positivity"; }  
    else if (chart.dataSelection == 'mortalityRate') { dataLabel += "mortality rate"; }  
  }

  return dataLabel;
};


var tip_html = function(chart) {
  return function(d, i) {
    const isSmall = (_client_width < 500);
    const highlights = [chart.highlight].concat( (chart.extraHighlights)?(chart.extraHighlights):[] );
    const isHighlighted = ( highlights.indexOf(d.country) != -1 );
    
    let alignRight = false;
    if (chart.xaxis && chart.xaxis.indexOf("right") != -1) { alignRight = true; }

    var gData = _.find(chart.data, function (e) { return e.country == d.country }).data;

    var geoGrowth = [];
    if (i >= 2) {
      let d0 = gData[i - 1];
      let ggrowth = Math.pow(d.cases / d0.cases, 1 / (d.dayCounter - d0.dayCounter));
      if (isFinite(ggrowth)) {
        geoGrowth.push(`Previous day: <b>${ggrowth.toFixed(2)}x</b> growth`);
      }
    }
    if (i >= 8) {
      let d0 = gData[i - 7];
      let ggrowth = Math.pow(d.cases / d0.cases, 1 / (d.dayCounter - d0.dayCounter));
      if (isFinite(ggrowth)) {
        geoGrowth.push(`Previous week: <b>${ggrowth.toFixed(2)}x</b> /day`);
      }
    }
    if (i > 0) {
      let d0 = gData[0];
      let ggrowth = Math.pow(d.cases / d0.cases, 1 / (d.dayCounter - d0.dayCounter));
      if (isFinite(ggrowth)) {
        geoGrowth.push(`Previous ${d.dayCounter} days: <b>${ggrowth.toFixed(2)}x</b> /day`);
      }
    }

    var s2 = "";
    if (chart.normalizePopulation && !chart.isRatio) { s2 = " per 1,000,000 people"; }

    var dataLabel = generateDataLabel(chart);
    var dataLabel_cutoff = dataLabel;
    
    if (chart.dataSelection == 'testPositivity') { dataLabel_cutoff = "tests"; }
    else if (chart.dataSelection == 'mortalityRate') { dataLabel_cutoff = "deaths from COVID-19"; }  

    let daysSince = `(`;
    daysSince += `<b>${d.daysAgo}</b> day${(d.daysAgo != 1)?"s":""} ago and `;
    daysSince += `<b>${d.dayCounter}</b> day${(d.dayCounter != 1)?"s":""} after reaching ${chart.y0} ${dataLabel_cutoff}${s2})`;
    if (chart.dataSelection == 'hospitalized' || chart.dataSelection == 'tests') {
      daysSince = "";
    }


    let dateStr = "";
    let dateParts = d.date.split("-");
    let date = new Date(parseInt(dateParts[2]), parseInt(dateParts[0]) - 1, parseInt(dateParts[1]));

    if (date instanceof Date) {
      dateStr = `${ date.toLocaleDateString('en-US', { weekday: 'long'}) }, `;
    }
    



    var s;
    
    if (alignRight) {
      s = `<div class="tip-country">${d.country} &ndash; ${d.daysAgo} day${(d.daysAgo != 1)?"s":""} ago</div>`;
    } else {
      s = `<div class="tip-country">${d.country} &ndash; Day ${d.dayCounter}</div>`;
    }

    let numberStr;
    if (chart.isRatio) {
      numberStr = (((d.rawcases)?d.rawcases:d.cases) * 100).toLocaleString("en-US", {maximumFractionDigits: 2}) + "%";
    } else {
      numberStr = ((d.rawcases)?d.rawcases:d.cases).toLocaleString("en-US", {maximumFractionDigits: 1})
    }

    if (d.rawcases) { s += "<i>"; }
    s += `<div class="tip-details" style="border-bottom: solid 1px black; padding-bottom: 2px;"><b>${numberStr}</b> ${dataLabel}${s2} on ${dateStr}${d.date} ${daysSince}</div>`;
    if (d.rawcases) { s += "</i>"; }

    if (chart.isRatio && !chart.avgData) {
      let d_n = d.n, d_d = d.d;

      let n_label, d_label;
      switch (chart.dataSelection) {
        case "testPositivity":
          n_label = "cases";
          d_label = "tests";
          break;

        case "mortalityRate":
          n_label = "deaths";
          d_label = "cases";
          break;
      }
      
      if (chart.showDelta) {
        if (i > 0) {
          let d_cur = gData[i];
          let d_prev = gData[i - 1];

          d_n = d_cur.n - d_prev.n;
          d_d = d_cur.d - d_prev.d;

          s += `<div class="tip-details" style="padding-bottom: 2px;"><i>` +
            `<b>${d_n.toLocaleString("en-US", {maximumFractionDigits: 1})}</b> new ${n_label} / <b>${d_d.toLocaleString("en-US", {maximumFractionDigits: 1})}</b> new ${d_label}` +
            `</i></div>`;
        }
      } else {
        s += `<div class="tip-details" style="padding-bottom: 2px;"><i>` +
        `<b>${d_n.toLocaleString("en-US", {maximumFractionDigits: 1})}</b> total ${n_label} / <b>${d_d.toLocaleString("en-US", {maximumFractionDigits: 1})}</b> total ${d_label}` +
        `</i></div>`;
      }

      geoGrowth = [];
    }

    if (d.rawcases) {
      if (chart.isRatio) {
        numberStr = (d.cases * 100).toLocaleString("en-US", {maximumFractionDigits: 2}) + "%";
      } else {
        numberStr = (d.cases).toLocaleString("en-US", {maximumFractionDigits: 1})
      }
  
      var trailingDays = Math.min(d.dayCounter + 1, chart.avgData);
      s += `<div class="tip-details">`;
      s += "<b>" + numberStr + " average</b> " + dataLabel + s2 + " /day over the <b>past " + trailingDays + " days</b>";
      s += `</div>`;
    }
    
    else if (geoGrowth.length > 0) {
      s += `<div class="tip-details"><i><u>Avg. geometric growth</u>:<br>`;
      for (var str of geoGrowth) {
        s += str + "<br>";
      }
      s += `</i></div>`;
    }

    if (!isSmall && !isHighlighted) {
      s += `<div class="tip-details" style="font-size: 10px; border-top: solid 1px black; padding-top: 1px; margin-top: 2px;">`;
      s += `<i style="color: purple;">Shift-click to add as an additional highlight</i>`
      s += `</div>`;
    }

    gtag("event", "mouseover", {event_category: chart.self, event_label: d.country, value: d.dayCounter});
    return s;
  }
};

var textToClass = function (s) {
  return s.replace(/[\W_]+/g,"-");
};

var showLoadingSpinner = function(chart) {
  $("#" + chart.id).html(`<div class="text-center divoc-graph-loading"><div class="spinner-border text-primary" role="status">
    <span class="sr-only">Loading...</span>
  </div></div>`);
}

var cancelAnimation = function(chart) {
  if (_animation_timeout) {
    clearTimeout(_animation_timeout);
    _animation_timeout = null;

    $(`.animate-button[data-chart="${chart.self}"]`).html("&#9654; Animate");
  }
}

var render = function(chart) {
  cancelAnimation(chart);
  showLoadingSpinner(chart);
  setTimeout(function() { doRender(chart) }, 0);
};

var calculateMaxDayRendered = function(chart) {
  let maxDayRendered = chart.xMax;
  let f = _.find(chart.data, function (e) { return e.country == chart.highlight })

  // xAxis
  if (chart.xaxis == "right") {
    if (f) { maxDayRendered = f.totalDays; }
  } else if (chart.xaxis == "right-4wk") {
    maxDayRendered = 28;
  } else if (chart.xaxis == "right-8wk") {
    maxDayRendered = 7 * 8;
  } else if (chart.xaxis == "right-all") {
    let m = _.maxBy(chart.data, 'totalDays');
    maxDayRendered = m.totalDays;
  } else {
    // left-align
    if (f && f.maxDay > maxDayRendered) {
      maxDayRendered = f.maxDay + 3;
    }
  }

  return maxDayRendered;
};

var animate = function(chart) {
  cancelAnimation(chart);
  showLoadingSpinner(chart);
  $(`.animate-button[data-chart="${chart.self}"]`).html("&#x1f501; Restart");

  setTimeout(function() { doAnimate(chart) }, 0);
  gtag("event", "start-animation", {event_category: chart.self});
};

var _animation_timeout = null;
var doAnimate = function(chart, filter = 0) {
  let chart_frame = JSON.parse(JSON.stringify(chart));

  let filterFunction;
  let maxDayRendered = calculateMaxDayRendered(chart);
  if (chart.xaxis && chart.xaxis != "left") {
    filterFunction = function (d) { return (d.daysAgo > maxDayRendered - filter ); }
  } else {
    filterFunction = function (d) { return (d.dayCounter <= filter); }
  }

  for (let chartData of chart_frame.data) {
    chartData.data = _.filter(chartData.data, filterFunction);
  }
  doRender(chart_frame);

  if (filter <= maxDayRendered && (filter == 0 || _animation_timeout)) {
    _animation_timeout = setTimeout(function() { doAnimate(chart, filter + 1) }, 100);
  } else {
    _animation_timeout = null;
    $(`.animate-button[data-chart="${chart.self}"]`).html("&#9654; Animate");
  }
};



var doRender = function(chart) {
   if (chart.data.length == 0) {
     let message = "There is no data available to display for your selected options.";
     
     if (chart.highlight == "(None)" && chart.show == "highlight-only") {
      message = "You are asking for the impossible, I like the way you think! :)<br><br>" +
        `However, there is nothing to display when you select <b>(None)</b> as the highlight and then ask to show <b>"Highlight Only"</b>.`;
     }

    $("#" + chart.id).html(`<div class="text-center divoc-graph-loading"><div role="status" style="padding-top: 20px;">
      ${message}
    </div></div>`);
    return;
   }

  // Find data on all highlights
  var highlights = [ chart.highlight ];
  if (chart.extraHighlights) { highlights = highlights.concat( chart.extraHighlights ); }
  
  // Find primary highlight data
  data_y0 = chart.y0;
  gData = undefined;
  var f = _.find(chart.data, function (e) { return e.country == chart.highlight })
  if (f && (gData = f.data) && gData[0]) {
    if (gData[0].cases) { data_y0 = gData[0].cases; }
  }


  var maxDayRendered = calculateMaxDayRendered(chart);
  let alignRight = false, labelOffGrid = false;
  if (chart.xaxis && chart.xaxis != "left") {
    alignRight = true;
    labelOffGrid = true;
  }

  var margin = { top: 10, right: 20, bottom: 45, left: 60 };

  var cur_width = $("#sizer").width();
  _client_width = cur_width;

  var height = 500;
  var isSmall = false;
  if (cur_width < 500) {
    height = 300;
    isSmall = true;
    margin.left = 40;
  }

  if (alignRight) {
    margin.top += 10;
    height -= 10;
    margin.right = 10;
  }

  if (labelOffGrid) {
    let maxCountryLength = 0;
    for (let s of highlights) {
      maxCountryLength = Math.max(maxCountryLength, s.length);
    }
    if (isSmall && maxCountryLength > 12) { maxCountryLength = 12; }

    margin.right += Math.ceil(maxCountryLength * 9);
  }

  var width = cur_width - margin.right - margin.left;


  // Find percentage graph
  let isRatio = false;
  switch (chart.dataSelection) {
    case 'testPositivity':
    case 'mortalityRate':
      isRatio = true;
      break;
  }


  // X-axis scale (days)
  var daysScale = d3.scaleLinear();
  if (alignRight) {
    daysScale.domain([-maxDayRendered, 0])
      .range([0, width]);
  } else {
    daysScale.domain([0, maxDayRendered])
      .range([0, width]);
  }

  // Y-axis scale (# of cases)
  scale_y0 = chart.y0;
  if (chart.showDelta) {
    scale_y0 = 1;
  }

  var casesScale;
  if (chart.scale == "linear" || chart.forceLinear) { casesScale = d3.scaleLinear(); scale_y0 = 0; }
  else { casesScale = d3.scaleLog(); }

  scale_yMax = chart.yMax;
  if (isRatio) {
    scale_y0 = 0;
    scale_yMax = _.maxBy(chart.data, 'maxCases').maxCases;
    if (scale_yMax > 1) { scale_yMax = 1; }
  }

  if (chart.yAxisScale == "highlight") {
    var highlights_data = _.filter(chart.data, function (d) { return highlights.indexOf(d.country) != -1; });

    if (highlights_data.length > 0) {
      // Using gloabl `maxCases`:
      //var maxCases = _.maxBy(highlights_data, 'maxCases').maxCases;

      // Re-calculate
      var maxCases = -1;
      for (let d of highlights_data) {
        if (d.data.length > 0) {
          let dataInScope = [];
          if (alignRight) {
            dataInScope = _.filter(d.data, function (d) { return (d.daysAgo <= maxDayRendered) });
          } else {
            dataInScope = d.data;
          }
            
          let max = _.maxBy(dataInScope, 'cases').cases;
          if (max > maxCases) { maxCases = max; }
        }
      }

      scale_yMax = maxCases * 1.05;
    }
  }



  casesScale.domain([scale_y0, scale_yMax]).range([height, 0]);
  
  // Color Scale
  var colorScale = d3.scaleOrdinal(d3.schemeCategory10);
  for (let countryName of highlights) {
    colorScale(countryName);
  }

  // SVG
  $("#" + chart.id).html("");

  var svg = d3.select("#" + chart.id)
    .append("svg")
    .attr("version", 1.1)
    .attr("xmlns", "http://www.w3.org/2000/svg")    
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("width", width + margin.left + margin.right)
    .style("height", height + margin.top + margin.bottom);

  svg.append("style");
    
  svg = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Mouseovers
  var tip = d3.tip().attr('class', 'd3-tip').html(tip_html(chart));
  svg.call(tip);

  /*
  svg.append("text")
    .attr("x", -55)
    .attr("y", -20)
    .attr("class", "chart-header")
    .text(generateDataLabel(chart, true));
  */


  if (alignRight) {
    svg.append("rect")
      .attr("x", daysScale(-14))
      .attr("width", daysScale(0) - daysScale(-14))
      .attr("y", 0)
      .attr("height", height)
      .attr("fill", "#fffffa");

    // 
    let dateLines = [];
    for (let relDate = new Date("2020-02-01 00:00:00");
        relDate < _dateObj_today;
        relDate = new Date(relDate.setMonth(relDate.getMonth()+1)))
    {
      let daysAgo = (_dateObj_today_time - relDate.getTime()) / (1000 * 3600 * 24);
      if (daysAgo > maxDayRendered) { continue; }

      dateLines.push({
        daysAgo: daysAgo,
        dateLabel: relDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        lineWidth: 1
      });
    }

    dateLines.push({
      daysAgo: 0,
      dateLabel: _dateObj_today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      lineWidth: 3
    });

    for (let dateLine of dateLines) {
      var showLabel = true;
      if (dateLine.daysAgo > 0 && dateLine.daysAgo <= 10) {
        showLabel = false;
      }

      svg.append("line")
        .attr("x1", daysScale(-dateLine.daysAgo))
        .attr("x2", daysScale(-dateLine.daysAgo))
        .attr("y1", (showLabel)?-12:0)
        .attr("y2", height)
        .attr("stroke", "#bbb")
        .attr("stroke-width", dateLine.lineWidth);

      if (showLabel) {
        svg.append("text")
          .attr("x", daysScale(-dateLine.daysAgo) - 4)
          .attr("y", -2)
          .attr("class", "text-credits")
          .attr("text-anchor", "end")
          .text(dateLine.dateLabel);
      }
    }
  }


  // Axes
  let xTickValues = [0];
  let xTickValue_ct = 0;
  while (xTickValue_ct <= maxDayRendered) {
    if (alignRight) { xTickValues.push(-xTickValue_ct); }
    else { xTickValues.push(xTickValue_ct); }

    xTickValue_ct += 7;
  }

  var x_axis = d3.axisBottom(daysScale);
  x_axis.tickValues(xTickValues);
  svg.append('g')
     .attr("transform", "translate(0, " + height + ")")
     .attr("class", "axis")
     .call(x_axis); 
  
  var x_grid = d3.axisBottom(daysScale).tickSize(-height).tickFormat("").tickValues(xTickValues);
  svg.append('g')
     .attr("transform", "translate(0, " + height + ")")
     .attr("class", "grid")
     .call(x_grid);

  // Have tickValues at 1, 5, 10, 50, 100, ...
  var tickValue = 1;
  var tickValueIncrease = 5; 
  var tickValues = [];
  while (tickValue <= 1e6) {
    if (tickValue >= scale_y0 && tickValue <= scale_yMax) { tickValues.push(tickValue); }
    tickValue *= tickValueIncrease;

    if (tickValueIncrease == 5) { tickValueIncrease = 2; }
    else { tickValueIncrease = 5; }
  }


  let y_axis_tickFormat;
  if (isRatio) {
    if (scale_yMax <= 0.07) {
      y_axis_tickFormat = d3.format(".1%");
    } else {
      y_axis_tickFormat = d3.format(".0%");
    }
    
  } else if (!isSmall) {
    y_axis_tickFormat = d3.format("0,");
  } else {
    y_axis_tickFormat = function (val) {
      var oom = Math.log10(val);

      let suffix = "";
      let factor = 1;
      
      if (oom < 3) { return val; }
      else if (oom < 6) { factor = 1e3; suffix = "k"; }
      else if (oom < 9) { factor = 1e6; suffix = "m"; }

      if (val % factor < factor / 10) { return (val / factor).toFixed(0) + suffix; }
      else { return (val / factor).toFixed(1) + suffix; }      
    }
  }
  

  var y_axis = d3.axisLeft(casesScale).tickFormat(y_axis_tickFormat);

  if (chart.scale == "log" && scale_yMax / scale_y0 > 100 && !chart.forceLinear) {
    y_axis.tickValues(tickValues);
  }
  
  svg.append('g')
    .attr("class", "axis")
    .call(y_axis);  

  var y_grid = d3.axisLeft(casesScale).tickSize(-width).tickFormat("");
  svg.append('g')
     .attr("class", "grid")
     .call(y_grid);
     

  // == Trendlines ==
  let scaleLinesMeta = [];
  if ( (chart.trendline == "default" && chart.dataSelection != "hospitalized" && chart.dataSelection != "tests") || chart.trendline == "35" || chart.trendline == "all") {
    scaleLinesMeta.push({ is35pct: true, dStart: 0, dasharray: 12, label: "1.35x daily", sLabel: "35%", gRate: 1.35, dEnd: maxDayRendered + 3 });    
  } 

  var xTop_visualOffset = -5;

  // Disable trendlines on right-align
  if (alignRight || isRatio) { scaleLinesMeta = []; }

  for (var scaleLineMeta of scaleLinesMeta) {
    var cases = data_y0, day = 0, y_atMax = -1, y_atStart = -1;
    if (scaleLineMeta.y0) {
      cases = scaleLineMeta.y0;
    }
    if (cases < 1) { cases = 1; }

    var pctLine = [];
    while (day <= scaleLineMeta.dEnd && cases <= chart.yMax * scaleLineMeta.gRate && cases >= 1) {
      if (day >= scaleLineMeta.dStart) {
        pctLine.push({
          dayCounter: day,
          cases: cases
        })

        if (y_atStart == -1) { y_atStart = cases; }
      }

      day++;
      cases *= scaleLineMeta.gRate;
    }
    y_atMax = cases;
  
    svg.datum(pctLine)
      .append("path")
      .attr("fill", "none")
      .attr("stroke", function() {
        if (scaleLineMeta.color) { return scaleLineMeta.color; }
        else { return "black"; }
      })
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", scaleLineMeta.dasharray)
      .attr("d", d3.line()
        .x(function (d) { return daysScale(d.dayCounter); })
        .y(function (d) { return casesScale(d.cases); })
      );
  
    svg.append("text")
      .attr("class", "label-country")
      .attr("x", function() {
        if (y_atMax > scale_yMax) { // extends off the top
          return daysScale(
            Math.log( scale_yMax / y_atStart )  / Math.log( scaleLineMeta.gRate ) + scaleLineMeta.dStart
          );
        } else if (y_atMax < scale_y0) { // extends off bottom
          return daysScale(
            Math.log( 1 / y_atStart ) / Math.log( scaleLineMeta.gRate ) + scaleLineMeta.dStart
          );
        } else { // extends off right
          return daysScale(scaleLineMeta.dEnd);
        }
      })
      .attr("y", function () {
        if (y_atMax > scale_yMax) { // extends off the top 
          if (!scaleLineMeta.is35pct) { xTop_visualOffset += 10; return xTop_visualOffset; }
          else { if (isSmall) { return -2; } return 5; }
          
        } else if (y_atMax < scale_y0) { // extends off bottom 
          return height;
        } else { // extends off right
          return casesScale(y_atMax);
        }
      })
      .attr("text-anchor", "end")
      .style("font-size", (isSmall)?"8px":"10px")
      .attr("fill", function() {
        if (scaleLineMeta.color) { return scaleLineMeta.color; }
        else { return "black"; }
      })
      .text(function() {
        return scaleLineMeta.label;
      })
  }
  

  // == X-Axis Label ==
  var xAxisLabel = `Days since ${chart.y0} `
  if (chart.dataSelection == 'cases') { xAxisLabel += "case"; if (chart.y0 != 1) { xAxisLabel += "s"; }}
  else if (chart.dataSelection == 'active') { xAxisLabel += "active case"; if (chart.y0 != 1) { xAxisLabel += "s"; }}
  else if (chart.dataSelection == 'deaths' || chart.dataSelection == 'mortalityRate') { xAxisLabel += "death"; if (chart.y0 != 1) { xAxisLabel += "s"; } }
  else if (chart.dataSelection == 'testPositivity') { xAxisLabel += "test"; if (chart.y0 != 1) { xAxisLabel += "s"; } }
  else if (chart.dataSelection == 'recovered') { xAxisLabel += "recover"; if (chart.y0 != 1) { xAxisLabel += "ies"; } else { xAxisLabel += "y"; }}
  if (chart.normalizePopulation && !chart.isRatio) { xAxisLabel += "/1m people"; }

  if (chart.dataSelection == 'tests') { xAxisLabel = "Days since Apr. 12"; }
  else if (chart.dataSelection == 'hospitalized') { xAxisLabel = "Days since Apr. 12"; }

  if (alignRight) {
    xAxisLabel = "Number of days ago";
  }

  svg.append("text")
     .attr("x", width - 5)
     .attr("y", height - 5)
     .attr("class", "axis-title")
     .attr("text-anchor", "end")
     .text(xAxisLabel);


  var yAxisLabel = "";
  if (chart.showDelta) { yAxisLabel += "New Daily "; }
  if (chart.dataSelection == 'cases') { yAxisLabel += "Confirmed Cases"; }
  else if (chart.dataSelection == 'active') { yAxisLabel += "Active Cases"; }
  else if (chart.dataSelection == 'deaths') { yAxisLabel += "COVID-19 Deaths"; }
  else if (chart.dataSelection == 'recovered') { yAxisLabel += "Recoveries" }
  else if (chart.dataSelection == 'tests') { yAxisLabel += "COVID-19 Tests" }
  else if (chart.dataSelection == 'hospitalized') { yAxisLabel += "Hospitalizations of COVID-19" }
  else if (chart.dataSelection == 'testPositivity') { yAxisLabel += "Test Positivity Rate" }
  else if (chart.dataSelection == 'mortalityRate') { yAxisLabel += "Mortality Rate" }
  if (chart.normalizePopulation && !chart.isRatio) {
    yAxisLabel += "/1m people";
  }

  svg.append("text")
     .attr("transform", "rotate(-90)")
     .attr("x", -2)
     .attr("y", 15)
     .attr("class", "axis-title")
     .attr("text-anchor", "end")
     .text(yAxisLabel);

  if (chart.avgData) {
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -2)
      .attr("y", 28)
      .attr("class", "axis-title")
      .attr("text-anchor", "end")
      .style("font-size", "12px")
      .style("fill", "#888")
      .text(`(${chart.avgData}-day Average)`);
  }



  svg.append("text")
    .attr("x", width)
    .attr("y", height + 32)
    .attr("class", "text-credits")
    .attr("text-anchor", "end")
    .text(`Data: Johns Hopkins CSSE; Updated: ${_dateUpdated}`);


  svg.append("a")
    .attr("href", "http://waf.cs.illinois.edu/")
    .append("text")
    .attr("x", width)
    .attr("y", height + 32 + 10)
    .attr("class", "axis-title")
    .attr("text-anchor", "end")
    .style("font-size", "8px")
    .style("fill", "#aaa")
    .text(`Interactive Visualization: https://91-DIVOC.com/ by @profwade_`);


  chart.data.sort(function (d1, d2) {
    var highlight_d1 = ( highlights.indexOf(d1.country) != -1 );
    var highlight_d2 = ( highlights.indexOf(d2.country) != -1 );

    if      ( highlight_d1 && !highlight_d2) { return 1; }
    else if (!highlight_d1 &&  highlight_d2) { return -1; }
    else { return 0; }
  });

  var renderLineChartLabels = function (svg, i) {
    var countryData = chart.data[i];
    if (!countryData.data[0]) { return; }
    var isHighlighted = (highlights.indexOf(countryData.country) != -1);
    var maxDay = countryData.maxDay;

    var countryText = svg.append("text")
      .attr("fill", function (d) { return colorScale(countryData.data[0].country); })
      .attr("class", "label-country C-" + textToClass(countryData.data[0].country))
      .classed("C_highlight", isHighlighted)
      .style("opacity", function () {
        if (isHighlighted) { return 1; }
        else { return 0.3; }
      })
      .style("font-size", function () {
        if (isHighlighted) { return "15px"; }
        else { return null; }
      })
      .text(countryData.country);

    var textHeightAdjustment = 0;
    if (isSmall && isHighlighted && daysScale(countryData.maxDay) > (width * 3)/4 ) { textHeightAdjustment = -10; }

    if (textHeightAdjustment) {
      countryText.attr("text-anchor", "middle")
    }

    let lastDataPoint = countryData.data[countryData.data.length - 1];
    if (labelOffGrid) {
      countryText
        .attr("x", function() {
          return width + 5;
        })
        .attr("y", function () {
          if (lastDataPoint.cases < scale_y0) { return height + 5; }
          return casesScale( lastDataPoint.cases );
        })
        .attr("alignment-baseline", "middle")
        .attr("dominant-baseline", "middle")
        .attr("text-anchor", "start")
    } else if (alignRight) {
      countryText
        .attr("x", function() {
          return daysScale( -lastDataPoint.daysAgo );
        })
        .attr("y", function () {
          if (lastDataPoint.cases < scale_y0) { return height + 5; }
          return casesScale( lastDataPoint.cases ) - 10;
        })
        .attr("alignment-baseline", "middle")
        .attr("dominant-baseline", "middle")
        .attr("text-anchor", "end")
    } else if (countryData.maxDay + 2 < maxDayRendered || !countryData.data[maxDayRendered - 1]) { 
      countryText
        .attr("x", 5 + daysScale(lastDataPoint.dayCounter) + textHeightAdjustment )
        .attr("y", function () {
          if (lastDataPoint.cases < scale_y0) { return height + 5; }
          return casesScale( lastDataPoint.cases ) + textHeightAdjustment;
        })
        .attr("alignment-baseline", "middle")
        .attr("dominant-baseline", "middle")
    } else {
      countryText
        .attr("x", daysScale(maxDayRendered) - 5 + textHeightAdjustment )
        .attr("y", function () {
          
          if (lastDataPoint.cases < scale_y0) { return height + 5; }
          return casesScale(lastDataPoint.cases) - 5 + textHeightAdjustment;
        })
        .attr("text-anchor", "end")
    }
  };

  var minHighlightHeight = 99999; 

  var renderLineChart = function(svg, i) {
    var countryData = chart.data[i];
    if (!countryData.data[0]) { return; }

    var isHighlighted = (highlights.indexOf(countryData.country) != -1);
    var maxDay = countryData.maxDay;

    svg.datum(countryData.data)
      .append("path")
      .attr("fill", "none")
      .attr("class", function (d) { return "C-" + textToClass(d[0].country); })
      .attr("stroke", function (d) { return colorScale(d[0].country); } )
      .attr("stroke-width", function (d) {
        if (isHighlighted) { return 4; }
        else { return 1; }
      })
      .style("opacity", function (d) {
        if (isHighlighted) { return 1; }
        else { return (isSmall) ? 0.15 : 0.3; }
      })      
      .attr("d", d3.line()
        .x(function (d) {
          if (alignRight) {
            return daysScale( -d.daysAgo );
          }
          return daysScale(d.dayCounter);
        })
        .y(function (d) { return casesScale(d.cases); })
        .defined(function (d, i, a) {
          return (d.cases >= scale_y0);
        })
      );

    svg.selectAll("countries")
      .data(countryData.data)
      .enter()
      .append("circle")
      .attr("cx", function (d) {
        if (alignRight) {
          return daysScale( -d.daysAgo );
        }
        return daysScale(d.dayCounter);
      })
      .attr("cy", function (d) {
        if (d.cases < scale_y0) { return height + 5; }
        return casesScale(d.cases);
      })
      .style("opacity", function (d) {
        if (isHighlighted) { return 1; }
        else { return (isSmall) ? 0.15 : 0.3; }
      })
      .attr("r", function (d) {
        if (isHighlighted) { return 4; }
        else { return 3; }
      })
      .style("display", function (d) {
        if (d.cases < scale_y0 && !isHighlighted) { return "none"; }
        
        if (isHighlighted) {
          let v = casesScale(d.cases);
          if (v < minHighlightHeight) { minHighlightHeight = v; }
        }
        return null;
      })
      .attr("class", function (d) { return "C-" + textToClass(d.country); })
      .attr("fill", function (d) { return colorScale(d.country); })
      .on('mouseover', function (d, i) {
        tip.show(d, i);

        let cssClass = ".C-" + textToClass(d.country);
        svg.selectAll(cssClass)
          .classed('svg-hover-highlight', true);

      })
      .on('mouseout', function (d, i) {
        tip.hide(d, i);

        let cssClass = ".C-" + textToClass(d.country);
        svg.selectAll(cssClass)
          .classed('svg-hover-highlight', false);
      })
      .on('click', function (d) {
        if (d3.event.shiftKey) {
          const chart = getChart(this);

          if (!chart.extraHighlights) { chart.extraHighlights = []; }
          if (chart.highlight != d.country && chart.extraHighlights.indexOf(d.country) == -1) {
            chart.extraHighlights.push(d.country);
            additionalHighlight_rerender(chart);
            tip.hide();
            render(chart);
          }
        }
      });
  };

  // Draw labels below circles/lines
  for (var i = 0; i < chart.data.length; i++) {
    renderLineChartLabels(svg, i);
  }

  // Draw circles last so they're on top for mouseovers
  for (var i = 0; i < chart.data.length; i++) {
    renderLineChart(svg, i);
  }

  if (!f && chart.highlight != "(None)") {
    var desc = `${chart.y0} `
    if (chart.dataSelection == 'cases') { desc += "case"; if (chart.y0 != 1) { desc += "s"; }}
    else if (chart.dataSelection == 'active') { desc += "active case"; if (chart.y0 != 1) { desc += "s"; }}
    else if (chart.dataSelection == 'deaths' || chart.dataSelection == 'mortalityRate') { desc += "death"; if (chart.y0 != 1) { desc += "s"; } }
    else if (chart.dataSelection == 'recovered') { desc += "recover"; if (chart.y0 != 1) { desc += "ies"; } else { desc += "y"; }}
    else if (chart.dataSelection == 'testPositivity') { desc += "test"; if (chart.y0 != 1) { desc += "s"; }}
    else if (chart.dataSelection == 'hospitalized') { desc += "hospitalization"; if (chart.y0 != 1) { desc += "s"; }}
    if (chart.normalizePopulation && !chart.isRatio) { desc += "/1m people"; }

    $("#" + chart.id).append(
      `<div class="alert alert-secondary" style="margin-top: 10px; margin-bottom: 0px; text-align: center; font-size: 12px;">
      <b>Note:</b> ${chart.highlight} has not reached ${desc}. No data is available to highlight.
      </div>`);
  }

  if (minHighlightHeight > (0.67 * height) && !_animation_timeout && chart.highlight != "(None)" && minHighlightHeight < 99999) {
    $("#" + chart.id).append(`<div class="alert alert-info" style="margin-top: 10px; margin-bottom: 0px; text-align: center; font-size: 12px;">Note: All of your highlighted data is in the bottom third of the graph. <a href="#" onclick="scaleToHighlight(event)">You can get a zoomed-in view of the graph by setting <b>Y-Axis</b> to <b>"Scale to Highlight"</b>.</a></div>`);
  }

  if (!_animation_timeout) {
    gtag("event", "render", {event_category: chart.self});
  }
};
