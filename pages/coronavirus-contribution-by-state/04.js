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
      for (let chartid in charts) {
        render( charts[chartid] );
      }
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
  if (state == "United States" || state == "Puerto Rico" || state.substring(0, 3) == "US-") { return result; }

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



// find default state value
var stored;

var defaultState = "(None)";
var defaultCountry = "United States";


// chart metadata
var charts = {
  'countries': {
    self: 'countries',
    reducer: reducer_byCountry,
    scale: "linear",
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
    xaxis: "right",

    subdata_reducer: reducer_byUSstate,
    defaultSubHighlight: defaultState,
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
    scale: "linear",

    dataSelection_y0: { 'active': 20, 'cases': 20, 'deaths': 5, 'recovered': 20, 'hospitalized': 1, 'tests': 1, 'testPositivity': 10, 'mortalityRate': 5},
    yAxisScale: 'fixed',

    xMax: null, yMax: null, data: null,
    trendline: "default",
    dataRawSelection: "cases-daily-7",
    xaxis: "right",
    region: "census"
  },

  'countries-normalized': {
    self: 'countries-normalized',
    reducer: reducer_byCountry,
    scale: "linear",
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
    dataRawSelection: "cases-daily-7",
    xaxis: "right",

    subdata_reducer: reducer_byUSstate,
    defaultSubHighlight: defaultState,
    subDataNormalizePopulation: "country",
  },
  'states-normalized': {
    self: 'states-normalized',
    reducer: reducer_byUSstate,
    scale: "linear",
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
    dataRawSelection: "cases-daily-7",
    xaxis: "right",
  },
};


var findNextExp = function(x) {
  return x * 1.3;
};

var transformToTrailingAverage2_ratio = function (data, period) {
  var largest = -1;
  var sum = 0, ct = 0;

  for (var i = 0; i < data.length; i++) {
    // Current Change
    let dsum = data[i].n;
    let dct = data[i].d;
    if (i > 0) {
      dsum -= data[i - 1].n;
      dct -= data[i - 1].d;
    }

    if (dsum >= 0 && dct >= 0) {
      sum += dsum;
      ct += dct;
    }

    // Trailing Change
    var j = i - period;
    if (j >= 0) {
      dsum = data[j].n;
      dct = data[j].d;
      if (j > 0) {
        dsum -= data[j - 1].n;
        dct -= data[j - 1].d;
      }

      if (dsum >= 0 && dct >= 0) {
        sum -= dsum;
        ct -= dct;
      }
    }

    avg = sum / ct;
    if (avg > largest) { largest = avg; }
    data[i].cases = avg;
    data[i].sum_n = sum;
    data[i].sum_d = ct;
  }

  return largest;
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
    if ('n' in countryData.data[0]) {
      countryData.maxCases = transformToTrailingAverage2_ratio(countryData.data, period);
    } else {
      countryData.maxCases = transformToTrailingAverage2(countryData.data, period);
    }
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

  if (!chart.subdata && chart.extraHighlights && chart.subdata_reducer) {
    process_data(_rawData, chart, true, true);
  }

  if (chart.subdata && chart.extraHighlights) {
    let highlightedSubdata = _.filter(chart.subdata, function (d) {
      return chart.extraHighlights.indexOf(d.country) != -1;
    });
    caseData = caseData.concat(highlightedSubdata);
  }

  let retain = [], retain_f = null, exclude = [];
  switch (chart.show) {
    case "highlight-only":
      retain = highlights;
      break;
    
    case "northeast":
      retain = _regions["census"]["Northeast"];
      break;

    case "midwest":
      retain = _regions["census"]["Midwest"];
      break;

    case "south":
      retain = _regions["census"]["South"];
      break;

    case "west":
      retain = _regions["census"]["West"];
      break;

    case "!northeast":
      exclude = _regions["census"]["Northeast"];
      break;

    case "!midwest":
      exclude = _regions["census"]["Midwest"];
      break;

    case "!south":
      exclude = _regions["census"]["South"];
      break;

    case "!west":
      exclude = _regions["census"]["West"];
      break;

    case "pop-small":
      retain_f = function(d) { return (d.pop <= 5e6) || (highlights.indexOf(d.country) != -1); }
      break;

    case "pop-large":
      retain_f = function(d) { return (d.pop > 5e6) || (highlights.indexOf(d.country) != -1); }
      break;

    case "us-states":
      exclude = ["US-exclude-NY/NJ/CT", "US-West", "US-Northeast", "US-Midwest", "US-South", "United States", "Puerto Rico", "Northern Mariana Islands", "Guam", "Virgin Islands"];
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

    if (chart.self == "states" || chart.self == "states-normalized") {
      exclude = ["US-West", "US-Northeast", "US-Midwest", "US-South", "United States", "US-exclude-NY/NJ/CT"];
      caseData = _.filter(caseData, function(d) {
        return (exclude.indexOf(d.country) == -1) || (highlights.indexOf(d.country) != -1);
      });
    } else {
      exclude = ["Global"];
      caseData = _.filter(caseData, function(d) {
        return (exclude.indexOf(d.country) == -1) || (highlights.indexOf(d.country) != -1);
      });
    }

    highlight_data = _.filter(caseData, function(d) { return highlights.indexOf(d.country) != -1; });

    caseData = _.sortBy(caseData, function (d) { return -d.data[ d.data.length - 1 ].cases; });
    if (numShow > 0) { caseData = _.take(caseData, numShow); }
    else { caseData = _.takeRight(caseData, -numShow); }
    for (var hd of highlight_data) {
      if ( !_.find(caseData, function (d) { return d.country == hd.country } ) ) {
        caseData.push(hd);
      }
    }
  }

  /*
  var $highlight = $("#highlight-" + chart.id);
  if ($highlight.html().length < 100) { 
    $highlight.html(getHTMLCountryOptionsToSelect(allCountries, chart.highlight));
  }
  */

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

var calculateDaysAgo = function(date) {
  let dateParts = date.split("-");
  let dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
  let daysAgo = (_dateObj_today_time - dateObj.getTime()) / (1000 * 3600 * 24);
  // TODO: 
  return Math.ceil(daysAgo);
};

var process_data = function(data, chart, isSubdata = false, noPrepData = false) {
  var agg;
 
  if (!isSubdata) { agg = _.reduce(data, chart.reducer, {}); }
  else            { agg = _.reduce(data, chart.subdata_reducer, {}); }
  
  let y0_threshold = chart.y0;
  if (chart.isRatio) { y0_threshold = 0; }

  var caseData = [];
  var maxDayCounter = 0;

  let popData;
  if (isSubdata) {
    popData = _popData["state"];
  } else if (chart.normalizePopulation) {
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
    /*
    if (!popSize && location.hostname === "localhost") {
      console.log("Missing " + chart.normalizePopulation + ": " + country);
    }
    */

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
      let dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
      let daysAgo = (_dateObj_today_time - dateObj.getTime()) / (1000 * 3600 * 24);
      // TODO: 
      daysAgo = Math.ceil(daysAgo);

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

          //if (cases < 0) { cases = 0; }
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
        maxDayCounter = dayCounter;
      }
    }
  }

  caseData = _.sortBy(caseData, function (d) {
    return -d.lastDayCases;
  });

  if (!isSubdata) {
    chart.fullData = caseData;
    chart.xMax = maxDayCounter;
  } else {
    caseData = _.filter(caseData, function (d) { return d.country != "United States"; } )
    chart.subdata = caseData;
  }

  if (!isSubdata && chart.subdata) { process_data(data, chart, true, true); }
  if (!noPrepData) { prep_data(chart); }
};


const urlParams = new URLSearchParams(window.location.search);
let _data_src = urlParams.get("data-source");
if (!_data_src) { _data_src = "jhu"; }




var _data_sources = {
  // Johns Hopkins:
  "jhu": {
    url: "../jhu.csv?d=" + _reqStr,
    f: function (row) {
      row["Active"] = +row["Active"];
      row["Confirmed"] = +row["Confirmed"];
      row["Recovered"] = +row["Recovered"];
      row["Deaths"] = +row["Deaths"];
      row["People_Tested"] = +row["People_Tested"];
      row["People_Hospitalized"] = +row["People_Hospitalized"];

      if (row["Country_Region"] == "Georgia") { row["Country_Region"] = "Georgia (EU)"; }
      return row;
    },
  },

  // COVID Tracking Project
  "ctp": {
    url: "../ctp.csv?d=" + _reqStr,
    f: function (row) {
      row["Country_Region"] = "United States";
      row["Active"] = +row["Active"];
      row["Confirmed"] = +row["Confirmed"];
      row["Recovered"] = +row["Recovered"];
      row["Deaths"] = +row["Deaths"];
      row["People_Tested"] = +row["People_Tested"];
      row["People_Hospitalized"] = +row["People_Hospitalized"];
      return row;
    }
  },

  // Wikipedia Population
  "wikipedia-pop": {
    url: "wikipedia-population.csv",
    f: function (row) {
      row["Population"] = (+row["Population"]);
      return row;    
    }
  }
};



var _dataReady = false, _pageReady = false, _chartIdFirst;


var tryRender = function () {
  if (_dataReady && _pageReady) {
    if (_intial_load) { process_ui_state(); process_query_string(); }
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

var getDataPromise = function(dataSource) {
  let src = _data_sources[dataSource];
  return d3.csv(src.url, src.f);
};

var doInitialDataLoad = function() {
  let dataPromiseSource = [];
  if (_data_src == "ctp") {
    dataPromiseSource.push( getDataPromise("ctp") );
  } else {
    dataPromiseSource.push( getDataPromise("jhu") );
  }
  dataPromiseSource.push( getDataPromise("wikipedia-pop") );
  
  Promise.all(dataPromiseSource)
    .then(function(result) {
      data = result[0];
      populationData = result[1];
  
      let dateParts = data[data.length - 1].Date.split("-");
      _dateObj_today = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
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
};
doInitialDataLoad();




var updateAdditionalHighlight = function(e, isSubdata=false) {
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
  saveAs(hrefData, "91-DIVOC-04.svg");

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
      saveAs(blob, "91-DIVOC-04.png");
    });
  }

  img.src = hrefData;
  gtag("event", "saveAs-PNG", {event_category: chart.self});
};

var _update_graph = function(chart, value, attr, selector) {
  let chartSelector = "";
  if (!chart) {
    for (let chartid in charts) {
      _update_graph(charts[chartid], value, attr, selector);
    }
    return;
  }

  chart[attr] = value;
  chartSelector = `[data-chart="${chart.self}"]`;

  // UI Update:
  if (attr == "scale") {
    $(`.${selector}${chartSelector}[data-scale="${value}"]`).click();
  } else if (attr == "extraHighlights") {
    value = value.split(",");
    chart[attr] = value;
  } else {
    let el = $(`section${chartSelector} .${selector} option[value="${value}"]`);
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
    additionalHighlight_rerender(chart);
  }
}

var process_query_string = function() {
  const urlParams = new URLSearchParams(window.location.search);

  _qs_update_graph(null, urlParams, "data-source", null, "datasrc-select");
  _qs_update_graph(null, urlParams, "xaxis", "xaxis", "xaxis-select");
  _qs_update_graph(null, urlParams, "display", "display", "display-select");
  _qs_update_graph(null, urlParams, "region", "region", "region-select");
  _qs_update_graph(null, urlParams, "show", "show", "filter-select");
  _qs_update_graph(null, urlParams, "data", "dataSelection", "data-select");

  //updateQueryString(chart);
};

var _process_ui_state = function(chart, attr, selector) {
  let sectionSelector = `section[data-chart="${chart.self}"]`;
  let value;

  if (attr == "scale") {
    value = $(`${sectionSelector} .${selector}.active`).data("scale");
  } else if (attr == "extraHighlights") {
    // Not displayed on Chrome/Firefox so no need to process 
    // value = $(`${sectionSelector} .${selector} :selected`).map( function() { return $(this).val(); } );
  } else {
    value = $(`${sectionSelector} .${selector} :selected`).val();
  }

  if (value) {

    if (attr == "dataSelection") {
      updateDataSelectionOptions(chart, value);
    } else {
      chart[attr] = value;
    }
  }
};

var process_ui_state = function() {
  for (let chartid in charts) {
    let chart = charts[chartid];

    _process_ui_state(chart, "xaxis", "xaxis-select");
    _process_ui_state(chart, "display", "display-select");
    _process_ui_state(chart, "region", "region-select");
    _process_ui_state(chart, "show", "filter-select");
    _process_ui_state(chart, "dataSelection", "data-select");
    //_process_ui_state(chart, "extraHighlights", "extra-highlights");
  }
};


var generateUrl = function(chart) {
  var dataattr = chart.id.substring( chart.id.indexOf("-") + 1 );
  var options = {
    chart: dataattr,
    show: chart.show,
    xaxis: chart.xaxis,
    display: chart.display,
    region: chart.region,
    data: (chart.dataRawSelection) ? chart.dataRawSelection : chart.dataSelection,
    'data-source': _data_src
  }

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
    let isSubdata = false;
    let selectedOptionData = _.find(chart.fullData, function (d) { return d.country == selectedOption; } );
    if (!selectedOptionData) {
      if (!chart.subdata && chart.subdata_reducer) {
        process_data(_rawData, chart, true, true);
      }

      if (chart.subdata) {
        selectedOptionData = _.find(chart.subdata, function (d) { return d.country == selectedOption; } );
        if (selectedOptionData) {
          isSubdata = true;
        }
      }
    }

    ui_add_highlight(chart, chart.self, _additionalHighlight_index, selectedOption, isSubdata);
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
  let chartId = el.data("chart");
  let chart = charts[chartId];

  let child = e.target.parentElement.parentElement.parentElement;
  var indexToRemove = Array.prototype.indexOf.call(child.parentElement.children, child) / 2;

  chart.extraHighlights.splice(indexToRemove, 1);
  additionalHighlight_rerender(chart);

  prep_data(chart);
  render(chart);
  updateQueryString(chart);

  e.preventDefault();
  return false;
}

var ui_add_highlight = function(chart, chartId, index, selectedOption=null, isSubdata=false) {
  var el_add = $(`.extra-highlights[data-chart="${chartId}"]`);
  var allCountries = _.map((!isSubdata)?chart.fullData:chart.subdata, 'country').sort();
  if (!selectedOption) { selectedOption = (!isSubdata)?chart.defaultHighlight:chart.defaultSubHighlight; }

  let additionalText = "Additional Highlight";
  if (isSubdata) { additionalText = "Additional State"; }

  var html =
    `<div class="btn-group btn-group-toggle" data-toggle="buttons" style="padding-bottom: 3px;">
        <div class="input-group-prepend">
          <span class="input-group-text">[<a href="#" data-index="${index}" data-chart="${chartId}" onclick="additionalHighlightRemove(event)">X</a>] ${additionalText}:</span>
        </div>
        <select class="form-control additional-highlight-select" onchange="updateAdditionalHighlight(event, ${isSubdata})" data-chart="${chartId}">
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

      if (!_intial_load) { render(chart); }
    }

    updateQueryString(chart);
    e.preventDefault();
    gtag("event", "change-scale", {event_category: chartId, event_label: chart.scale});
    return false;
  });


  $(".display-select").change(function (e) {
    const chart = getChart(e.target);
    chart.display = $(e.target).val();
    render(chart);
    updateQueryString(chart);
    gtag("event", "change-view", {event_category: chart.self, event_label: chart.display});
  });

  $(".region-select").change(function (e) {
    const chart = getChart(e.target);
    chart.region = $(e.target).val();
    render(chart);
    updateQueryString(chart);
    gtag("event", "change-region", {event_category: chart.self, event_label: chart.region});
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

    process_data_and_render(chart);
    updateQueryString(chart);
    gtag("event", "change-data", {event_category: chartId, event_label: value});
  });

  $(".add-highlight").click(function (e) {
    e.preventDefault();

    var chartId = $(e.target).data("chart");
    var chart = charts[chartId];

    let isSubdata = false;
    if ($(e.target).data("subdata")) {
      isSubdata = true;
      if (!chart.subdata) { process_data(_rawData, chart, true); }
    }

    ui_add_highlight(chart, chartId, _additionalHighlight_index, null, isSubdata);
    _additionalHighlight_index++;

    if (!chart.extraHighlights) { chart.extraHighlights = []; }
    if (isSubdata) { chart.extraHighlights.push(chart.defaultSubHighlight); }
    else           { chart.extraHighlights.push(chart.defaultHighlight); }
    

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

  $(".animate-button").click(function (e) {
    var chartId = $(e.target).data("chart");
    var chart = charts[chartId];
    animate(chart);
  });

  $(".datasrc-select").change(function (e) {
    var value = $(e.target).val();
    if (value != _data_src) {
      _data_src = value;
      showLoadingSpinner();
      doInitialDataLoad();
      gtag("event", "change-data", {event_category: 'all', event_label: value});
    }
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

    if (chart.id.indexOf("state") != -1) { dataLabel += " by US States"; }
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
  return function(d, i, cData) {
    const isSmall = (_client_width < 500);
    let country = cData.state;
    let cases = cData.value;
    let daysAgo = cData.daysAgo;

    var s2 = "";
    if (chart.normalizePopulation && !chart.isRatio) { s2 = " per 1,000,000 people"; }

    var dataLabel = generateDataLabel(chart);
    var dataLabel_cutoff = dataLabel;
    
    if (chart.dataSelection == 'testPositivity') { dataLabel_cutoff = "tests"; }
    else if (chart.dataSelection == 'mortalityRate') { dataLabel_cutoff = "deaths from COVID-19"; }  

    let daysSince = `(`;
    daysSince += `<b>${daysAgo}</b> day${(daysAgo != 1)?"s":""} ago)`;

    let dateParts = cData.date.split("-");
    let date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));

    let dateStr = "";
    if (date instanceof Date) {
      dateStr = `${ date.toLocaleDateString('en-US', { weekday: 'long'}) }, `;
    }

    var s;
    s = `<div class="tip-country">${country} &ndash; ${daysAgo} day${(daysAgo != 1)?"s":""} ago</div>`;

    let numberStr = (cases).toLocaleString("en-US", {maximumFractionDigits: 0})

    if (d.rawcases) { s += "<i>"; }
    s += `<div class="tip-details" style="border-bottom: solid 1px black; padding-bottom: 2px;"><b>${numberStr}</b> ${dataLabel}${s2} on ${dateStr}${cData.date} ${daysSince}</div>`;
    if (d.rawcases) { s += "</i>"; }

    let pctCases = ((cases / cData.caseSum) * 100).toLocaleString("en-US", {maximumFractionDigits: 2}) + "%";

    s += `<div class="tip-details">`;
    s += `<b>${pctCases}%</b> of all ${dataLabel} in the United States on ${cData.date}`;
    s += `</div>`;
      
    gtag("event", "mouseover", {event_category: chart.self, event_label: d.country, value: d.dayCounter});
    return s;
  }
};

var textToClass = function (s) {
  return s.replace(/[\W_]+/g,"-");
};

var showLoadingSpinner = function(chart, message = "") {
  if (chart) {
    $("#" + chart.id).html(`<div class="text-center divoc-graph-loading">
      <div class="spinner-border text-primary" role="status"><span class="sr-only">Loading...</span> </div>
      <div>${message}</div>
    </div>`);
  } else {
    for (let c in charts) { showLoadingSpinner(charts[c]); }
  }
}

var cancelAnimation = function(chart) {
  if (_animation_timeout) {
    clearTimeout(_animation_timeout);
    _animation_timeout = null;

    $(`.animate-button[data-chart="${chart.self}"]`).html("&#9654; Animate");
  }
}

var process_data_and_render = function(chart) {
  cancelAnimation(chart);
  showLoadingSpinner(chart, `Processing ${_rawData.length.toLocaleString("en-US", {maximumFractionDigits: 0})} data points...`);
  setTimeout(function() {
    process_data(_rawData, chart);
    render(chart);
  }, 0);
};

var render = function(chart) {
  let countryCount = chart.data.length;

  let dataPointCount = 0;
  for (let d of chart.data) { dataPointCount += d.data.length; }

  countryCount = countryCount.toLocaleString("en-US", {maximumFractionDigits: 0});
  dataPointCount = dataPointCount.toLocaleString("en-US", {maximumFractionDigits: 0});

  cancelAnimation(chart);
  showLoadingSpinner(chart, `Rendering ${dataPointCount} data points from ${countryCount} locations...`);
  setTimeout(function() { doRender(chart) }, 0);
};

var calculateMaxDayRendered = function(chart) {
  let maxDayRendered = chart.xMax;
  let f = _.filter(chart.data, function (e) {
    return e.country == chart.highlight || (chart.extraHighlights && chart.extraHighlights.indexOf(e.country) != -1);
  });
  if (f.length == 0) { f = null; }

  // xAxis
  if (chart.xaxis == "right") {
    if (f) {
      let totalDays = _.maxBy(f, 'totalDays').totalDays;
      maxDayRendered = totalDays;
    }
  } else if (chart.xaxis == "right-4wk") {
    maxDayRendered = 28;
  } else if (chart.xaxis == "right-8wk") {
    maxDayRendered = 7 * 8;
  } else if (chart.xaxis == "right-12wk") {
    maxDayRendered = 7 * 12;
  } else if (chart.xaxis == "right-all") {
    let m = _.maxBy(chart.data, 'totalDays');
    maxDayRendered = m.totalDays;
  } else {
    // left-align
    if (f) {
      let maxDay = _.maxBy(f, 'maxDay').maxDay;
      maxDayRendered = Math.ceil(maxDay * 1.13);
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

const _regions = {
  "BEA": {
    "N. England": ["Connecticut", "Maine", "Massachusetts", "New Hampshire", "Rhode Island", "Vermont"],
    "Mideast": ["Delaware", "District of Columbia", "Maryland", "New Jersey", "New York", "Pennsylvania"],
    "Gr. Lakes": ["Illinois", "Indiana", "Michigan", "Ohio", "Wisconsin"],
    "Plains": ["Iowa", "Kansas", "Minnesota", "Missouri", "Nebraska", "North Dakota", "South Dakota"],
    "Southeast": ["Alabama", "Arkansas", "Florida", "Georgia", "Kentucky", "Louisiana", "Mississippi", "North Carolina", "South Carolina", "Tennessee", "Virginia", "West Virginia"],
    "Southwest": ["Arizona", "New Mexico", "Oklahoma", "Texas"],
    "Rocky Mtn.": ["Colorado", "Idaho", "Montana", "Utah", "Wyoming"],
    "Far West": ["Alaska", "California", "Hawaii", "Nevada", "Oregon", "Washington"],
  },
  "census": {
    "Northeast": ["Connecticut", "Maine", "Massachusetts", "New Hampshire", "Rhode Island", "Vermont", "New Jersey", "New York", "Pennsylvania"],
    "Midwest": ["Illinois", "Indiana", "Michigan", "Ohio", "Wisconsin", "Iowa", "Kansas", "Minnesota", "Missouri", "Nebraska", "North Dakota", "South Dakota"],
    "South": ["Delaware", "Florida", "Georgia", "Maryland", "North Carolina", "South Carolina", "Virginia", "District of Columbia", "West Virginia", "Alabama", "Kentucky", "Mississippi", "Tennessee", "Arkansas", "Louisiana", "Oklahoma", "Texas"],
    "West": ["Arizona", "Colorado", "Idaho", "Montana", "Nevada", "New Mexico", "Utah", "Wyoming", "Alaska", "California", "Hawaii", "Oregon", "Washington"],
  },
  "USDA": {
    "Northeast": ["Connecticut", "Maine", "Massachusetts", "New Hampshire", "Rhode Island", "Vermont", "New Jersey", "New York", "Pennsylvania", "Virginia", "District of Columbia", "West Virginia", "Maryland"],
    "Midwest": ["Illinois", "Indiana", "Michigan", "Ohio", "Wisconsin", "Iowa", "Minnesota", "Missouri", "Kentucky"],
    "Plains": ["Oklahoma", "Texas", "Kansas",  "North Dakota", "South Dakota", "Nebraska", "Montana", "Wyoming", "New Mexico", "Colorado"],
    "South": ["Delaware", "Florida", "Georgia", "North Carolina", "South Carolina", "Alabama", "Mississippi", "Tennessee", "Arkansas", "Louisiana"],
    "West": ["Arizona", "Idaho", "Nevada", "Utah", "Alaska", "California", "Hawaii", "Oregon", "Washington"],
  },
  "partisan": {
    "Democrat": ["Kansas", "Wisconsin", "Kentucky", "Colorado", "New Mexico", "Minnesota", "Illinois", "Rhode Island", "Washington", "Connecticut", "New York", "Oregon", "Pennsylvania", "Virginia", "California", "the U.S. Virgin Islands", "Louisiana", "Nevada", "Guam", "Delaware", "Michigan", "Hawaii", "New Jersey", "North Carolina", "Maine", "Montana"],
    "Republican": ["Georgia", "Tennessee", "Missouri", "Alaska", "Maryland", "Idaho", "New Hampshire", "Alabama", "Oklahoma", "Florida", "Texas", "Massachusetts", "Vermont", "South Carolina", "South Dakota", "Indiana", "North Dakota", "Iowa", "Ohio", "Mississippi", "Utah", "Arizona", "the Northern Mariana Islands", "Wyoming", "Arkansas", "West Virginia", "Nebraska"]
  },
  "population": {
    "   10m+": ["California", "Texas", "Florida", "New York", "Pennsylvania", "Illinois", "Ohio", "Georgia", "North Carolina"],
    "  5-10m": ["Michigan", "New Jersey", "Virginia", "Washington", "Arizona", "Massachusetts", "Tennessee", "Indiana", "Missouri", "Maryland", "Wisconsin", "Colorado", "Minnesota", "South Carolina"],
    " 1-5m": ["Alabama", "Louisiana", "Kentucky", "Oregon", "Oklahoma", "Connecticut", "Utah", "Puerto Rico", "Iowa", "Nevada", "Arkansas", "Mississippi", "Kansas", "New Mexico", "Nebraska", "West Virginia", "Idaho", "Hawaii", "New Hampshire", "Maine", "Montana", "Rhode Island"],
    "<1m": ["Delaware", "South Dakota", "North Dakota", "Alaska", "District of Columbia", "Vermont", "Wyoming"]
  }
};



var stateToRegionMap = {};


const colorScale_colors = [
  { h: 216, s: 47, l: 26 },
  { h: 11, s: 96, l: 26 },
  { h: 44, s: 100, l: 26 },
  { h: 92, s: 58, l: 26 },
  { h: 258, s: 30, l: 26 },
  { h: 150, s: 61, l: 26 },
  { h: 184, s: 90, l: 26 },
  { h: 320, s: 90, l: 26 },
];

var regionColors = {};
var colorScale_map = {};

const colorScale_f = function(key) {
  if (!colorScale_map[key]) {
    let color = regionColors[ stateToRegionMap[key] ] ;

    if (color) {
      colorScale_map[key] = `hsla(${color.h}, ${color.s}%, ${color.l}%, 1)`;
      color.l += color.dl;
    } else {
      colorScale_map[key] = '#888';
    }
  }

  return colorScale_map[key];
};


var doRender = function(chart) {
   if (chart.data.length == 0) {
     let message;
     if (_data_src == "ctp" && (chart.self == "countries" || chart.self == "countries-normalized")) {
       message = "The COVID Tracking Project provides data only for the United States.  See US data below. :)"
     } else {
       message = "There is no data available to display for your selected options.";
     }
     
     if (chart.highlight == "(None)" && chart.show == "highlight-only") {
      message = "You are asking for the impossible, I like the way you think! :)<br><br>" +
        `However, there is nothing to display when you select <b>(None)</b> as the highlight and then ask to show <b>"Highlight Only"</b>.`;
     }

    $("#" + chart.id).html(`<div class="text-center divoc-graph-loading"><div role="status" style="padding-top: 20px;">
      ${message}
    </div></div>`);
    return;
  }

  // == Populate Region Data ==
  regionColors = {};
  colorScale_map = {};
  stateToRegionMap = {};

  let region_ct = 0;
  let selectedRegionData = _regions[ chart.region ];
  for (let regionName in selectedRegionData) {
    for (let stateName of selectedRegionData[regionName]) {
      stateToRegionMap[stateName] = regionName;
    }

    let color = colorScale_colors[ region_ct++ % colorScale_colors.length ];
    color = Object.assign({}, color);

    let statesInRegion = selectedRegionData[regionName].length;
    if (statesInRegion > 10) { color.dl = 2; }
    else { color.dl = 3; }

    regionColors[regionName] = color;
    colorScale_map[regionName] = `hsla(${color.h}, ${color.s}%, 50%, 1)`;
  }

  // ==
  let dataByDate = {};
  for (let d of chart.data) {
    dataByDate = _.reduce(d.data, function (result, d) {
      if (!result[d.date]) { result[d.date] = {}; }
      //if (!result[d.date][d.country]) { result[d.date][d.country] = {}; }
      result[d.date][d.country] = d.cases;
      return result;
    }, dataByDate);
  };

  let maxCaseSum = 0;
  dataByDate = _.map(dataByDate, function (d, key) {
    let caseSum = 0;
    for (let index in d) {
      caseSum += d[index];
    }
    if (caseSum > maxCaseSum) { maxCaseSum = caseSum; }

    d["Date"] = key;
    d.daysAgo = calculateDaysAgo(key);
    d.caseSum = caseSum;
    return d;
  });
  dataByDate = _.sortBy(dataByDate, "Date");

  var maxDayRendered = calculateMaxDayRendered(chart);
  dataByDate = dataByDate.slice( -maxDayRendered - 1 );


  let countriesToGraph = _.map(chart.data, 'country');
  countriesToGraph.sort(function (d1, d2) {
    let r1 = stateToRegionMap[d1];
    let r2 = stateToRegionMap[d2];

    if (!r1) { r1 = "~"; }
    if (!r2) { r2 = "~"; }

    if (r1 == r2) { r1 = d1; r2 = d2; }

    if (r1 < r2) { return -1; }
    else if (r1 == r2) { return 0; }
    else { return 1; }
  });

  let stackOffset = d3.stackOffsetNone;
  let hideYAxis = false;

  switch (chart.display) {
    case "pct": stackOffset = d3.stackOffsetExpand; break;
    case "center": stackOffset = d3.stackOffsetSilhouette; hideYAxis = true; break;
    case "smooth": stackOffset = d3.stackOffsetWiggle; hideYAxis = true; break;
  }
  


  let stackData = d3.stack()
  .offset(stackOffset)
  .keys( countriesToGraph )(dataByDate);

  
  let regions = {};
  let minValue = 0 , maxValue = 0;
  for (let d_state of stackData) {
    let state = d_state.key;
    let d = d_state[ d_state.length - 1 ];
    let region = stateToRegionMap[state];

    if (!regions[region]) { regions[region] = { name: region, start: d[0] }; }
    regions[region].end = d[1];
  }

  let lowestData = stackData[0];
  let highestData = stackData[ stackData.length - 1 ];
  for (let i = 0; i < lowestData.length; i++) {
    let low = lowestData[i][0];
    let high = highestData[i][1];

    if (low < minValue) { minValue = low; }
    if (high > maxValue) { maxValue = high; }
  }

  /*
  if (d[0] < minValue) { minValue = d[0]; }
  if (d[1] > maxValue) { maxValue = d[1]; }
  */


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


  let alignRight = false, labelOffGrid = false;
  if (chart.xaxis && chart.xaxis != "left") {
    alignRight = true;
    labelOffGrid = true;
  }

  var margin = { top: 10, right: 20, bottom: 45, left: 40 };

  var cur_width = $("#sizer").width();
  _client_width = cur_width;
  cur_width -= 2;

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

  let future_date, future_time_added_right = 0;
  //future_date = new Date("2020-11-21");

  if (future_date) {
    future_time_added_right = (future_date.getTime() - _dateObj_today_time) / (1000 * 3600 * 24);
  }

  if (labelOffGrid && future_time_added_right < 10) {
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
    daysScale.domain([-maxDayRendered, future_time_added_right])
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

  let scale_y_highlight, scale_y_curMax;
  if (chart.yAxisScale == "highlight" || chart.yAxisScale == "both") {
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

      scale_y_highlight = scale_yMax = maxCases * 1.05;
    }
  }
  
  if (chart.yAxisScale == "currentMax" || chart.yAxisScale == "both") {
    let maxCasesValue = 0;
    for (let d of chart.data) {
      let last;
      if (d.data.length > 0) {
        last = d.data[ d.data.length - 1 ];
        if (!alignRight) {
          if (last.dayCounter > maxDayRendered) {
            last = _.find( d.data, function (d) { return d.dayCounter == maxDayRendered; });
          }
        }
      }

      if (last && last.cases > maxCasesValue) { maxCasesValue = last.cases; }
    }

    scale_y_curMax = scale_yMax = maxCasesValue * 1.05;
  }

  if (chart.yAxisScale == "both") {
    scale_yMax = Math.max(scale_y_highlight, scale_y_curMax);
  }

  scale_y0 = minValue * 1.05
  scale_yMax = maxValue * 1.05;
  if (chart.display == "pct") {
    scale_yMax = 1;
    isRatio = true;
  }
  //scale_yMax = 1;




  casesScale.domain([scale_y0, scale_yMax]).range([height, 0]);
  
  // Color Scale
  var colorScale = colorScale_f;


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


  if (alignRight) {
    svg.append("rect")
      .attr("x", daysScale(-14))
      .attr("width", daysScale(0) - daysScale(-14))
      .attr("y", 0)
      .attr("height", height)
      .attr("fill", "#fffffa");

    // 
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
  } else {
    y_axis_tickFormat = function (val) {
      if (hideYAxis && val < 0) { val = -val; }

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


  if (_data_src == "ctp") {
    svg.append("text")
    .attr("x", width)
    .attr("y", height + 32)
    .attr("class", "text-credits")
    .attr("text-anchor", "end")
    .text(`Data: The COVID Tracking Project; Updated: ${_dateUpdated}`);
  } else {
    svg.append("text")
    .attr("x", width)
    .attr("y", height + 32)
    .attr("class", "text-credits")
    .attr("text-anchor", "end")
    .text(`Data: Johns Hopkins CSSE; Updated: ${_dateUpdated}`);
  }

  svg.append("text")
    .attr("x", width)
    .attr("y", height + 32 + 10)
    .attr("class", "axis-title")
    .attr("text-anchor", "end")
    .style("font-size", "8px")
    .style("fill", "#aaa")
    .text(`Interactive Visualization: https://91-DIVOC.com/ by @profwade_`);

  let area = d3.area()
  .x((d, i) => daysScale(-d.data.daysAgo))
  .y0(d => casesScale(d[0]) )
  .y1(d => casesScale( d[1] ? (d[1]) : (d[0])) );

  svg.append("g")
  .selectAll("path")
  .data(stackData)
  .enter()
  .append("path")
  .attr("fill", (d) => colorScale(d.key))
  .attr("d", area)
  .on("mousemove", (d, i, elems) => {
    let mouse_daysAgo = Math.ceil(daysScale.invert(d3.mouse(elems[i])[0]));
    let x = daysScale(mouse_daysAgo); // - maxDayRendered);

    let d_index = d.length - 1 + mouse_daysAgo;
    let mouse_coordData = d[ d_index ];
    let cases_y0 = mouse_coordData[0];
    let y0 = casesScale(cases_y0);
    let cases_y1 = mouse_coordData[1];
    let y1 = casesScale(cases_y1);
    let mouse_allData = d[d_index].data;

    let state = d.key
    let date = mouse_allData.Date;
    let value = mouse_allData[state];

    focusBottom
    .attr("cx", x)
    .attr("cy", y0)
    .attr("fill", colorScale(state));

    focusTop
    .attr("cx", x)
    .attr("cy", y1)
    .attr("fill", colorScale(state));

    focusLine
    .attr("x1", x)
    .attr("x2", x)
    .attr("y1", y0)
    .attr("y2", y1);

    let toolTipData = {
      state: state,
      date: date,
      value: value,
      daysAgo: -mouse_daysAgo,
      caseSum: mouse_allData.caseSum
    };

    tip.show(d, i, toolTipData, focusTop._groups[0][0]);
  })
  .on("mouseover", function () {
    focusTop.style("display", null);
    focusBottom.style("display", null);
    focusLine.style("display", null);
  })
  .on("mouseout", function () {
    tip.hide();
    focusTop.style("display", "none");
    focusBottom.style("display", "none");
    focusLine.style("display", "none");
  });


  var y_grid = d3.axisLeft(casesScale).tickSize(-width).tickFormat("");
  svg.append('g').attr("class", "grid").call(y_grid);

  var x_grid = d3.axisBottom(daysScale).tickSize(-height).tickFormat("").tickValues(xTickValues);
  svg.append('g').attr("transform", "translate(0, " + height + ")").attr("class", "grid").call(x_grid);


  let focusTop = svg.append("g")
  .append("circle")
  .attr("r", 1)
  .attr("fill", "black")
  .attr("stroke", "black");

  let focusBottom = svg.append("g")
  .append("circle")
  .attr("r", 1)
  .attr("fill", "white")
  .attr("stroke", "black");

  let focusLine = svg.append("g")
  .append("line")
  .attr("stroke-width", 1)
  .attr("stroke", "black");


  for (let region_key in regions) {
    let region = regions[region_key];

    if (region.name) {

      svg.append("line")
      .attr("x1", width)
      .attr("x2", width + 10)
      .attr("y1", casesScale(region.start) )
      .attr("y2", casesScale(region.start) )
      .attr("stroke", colorScale(region.name) )    

      svg.append("line")
      .attr("x1", width)
      .attr("x2", width + 10)
      .attr("y1", casesScale(region.end) + 1 )
      .attr("y2", casesScale(region.end) + 1 )
      .attr("stroke", colorScale(region.name) )

      svg.append("text")
      .attr("x", width + 5)
      .attr("y", 1 + (casesScale(region.start) + casesScale(region.end)) / 2 )
      .attr("stroke", colorScale(region.name) )
      .attr("alignment-baseline", "middle")
      .style("font-size", "12px")
      .text(region.name.trim());
    }
  }


  if (alignRight) {
    let dateLines = [];
    let endDate = (future_date) ? (future_date) : _dateObj_today;
    for (let relDate = new Date("2020-02-01 00:00:00");
        relDate < endDate;
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

    if (future_date) {      
      dateLines.push({
        daysAgo: -future_time_added_right,
        dateLabel: future_date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        lineWidth: 3
      });
    }

    for (let dateLine of dateLines) {
      var showLabel = true;
      if (dateLine.daysAgo > 0 && width - daysScale(-dateLine.daysAgo) <= 50) {
        showLabel = false;
      }

      svg.append("line")
        .attr("x1", daysScale(-dateLine.daysAgo))
        .attr("x2", daysScale(-dateLine.daysAgo))
        .attr("y1", (showLabel)?-12:0)
        .attr("y2", height)
        .attr("stroke", "#000")
        .attr("opacity", 0.3)
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

  
  return; 

  chart.data.sort(function (d1, d2) {
    var highlight_d1 = ( highlights.indexOf(d1.country) != -1 );
    var highlight_d2 = ( highlights.indexOf(d2.country) != -1 );

    if      ( highlight_d1 && !highlight_d2) { return 1; }
    else if (!highlight_d1 &&  highlight_d2) { return -1; }
    else { return 0; }
  });

  let labelOffGrid_x = daysScale(0) + 5;
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
    if (!alignRight && lastDataPoint.dayCounter > maxDayRendered) {      
      let foundLastDataPoint = _.find(countryData.data, function (e) {
        return e.dayCounter >= maxDayRendered;
      })

      if (foundLastDataPoint) { lastDataPoint = foundLastDataPoint; }
    }

    if (labelOffGrid) {
      countryText
        .attr("x", function() {
          return labelOffGrid_x;
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
      // Off of left side of chart
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
      .filter(function (d, i) {
        if (isHighlighted) { return true; }

        if (alignRight) {
          if (d.daysAgo > 60) { return (d.daysAgo % 3 == 0); }
          if (d.daysAgo > 30) { return (d.daysAgo % 2 == 0); }  
        } else {
          let daysDelta = maxDayRendered - d.dayCounter;
          if (d.daysAgo < daysDelta) { daysDelta = d.daysAgo; }

          if (daysDelta > 60) { return (daysDelta % 3 == 0); }
          if (daysDelta > 30) { return (daysDelta % 2 == 0); }  
        }

        return true;
      })      
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
      <b>Note:</b> ${chart.highlight} has not reached ${desc} in the provided data.  Therefore, no data is available to highlight.
      </div>`);
  }

  if (minHighlightHeight > (0.67 * height) && !_animation_timeout && chart.highlight != "(None)" && minHighlightHeight < 99999) {
    $("#" + chart.id).append(`<div class="alert alert-info" style="margin-top: 10px; margin-bottom: 0px; text-align: center; font-size: 12px;">Note: All of your highlighted data is in the bottom third of the graph. <a href="#" onclick="scaleToHighlight(event)">You can get a zoomed-in view of the graph by setting <b>Y-Axis</b> to <b>"Scale to Highlight"</b>.</a></div>`);
  }

  if (!_animation_timeout) {
    gtag("event", "render", {event_category: chart.self});
  }
};
