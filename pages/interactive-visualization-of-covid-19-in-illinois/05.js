var _rawData = null;
var _popData = null;
var dateColumns = [];
var _client_width = -1;
var _intial_load = true;
var _dateObj_today, _dateObj_today_time;
var _additionalHighlight_index = 0;

const il_regions = {
  // https://ilga.gov/commission/jcar/admincode/077/077005150B02000R.html
  // https://www.dph.illinois.gov/sites/default/files/resources/ems-regions-map.pdf

  // North Central (1, 2)
  "Region 1: North West": [
    "Jo Daviess", "Stephenson", "Winnebago", "Boone", "Ogle", "Lee", "Carroll", "Whiteside", "Dekalb",
  ],

  "Region 2: North Central": [
    "Rock Island", "Warren", "Bureau", "Putnam", "LaSalle", "Mercer", "Henry", "Stark", "Marshall", "Livingston", "Henderson", "Knox", "Peoria", "Woodford", "McDonough", "Fulton", "Tazewell", "McLean",
  ],

  // Central (3, 6)
  "Region 3: Central West": [
    "Hancock", "Adams", "Pike", "Calhoun", "Schuyler", "Brown", "Cass", "Morgan", "Scott", "Greene", "Jersey", "Mason", "Menard", "Sangamon", "Macoupin", "Logan", "Christian", "Montgomery",
  ],

  "Region 6: Central East": [
    "Ford", "Iroquois", "DeWitt", "Piatt", "Champaign", "Vermilion", "Macon", "Moultrie", "Douglas", "Edgar", "Shelby", "Coles", "Cumberland", "Clark", "Fayette", "Effingham", "Jasper", "Crawford", "Clay", "Richland", "Lawrence",
  ],

  // Southern (4, 5)
  "Region 4: Greater St. Louis": [
    "Madison", "St. Clair", "Monroe", "Randolph", "Bond", "Clinton", "Washington",
  ],

  "Region 5: South East": [
      "Perry", "Jackson", "Union", "Alexander", "Marion", "Jefferson", "Franklin", "Williamson", "Johnson", "Pulaski", "Wayne", "Hamilton", "Saline", "Pope", "Massac", "Edwards", "White", "Gallatin", "Hardin", "Wabash",
  ],

  // Northeast (7-11)
  "Regions 7-10: Burbs": [
    "McHenry", "Kane", "Kendall", "Grundy", "Kankakee", "Will", "Cook", "DuPage", "Lake"
  ],

  "Region 11: Chicago": ["Chicago"],

  //
  "Region 7: Burbs/Far South": [],
  "Region 8: Burbs/Far West": [],
  "Region 9: Burbs/Far North": [],
  "Region 10: Burbs/Near-In": [],
  "Cook": ["Cook w/o Chicago", "Chicago"],
  "Region 6 w/o UIUC": [],
}

var _custom_agg = {
  global: [],
  dict: {}
};

for (let regionKey in il_regions) {
  _custom_agg.global.push({
    label: regionKey,
    countries: il_regions[regionKey]
  })
}

for (let d of _custom_agg.global) {
  d.rawdata = {};
  for (let c of d.countries ) {
    if (!_custom_agg.dict[c]) { _custom_agg.dict[c] = []; }
    _custom_agg.dict[c].push( { label: d.label, rawdata: d.rawdata });
  }
}

let applyCustomAgg = function() {
  _custom_agg.dict = {};
  for (let d of _custom_agg.global) {
    d.rawdata = {};
    for (let c of d.countries ) {
      if (!_custom_agg.dict[c]) { _custom_agg.dict[c] = []; }
      _custom_agg.dict[c].push( { label: d.label, rawdata: d.rawdata, src: d });
    }
  }

  for (let d of _rawData) {
    let country = d["Region"];
    let date = d["Date"];
    let customAggData = _custom_agg.dict[country];

    if (customAggData) {
      for (let cd of customAggData) {
        if (!cd.rawdata[date]) {
          cd.rawdata[date] = { "aggregation": true, "Date": date, "Region": cd.label };          
        }

        let rawdata = cd.rawdata[date];
        for (let key in d) {
          if (typeof(d[key]) == "number") {
            if (!rawdata[key]) { rawdata[key] = 0; }
            rawdata[key] += d[key];
          }
        }
      }
    }
  }

  // Append data
  let aggData = [];
  for (let d of _custom_agg.global) {
    for (let dateKey in d.rawdata) {
      aggData = aggData.concat(d.rawdata[dateKey]);
    }
  }
  //aggData = _.sortBy(aggData, "Date");
  _rawData = _rawData.concat(aggData);
  _rawData = _.sortBy(_rawData, "Date");
  
  // Calculate population data
  for (let cad of _custom_agg.global) {
    _popData.country[ cad.label ] = 0;

    for (let country of cad.countries) {
      if (_popData.country[ country ]) {
        _popData.country[ cad.label ]  += _popData.country[ country ];
      }
    }
  }
};



// Resize
$(window).resize(function () {
  if (_rawData != null) {
    var new_width = $("#sizer").width();
    if (_client_width != new_width) {
      for (let chartKey in charts) {
        render( charts[chartKey] );
      }
    }
  }
});


var showLoadingSpinner = function(chart, message = "", cancel_f) {
  if (chart) {
    let el = $(`#${chart.id} .divoc-graph-loading div.loading-message`);
    if (el.length > 0) {
      el.html(message);
    } else {
      $("#" + chart.id).html(`<div class="text-center divoc-graph-loading">
        <div class="spinner-border text-primary" role="status"><span class="sr-only">Loading...</span> </div>
        <div class="loading-message">${message}</div>
        <button class="btn btn-danger divoc-spinner-cancel" style="display: none">Cancel</button>
      </div>`);
    }

    if (cancel_f) {
      $(".divoc-spinner-cancel").on('click', cancel_f);
      $(".divoc-spinner-cancel").show();
    } else {
      $(".divoc-spinner-cancel").hide();
    }
  } else {
    for (let c in charts) { showLoadingSpinner(charts[c], message); }
  }
}

// reducers
var reducer_sum_with_key = function(result, value, key) {
  if (!result[key]) { result[key] = {} }

  let obj = result[key];
  let date = value["Date"];
  if (!obj[date]) { obj[date] = { beds: 0, icu: 0, testPositivityRate: 0, ventilator: 0, cases: 0, deaths: 0 } }

  const fields = {
    beds: "Beds",
    icu: "ICU",
    testPositivityRate: "TestPositivity",
    ventilator: "Ventilator",
    cases: "Confirmed",
    deaths: "Deaths",
    tests: "People_Tested"
  };

  for (let fieldKey in fields) {
    let v = value[ fields[fieldKey] ];
    if (v) {
      obj[date][fieldKey] = value[ fields[fieldKey] ];
    }
  }

  return result;
};

var reducer_byUSstate = function(result, value, key) {
  country = value["Country_Region"];
  state = value["Province_State"];

  if (!state || state == "") { return result; }
  if (country != "United States") { return result; }
  if (state.indexOf("Princess") != -1) { return result; }

  // Use the state name as key
  key = state;
  return reducer_sum_with_key(result, value, key);
};

var reducer_byCountry = function(result, value, key) {
  //state = value["Province_State"];
  //if (state && state != "") { return result; }

  key = value["Region"];
  return reducer_sum_with_key(result, value, key);
};




var localStorage = window.localStorage;

var _storedValues = {};
/*
if (localStorage['91-DIVOC-05']) {
  _storedValues = JSON.parse(localStorage['91-DIVOC-05']);
}
*/

var setStoredValue = function(key, value) {
  _storedValues[key] = value;
  localStorage['91-DIVOC-05'] = JSON.stringify(_storedValues);
};

var getStoredValue = function(key) {
  return _storedValues[key];
};


// find default state value
var stored;

var defaultCountry = "(All Regions)";
if ((stored = getStoredValue("country"))) { defaultCountry = stored; }





// chart metadata
var charts = {
  'countries': {
    self: 'countries',
    dataSourceNeeded: 'countries',
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
    yAxisScale: 'fixed',
    xMax: null, yMax: null, data: null,
    trendline: "default",
    dataRawSelection: "cases-daily-7",
    xaxis: "right",

    defaultSubHighlight: defaultCountry,
  },
  'countries-normalized': {
    self: 'countries-normalized',
    dataSourceNeeded: 'countries',
    reducer: reducer_byCountry,
    scale: "linear",
    highlight: defaultCountry,
    defaultHighlight: defaultCountry,
    y0: 100,
    xCap: 25,
    id: "chart-countries-normalized",
    normalizePopulation: true,
    show: "25",
    dataSelection: 'cases',
    showDelta: true,
    avgData: 7,
    yAxisScale: 'fixed',
    xMax: null, yMax: null, data: null,
    trendline: "default",
    dataRawSelection: "cases-daily-7",
    xaxis: "right",

    defaultSubHighlight: defaultCountry,
  }  
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
    if (!isFinite(avg)) { avg = 0; }
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
  allCountries = _all_countries;
  if (allCountries[0] != "(None)") {
    allCountries.sort();
    allCountries.unshift("(All Regions)");
    allCountries.unshift("(None)");
  }
  for (var country of allCountries) {
    var el_option = $("<option />").val(country).text(country);
    if (selectedCountry == country) { el_option.attr("selected", true); }
    html += el_option.wrap('<p/>').parent().html();
  }
  return html;
}

var prep_data = function(chart, resetReport = true) {
  chart.displayData = {};
  let origDataSelection = chart.dataRawSelection;

  chart.data = chart.displayData[origDataSelection] = _prep_data(chart, chart.fullData);
  if (chart.extraData) {
    let originalShow = chart.show;
    chart.show = "highlight-only";
    for (let extraDataStr of chart.extraData) {

      updateDataSelectionOptions(chart, extraDataStr, false);
      chart.displayData[extraDataStr + "-extraData"] = _prep_data(chart, chart.cache[extraDataStr]);
    }
    chart.show = originalShow;
  }

  updateDataSelectionOptions(chart, origDataSelection, false);
  if (resetReport) { doResetReport(chart); }
};

var _prep_data = function(chart, fullData) {
  var caseData = fullData;
  var allCountries = _.map(caseData, 'country').sort();
  var highlights = [ chart.highlight ];
  if (chart.extraHighlights) { highlights = highlights.concat( chart.extraHighlights ); }
  
  if (highlights.indexOf("(All Regions)") != -1) {
    for (let regionName in il_regions) {
      if (regionName != "Cook" && highlights.indexOf(regionName) == -1) {
        highlights.push(regionName);
      }
    }
  }

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

    case "pop-small":
      retain_f = function(d) { return (d.pop <= 5e6) || (highlights.indexOf(d.country) != -1); }
      break;

    case "pop-large":
      retain_f = function(d) { return (d.pop > 5e6) || (highlights.indexOf(d.country) != -1); }
      break;

    case "pop100m": retain_f = function(d) { return (d.pop > 100e6) || (highlights.indexOf(d.country) != -1); }
      break;

    case "pop50m":  retain_f = function(d) { return (d.pop > 50e6) || (highlights.indexOf(d.country) != -1); }
      break;

    case "pop10m":  retain_f = function(d) { return (d.pop > 10e6) || (highlights.indexOf(d.country) != -1); }
      break;

    case "us-states":
      exclude = ["US-exclude-NY/NJ/CT", "US-West", "US-Northeast", "US-Midwest", "US-South", "United States", "Puerto Rico", "Northern Mariana Islands", "Guam", "Virgin Islands"];
      break;

    case "agg-only":
      retain = _.map(_custom_agg.global, "label");
      retain.push("Chicago");
      retain = retain.concat(highlights);
      break;
  }

  if ( il_regions[chart.show] ) {
    retain = il_regions[chart.show];
    retain = retain.concat(highlights);
  }

  if (retain.length > 0) {
    caseData = _.filter(caseData, function(d) { return (retain.indexOf(d.country) != -1 || highlights.indexOf(d.country) != -1); });
  } else if (exclude.length > 0) {
    caseData = _.filter(caseData, function(d) { return (exclude.indexOf(d.country) == -1 || highlights.indexOf(d.country) != -1); });
  } else if (retain_f) {
    caseData = _.filter(caseData, retain_f);
  } else if (chart.show != "all") {
    let numShow = parseInt(chart.show);

    exclude = ["Illinois", "Chicago"];
    exclude = exclude.concat( _.map(_custom_agg.global, "label") );
    exclude = exclude.filter(function(item) { return item !== "Cook" && item !== "Chicago"; })

    caseData = _.filter(caseData, function(d) {
      return (exclude.indexOf(d.country) == -1) || (highlights.indexOf(d.country) != -1);
    });

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

  var $highlight = $("#highlight-" + chart.id);
  if ($highlight.html().length < 100) { 
    $highlight.html(getHTMLCountryOptionsToSelect(allCountries, chart.highlight));
  }

  if (chart.avgData && chart.avgData > 1) { transformToTrailingAverage(caseData, chart.avgData); }
  return caseData;
};


var getDataCacheString = function(chart, dataSelection, isSubdata = false) {
  let dataStr = dataSelection;
  if (isSubdata) { dataStr += "-subdata"; }

  return dataStr;  
}

var _process_data_verify = function(chart, dataSelection, isSubdata) {
  let dataStr = getDataCacheString(chart, dataSelection, isSubdata);

  if (!chart.cache) { chart.cache = {}; }
  if (!chart.cache[dataStr]) {
    updateDataSelectionOptions(chart, dataSelection, false);
    chart.cache[dataStr] = do_process_data(_rawData, chart, isSubdata);
  }

  return chart.cache[dataStr];
};

var process_data2 = function(chart, isSubdata = false, noPrepData = false) {
  process_data(_rawData, chart, isSubdata, noPrepData);
};

var process_data = function(data, chart, isSubdata = false, noPrepData = false) {
  let origDataSelection = chart.dataRawSelection;
  let processedData = _process_data_verify(chart, origDataSelection, isSubdata);

  if (chart.extraData) {
    for (let extraDataSrc of chart.extraData) {
      _process_data_verify(chart, extraDataSrc, false);

      if (chart.subdata) { _process_data_verify(chart, extraDataSrc, true); }
    }
  }

  // Populate chart object (legacy)
  updateDataSelectionOptions(chart, origDataSelection, false);
  if (!isSubdata) { chart.fullData = processedData; }
  else            { chart.subdata = processedData; }

  if (!isSubdata && chart.subdata) { process_data(data, chart, true, true); }
  if (!noPrepData) { prep_data(chart); }
};

var convertDateToObject = function(s) {
  let dateParts = s.split("-");
  let dateObj;

  if (dateParts[0].length == 4) {
    // yyyy-mm-dd
    dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
  } else {
    // mm-dd-yyyy (legacy, from JHU)
    dateObj = new Date(parseInt(dateParts[2]), parseInt(dateParts[0]) - 1, parseInt(dateParts[1]));
  }

  return dateObj;
};

let _all_countries = [];
let _all_countries_first = true;
var do_process_data = function(data, chart, isSubdata = false) {
  var agg;

  //console.log(`>> Processing Data (chart=${chart.self}, subdata=${isSubdata}, noPrep=${noPrepData})`);
  
  if (!isSubdata) { agg = _.reduce(data, chart.reducer, {}); }
  else            { agg = _.reduce(data, chart.subdata_reducer, {}); }
  
  let y0_threshold = chart.y0;
  if (chart.isRatio) { y0_threshold = 0; }
  //if (isSubdata) { y0_threshold = 10; }

  var caseData = [];
  var maxDayCounter = 0;

  let popData = _popData["country"];;
  /*
  if (isSubdata) {
    popData = _popData["state"];
  } else if (chart.normalizePopulation) {
    popData = _popData[chart.normalizePopulation]; 
  } else if (chart.self == "countries") {
    popData = _popData["country"];
  } else if (chart.self == "states") {
    popData = _popData["state"];
  }
  */

  let isRatio = chart.isRatio;

  let ratioData;
  switch (chart.dataSelection) {
    case 'testPositivity':
      ratioData = { n: 'cases', d: 'tests', raw: 'tests' };
      break;

    case 'mortalityRate':
      ratioData = { n: 'deaths', d: 'cases', raw: 'deaths' };
      break;
  }

  let fetch = function(country, dataSelection, dates, i, raw=false) {
    if (ratioData) {
      if (raw) {
        return fetchCasesValue_v2(country, ratioData.raw, dates, i);
      } else {
        let d = fetchCasesValue_v2(country, ratioData.d, dates, i);
        if (d == 0) { return 0; }

        let n = fetchCasesValue_v2(country, ratioData.n, dates, i);
        return n/d;
      }
    } else {
      return fetchCasesValue_v2(country, dataSelection, dates, i);
    }
  };

  let fetchDetla = function(country, dataSelection, dates, i) {
    if (ratioData) {
      let d0 = fetchCasesValue_v2(country, ratioData.d, dates, i);
      let d1 = fetchCasesValue_v2(country, ratioData.d, dates, i - 1);
      if (d0 - d1 == 0) { return 0; }

      let n0 = fetchCasesValue_v2(country, ratioData.n, dates, i);
      let n1 = fetchCasesValue_v2(country, ratioData.n, dates, i - 1);

      return (n0 - n1) / (d0 - d1);
    } else {
      return fetchCasesValue_v2(country, dataSelection, dates, i) - fetchCasesValue_v2(country, dataSelection, dates, i - 1);
    }
  };

  let fetchCasesValue_v2 = function(country, dataSelection, dates, i) {
    let date = dates[i];
    return agg[country][date][dataSelection];
  };

  for (var country in agg) {
    if (_all_countries_first) { _all_countries.push(country); }
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

      let dateObj = convertDateToObject(date);

      let daysAgo = (_dateObj_today_time - dateObj.getTime() + 3.7e6) / (1000 * 3600 * 24);
      daysAgo = Math.round(daysAgo);

      //let cases = fetchCasesValue(country, date);
      let cases = fetch(country, chart.dataSelection, dates, i);
      var rawCaseValue = fetch(country, chart.dataSelection, dates, i, true);

      if (chart.showDelta) {
        if (i == 0) {
          cases = 0;
        } else {
          //date_prev = dates[i - 1];
          //cases = fetchCasesDelta(country, date, date_prev);
          //cases = fetchDetla(country, chart.dataSelection, dates, i);
          if (chart.dataSelection == "cases" || chart.dataSelection == "deaths" || chart.dataSelection == "tests") {
            cases = fetchDetla(country, chart.dataSelection, dates, i);
          } else {
            cases = fetch(country, chart.dataSelection, dates, i);
          }
          
        }
      }

      if (chart.normalizePopulation && !chart.isRatio) {
        cases = (cases / popSize) * 1e5;
        rawCaseValue = (rawCaseValue / popSize) * 1e5;
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

        if (daysAgo == 0 && cases == 0) {
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
      var cData = {
        pop: popSize,
        country: country,
        data: countryData,
        maxCases: maxCases,
        maxDay: maxDay,
        totalDays: totalDays,
        lastDayCases: lastDayCases,
        dataSelection: chart.dataSelection
      };

      for (let d of countryData) {
        d.src = cData;
      }
      caseData.push(cData);


      if (dayCounter > maxDayCounter) {
        maxDayCounter = dayCounter;
      }
    }
  }
  _all_countries_first = false;

  caseData = _.sortBy(caseData, function (d) {
    return -d.lastDayCases;
  });

  if (!isSubdata) {
    chart.xMax = maxDayCounter;
  } else {
    caseData = _.filter(caseData, function (d) { return d.country != "United States"; } )
  }  

  return caseData;
};


const urlParams = new URLSearchParams(window.location.search);
let _data_src = urlParams.get("data-source");
if (!_data_src) { _data_src = "il-dph"; }

var _data_sources = {
  "il-dph": {
    url: "il-data.csv?d=" + _reqStr,
    f: function (row) {
      row["TestPositivity"] = +row["TestPositivity"];

      row["Beds"] = +row["Beds"];
      row["Ventilator"] = +row["Ventilator"];
      row["ICU"] = +row["ICU"];

      row["Confirmed"] = +row["Confirmed"];
      row["Deaths"] = +row["Deaths"];
      row["People_Tested"] = +row["People_Tested"];

      if (row["Beds"]) { row["Beds"] = 1 - row["Beds"]; }
      if (row["Ventilator"]) { row["Ventilator"] = 1 - row["Ventilator"]; }
      if (row["ICU"]) { row["ICU"] = 1 - row["ICU"]; }

      if (row["Region"] == "Cook") { row["Region"] = "Cook w/o Chicago"; }

      return row;
    },
    name: "Illinois Department of Public Health",
    provides: ["illinois"],
  },
  "il-population": {
    url: "il-population.csv",
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
    render(charts[_chartIdFirst]);

    setTimeout(initialRender2, 100);
  }
}

var initialRender2 = function() {
  for (let chartid of Object.keys(charts)) {
    if (_chartIdFirst == chartid) { continue; }

    process_data(_rawData, charts[chartid]);
    render(charts[chartid]);
  }

  process_query_string_ui();
  _intial_load = false;
};

var getDataPromise = function(dataSource) {
  let src = _data_sources[dataSource];
  return d3.csv(src.url, src.f);
};

var doInitialDataLoad = function() {
  showLoadingSpinner(null, "Fetching and Visualizing Data...");

  // clear cache
  for (let chartKey in charts) { charts[chartKey].cache = {}; }

  let dataPromiseSource = [];
  dataPromiseSource.push( getDataPromise(_data_src) );
  dataPromiseSource.push( getDataPromise("il-population") );
  
  Promise.all(dataPromiseSource)
    .then(function(result) {
      data = result[0];
      populationData = result[1];

      _dateObj_today = convertDateToObject(data[data.length - 1].Date);
      _dateObj_today_time = _dateObj_today.getTime();
      
      // Add custom aggs
      _rawData = data;
  
      _popData = {country: {}, state: {}};
      for (var pop of populationData) {
        _popData.country[pop.Region] = pop.Population;
      }

      applyCustomAgg(_rawData, _popData);
      

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
var saveGraph_fetchCSS = function() {
  return new Promise((resolve, reject) => {
    if (_cssData) {
      resolve(_cssData);
    } else {
      $.get("css.css")
      .done( (cssData) => { _cssData = cssData; resolve(_cssData); })
      .fail( (message) => { reject(message); });
    }
  });
};

var saveGraphImage = function(format, e) {
  e.preventDefault();
  const chart = getChart(e.target);

  if (format == "csv") {
    saveAsCSV(chart);
  } else if (format == "gif" || format == "webm") {
    saveVideo(chart, format);
  } else {
    saveGraph_fetchCSS()
    .then(() => {
      switch (format) {
        case 'svg': saveAsSVG(chart); break;
        case 'png': saveAsPNG(chart); break;
      }
    });
  }
  
  gtag("event", "saveAs", {event_category: chart.self, event_label: format});
  return false;
}

var saveAsCSV = function(chart) {
  let dates = {};
  let dataByCountry = {};
  for (let cData of chart.data) {
    let country = cData.country;
    
    for (let dData of cData.data) {
      let date = dData.date;
      let cases = dData.cases;

      dates[date] = 1;

      if (!dataByCountry[country]) { dataByCountry[country] = {}; }
      dataByCountry[country][date] = cases;
    }
  }

  dates = Object.keys(dates);
  dates.sort();

  let csv = "location";
  for (let date of dates) {
    csv += "," + date;
  }
  csv += "\n";

  for (let country of Object.keys(dataByCountry)) {
    csv += country;
    for (let date of dates) {
      let d = dataByCountry[country][date];
      if (d) { csv += "," + d; }
      else   { csv += ","; }
    }
    csv += "\n";
  }

  var blob = new Blob([csv], {type: "text/plain;charset=utf-8"});
  saveAs(blob, "91-DIVOC-" + chart.self + ".csv");
};


// https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
var _protofill_cavnas_toBlob = function() {
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
};


var getSvgDataString = function(svgxml) {
  svgxml = svgxml.replace(`<style></style>`, `<style>${_cssData}</style>`);
  svgxml = svgxml.replace(`<style />`, `<style>${_cssData}</style>`);

  return "data:image/svg+xml," + encodeURIComponent(svgxml);
};

var saveAsSVG = function(chart) {
  let hrefData = getSvgDataString( $(`#chart-${chart.self}`).html() );
  saveAs(hrefData, "91-DIVOC-" + chart.self + "-" + chart.highlight.replace(" ", "") + ".svg");

  gtag("event", "saveAs-SVG", {event_category: chart.self});
};

var svgToCanvas = function(svg) {
  return new Promise( (resolve, reject) => {
    _protofill_cavnas_toBlob();

    let html = svg.outerHTML;
    let height = svg.getAttribute('height');
    let width = svg.getAttribute('width');

    let hrefData = getSvgDataString(html);
    var canvas = $(`<canvas height="${height}" width="${width}" />`).get(0);
    var ctx = canvas.getContext('2d');
  
    var img = new Image(width, height);
    img.onload = function () {
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas);
    }
    img.onerror = function (message) {
      reject(message);
    }  
    img.src = hrefData;
  });
};

var chartToCanvas = function(chart) {
  //let svg  = $(`#chart-${chart.self} svg`).get(0);
  let svg = doRender(chart, true, null).node();
  return svgToCanvas(svg);
};

var saveAsPNG = function(chart) {
  chartToCanvas(chart).then(function (canvas) {
    canvas.toBlob(function (blob) {
      saveAs(blob, "91-DIVOC-" + chart.self + "-" + chart.highlight.replace(" ", "") + ".png");
      gtag("event", "saveAs-PNG", {event_category: chart.self});
    });
  });
};


var _update_graph = function(chart, value, attr, selector) {
  let chartSelector = "";
  if (chart) {
    chart[attr] = value;
    chartSelector = `[data-chart="${chart.self}"]`;
  }

  // UI Update:
  if (attr == "scale") {
    $(`.${selector}${chartSelector}[data-scale="${value}"]`).click();
  } else if (attr == "extraHighlights" || attr == "extraData" || attr == "extraDataScale") {
    value = value.split(",");
    chart[attr] = value;
  } else {
    if (chart) { chart[attr] = value; }
    else       { for (let chartKey in charts) { charts[chartKey][attr] = value; } }

    let el;
    if (chart) {
      el = $(`section${chartSelector} .${selector} option[value="${value}"]`);
    } else {
      el = $(`.${selector} option[value="${value}"]`);
    }
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
    if (attr == "extraData" && !chart.extraDataScale)  { chart.extraDataScale = []; }
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

  if (chart.extraData) {
    for (let i = 0; i < chart.extraData.length; i++) {
      let d = chart.extraData[i];
      let scale = chart.extraDataScale[i];

      ui_add_data(chart, scale, d);
    }
  }
}

var process_query_string = function() {
  const urlParams = new URLSearchParams(window.location.search);

  _qs_update_graph(null, urlParams, "data-source", null, "datasrc-select");
  _qs_update_graph(null, urlParams, "xaxis", "xaxis", "xaxis-select");
  _qs_update_graph(null, urlParams, "y", "yAxisScale", "yaxis-select");
  _qs_update_graph(null, urlParams, "scale", "scale", "scaleSelection");

  
  let chartId = urlParams.get("chart");
  if (!chartId) { return; }

  let chart = charts[chartId];
  if (!chart) { return; }
  //let chart = charts.countries;

  let otherChart;
  if (chart.self == "states") { otherChart = chart["states-normalized"]; }
  else if (chart.self == "states-normalized") { otherChart = chart["states"]; }
  else if (chart.self == "countries") { otherChart = chart["countries-normalized"]; }
  else if (chart.self == "countries-normalized") { otherChart = chart["countries"]; }

  _qs_update_graph(chart, urlParams, "data", "dataSelection", "data-select");
  _qs_update_graph(chart, urlParams, "highlight", "highlight", "highlight-select");
  _qs_update_graph(chart, urlParams, "extra", "extraHighlights", "extra-highlights");
  _qs_update_graph(chart, urlParams, "show", "show", "filter-select");
  _qs_update_graph(chart, urlParams, "extraData", "extraData", "extra-data");
  _qs_update_graph(chart, urlParams, "extraDataScale", "extraDataScale", "extra-data");

  if (otherChart) {
    _qs_update_graph(otherChart, urlParams, "data", "dataSelection", "data-select");
    _qs_update_graph(otherChart, urlParams, "highlight", "highlight", "highlight-select");
    _qs_update_graph(otherChart, urlParams, "extra", "extraHighlights", "extra-highlights");  
    _qs_update_graph(otherChart, urlParams, "show", "show", "filter-select");
    _qs_update_graph(otherChart, urlParams, "extraData", "extraData", "extra-data");
    _qs_update_graph(otherChart, urlParams, "extraDataScale", "extraDataScale", "extra-data");
  }

  updateQueryString(chart);
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

    _process_ui_state(chart, "highlight", "highlight-select");
    _process_ui_state(chart, "show", "filter-select");
    _process_ui_state(chart, "xaxis", "xaxis-select");
    _process_ui_state(chart, "yAxisScale", "yaxis-select");
    _process_ui_state(chart, "dataSelection", "data-select");
    _process_ui_state(chart, "scale", "scaleSelection");
    //_process_ui_state(chart, "extraHighlights", "extra-highlights");
  }
};


var generateUrl = function(chart) {
  var dataattr = chart.id.substring( chart.id.indexOf("-") + 1 );
  var options = {
    chart: dataattr,
    highlight: chart.highlight,
    show: chart.show,
    y: chart.yAxisScale,
    scale: chart.scale,
    data: (chart.dataRawSelection) ? chart.dataRawSelection : chart.dataSelection,
    'data-source': _data_src
  }

  if (chart.xaxis) { options.xaxis = chart.xaxis; }
  if (chart.extraHighlights) { options.extra = chart.extraHighlights; }
  if (chart.extraData && chart.extraDataScale) {
    options.extraData = chart.extraData; 
    options.extraDataScale = chart.extraDataScale;
  }

  var qs = Object.keys(options).map(function(key) {
    return key + '=' + encodeURIComponent(options[key]).replace("(", "%28").replace(")", "%29");
  }).join('&');

  var url = [location.protocol, '//', location.host, location.pathname].join('');
  return url + "?" + qs + "#" + dataattr;
};

var additionalHighlight_rerender = function(chart) {
  $(`section[data-chart="${chart.self}"] .extra-highlights`).html("");
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
  updateQueryString(chart);

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
  gtag("event", "additional-highlight-remove", {event_category: chart.self});

  return false;
}

var ui_add_highlight = function(chart, chartId, index, selectedOption=null, isSubdata=false) {
  var el_add = $(`section[data-chart="${chartId}"] .extra-highlights`);
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

var _add_data_onchange = function (chart) {
  let el = $(`section[data-chart="${chart.self}"] .additional-data-select`);
  chart.extraData = _.map( el.toArray(), function (e) { return $(e).val(); } )

  el = $(`section[data-chart="${chart.self}"] .additional-data-select-scale`);
  chart.extraDataScale = _.map( el.toArray(), function (e) { return $(e).val(); } )

  process_data2(chart);
  render(chart);
  updateQueryString(chart);
}

var add_data_onchange = function (e) {
  const chart = getChart(e.target);
  _add_data_onchange(chart);

  gtag("event", "add-data-changed", {event_category: chart.self, event_label: JSON.stringify(chart.extraData)});
};

var add_data_onremove = function (e) {
  e.preventDefault();
  const chart = getChart(e.target);

  let child = e.target.parentElement.parentElement.parentElement.parentElement;
  $(child).remove();
  _add_data_onchange(chart);

  gtag("event", "add-data-remove", {event_category: chart.self, event_label: JSON.stringify(chart.extraData)});
};

var ui_add_data = function (chart, scale="graph", dataSelection = undefined) {
  let el_add = $(`section[data-chart="${chart.self}"] .extra-data`);
  let el_dataSelection = $(`section[data-chart="${chart.self}"] .data-select`);
  
  let scale_selected = { graph: "", separately: "" };
  scale_selected[scale] = "selected";

  let dataSelectOptions =
    `<select class="form-control additional-data-select" onchange="add_data_onchange(event)">
      ${el_dataSelection.html()}
    </select>`;

  if (dataSelection) {
    let el = $(dataSelectOptions);
    $("option:selected", el).removeAttr("selected");
    $(`option[value=${dataSelection}`, el).attr("selected", true);
    dataSelectOptions = el[0].outerHTML;
  }

  let html =
    `<div><div class="btn-group btn-group-toggle" data-toggle="buttons" style="padding-bottom: 3px;">
      <div class="input-group-prepend">
        <span class="input-group-text">[<a href="#" onclick="add_data_onremove(event)">X</a>] Additional Data:</span>
      </div>
      ${dataSelectOptions}
      <select class="form-control additional-data-select-scale" onchange="add_data_onchange(event)">
        <option value="graph"${scale_selected["graph"]}>Scale Using Graph Units</option>
        <option value="separately"${scale_selected["separately"]}>Scale Separately</option>
      </select>
    </div></div>`;

  el_add.append(html);
};


var updateQueryString = function(chart) {
  if (!chart) {
    for (let chartKey in charts) {
      updateQueryString(charts[chartKey]);
    }
    return;
  }
  var dataattr = chart.id.substring(6);
  var url = generateUrl(chart);

  var html = `Direct Link w/ Your Options: <a href="${url}">${url}</a>`;
  $(`section[data-chart="${dataattr}"] .query-string`).show();
  $(`section[data-chart="${dataattr}"] .query-string`).html(html);
};

var calculateDataOptions = function(value) {
  let options = {
    showDelta: false,
    isRatio: false,
    baseDataType: value,
    forceLinear: false
  };

  let valuePieces = value.split('-');
  if (valuePieces.length >= 2) {
    // eg: cases-daily
    options.baseDataType = valuePieces[0];
    options.showDelta = true;

    // eg: cases-daily-7
    if (valuePieces.length == 3) {
      options.avgData = parseInt(valuePieces[2]);
    }
  }

  switch (valuePieces[0]) {
    case 'testPositivity':
    case 'icu':
    case 'testPositivityRate':
    case 'ventilator':
    case 'beds':
    case 'mortalityRate':
      options.isRatio = true;
      options.forceLinear = true;  
      break;
  }

  switch (options.baseDataType) {
    case "mortalityRate":
      options.dataSourceNeeded = "deaths";
      break;

    case "testPositivity":
      options.dataSourceNeeded = "tests";
      break;

    default:
      options.dataSourceNeeded = options.baseDataType;
      break;
  }

  return options;
};

var updateDataSelectionOptions = function(chart, value, apply_ui_changes = true) {
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

  if (value == 'testPositivity' || value == 'mortalityRate' || value == 'testPositivityRate' || value == "icu" || value == "beds" || value == "ventilator") {
    chart.isRatio = true;
    chart.forceLinear = true;

    if (apply_ui_changes) { $(`section[data-chart="${chart.self}"] .scaleSelectionArea`).hide(); }
  } else if (chart.forceLinear) {
    chart.forceLinear = false;

    if (apply_ui_changes) { $(`section[data-chart="${chart.self}"] .scaleSelectionArea`).show(); }
  }


  chart.dataSelection = value;
  chart.y0 = 0.00001; // chart.dataSelection_y0[value];

  if (apply_ui_changes) { $("#" + chart.id.substring(6)).html("<h2>" + generateDataLabel(chart, true) + "</h2>"); }
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

    if (chart.id.indexOf("countries") != -1) { setStoredValue('country', val, 30); }
    if (chart.id.indexOf("states") != -1) { setStoredValue('state', val, 30); }

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

      if (!_intial_load) { render(chart); }
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

    process_data_and_render(chart);
    updateQueryString(chart);
    gtag("event", "change-data", {event_category: chartId, event_label: value});
  });

  $(".add-data").click(function (e) {
    e.preventDefault();

    const chart = getChart(e.target);

    let chart_dType = calculateDataOptions(chart.dataRawSelection);

    if (chart_dType.isRatio) { ui_add_data(chart, "separately"); }
    else                     { ui_add_data(chart); }
    
    _add_data_onchange(chart);
    gtag("event", "add-data", {event_category: chart.self});
  });

  $(".add-highlight").click(function (e) {
    e.preventDefault();

    const chart = getChart(e.target);

    let isSubdata = false;
    if ($(e.target).data("subdata")) {
      isSubdata = true;
      if (!chart.subdata) { process_data(_rawData, chart, true); }
    }

    ui_add_highlight(chart, chart.self, _additionalHighlight_index, null, isSubdata);
    _additionalHighlight_index++;

    if (!chart.extraHighlights) { chart.extraHighlights = []; }
    if (isSubdata) { chart.extraHighlights.push(chart.defaultSubHighlight); }
    else           { chart.extraHighlights.push(chart.defaultHighlight); }
    

    prep_data(chart);
    render(chart);
    updateQueryString(chart);
    gtag("event", "add-highlight", {event_category: chart.self, event_label: chart.extraHighlights.length});
  });

  $(".show-lesser-used-options").click(function (e) {
    const chart = getChart(e.target);

    $(e.target).hide();

    const el = $(`section[data-chart="${chart.self}"] .lesser-used-options`);
    el.show();

    gtag("event", "show-lesser-used-options", {event_category: chart.self});
    e.preventDefault();
  });

  $(".report-button").click(function (e) {
    const chart = getChart(e.target);
    $(e.target).hide();
    generateReport(chart);
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
      doInitialDataLoad();
      updateQueryString();
      gtag("event", "change-data", {event_category: 'all', event_label: value});
    }
  });

  _pageReady = true;
  tryRender();
});

var addHighlightFromReport = function(e, country) {
  const chart = getChart(e.target);
  if (  
    (chart.highlight == country) ||
    (chart.extraHighlights && chart.extraHighlights.indexOf(country) != -1)
  ) { return; }


  let isSubdata = false;
  if ($(e.target).data("subdata")) {
    isSubdata = true;
    if (!chart.subdata) { process_data(_rawData, chart, true); }
  }

  ui_add_highlight(chart, chart.self, _additionalHighlight_index, country, isSubdata);
  _additionalHighlight_index++;

  if (!chart.extraHighlights) { chart.extraHighlights = []; }
  if (isSubdata) { chart.extraHighlights.push(country); }
  else           { chart.extraHighlights.push(country); }
  

  prep_data(chart, false);
  render(chart);
  updateQueryString(chart);
  gtag("event", "add-highlight-from-report", {event_category: chart.self, event_label: country});
};

let _report_id = 1;
var doResetReport = function (chart) {
  if (_report_id != 1) {
    $(`section[data-chart="${chart.self}"] .report`).html(`<h5>Visualization Updated</h5><span class="text-center">Your display options were changed and a new report can now be generated.</span>`);
    $(`section[data-chart="${chart.self}"] .report-button`).show();
  }
}

var generateReport = function (chart) {
  let delta = 7;
  let reportData = [];

  for (let fData of chart.data) {
    let country = fData.country;
    let cData = fData.data;

    let dToday = cData[cData.length - 1];
    if (cData.length - 1 - delta < 0) { continue; }
    let dPrev = cData[cData.length - 1 - 7];

    if (dPrev.cases != 0) {
      let rawIncrease = dToday.cases - dPrev.cases;
      let pctIncrease = rawIncrease / dPrev.cases;
      reportData.push({
        country: country,
        raw: rawIncrease,
        pct: pctIncrease
      });
    }
  }

  let report = "";
  let timePeriodStr = "one week ago";

  let generateListElements = function(data, isPct) {
    let report = "";
    let ct = 0;
    for (let r of data) {
      let num;
      if (isPct) {
        num = (100 * r.pct).toLocaleString("en-US", {maximumFractionDigits: 2}) + "%";
        if (r.pct >= 0) { num = "+" + num; }
        num = "<b>" + num + "</b>";
        num += " change";
      } else {
        let sigDigits = 0;
        let dAbs = Math.abs(r.raw);

        if (chart.isRatio) { dAbs *= 100; }

        if (dAbs < 10) { sigDigits = 2; }
        if (dAbs < 0.1) { sigDigits = 4; }
        if (dAbs < 0.001) { sigDigits = 6; }

        if (chart.isRatio) { num = (100 * r.raw).toLocaleString("en-US", {maximumFractionDigits: sigDigits}); }
        else               { num = (r.raw).toLocaleString("en-US", {maximumFractionDigits: sigDigits}); }
        if (r.raw >= 0) { num = "+" + num; }
        num = "<b>" + num + "</b>";

        if (chart.isRatio) { num += "%"; }
        num += ` ${generateDataLabel(chart)}`;

        if (chart.normalizePopulation && !chart.isRatio) {
          num += ` /100k`;
        }
      }

      report += `<li><a href="#${chart.self}" onclick="addHighlightFromReport(event, '${r.country}');">${r.country}</a>: ${num}</li>`
      ct++;

      if (ct == 5) {
        let href = "r" + _report_id++;

        report += `<a href="#${href}" style="font-size: 12px; font-style: italic;" onclick="$('#${href}').show(); event.preventDefault(); $(this).hide();">[Show all ${data.length}]</a>`;
        report += `<div id="${href}" class="collapse">`;
      }
    }

    if (ct >= 5) {
      report += `</div>`;
    }

    return report;
  };


  report += `<div class="report" style="margin: 5px;">`;
  report += `<h5>Detailed Data Report: ${generateDataLabel(chart, true)}</h5>`;
  report += `This report is generated based entirely on the visualization options you have selected and includes <b>only</b> the data displayed above. `;
  report += `As you change the chart options, you can regenerate the report with your new data selection. `;
  report += `<i>(Click on any country in this report to add it as an additional highlight.)</i>`;
  report += "<hr>";


  report += `<div class="row">`;

  report += `<div class="col-lg-6">`;
  report += `Largest percent increases since ${timePeriodStr}:`;
  report += "<ol>";
  reportData = _.sortBy(reportData, "pct");
  reportData.reverse();
  report += generateListElements(reportData, true);
  report += "</ol>";
  report += `</div>`;

  report += `<div class="col-lg-6">`;
  report += `Largest raw increases since ${timePeriodStr}:`;
  report += "<ol>";
  reportData = _.sortBy(reportData, "raw");
  reportData.reverse();
  report += generateListElements(reportData, false);
  report += "</ol>";
  report += `</div>`;

  report += `</div>`;

  report += "<hr>";


  report += `<div class="row">`;
  
  report += `<div class="col-lg-6">`;
  report += `Largest percent decrease since ${timePeriodStr}:`;
  report += "<ol>";
  reportData = _.sortBy(reportData, "pct");
  report += generateListElements(reportData, true);
  report += "</ol>";
  report += `</div>`;

  report += `<div class="col-lg-6">`;
  report += `Largest raw decrease since ${timePeriodStr}:`;
  report += "<ol>";
  reportData = _.sortBy(reportData, "raw");
  report += generateListElements(reportData, false);
  report += "</ol>";
  report += `</div>`;

  report += `</div>`;  

  let el = $(`section[data-chart="${chart.self}"] .report`);
  el.html(report);
  el.show();

  gtag("event", "create-report", {event_category: chart.self});
};

var generateDataLabel_v3 = function(chart, dType, title = false) {
  var dataLabel = "";

  if (title) {
    if (dType.isRatio) {
      if (dType.showDelta) { dataLabel = "Daily "; }
      else { dataLabel = "Cumulative "; }      
    } 
    else if (dType.showDelta) { dataLabel = "New "; }

    if (dType.baseDataType == 'cases') { dataLabel += "Confirmed COVID-19 Cases"; }
    else if (dType.baseDataType == 'active') { dataLabel += "Active COVID-19 Cases"; }
    else if (dType.baseDataType == 'deaths') { dataLabel += "Deaths from COVID-19"; }
    else if (dType.baseDataType == 'recovered') { dataLabel += "Recoveries from COVID-19"; }
    else if (dType.baseDataType == 'hospitalized') { dataLabel += "Total hospitalized with COVID-19"; }
    else if (dType.baseDataType == 'tests') { dataLabel += "COVID-19 Tests Performed"; }  
    else if (dType.baseDataType == 'testPositivity' || dType.baseDataType == 'testPositivityRate') { dataLabel += "COVID-19 Test Positivity Rate"; }  
    else if (dType.baseDataType == 'mortalityRate') { dataLabel += "COVID-19 Case Fatality Rate"; }  
    else if (dType.baseDataType == 'icu') { dataLabel += "ICU Utilization"; }  
    else if (dType.baseDataType == 'ventilator') { dataLabel += "Ventilators In Use"; }  
    else if (dType.baseDataType == 'beds') { dataLabel += "Medical Beds In Use"; }  


    if (dType.showDelta) { dataLabel += " per Day"; }

    if (chart.id.indexOf("state") != -1) { dataLabel += " by US States/Territories"; }
    if (chart.normalizePopulation) { dataLabel += ", normalized by population"; }

    dataLabel += " in Illinois";
  } else {
    if (dType.isRatio) {
      //if (!dType.showDelta) { dataLabel = "cumulative "; }      
    } 
    else if (dType.showDelta) { dataLabel = "new "; }

    if (dType.baseDataType == 'cases') { dataLabel += "confirmed cases"; }
    else if (dType.baseDataType == 'active') { dataLabel += "active cases"; }
    else if (dType.baseDataType == 'deaths') { dataLabel += "deaths from COVID-19"; }
    else if (dType.baseDataType == 'recovered') { dataLabel += "recoveries"; }
    else if (dType.baseDataType == 'hospitalized') { dataLabel += "total hospitalizations"; }
    else if (dType.baseDataType == 'tests') { dataLabel += "COVID-19 tests performed"; }  
    else if (dType.baseDataType == 'testPositivity' || dType.baseDataType == 'testPositivityRate') { dataLabel += "test positivity"; }  
    else if (dType.baseDataType == 'mortalityRate') { dataLabel += "case fatality rate"; }  
    else if (dType.baseDataType == 'icu') { dataLabel += "ICU Utilization"; }  
    else if (dType.baseDataType == 'ventilator') { dataLabel += "ventilators in use"; }  
    else if (dType.baseDataType == 'beds') { dataLabel += "medical beds in use"; }  

  }

  return dataLabel;
}

var generateDataLabel = function(chart, title = false) {
  return generateDataLabel_v3(chart, calculateDataOptions(chart.dataRawSelection), title);
};


var numericFormat = function(num, minimumDecimals = 1) {
  let suggestedDecimals;
  if      (num > 100)  { suggestedDecimals = 0; }   /* 273 */
  else if (num > 10)   { suggestedDecimals = 1; }   /* 27.3 */
  else if (num > 1)    { suggestedDecimals = 2; }   /* 2.73 */
  else if (num > 0.1)  { suggestedDecimals = 3; }   /* 0.273 */
  else if (num > 0.01) { suggestedDecimals = 4; }   /* 0.0273 */
  else                 { suggestedDecimals = 5; }

  let maximumFractionDigits = Math.max(suggestedDecimals, minimumDecimals);

  return num.toLocaleString("en-US", {maximumFractionDigits: maximumFractionDigits});
};


var tip_html = function(chart) {
  return function(d, i) {
    const isSmall = (_client_width < 500);
    let highlights;
    if (chart._rendered_highlights) {
      highlights = chart._rendered_highlights;
    } else {
      highlights = [chart.highlight].concat( (chart.extraHighlights)?(chart.extraHighlights):[] );
    }

    const isHighlighted = ( highlights.indexOf(d.country) != -1 );
    
    let alignRight = false;
    if (chart.xaxis && chart.xaxis.indexOf("right") != -1) { alignRight = true; }

    //var gData = _.find(chart.data, function (e) { return e.country == d.country }).data;
    var gData = d.src.data;
    var dType = calculateDataOptions(d.src.dataSelection);

    var geoGrowth = [];

    let d0, d_prev;
    d_prev = d0 = _.find(gData, function(r) { return r.daysAgo == d.daysAgo + 1; });
    if (d0) {
      let ggrowth = Math.pow(d.cases / d0.cases, 1 / (d.dayCounter - d0.dayCounter));
      if (isFinite(ggrowth)) {
        geoGrowth.push(`Previous day: <b>${ggrowth.toFixed(2)}x</b> growth`);
      }
    }

    d0 = _.find(gData, function(r) { return r.daysAgo == d.daysAgo + 7; });
    if (d0) {
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
    if (chart.normalizePopulation && !dType.isRatio) { s2 = " per 100,000 people"; }

    var dataLabel = generateDataLabel_v3(chart, dType);
    var dataLabel_cutoff = dataLabel;
    
    if (dType.baseDataType == 'testPositivity') { dataLabel_cutoff = "tests"; }
    else if (dType.baseDataType == 'mortalityRate') { dataLabel_cutoff = "deaths from COVID-19"; }  

    let daysSince = `(`;
    daysSince += `<b>${d.daysAgo}</b> day${(d.daysAgo != 1)?"s":""} ago)`;
    //daysSince += `<b>${d.dayCounter}</b> day${(d.dayCounter != 1)?"s":""} after reaching ${chart.y0} ${dataLabel_cutoff}${s2})`;
    if (dType.baseDataType == 'hospitalized' || dType.baseDataType == 'tests') {
      daysSince = "";
    }


    let dateStr = "";
    let date = convertDateToObject(d.date);
    
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
    if (dType.isRatio) {
      numberStr = numericFormat( (((d.rawcases)?d.rawcases:d.cases) * 100), 2 ) + "%";
    } else {
      numberStr = numericFormat( ((d.rawcases)?d.rawcases:d.cases) , 1);
    }

    if (d.rawcases) { s += "<i>"; }
    s += `<div class="tip-details" style="border-bottom: solid 1px black; padding-bottom: 2px;"><b>${numberStr}</b> ${dataLabel}${s2} on ${dateStr}${d.date} ${daysSince}</div>`;
    if (d.rawcases) { s += "</i>"; }

    if (dType.isRatio) {
      let d_n = d.n, d_d = d.d;

      let n_label, d_label;
      switch (dType.baseDataType) {
        case "testPositivity":
          n_label = "cases";
          d_label = "tests";
          break;

        case "mortalityRate":
          n_label = "deaths";
          d_label = "cases";
          break;
      }

      
      
      if (d_prev) {
        let d_cur = d;

        if (dType.showDelta) {
          d_n = d_cur.n - d_prev.n;
          d_d = d_cur.d - d_prev.d;
        }
        
        let avgString = "";
        if (chart.avgData) {
          avgString = `Past ${chart.avgData} days: `;
          d_n = d_cur.sum_n;
          d_d = d_cur.sum_d;
        }

        if (d_n && isFinite(d_n) && d_d && isFinite(d_d)) {
          s += `<div class="tip-details" style="padding-bottom: 2px;"><i>` +
            `${avgString}<b>${ numericFormat(d_n) }</b> new ${n_label} / <b>${ numericFormat(d_d) }</b> new ${d_label}` +
            `</i></div>`;
        }
      }

      geoGrowth = [];
    }

    if (d.rawcases && d.cases) {
      if (dType.isRatio) {
        //numberStr = (d.cases * 100).toLocaleString("en-US", {maximumFractionDigits: 2}) + "%";
        numberStr = numericFormat( d.cases * 100, 2 ) + "%";
      } else {
        //numberStr = (d.cases).toLocaleString("en-US", {maximumFractionDigits: 1})
        numberStr = numericFormat( d.cases );
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
      s += `<i style="color: purple;">Shift-click to add as an additional highlight and to show all data circles.</i>`
      s += `</div>`;
    }

    gtag("event", "mouseover", {event_category: chart.self, event_label: d.country, value: d.dayCounter});
    return s;
  }
};

var textToClass = function (s) {
  return s.replace(/[\W_]+/g,"-");
};

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

var renderEvent = function(e) {
  const chart = getChart(e.target);
  render(chart);
}

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
  if (chart.xaxis.substring(0, 5) == "right") {
    if (!f || chart.xaxis == "right-all") {
      let m = _.maxBy(chart.data, 'totalDays');
      maxDayRendered = m.totalDays;
    } else {
      let totalDays = _.maxBy(f, 'totalDays').totalDays;
      maxDayRendered = totalDays;
    }


    if (chart.xaxis == "right-4wk") {
      maxDayRendered = Math.min( maxDayRendered, 28 );
    } else if (chart.xaxis == "right-8wk") {
      maxDayRendered = Math.min( maxDayRendered, 28 * 2 );
    } else if (chart.xaxis == "right-12wk") {
      maxDayRendered = Math.min( maxDayRendered, 28 * 3 );
    }

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
  let chart_frame = _.cloneDeep(chart);

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

  let isLastAnimationFrame = !(filter <= maxDayRendered && (filter == 0 || _animation_timeout));

  doRender(chart_frame, !isLastAnimationFrame);

  if (isLastAnimationFrame) {
    _animation_timeout = null;
    $(`.animate-button[data-chart="${chart.self}"]`).html("&#9654; Animate");
  } else {
    _animation_timeout = setTimeout(function() { doAnimate(chart, filter + 1) }, 100);
  }
};


var showDownload = function(chart, message = "", url, fileName) {
  $("#" + chart.id).html(`<div class="text-center divoc-graph-loading">
    <h4 style="padding-top: 30px">${message}</h4>
    <a class="btn btn-primary" role="button" href="${url}" download="${fileName}">Download</a>
    <button type="button" class="btn btn-info" onclick="renderEvent(event)">Return to Chart</button>
  </div>`);
}

var showWebMFailure = function(chart) {
  $("#" + chart.id).html(`<div class="text-center divoc-graph-loading">
    <h4 style="padding-top: 30px">WebM Encoding Failed</h4>
    <p>Your browser does not support WebM encoding.  Try using the GIF option to save an animation.</p>
    <button type="button" class="btn btn-info" onclick="renderEvent(event)">Return to Chart</button>
  </div>`);
}

var showGifFailure = function(chart) {
  $("#" + chart.id).html(`<div class="text-center divoc-graph-loading">
    <h4 style="padding-top: 30px">GIF Encoding Failed</h4>
    <p>Your browser does not support GIF encoding.  You can use screen capture tool to save an animation.</p>
    <button type="button" class="btn btn-info" onclick="renderEvent(event)">Return to Chart</button>
  </div>`);
}


var saveVideo = function(chart, format = "gif", jumpBy = 1) {
  let _cancelAnimation = false;
  let videoWriter;

  var cancelAnimationRender = function () {
    _cancelAnimation = true;
    showLoadingSpinner(chart, `Canceling Animation...`);

    if (videoWriter) {
      try {
        if      (format == "gif")  { videoWriter.abort(); }
      } catch (e) { }
    }
  };

  var createAnimationCanvasList = async function(chart, jumpBy) {
    let filter = 0;
    let isLastAnimationFrame = false;
    let canvasList = [];
    let maxDayRendered = calculateMaxDayRendered(chart);
    
    await saveGraph_fetchCSS();
    while (filter <= maxDayRendered && !_cancelAnimation) {
      let lastFrame = false;
      if (filter == maxDayRendered) { lastFrame = true; }

      if (!lastFrame) {
        showLoadingSpinner(chart, `Creating animation frame ${filter + 1}/${maxDayRendered + 1}...`, () => cancelAnimationRender());
      } else {
        showLoadingSpinner(chart, `Finalizing animation...`);
      }

      let chart_frame = _.cloneDeep(chart);

      let filterFunction;
      if (chart.xaxis && chart.xaxis != "left") {
        filterFunction = function (d) { return (d.daysAgo >= maxDayRendered - filter ); }
      } else {
        filterFunction = function (d) { return (d.dayCounter <= filter); }
      }

      for (let chartData of chart_frame.data) {
        chartData.data = _.filter(chartData.data, filterFunction);
      }

      svg = doRender(chart_frame, !isLastAnimationFrame, null).node();
      canvas = await svgToCanvas(svg);

      canvasList.push(canvas);
      filter = filter + jumpBy;

      // Ensure the last frame is always captured
      if (!lastFrame && filter > maxDayRendered) {
        filter = maxDayRendered;
      }
    }

    return canvasList;
  };

  var _saveVideo = async function(chart, format, jumpBy) {
    try {
      // Init
      if      (format == "webm") { videoWriter = new WebMWriter({ frameDuration: 100 }); }
      else if (format == "gif")  { videoWriter = new GIF(); }    

      let canvasList = await createAnimationCanvasList(chart, jumpBy);
      for (let i = 0; i < canvasList.length && !_cancelAnimation; i++) {
        let canvas = canvasList[i];
        showLoadingSpinner(chart, `Rendering animation frames...`);

        let delay = 100;
        if (i == canvasList.length - 1) { delay = 2000; }

        // Add Frame
        if      (format == "webm") { videoWriter.addFrame(canvas, delay); }
        else if (format == "gif")  { videoWriter.addFrame(canvas, {delay: delay}); }  
      }

      // Finalize
      if (_cancelAnimation) {
        doRender(chart);
      } else if (format == "webm") {
        showLoadingSpinner(chart, `Finalizing video...`);
        let blob =  await videoWriter.complete();

        let url = URL.createObjectURL(blob);
        let fileName = "91-DIVOC-" + chart.self + ".webm";
        showDownload(chart, "Your video is ready!", url, fileName);
      }
      
      else if (format == "gif")  {
        videoWriter.on('abort', function(pct) {
          doRender(chart);
        });

        videoWriter.on('progress', function(pct) {
          showLoadingSpinner(chart, `Finalizing GIF (${(100 * pct).toFixed(0)}%)...`, () => cancelAnimationRender());
        });

        videoWriter.on('finished', function(blob) {
          let url = URL.createObjectURL(blob);
          let fileName = "91-DIVOC-" + chart.self + ".gif";
          showDownload(chart, "Your GIF is ready!", url, fileName);
        });

        videoWriter.render();
      }

    } catch (e) {
      console.error(e);
      if (format == "gif") { showGifFailure(chart); } 
      if (format == "webm") { showWebMFailure(chart); } 
    }
  };

  if (format == "webm") {
    if (typeof WebMWriter == "undefined") { $.getScript("js/webm-writer-0.3.0.js", function () { _saveVideo(chart, format, jumpBy); } ) }
    else { _saveVideo(chart, format, jumpBy); }
  } else if (format == "gif") {
    if (typeof GIF == "undefined") { $.getScript("js/gif.js", function () { _saveVideo(chart, format, jumpBy); } ) }
    else { _saveVideo(chart, format, jumpBy); }
  }
};

var getAttribution = function(chart) {
  let realDataSource = _data_src;
  if (_data_src == "merged") {
    switch (chart.self) {
      case "countries":
      case "countries-normalzied":
        realDataSource = "merged";
        break;

      default:
        realDataSource = "jhu";
        break;
    }
  }

  let srcString;
  srcString = _data_sources[realDataSource].name;

  return `Data: ${srcString}; Updated: ${_dateUpdated}`;
}

var changeDataSourceSelection = function(newDataSource) {
  $(".datasrc-select").val(newDataSource).change();
};

var doRender = function(chart, isInAnimation = false, target = chart.id) {
  let dType = calculateDataOptions(chart.dataRawSelection);
  if (chart.data.length == 0) {
     let dataSourceNeeded = chart.dataSourceNeeded + "-" + dType.dataSourceNeeded;

     let message = "";
     if (_data_sources[_data_src].provides.indexOf(dataSourceNeeded) == -1) {
       message += `<b>${_data_sources[_data_src].name}</b> does not provide county-level data for your selection. <b>Select a region or All Regions</b> to see this data from IL-PHD.`;
    }
    
    if (chart.highlight == "(None)" && chart.show == "highlight-only") {
    message = "You are asking for the impossible, I like the way you think! :)<br><br>" +
      `However, there is nothing to display when you select <b>(None)</b> as the highlight and then to show <b>"Highlight Only"</b>.`;
    }

    $("#" + chart.id).html(`<div class="divoc-graph-loading"><div role="status" style="padding: 20px;">
      ${message}
    </div></div>`);
    return;
   }

  // Find data on all highlights
  var highlights = [ chart.highlight ];
  if (chart.extraHighlights) { highlights = highlights.concat( chart.extraHighlights ); }

  if (highlights.indexOf("(All Regions)") != -1) {
    for (let regionName in il_regions) {
      if (regionName != "Cook" && highlights.indexOf(regionName) == -1) {
        highlights.push(regionName);
      }
    }
  }

  chart._rendered_highlights = highlights;

  
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

  var margin = { top: 10, right: 20, bottom: 45, left: 40 };

  var cur_width;
  
  if (target) {
    cur_width = $("#sizer").width();
    _client_width = cur_width;
    cur_width -= 2;
  } else {
    cur_width = 1108;
  }

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

  if (!target) {
    margin.top += 25;
  }

  let future_date, future_time_added_right = 0;
  //future_date = new Date("2020-11-21");

  if (future_date) {
    future_time_added_right = (future_date.getTime() - _dateObj_today_time) / (1000 * 3600 * 24);
  }

  if (labelOffGrid && future_time_added_right < 10) {
    let maxCountryLength = 0;
    for (let s of highlights) {
      if (s) { maxCountryLength = Math.max(maxCountryLength, s.length); }
    }
    if (isSmall && maxCountryLength > 12) { maxCountryLength = 12; }

    if (maxCountryLength > 10) {
      margin.right += Math.ceil(maxCountryLength * 8.5);
    } else {
      margin.right += Math.ceil(maxCountryLength * 10);
    }
  }

  var width = cur_width - margin.right - margin.left;


  // Find percentage graph
  //let dType = calculateDataOptions()
  let isRatio = dType.isRatio;


  // switch (chart.dataSelection) {
  //   case 'testPositivity':
  //   case 'mortalityRate':
  //     isRatio = true;
  //     break;
  // }


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

  // Create scale_data including all data to consider for scaling...
  let scale_data = chart.data;
  if (chart.extraData) {
    scale_data = [].concat(chart.data);
    for (let i = 0; i < chart.extraData.length; i++) {
      let extraDataScale = chart.extraDataScale[i];
      if (extraDataScale == "graph") {
        let extraDataStr = chart.extraData[i];
        scale_data = scale_data.concat( chart.displayData[extraDataStr + "-extraData"] );
      }
    }
  }

  let scale_yMax;

  let _find_max_cases = function(data) {
    var maxCases = -1;
    for (let d of data) {
      if (d.data.length > 0) {
        let dataInScope = [];
        if (alignRight) {
          dataInScope = _.filter(d.data, function (d) { return (d.daysAgo <= maxDayRendered) });
        } else {
          dataInScope = d.data;
        }

        if (dataInScope.length > 0) {       
          let max = _.maxBy(dataInScope, 'cases')
          
          if (max) {
            max = max.cases;
            if (max > maxCases) { maxCases = max; }
          }
        }
      }
    }

    return maxCases;
  };

  let scale_y_highlight, scale_y_curMax;
  if (chart.yAxisScale == "highlight" || chart.yAxisScale == "both" || chart.yAxisScale == "fixed") {
    let highlights_data;
    if (chart.yAxisScale == "highlight" || chart.yAxisScale == "both") {
      highlights_data = _.filter(scale_data, function (d) { return highlights.indexOf(d.country) != -1; });
    } else {
      highlights_data = scale_data;
    }

    if (highlights_data.length > 0) {
      let maxCases = _find_max_cases(highlights_data);
      scale_y_highlight = scale_yMax = maxCases * 1.05;
    }
  }
  
  if (!f || chart.yAxisScale == "highlightCurMax" || chart.yAxisScale == "currentMax" || chart.yAxisScale == "both") {
    let maxCasesValue = 0;

    if (f && chart.yAxisScale == "highlightCurMax") {
      scale_data = _.filter(scale_data, function (d) { return highlights.indexOf(d.country) != -1; });
    }

    for (let d of scale_data) {
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
    if (scale_y_highlight && scale_y_curMax) {
      scale_yMax = Math.max(scale_y_highlight, scale_y_curMax);
    } else if (scale_y_highlight) {
      scale_yMax = scale_y_highlight;
    } else {
      scale_yMax = scale_y_curMax;
    }
  }

  if (!scale_yMax) {
    scale_yMax = 1;
  }

  let forcedScale = false;
  if (isRatio) {
    scale_y0 = 0;

    if (dType.baseDataType == "icu" || dType.baseDataType == "ventilator" || dType.baseDataType == "beds") {
      scale_yMax = 1;
      forcedScale = true;
    }
    
    if (scale_yMax > 1) {
      scale_yMax = _.maxBy(scale_data, 'maxCases').maxCases;
      if (scale_yMax > 1) { scale_yMax = 1; }
    } else if (scale_yMax == 0) {
      scale_yMax = 1;
    }
  } else {
    if (scale_yMax < 3) {
      scale_yMax = 3;
      forcedScale = true;
    }
  }

  casesScale.domain([scale_y0, scale_yMax]).range([height, 0]);
  
  // Color Scale
  var colorScale = d3.scaleOrdinal(d3.schemeCategory10);
  for (let countryName of highlights) {
    colorScale(countryName);
  }

  // SVG
  var svg, baseSvg;

  if (target == null) {
    baseSvg = svg = d3.create("svg")
    .attr("version", 1.1)
    .attr("xmlns", "http://www.w3.org/2000/svg")    
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("width", width + margin.left + margin.right)
    .style("height", height + margin.top + margin.bottom);
  } else {
    $("#" + chart.id).html("");

    baseSvg = svg = d3.select("#" + target)
    .append("svg")
    .attr("version", 1.1)
    .attr("xmlns", "http://www.w3.org/2000/svg")    
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("width", width + margin.left + margin.right)
    .style("height", height + margin.top + margin.bottom);
  }

  svg.append("style");
  var hasAddedMouseOver = false;

  svg = svg.append("g")
  .on('mouseover', function () {
    if (!hasAddedMouseOver) {
      hasAddedMouseOver = true;

      svg.selectAll(".Cmouse")
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
            updateQueryString(chart);
          }
        }
      })
    }
  })
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Mouseovers
  var tip = d3.tip().attr('class', 'd3-tip').html(tip_html(chart));
  svg.call(tip);




  if (!target) {
    svg.append("text")
      .attr("x", -margin.left + 2)
      .attr("y", -margin.top + 20)
      .attr("class", "chart-header")
      .text(generateDataLabel(chart, true));
  }

  if (alignRight) {
    svg.append("rect")
      .attr("x", daysScale(-14))
      .attr("width", daysScale(0) - daysScale(-14))
      .attr("y", 0)
      .attr("height", height)
      .attr("fill", "#fffffa");

    // 
    let dateLines = [];
    let endDate = (future_date) ? (future_date) : _dateObj_today;
    for (let relDate = new Date("2020-02-01 00:00:00");
        relDate < endDate;
        relDate = new Date(relDate.setMonth(relDate.getMonth()+1)))
    {
      let daysAgo = Math.round((_dateObj_today_time - relDate.getTime() + 3.7e6) / (1000 * 3600 * 24));
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

  const phase4lines = {
    "icu": 0.9,
    "ventilator": 0.9,
    "beds": 0.9,
    "testPositivityRate": 0.08,
    "testPositivity": 0.08
  }

  if (phase4lines[dType.baseDataType]) {
    svg.append("line")
    .attr("x1", 0)
    .attr("x2", width)
    .attr("y1", casesScale(phase4lines[dType.baseDataType]))
    .attr("y2", casesScale(phase4lines[dType.baseDataType]))
    .attr("stroke", "red")
    .attr("stroke-dasharray", "2");

    svg.append("text")
    .attr("x", width / 2)
    .attr("y", casesScale(phase4lines[dType.baseDataType]) - 5)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("fill", "red")
    .attr("font-weight", "bold")
    .text("Mitigation Threshold")

    /*
    svg.append("text")
    .attr("x", width / 2)
    .attr("y", casesScale(phase4lines[dType.baseDataType]) + 4)
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "hanging")
    .attr("font-size", "12px")
    .attr("fill", "black")
    .attr("font-weight", "bold")
    .text("Mitigation Threshold")
    */
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
    while (day <= scaleLineMeta.dEnd && cases <= scale_yMax * scaleLineMeta.gRate && cases >= 1) {
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
  //else if (chart.dataSelection == 'active') { xAxisLabel += "active case"; if (chart.y0 != 1) { xAxisLabel += "s"; }}
  else if (chart.dataSelection == 'deaths' || chart.dataSelection == 'mortalityRate') { xAxisLabel += "death"; if (chart.y0 != 1) { xAxisLabel += "s"; } }
  else if (chart.dataSelection == 'tests' || chart.dataSelection == 'testPositivity') { xAxisLabel += "test"; if (chart.y0 != 1) { xAxisLabel += "s"; } }
  else if (chart.dataSelection == 'recovered') { xAxisLabel += "recover"; if (chart.y0 != 1) { xAxisLabel += "ies"; } else { xAxisLabel += "y"; }}
  else if (chart.dataSelection == 'hospitalized') { xAxisLabel += "hospitalization"; if (chart.y0 != 1) { xAxisLabel += "s"; }}
  if (chart.normalizePopulation && !chart.isRatio) { xAxisLabel += "/100k people"; }

  /*
  if (chart.dataSelection == 'tests') { xAxisLabel = "Days since Apr. 12"; }
  else if (chart.dataSelection == 'hospitalized') { xAxisLabel = "Days since Apr. 12"; }
  */

  if (alignRight) {
    xAxisLabel = "Number of days ago";
  }

  svg.append("text")
     .attr("x", width - 5)
     .attr("y", height - 5)
     .attr("class", "axis-title")
     .attr("text-anchor", "end")
     .text(xAxisLabel);

  let _draw_yAxisLabel = function(g, dType) {
    var yAxisLabel = "";
    if (dType.showDelta) { yAxisLabel += "New Daily "; }
    if (dType.baseDataType == 'cases') { yAxisLabel += "Confirmed Cases"; }
    else if (dType.baseDataType == 'active') { yAxisLabel += "Active Cases"; }
    else if (dType.baseDataType == 'deaths') { yAxisLabel += "COVID-19 Deaths"; }
    else if (dType.baseDataType == 'recovered') { yAxisLabel += "Recoveries" }
    else if (dType.baseDataType == 'tests') { yAxisLabel += "COVID-19 Tests" }
    else if (dType.baseDataType == 'hospitalized') { yAxisLabel += "Hospitalizations of COVID-19" }
    else if (dType.baseDataType == 'testPositivity') { yAxisLabel += "Test Positivity Rate" }
    else if (dType.baseDataType == 'testPositivityRate') { yAxisLabel += "Test Positivity Rate" }
    else if (dType.baseDataType == 'mortalityRate') { yAxisLabel += "Case Fatality Rate" }
    else if (dType.baseDataType == 'icu') { yAxisLabel += "ICU Utilization" }
    else if (dType.baseDataType == 'beds') { yAxisLabel += "Medical Beds In Use" }
    else if (dType.baseDataType == 'ventilator') { yAxisLabel += "Ventilators In Use" }


    if (chart.normalizePopulation && !dType.isRatio) {
      yAxisLabel += "/100k people";
    }
  
    g.append("text")
     .attr("transform", "rotate(-90)")
     .attr("x", -2)
     .attr("y", 15)
     .attr("class", "axis-title")
     .attr("text-anchor", "end")
     .text(yAxisLabel);
  
    if (dType.avgData) {
      g.append("text")
       .attr("transform", "rotate(-90)")
       .attr("x", -2)
       .attr("y", 28)
       .attr("class", "axis-title")
       .attr("text-anchor", "end")
       .style("font-size", "12px")
       .style("fill", "#888")
       .text(`(${dType.avgData}-day Average)`);
    }
  };

  var yaxis_g = svg.append("g");
  _draw_yAxisLabel(yaxis_g, calculateDataOptions(chart.dataRawSelection));

  svg.append("text")
  .attr("x", width)
  .attr("y", height + 32)
  .attr("class", "text-credits")
  .attr("text-anchor", "end")
  .text(getAttribution(chart));

  svg.append("text")
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
    else {
      if (!d1.data || d1.data.length == 0) { return 0; }
      if (!d2.data || d2.data.length == 0) { return 0; }

      let d1_d = d1.data[ d1.data.length - 1 ].cases;
      let d2_d = d2.data[ d2.data.length - 1 ].cases;

      if      (d1_d > d2_d) { return -1; }
      else if (d1_d < d2_d) { return 1; }
      else { return 0; }
    }
  });

  var highlightedLabelLocations = {}, nonhighlightedLabelLocations = {};

  var renderLineChartLabels = function (svg, i, data, dasharray) {
    var countryData = data[i];
    if (!countryData.data[0]) { return; }
    var isHighlighted = (highlights.indexOf(countryData.country) != -1);

    var countryText = svg.append("text")
      .attr("fill", function (d) { return colorScale(countryData.data[0].country); })
      .attr("class", "label-country C-" + textToClass(countryData.data[0].country))
      .classed("C_highlight", isHighlighted)
      .style("opacity", function () {
        if (isHighlighted) { return 1; }
        else { return 0.3; }
      })
      .style("font-size", function () {
        if (isHighlighted) {
          if (dasharray) { return "8px"; }
          return "15px";
        }
        else { return null; }
      })
      .text( function () {
        if (dasharray) {
          let s = calculateDataOptions(countryData.data[0].src.dataSelection).baseDataType;
          return s.charAt(0).toUpperCase() + s.slice(1);
        } else {
          if (isSmall && countryData.country.indexOf("Region: ") != -1) {
            return countryData.country.substring(8);  
          }
          return countryData.country;
        }
      });

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
          return daysScale( -lastDataPoint.daysAgo ) + 5;
        })
        .attr("y", function () {
          if (lastDataPoint.cases < scale_y0) { return height + 5; }

          let yLocation = Math.round( casesScale( lastDataPoint.cases ) );
          let yChange = 0;
          let yRange = 5;
          let labelLocations;

          if (isHighlighted) {
            yRange = 10;
            labelLocations = highlightedLabelLocations;
          } else {
            labelLocations = nonhighlightedLabelLocations;
          }

          while (
            yChange < yRange * 2 &&
            labelLocations[yLocation + yChange] &&
            labelLocations[yLocation - yChange] 
          ) {
            yChange++;
          }

          if (yChange == yRange * 2) { }
          else if ( !labelLocations[yLocation + yChange] ) { yLocation = yLocation + yChange; }
          else if ( !labelLocations[yLocation - yChange] ) { yLocation = yLocation - yChange; }

          for (let dy = -yRange; dy <= yRange; dy++) {
            labelLocations[yLocation + dy] = 1;
          }

          return yLocation;
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

  var renderLineChart = function(svg, i, data, dasharray) {
    var countryData = data[i];
    if (!countryData.data[0]) { return; }

    var isHighlighted = (highlights.indexOf(countryData.country) != -1);
    var maxDay = countryData.maxDay;

    let line = svg.datum(countryData.data)
      .append("path")
      .attr("fill", "none")
      .attr("class", function (d) { return "C-" + textToClass(d[0].country); })
      .attr("stroke", function (d) { return colorScale(d[0].country); } )
      .attr("stroke-width", function (d) {
        if (isHighlighted) {
          if (dasharray) { return 2; }
          return 4;
        }
        else { return 1; }
      })
      .style("opacity", function (d) {
        if (isHighlighted) { return 1; }
        else { return (isSmall) ? 0.15 : 0.3; }
      })
      .attr("d", d3.line()
        .x(function (d) {
          if (alignRight) { return daysScale( -d.daysAgo ); }
          if (d.alignedDayCounter) { return daysScale(d.alignedDayCounter); }
          return daysScale(d.dayCounter);
        })
        .y(function (d) {
          if (!d.cases || Number.isNaN(d.cases)) { return height + 5; }
          return casesScale(d.cases);
        })
        .defined(function (d) {
          if (!d.cases || Number.isNaN(d.cases)) { return false; }
          return (d.cases >= scale_y0);
        })
      );

    if (dasharray) {
      line.attr("stroke-dasharray", dasharray);
    }

    
    let countryCircles = svg.selectAll("countries")
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
        if (alignRight) { return daysScale( -d.daysAgo ); }
        if (d.alignedDayCounter) { return daysScale(d.alignedDayCounter); }
        return daysScale(d.dayCounter);
      })
      .attr("cy", function (d) {
        if (!d.cases || Number.isNaN(d.cases)) { return height + 5; }
        if (d.cases < scale_y0) { return height + 5; }
        return casesScale(d.cases);
      })
      .style("opacity", function (d) {
        if (isHighlighted) { return 1; }        
        else { return (isSmall) ? 0.15 : 0.3; }
      })
      .attr("r", function (d) {
        if (isHighlighted) {
          if (dasharray) { return 2; }
          return 4;
        }
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
      .attr("class", function (d) { return "Cmouse C-" + textToClass(d.country); })
      .attr("fill", function (d) { return colorScale(d.country); })
  };

  var __render_line_chart = function(svg, data, dasharray = undefined) {
    // Draw labels below circles/lines
    for (var i = 0; i < data.length; i++) {
      renderLineChartLabels(svg, i, data, dasharray);
    }

    // Draw circles last so they're on top for mouseovers
    for (var i = 0; i < data.length; i++) {
      renderLineChart(svg, i, data, dasharray);
    }
  };

  __render_line_chart(svg, chart.data);
  
  if (chart.extraData) {
    let dashPatterns = ["4", "1", "8", "2"];
    let translateScale = 65;
    for (let i = 0; i < chart.extraData.length; i++) {
      let extraDataStr = chart.extraData[i];
      let displayData = chart.displayData[extraDataStr + "-extraData"];

      let extraDataScale = chart.extraDataScale[i];
      if (extraDataScale == "separately") {
        let maxCases = _find_max_cases(displayData);
        casesScale.domain([scale_y0, maxCases * 1.05]).range([height, 0]);

        let dType = calculateDataOptions(extraDataScale);
        if (dType.isRatio) {
          if ((maxCases * 1.05) <= 0.07) {
            y_axis_tickFormat = d3.format(".1%");
          } else {
            y_axis_tickFormat = d3.format(".0%");
          }
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
      
        let y_axis2 = d3.axisLeft(casesScale).tickFormat(y_axis_tickFormat);
        
        svg.append('g')
          .attr("transform", `translate(${translateScale}, 0)`)
          .style("opacity", "0.5")
          .attr("class", "axis")
          .call(y_axis2);

        let y_axis2_g = svg.append('g')
          .attr("transform", `translate(${translateScale}, 0)`)
          .style("opacity", "0.5");

        _draw_yAxisLabel(y_axis2_g, calculateDataOptions(extraDataStr));
        translateScale += 60;
      }

      if (!alignRight) {
        for (let countryData of displayData) {
          let baseData = _.find(chart.data, function (e) { return e.country == countryData.country; } )
          if (!baseData) { continue; }

          for (let d of countryData.data) {
            let d_base = _.find(baseData.data, function (bd) { return bd.date == d.date; });
            if (d_base) { d.alignedDayCounter = d_base.dayCounter; }
          }
        }
      }

      __render_line_chart(svg, displayData, dashPatterns[ i % dashPatterns.length ]);
    }
  }


  if (target && !f && chart.highlight[0] != "(") {
    var desc = `${chart.y0} `
    if (chart.dataSelection == 'cases') { desc += "case"; if (chart.y0 != 1) { desc += "s"; }}
    else if (chart.dataSelection == 'active') { desc += "active case"; if (chart.y0 != 1) { desc += "s"; }}
    else if (chart.dataSelection == 'deaths' || chart.dataSelection == 'mortalityRate') { desc += "death"; if (chart.y0 != 1) { desc += "s"; } }
    else if (chart.dataSelection == 'recovered') { desc += "recover"; if (chart.y0 != 1) { desc += "ies"; } else { desc += "y"; }}
    else if (chart.dataSelection == 'testPositivity') { desc += "test"; if (chart.y0 != 1) { desc += "s"; }}
    else if (chart.dataSelection == 'hospitalized') { desc += "hospitalization"; if (chart.y0 != 1) { desc += "s"; }}
    if (chart.normalizePopulation && !chart.isRatio) { desc += "/100k people"; }

    $("#" + chart.id).append(
      `<div class="alert alert-secondary" style="margin-top: 10px; margin-bottom: 0px; text-align: center; font-size: 12px;">
      <b>Note:</b> ${chart.highlight} is not available in the selected data and, therefore, cannot be highlighted.
      </div>`);
  }

  if (target && !forcedScale && minHighlightHeight > (0.67 * height) && !_animation_timeout && chart.highlight != "(None)" && minHighlightHeight < 99999) {
    $("#" + chart.id).append(`<div class="alert alert-info" style="margin-top: 10px; margin-bottom: 0px; text-align: center; font-size: 12px;">Note: All of your highlighted data is in the bottom third of the graph. <a href="#" onclick="scaleToHighlight(event)">You can get a zoomed-in view of the graph by setting <b>Y-Axis</b> to <b>"Scale to Highlight"</b>.</a></div>`);
  }

  if (!_animation_timeout && target != null) {
    gtag("event", "render", {event_category: chart.self});
  }

  return baseSvg;
};
