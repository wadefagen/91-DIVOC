var _rawData = null;
var _popData = null;
var dateColumns = [];
var _client_width = -1;
var _intial_load = true;

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
    sort: function (d) { return -d.maxCases; },
    dataSelection: 'cases',
    showDelta: true,
    avgData: 7,
    dataSelection_y0: { 'active': 100, 'cases': 100, 'deaths': 10, 'recovered': 100, 'new-cases': 1 },
    yAxisScale: 'fixed',
    xMax: null, yMax: null, data: null,
    trendline: "default",
    dataRawSelection: "cases-daily-7",
    xaxis: "right"
  },
  'states': {
    self: 'states',
    reducer: reducer_byUSstate,
    scale: "log",
    highlight: defaultState,
    defaultHighlight: defaultState,
    y0: 20,
    xCap: 40,
    id: "chart-states",
    normalizePopulation: false,
    show: "all",
    sort: function (d) { return -d.maxCases; },
    dataSelection: 'cases',
    showDelta: true,
    avgData: 7,
    dataSelection_y0: { 'active': 20, 'cases': 20, 'deaths': 5, 'recovered': 20, 'hospitalized': 1, 'tests': 1 },
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
    sort: function (d) { return -d.maxCases; },
    dataSelection: 'cases',
    showDelta: true,
    avgData: 7,
    dataSelection_y0: { 'active': 1, 'cases': 1, 'deaths': 1, 'recovered': 1 },
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
    show: "all",
    sort: function (d) { return -d.maxCases; },
    dataSelection: 'cases',
    showDelta: true,
    avgData: 7,
    dataSelection_y0: { 'active': 1, 'cases': 1, 'deaths': 1, 'recovered': 1, 'hospitalized': 1, 'tests': 1 },
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

  switch (chart.show) {
    case "all":
      // No filtering
      break;

    case "highlight-only":
      caseData = _.filter(caseData, function(d) {
        return highlights.indexOf(d.country) != -1;
      });
      break;

    default:
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
      break;
  }

  var $highlight = $("#highlight-" + chart.id);
  if ($highlight.html().length < 100) { 
    $highlight.html(getHTMLCountryOptionsToSelect(allCountries, chart.highlight));
  }

  if (chart.avgData && chart.avgData > 1) { transformToTrailingAverage(caseData, chart.avgData); }
  chart.data = caseData;
  
  casesMax = _.sortBy(chart.data, function(d) { return -d.maxCases; } )[0];
  chart.yMax = findNextExp(casesMax.maxCases);

  return chart;
};


var process_data = function(data, chart) {
  var agg = _.reduce(data, chart.reducer, {});

  var caseData = [];
  var maxDayCounter = 0;  
  
  for (var country in agg) {
    var popSize = -1;
    if (chart.normalizePopulation) {
      popSize = _popData[chart.normalizePopulation][country];

      if (!popSize && location.hostname === "localhost") {
        console.log("Missing " + chart.normalizePopulation + ": " + country);
      }
    } 

    dayCounter = -1;
    maxCases = 0;
    maxDay = -1;
    lastDayCases = -1;
    countryData = [];
    var dataIndex = 0;
    var dates = Object.keys(agg[country])
    for (var i = 0; i < dates.length; i++) {
      date = dates[i];
      // Start counting days only after the first day w/ 100 cases:
      //console.log(agg[country][date]);
      var cases = agg[country][date][chart.dataSelection];
      var rawCaseValue = cases;

      if (chart.showDelta) {
        if (i == 0) {
          cases = 0;
        } else {
          prevCases = agg[country][dates[i - 1]][chart.dataSelection];
          cases = cases - prevCases;
        }
      }

      if (chart.normalizePopulation) {
        cases = (cases / popSize) * 1e6;
        rawCaseValue = (rawCaseValue / popSize) * 1e6;
      }

      if (dayCounter == -1) {
        if (
          (!chart.growthFactor && cases >= chart.y0) ||
          (!chart.growthFactor && chart.showDelta && rawCaseValue >= chart.y0) ||
          (chart.growthFactor && rawCaseValue >= 100)
        ) {
          dayCounter = 0;
        }
      }
      
      // Once we start counting days, add data
      if (dayCounter > -1) {

        var recordData = true;
        if ( (chart.dataSelection == "tests" || chart.dataSelection == "hospitalized") && dayCounter == 0 && chart.showDelta ) {
          recordData = false;
        } else if (chart.showDelta) {
          //recordData = true;
        } else if (cases < chart.y0) {
          recordData = false;
        }

        //if (cases >= chart.y0 || chart.showDelta) {
        if (recordData) {
          countryData.push({
            pop: popSize,
            country: country,
            dayCounter: dayCounter,
            date: date,
            cases: cases,
            i: dataIndex++
          });

          lastDayCases = cases;
          maxDay = dayCounter;

          if (cases > maxCases) { maxCases = cases; }
        }

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
        lastDayCases: lastDayCases
      });

      if (dayCounter > maxDayCounter) {
        maxDayCounter = dayCounter + 4;
      }
    }
  }

  caseData = _.sortBy(caseData, chart.sort);
  chart.fullData = caseData;

  chart.xMax = maxDayCounter;
  if (chart.xMax > 80) { chart.xMax = 80; }

  prep_data(chart);
};

var covidData_promise = d3.csv("jhu-data.csv?d=" + _reqStr, function (row) {
  row["Active"] = +row["Active"];
  row["Confirmed"] = +row["Confirmed"];
  row["Recovered"] = +row["Recovered"];
  row["Deaths"] = +row["Deaths"];
  row["People_Tested"] = +row["People_Tested"];
  row["People_Hospitalized"] = +row["People_Hospitalized"];
  return row;
});

var populationData_promise = d3.csv("wikipedia-population.csv", function (row) {
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




var saveAsSVG = function(e) {
  var chartId = $(e.target).parent().data("chart");
  var chartXML = $(`#chart-${chartId}`).html();
  var hrefData = "data:application/octet-stream;base64," + btoa(chartXML);

  $(e.target).attr("href", "data:application/octet-stream;base64," + btoa(chartXML));
  $(e.target).attr("download", "91-DIVOC-" + chartId + ".svg");
}

var saveAsPNG = function(e) {
  e.preventDefault();

  var chartId = $(e.target).parent().data("chart");
  var chartSVG = $(`#chart-${chartId} svg`);
  var chartXML = $(`#chart-${chartId}`).html();
  var hrefData = "data:image/svg+xml," + encodeURIComponent(chartXML);

  var canvas = $(`<canvas height="${chartSVG.height()}" width="${chartSVG.width()}" />`).get(0);
  var ctx = canvas.getContext('2d');

  var img = new Image(chartSVG.width(), chartSVG.height());
  img.onload = function () {
    console.log("Image loaded.");

    ctx.drawImage(img, 0, 0, chartSVG.width(), chartSVG.height());

    /*
    var downloadData = canvas.toDataURL("image/png");
    saveAs(downloadData, "91-DIVOC-" + chartId + ".png");
    */
     
    canvas.toBlob(function (blob) {
      console.log("Saving.");
      saveAs(blob, "91-DIVOC-" + chartId + ".png");
    })
  }

  //saveAs(downloadData, "linkedin-banner-image.png");

  img.src = hrefData;
  //console.log(uriChart_2);


  /*
  var uriChart = 'data:image/svg+xml,' + encodeURIComponent(chartXML);

  var chartSVG = $(`#chart-${chartId} svg`);
  var chart_element = chartSVG.get(0);
  console.log(chart_element);

  var svgBlob = new Blob([chart_element], {type: 'image/svg+xml;charset=utf-8'});
  var uriChart_2 = URL.createObjectURL(svgBlob);

  var img = new Image();
  img.onload = function () {
    console.log("DONE!");
    alert("UGH");
  }
  img.src = uriChart_2;
  console.log(uriChart_2);


  var canvas = new OffscreenCanvas(chartSVG.width(), chartSVG.height());
  var ctx = canvas.getContext('2d');
  ctx.drawImage( uriChart_2, 0, 0, chartSVG.width(), chartSVG.height() );


  /*
  var chartSVG = $(`#chart-${chartId} svg`);
  var chart_element = chartSVG.get(0);
  console.log(chart_element);



  var canvas = new OffscreenCanvas(chartSVG.width(), chartSVG.height());
  var ctx = canvas.getContext('2d');
  ctx.drawImage( chart_element, 0, 0, chartSVG.width(), chartSVG.height() );
  console.log("DONE!");

  /*
  var img = new Image();
  img.onload = function () {
    ctx.drawImage(img, 0, 0);
    console.log("DONE!");
  }

  img.src = chartSVG.html();
  */
};

var _qs_update_graph = function(chart, chartId, urlParams, qs, attr, selector) {
  let qs_value = urlParams.get(qs);
  if (qs_value) {
    chart[attr] = qs_value;

    // UI Update:
    if (attr == "scale") {
      $(`.${selector}[data-chart="${chartId}"][data-scale="${qs_value}"]`).click();
    } else if (attr == "extraHighlights") {
      qs_value = qs_value.split(",");
      chart[attr] = qs_value;
    } else {
      let el = $(`.${selector}[data-chart="${chartId}"] option[value="${qs_value}"]`);
      el.prop('selected', true);
    }

    // Backend Update:
    if (attr == "dataSelection") {
      updateDataSelectionOptions(chart, qs_value);
    }
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
      ui_add_highlight(chart, chartId, selectedOption);
    }
  }
}

var process_query_string = function() {
  const urlParams = new URLSearchParams(window.location.search);
  
  let chartId = urlParams.get("chart");
  if (!chartId) { return; }

  let chart = charts[chartId];
  if (!chart) { return; }

  _qs_update_graph(chart, chartId, urlParams, "highlight", "highlight", "highlight-select");
  _qs_update_graph(chart, chartId, urlParams, "show", "show", "filter-select");
  _qs_update_graph(chart, chartId, urlParams, "trendline", "trendline", "trendline-select");
  _qs_update_graph(chart, chartId, urlParams, "y", "yAxisScale", "yaxis-select");
  _qs_update_graph(chart, chartId, urlParams, "data", "dataSelection", "data-select");
  _qs_update_graph(chart, chartId, urlParams, "scale", "scale", "scaleSelection");
  _qs_update_graph(chart, chartId, urlParams, "extra", "extraHighlights", "extra-highlights");
};


var generateUrl = function(chart) {
  var dataattr = chart.id.substring( chart.id.indexOf("-") + 1 );
  var options = {
    chart: dataattr,
    highlight: chart.highlight,
    show: chart.show,
    trendline: chart.trendline,
    y: chart.yAxisScale,
    scale: chart.scale,
    data: (chart.dataRawSelection) ? chart.dataRawSelection : chart.dataSelection
  }

  if (chart.extraHighlights) {
    options.extra = chart.extraHighlights;
  }

  var qs = Object.keys(options).map(function(key) {
    return key + '=' + options[key]
  }).join('&');

  var url = [location.protocol, '//', location.host, location.pathname].join('');
  return url + "?" + qs + "#" + dataattr;
};

var ui_add_highlight = function(chart, chartId, selectedOption=null) {
  var el_add = $(`.extra-highlights[data-chart="${chartId}"]`);
  var allCountries = _.map(chart.fullData, 'country').sort();
  if (!selectedOption) { selectedOption = chart.defaultHighlight; }

  var html =
    `<div class="btn-group btn-group-toggle" data-toggle="buttons" style="padding-bottom: 3px;">
        <div class="input-group-prepend">
          <span class="input-group-text">Additional Highlight:</span>
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

  if (value == "cases-daily") {
    value = "cases";
    chart.showDelta = true;
  } else if (value == "deaths-daily") {
    value = "deaths";
    chart.showDelta = true;
  } else if (value == "tests-daily") {
    value = "tests";
    chart.showDelta = true;
  } else if (value == "cases-daily-7") {
    value = "cases";
    chart.showDelta = true;
    chart.avgData = 7;
  } else if (value == "deaths-daily-7") {
    value = "deaths";
    chart.showDelta = true;
    chart.avgData = 7;
  } else if (value == "tests-daily-7") {
    value = "tests";
    chart.showDelta = true;
    chart.avgData = 7;
  }
  

  chart.growthFactor = false;
  if (value == "growth-cases") {
    value = "cases";
    chart.showDelta = true;
    chart.growthFactor = true;
  } else if (value == "growth-deaths") {
    value = "deaths";
    chart.showDelta = true;
    chart.growthFactor = true;      
  }

  chart.dataSelection = value;
  chart.y0 = chart.dataSelection_y0[value];

  $("#" + chart.id.substring(6)).html("<h2>" + generateDataLabel(chart, true) + "</h2>");
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
    var chartId = $(e.target).data("chart");
    var chart = charts[chartId];
    
    chart.trendline = $(e.target).val();
    //prep_data(chart);
    if ( chart.avgData ) { prep_data(chart); }
    render(chart);
    updateQueryString(chart);
    gtag("event", "change-trendline", {event_category: chartId, event_label: chart.trendline});
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

    ui_add_highlight(chart, chartId);

    if (!chart.extraHighlights) { chart.extraHighlights = []; }
    chart.extraHighlights.push(chart.defaultHighlight);
    render(chart);
    updateQueryString(chart);
    gtag("event", "add-highlight", {event_category: chartId, event_label: chart.extraHighlights.length});
  })

  _pageReady = true;
  tryRender();
});


var generateDataLabel = function(chart, title = false) {
  var dataLabel = "";

  if (title) {
    if (chart.showDelta) { dataLabel = "New "; }

    if (chart.dataSelection == 'cases') { dataLabel += "Confirmed COVID-19 Cases"; }
    else if (chart.dataSelection == 'active') { dataLabel += "Active COVID-19 Cases"; }
    else if (chart.dataSelection == 'deaths') { dataLabel += "Deaths from COVID-19"; }
    else if (chart.dataSelection == 'recovered') { dataLabel += "Recoveries from COVID-19"; }
    else if (chart.dataSelection == 'hospitalized') { dataLabel += "Total hospitalized with COVID-19"; }
    else if (chart.dataSelection == 'tests') { dataLabel += "COVID-19 Tests Performed"; }  

    if (chart.showDelta) { dataLabel += " per Day"; }

    if (chart.id.indexOf("state") != -1) { dataLabel += " by US States/Territories"; }
    if (chart.normalizePopulation) { dataLabel += ", normalized by population"; }


  } else {
    if (chart.showDelta) { dataLabel = "new "; }

    if (chart.dataSelection == 'cases') { dataLabel += "confirmed cases"; }
    else if (chart.dataSelection == 'active') { dataLabel += "active cases"; }
    else if (chart.dataSelection == 'deaths') { dataLabel += "deaths from COVID-19"; }
    else if (chart.dataSelection == 'recovered') { dataLabel += "recoveries"; }
    else if (chart.dataSelection == 'hospitalized') { dataLabel += "total hospitalizations"; }
    else if (chart.dataSelection == 'tests') { dataLabel += "COVID-19 tests performed"; }  
  }

  return dataLabel;
};


var tip_html = function(chart) {
  return function(d, i) {
    var geometicGrowth = Math.pow(d.cases / chart.y0, 1 / d.dayCounter);
    

    var gData = _.find(chart.data, function (e) { return e.country == d.country }).data;

    var geoGrowth = [];
    if (d.i >= 2) {
      let d0 = gData[i - 1];
      let ggrowth = Math.pow(d.cases / d0.cases, 1 / (d.dayCounter - d0.dayCounter));
      if (isFinite(ggrowth)) {
        geoGrowth.push(`Previous day: <b>${ggrowth.toFixed(2)}x</b> growth`);
      }
    }
    if (d.i >= 8) {
      let d0 = gData[i - 7];
      let ggrowth = Math.pow(d.cases / d0.cases, 1 / (d.dayCounter - d0.dayCounter));
      if (isFinite(ggrowth)) {
        geoGrowth.push(`Previous week: <b>${ggrowth.toFixed(2)}x</b> /day`);
      }
    }
    if (d.i > 0) {
      let d0 = gData[0];
      let ggrowth = Math.pow(d.cases / d0.cases, 1 / (d.dayCounter - d0.dayCounter));
      if (isFinite(ggrowth)) {
        geoGrowth.push(`Previous ${d.dayCounter} days: <b>${ggrowth.toFixed(2)}x</b> /day`);
      }
    }

    var s2 = "";
    if (chart.normalizePopulation) { s2 = " per 1,000,000 people"; }

    var dataLabel = generateDataLabel(chart);
    let daysSince = `(<b>${d.dayCounter}</b> days after reaching ${chart.y0} ${dataLabel}${s2})`;
    if (chart.dataSelection == 'hospitalized' || chart.dataSelection == 'tests') {
      daysSince = "";
    }


    let dateStr = "";
    let dateParts = d.date.split("-");
    let date = new Date(parseInt(dateParts[2]), parseInt(dateParts[0]) - 1, parseInt(dateParts[1]));

    if (date instanceof Date) {
      dateStr = `${ date.toLocaleDateString('en-US', { weekday: 'long'}) }, `;
    }
    



    var s = `<div class="tip-country">${d.country} &ndash; Day ${d.dayCounter}</div>`;
    if (d.rawcases) { s += "<i>"; }
    s += `<div class="tip-details" style="border-bottom: solid 1px black; padding-bottom: 2px;"><b>${((d.rawcases)?d.rawcases:d.cases).toLocaleString("en-US", {maximumFractionDigits: 1})}</b> ${dataLabel}${s2} on ${dateStr}${d.date} ${daysSince}</div>`;
    if (d.rawcases) { s += "</i>"; }

    if (d.rawcases) {
      var trailingDays = Math.min(d.dayCounter + 1, chart.avgData);
      s += `<div class="tip-details">`;
      s += "<b>" + d.cases.toLocaleString("en-US", {maximumFractionDigits: 1}) + " average</b> " + dataLabel + s2 + " /day over the <b>past " + trailingDays + " days</b>";
      s += `</div>`;
    }
    
    else if (geoGrowth.length > 0) {
      s += `<div class="tip-details"><i><u>Avg. geometric growth</u>:<br>`;
      for (var str of geoGrowth) {
        s += str + "<br>";
      }
      s += `</i></div>`;
    }

    gtag("event", "mouseover", {event_category: chart.self, event_label: d.country, value: d.dayCounter});
    return s;
  }
};

var render = function(chart) {
  $("#" + chart.id).html(`<div class="text-center divoc-graph-loading"><div class="spinner-border text-primary" role="status">
    <span class="sr-only">Loading...</span>
  </div></div>`);
  setTimeout(function() { doRender(chart) }, 0);
};

var doRender = function(chart) {

  console.log(chart.data);

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

  var maxDayRendered = chart.xMax;


  // xAxis
  let alignRight = false;
  if (chart.xaxis == "right") {
    alignRight = true;
    maxDayRendered = f.maxDay;
  } else if (chart.xaxis == "right-4wk") {
    alignRight = true;
    maxDayRendered = 28;
  } else if (chart.xaxis == "right-8wk") {
    alignRight = true;
    maxDayRendered = 7 * 8;
  } else {
    // left-align
    if (f && f.maxDay > maxDayRendered) {
      maxDayRendered = f.maxDay + 3;
    }
  }

  var margin = { top: 10, right: 20, bottom: 45, left: 60 };

  var cur_width = $("#sizer").width();
  _client_width = cur_width;



  var width = cur_width - margin.right - margin.left;
  var height = 500;

  var isSmall = false;
  if (width < 400) {
    height = 300;
    isSmall = true;
    margin.left = 40;
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
  var casesScale;
  if (chart.scale == "log") { casesScale = d3.scaleLog(); }
  else { casesScale = d3.scaleLinear(); }

  scale_y0 = chart.y0;
  if (chart.showDelta) {
    scale_y0 = 1;
  }

  scale_yMax = chart.yMax;
  if (chart.yAxisScale == "highlight") {
    var highlights_data = _.filter(chart.data, function (d) { return highlights.indexOf(d.country) != -1; });
    var maxCases = _.maxBy(highlights_data, 'maxCases').maxCases;
    scale_yMax = maxCases * 1.05;
  }

  casesScale.domain([scale_y0, scale_yMax]).range([height, 0]);
  
  // Color Scale
  var colorScale = d3.scaleOrdinal(d3.schemeCategory10);
  if (f) { colorScale(f.country); }

  // SVG
  $("#" + chart.id).html("");


  var svg = d3.select("#" + chart.id)
    .append("svg")
    .attr("version", 1.1)
    .attr("xmlns", "http://www.w3.org/2000/svg")    
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("width", width + margin.left + margin.right)
    .style("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Mouseovers
  var tip = d3.tip().attr('class', 'd3-tip').html(tip_html(chart));
  svg.call(tip);


  if (alignRight) {
    svg.append("g")
      .attr("transform", `translate(${width + 4}, ${height /2})`)
      .append("text")
      //.attr("x", width)
      //.attr("y", height / 2)
      //.attr("class", "axis-title")
      .attr("class", "text-credits")
      .attr("transform", "rotate(90)")
      .attr("text-anchor", "middle")
      .text("TODAY");

    svg.append("line")
      .attr("x1", width)
      .attr("x2", width)
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "#bbb")
      .attr("stroke-width", 3);

    svg.append("rect")
      .attr("x", daysScale(-14))
      .attr("width", daysScale(0) - daysScale(-14))
      .attr("y", 0)
      .attr("height", height)
      .attr("fill", "#fffffa");
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

  var y_axis = d3.axisLeft(casesScale).tickFormat(
    (!isSmall)?d3.format("0,"):function (val) {
      var oom = Math.log10(val);

      if (oom < 3) { return val.toFixed(0); }
      else if (oom < 6) { return ((val / 1000).toFixed(0)) + "k"; }
      else if (oom < 9) { return ((val / 1e6).toFixed(0)) + "m"; }
      else if (oom < 12) { return ((val / 1e9).toFixed(0)) + "b"; }
      else { return val; }
  });

  if (chart.scale == "log" && scale_yMax / scale_y0 > 100) {
    y_axis.tickValues(tickValues);
  }
  
  svg.append('g')
    .attr("class", "axis")
    .call(y_axis);  

  var y_grid = d3.axisLeft(casesScale).tickSize(-width).tickFormat("");
  svg.append('g')
     .attr("class", "grid")
     .call(y_grid);
     

  // Add Data
  // Create 35%-line
  let scaleLinesMeta = [];
  if ( (chart.trendline == "default" && chart.dataSelection != "hospitalized" && chart.dataSelection != "tests") || chart.trendline == "35" || chart.trendline == "all") {
    scaleLinesMeta.push({ is35pct: true, dStart: 0, dasharray: 12, label: "1.35x daily", sLabel: "35%", gRate: 1.35, dEnd: maxDayRendered + 3 });
  }

  var getSacleMeta = function(gData, f, dayTrend, dasharray) {
    if (gData.length == 0) { return null; }

    var d = gData[gData.length - 1];
    d0 = _.find(gData, function (e) { return e.dayCounter == d.dayCounter - dayTrend; });

    if (!d0) { return null; }

    let ggrowth = Math.pow(d.cases / d0.cases, 1 / (d.dayCounter - d0.dayCounter));

    let s = ggrowth.toFixed(2) + `x (prev. ${dayTrend}-day growth)`;
    let dEnd = d0.dayCounter + dayTrend + 7;

    return {
      dasharray: dasharray,
      color: colorScale(f.country),
      label: s,
      sLabel: s,
      gRate: ggrowth,
      y0: d.cases / Math.pow(ggrowth, d.dayCounter),
      dStart: d0.dayCounter,
      dEnd: dEnd
    };
  };
  
  if (chart.trendline == "highlight-1week" || chart.trendline == "all") {
    var scaleMetadata = getSacleMeta(gData, f, 7, 6);
    if (scaleMetadata) { scaleLinesMeta.push( scaleMetadata ); }
  }

  if (chart.trendline == "highlight-3day" || chart.trendline == "all") {
    var scaleMetadata = getSacleMeta(gData, f, 3, 4);
    if (scaleMetadata) { scaleLinesMeta.push( scaleMetadata ); }
  }

  if (chart.trendline == "highlight-1day" || chart.trendline == "all") {
    var scaleMetadata = getSacleMeta(gData, f, 1, 2);
    if (scaleMetadata) { scaleLinesMeta.push( scaleMetadata ); }
  }

  var xTop_visualOffset = -5;

  // Disable trendlines on right-align
  if (alignRight) { scaleLinesMeta = []; }

  for (var scaleLineMeta of scaleLinesMeta) {
    var cases = data_y0, day = 0, y_atMax = -1, y_atStart = -1;
    if (scaleLineMeta.y0) {
      cases = scaleLineMeta.y0;
    }
    var pctLine = [];
    while (day <= scaleLineMeta.dEnd && cases <= chart.yMax * scaleLineMeta.gRate && cases > 1) {
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
        if (y_atMax > scale_yMax) { /* extends off the top */
          return daysScale(
            Math.log( scale_yMax / y_atStart )  / Math.log( scaleLineMeta.gRate ) + scaleLineMeta.dStart
          );
        } else if (y_atMax < scale_y0) { /* extends off bottom */ 
          return daysScale(
            Math.log( 1 / y_atStart ) / Math.log( scaleLineMeta.gRate ) + scaleLineMeta.dStart
          );
        } else { /* extends off right */
          return daysScale(scaleLineMeta.dEnd);
        }
      })
      .attr("y", function () {
        if (y_atMax > scale_yMax) { /* extends off the top */
          if (!scaleLineMeta.is35pct) { xTop_visualOffset += 10; return xTop_visualOffset; }
          else { if (isSmall) { return -2; } return 5; }
          
        } else if (y_atMax < scale_y0) { /* extends off bottom */ 
          return height;
        } else { /* extends off right */
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
  


  var xAxisLabel = `Days since ${chart.y0} `
  if (chart.dataSelection == 'cases') { xAxisLabel += "case"; if (chart.y0 != 1) { xAxisLabel += "s"; }}
  else if (chart.dataSelection == 'active') { xAxisLabel += "active case"; if (chart.y0 != 1) { xAxisLabel += "s"; }}
  else if (chart.dataSelection == 'deaths') { xAxisLabel += "death"; if (chart.y0 != 1) { xAxisLabel += "s"; } }
  else if (chart.dataSelection == 'recovered') { xAxisLabel += "recover"; if (chart.y0 != 1) { xAxisLabel += "ies"; } else { xAxisLabel += "y"; }}
  if (chart.normalizePopulation) { xAxisLabel += "/1m people"; }

  if (chart.dataSelection == 'tests') { xAxisLabel = "Days since Apr. 12"; }
  else if (chart.dataSelection == 'hospitalized') { xAxisLabel = "Days since Apr. 12"; }
  //if (chart.showDelta) { xAxisLabel += "/day"; }

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
  if (chart.normalizePopulation) {
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

  var renderLineChart = function(svg, i) {
    var countryData = chart.data[i];
    var isHighlighted = (highlights.indexOf(countryData.country) != -1);
    var maxDay = countryData.maxDay;

    svg.datum(countryData.data)
      .append("path")
      .attr("fill", "none")
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
            return daysScale( d.dayCounter - maxDay );
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
          return daysScale( d.dayCounter - maxDay );
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
        if (d.cases < scale_y0) {
          if (isHighlighted) { return 4; }
          else { return 0; }
        }
        if (isHighlighted) { return 4; }
        else { return 3; }
      })
      .attr("fill", function (d) { return colorScale(d.country); })
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide);

    var countryText = svg.append("text")
      .attr("fill", function (d) { return colorScale(countryData.data[0].country); })
      .attr("class", "label-country")
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

    if (alignRight) {
      countryText
        .attr("x", width) //(Math.random() * width) )
        .attr("y", function () {
          if (countryData.data[countryData.data.length - 1].cases < scale_y0) { return height + 5; }
          return casesScale( countryData.data[countryData.data.length - 1].cases ) - 10;
        })
        .attr("alignment-baseline", "middle")
        .attr("text-anchor", "end")


    } else if (countryData.maxDay + 2 < maxDayRendered || !countryData.data[maxDayRendered - 1]) { 
      countryText
        .attr("x", 5 + daysScale(countryData.maxDay) + textHeightAdjustment )
        .attr("y", function () {
          if (countryData.data[countryData.data.length - 1].cases < scale_y0) { return height + 5; }
          return casesScale( countryData.data[countryData.data.length - 1].cases ) + textHeightAdjustment;
        })
        .attr("alignment-baseline", "middle")
    } else {
      countryText
        .attr("x", daysScale(maxDayRendered) - 5 + textHeightAdjustment )
        .attr("y", function () {
          
          if (countryData.data[maxDayRendered - 1].cases < scale_y0) { return height + 5; }
          return casesScale(countryData.data[maxDayRendered - 1].cases) - 5 + textHeightAdjustment;
        })
        .attr("text-anchor", "end")
    }
  };

  for (var i = 0; i < chart.data.length; i++) {
    renderLineChart(svg, i);
  }

  if (!f && chart.highlight != "(None)") {
    var desc = `${chart.y0} `
    if (chart.dataSelection == 'cases') { desc += "case"; if (chart.y0 != 1) { desc += "s"; }}
    else if (chart.dataSelection == 'active') { desc += "active case"; if (chart.y0 != 1) { desc += "s"; }}
    else if (chart.dataSelection == 'deaths') { desc += "death"; if (chart.y0 != 1) { desc += "s"; } }
    else if (chart.dataSelection == 'recovered') { desc += "recover"; if (chart.y0 != 1) { desc += "ies"; } else { desc += "y"; }}
    if (chart.normalizePopulation) { desc += "/1m people"; }

    $("#" + chart.id).append(`<div style="text-align: center;"><i><b>Note:</b> ${chart.highlight} has not reached ${desc}. No data is available to highlight.</i></div>`);
  }

  gtag("event", "render", {event_category: chart.self});
};
