var _rawData = null;
var _popData = null;
var dateColumns = [];
var _client_width = -1;



$(window).resize(function () {
  if (_rawData != null) {
    console.log("Window size changed -- resizing graphs.");
    var new_width = $("#sizer").width();
    if (_client_width != new_width) {
      render( charts['countries'] );
      render( charts['states'] );
      render( charts['countries-normalized'] );
      render( charts['states-normalized'] );
    }
  }
});


var reducer_byUSstate = function(result, value, key) {
  var states = [
    ['Arizona', 'AZ'],
    ['Alabama', 'AL'],
    ['Alaska', 'AK'],
    ['Arkansas', 'AR'],
    ['California', 'CA'],
    ['Colorado', 'CO'],
    ['Connecticut', 'CT'],
    ['Delaware', 'DE'],
    ['Florida', 'FL'],
    ['Georgia', 'GA'],
    ['Hawaii', 'HI'],
    ['Idaho', 'ID'],
    ['Illinois', 'IL'],
    ['Indiana', 'IN'],
    ['Iowa', 'IA'],
    ['Kansas', 'KS'],
    ['Kentucky', 'KY'],
    ['Louisiana', 'LA'],
    ['Maine', 'ME'],
    ['Maryland', 'MD'],
    ['Massachusetts', 'MA'],
    ['Michigan', 'MI'],
    ['Minnesota', 'MN'],
    ['Mississippi', 'MS'],
    ['Missouri', 'MO'],
    ['Montana', 'MT'],
    ['Nebraska', 'NE'],
    ['Nevada', 'NV'],
    ['New Hampshire', 'NH'],
    ['New Jersey', 'NJ'],
    ['New Mexico', 'NM'],
    ['New York', 'NY'],
    ['North Carolina', 'NC'],
    ['North Dakota', 'ND'],
    ['Ohio', 'OH'],
    ['Oklahoma', 'OK'],
    ['Oregon', 'OR'],
    ['Pennsylvania', 'PA'],
    ['Rhode Island', 'RI'],
    ['South Carolina', 'SC'],
    ['South Dakota', 'SD'],
    ['Tennessee', 'TN'],
    ['Texas', 'TX'],
    ['Utah', 'UT'],
    ['Vermont', 'VT'],
    ['Virginia', 'VA'],
    ['Washington', 'WA'],
    ['West Virginia', 'WV'],
    ['Wisconsin', 'WI'],
    ['Wyoming', 'WY'],
  ];

  var stateDict = {};
  for (i = 0; i < states.length; i++) {
    var s = states[i];
    stateDict[ s[1] ] = s[0];
  }

  country = value["Country_Region"];
  state = value["Province_State"];

  if (state == "") { return result; }
  if (country != "United States") { return result; }
  if (state.indexOf("Princess") != -1) { return result; }
  if (state.indexOf(",") != -1 && state.length > 2) {
    var abbr = state[ state.length - 2 ] + state[ state.length - 1 ];
    state = stateDict[abbr];
  }

  // Use the state name as key
  key = state;
  return reducer_sum_with_key(result, value, key);

  /*
  if (!result[key]) { result[key] = {} }
  let obj = result[key];

  for (var i = 0; i < dateColumns.length; i++) {
    var column = dateColumns[i];
    if (!obj[column]) { obj[column] = 0; }
    obj[column] = obj[column] + (+value[column]);
  }

  return result;
  */
};

var reducer_sum_with_key = function(result, value, key) {
  if (!result[key]) { result[key] = {} }
  let obj = result[key];

  let date = value["Date"];

  if (!obj[date]) { obj[date] = { active: 0, recovered: 0, deaths: 0, cases: 0 } }
  obj[date].active += value["Active"];
  obj[date].recovered += value["Recovered"];
  obj[date].deaths += value["Deaths"];
  obj[date].cases += value["Confirmed"];

  return result;
};


var reducer_byCountry = function(result, value, key) {
  state = value["Province_State"];
  if (state != "") { return result; }

  key = value["Country_Region"];
  return reducer_sum_with_key(result, value, key);
};



var charts = {
  'countries': {
    reducer: reducer_byCountry,
    scale: "log",
    highlight: "United States",
    y0: 100,
    xCap: 25,
    id: "chart-countries",
    normalizePopulation: false,
    show: 40,
    sort: function (d) { return -d.maxCases; },
    dataSelection: 'cases',
    dataSelection_y0: { 'active': 100, 'cases': 100, 'deaths': 10, 'recovered': 100 },
    xMax: null, yMax: null, data: null
  },
  'states': {
    reducer: reducer_byUSstate,
    scale: "log",
    highlight: "New York",
    y0: 20,
    xCap: 40,
    id: "chart-states",
    normalizePopulation: false,
    show: 9999,
    sort: function (d) { return -d.maxCases; },
    dataSelection: 'cases',
    dataSelection_y0: { 'active': 20, 'cases': 20, 'deaths': 5, 'recovered': 20 },
    xMax: null, yMax: null, data: null
  },

  'countries-normalized': {
    reducer: reducer_byCountry,
    scale: "log",
    highlight: "United States",
    y0: 1,
    xCap: 25,
    id: "chart-countries-normalized",
    normalizePopulation: "country",
    show: 40,
    sort: function (d) { return -d.maxCases + -(d.pop / 1e6); },
    dataSelection: 'cases',
    dataSelection_y0: { 'active': 1, 'cases': 1, 'deaths': 1, 'recovered': 1 },
    xMax: null, yMax: null, data: null
  },
  'states-normalized': {
    reducer: reducer_byUSstate,
    scale: "log",
    highlight: "New York",
    y0: 1,
    xCap: 40,
    id: "chart-states-normalized",
    normalizePopulation: "state",
    show: 9999,
    sort: function (d) { return -d.maxCases; },
    dataSelection: 'cases',
    dataSelection_y0: { 'active': 1, 'cases': 1, 'deaths': 1, 'recovered': 1 },
    xMax: null, yMax: null, data: null
  },
};

var findNextExp = function(x) {
  var pow10 = Math.pow(10, Math.ceil( Math.log10(x) ));

  if (x < pow10 / 2) { return pow10 / 2; }
  else { return pow10; }
};

var prep_data = function(chart) {
  var caseData = chart.fullData;

  if (chart.show < 9999) { caseData = _.take(caseData, chart.show); }
  var countries = _.map(caseData, 'country').sort();

  var $highlight = $("#highlight-" + chart.id);
  $highlight.html("");
  $.each(countries, function() {
    var el = $("<option />").val(this).text(this);
    if (chart.highlight == this) { el.attr("selected", true); }
    $highlight.append(el);
  });

  $highlight.change(function (e) {
    chart.highlight = $(e.target).val();
    render(chart);
  });

  chart.data = caseData;
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
    countryData = [];
    for (const date in agg[country]) {
      // Start counting days only after the first day w/ 100 cases:
      //console.log(agg[country][date]);
      var cases = agg[country][date][chart.dataSelection];
      if (chart.normalizePopulation) { cases = (cases / popSize) * 1e6; }

      if (dayCounter == -1 && cases >= chart.y0) {
        dayCounter = 0;
      }
      
      // Once we start counting days, add data
      if (dayCounter > -1) {
        if (cases >= chart.y0) {
          countryData.push({
            pop: popSize,
            country: country,
            dayCounter: dayCounter,
            date: date,
            cases: cases
          });

          maxDay = dayCounter;
        }
        if (cases > maxCases) { maxCases = cases; }

        dayCounter++;
      }
    }

    if (dayCounter > 0) {
      caseData.push({
        pop: popSize,
        country: country,
        data: countryData,
        maxCases: maxCases,
        maxDay: maxDay
      });

      if (dayCounter > maxDayCounter) {
        maxDayCounter = dayCounter + 2;
      }
    }
  }
  
  caseData = _.sortBy(caseData, chart.sort);
  chart.fullData = caseData;

  casesMax = _.sortBy(caseData, function(d) { return -d.maxCases; } )[0];
  chart.yMax = findNextExp(casesMax.maxCases);

  chart.xMax = maxDayCounter;
  if (chart.xMax > 40) { chart.xMax = 40; }

  return prep_data(chart);
};

var covidData_promise = d3.csv("jhu-data.csv?v=2", function (row) {
  row["Active"] = +row["Active"];
  row["Confirmed"] = +row["Confirmed"];
  row["Recovered"] = +row["Recovered"];
  row["Deaths"] = +row["Deaths"];
  return row;
});

var populationData_promise = d3.csv("wikipedia-population.csv", function (row) {
  row["Population"] = (+row["Population"]);
  return row;
});


var _dataReady = false, _pageReady = false;


var tryRender = function () {
  if (_dataReady && _pageReady) {
    process_data(_rawData, charts["countries"]);
    render(charts["countries"]);

    process_data(_rawData, charts["states"]);
    render(charts["states"]);
    
    process_data(_rawData, charts["countries-normalized"]);
    render(charts["countries-normalized"]);

    process_data(_rawData, charts["states-normalized"]);
    render(charts["states-normalized"]);  
  }
}



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
    alert("Failed to load data.");
  });





$(function() {
  $(".scaleSelection").mouseup(function(e) {
    var value = $(e.target).data("scale");
    var chartId = $(e.target).data("chart");
    var chart = charts[chartId];

    if (chart && chart.scale != value) {
      chart.scale = value;
      render(chart);
    }
  });

  $(".filter-select").change(function (e) {
    var chartId = $(e.target).data("chart");
    var chart = charts[chartId];
    
    chart.show = $(e.target).val();
    prep_data(chart);
    render(chart);
  });

  $(".data-select").change(function (e) {
    console.log("Data select: ")
    var chartId = $(e.target).data("chart");
    var chart = charts[chartId];
    var value = $(e.target).val();
    
    chart.dataSelection = value;
    chart.y0 = chart.dataSelection_y0[value];
    process_data(_rawData, chart);
    render(chart);
  });

  _pageReady = true;
  tryRender();
});


var tip_html = function(chart) {
  return function(d, i) {
    var geometicGrowth = Math.pow(d.cases / chart.y0, 1 / d.dayCounter);

    var s2 = "";
    if (chart.normalizePopulation) { s2 = " per 1,000,000 people"; }

    var dataLabel;
    if (chart.dataSelection == 'cases') { dataLabel = "confirmed cases"; }
    else if (chart.dataSelection == 'active') { dataLabel = "active cases"; }
    else if (chart.dataSelection == 'deaths') { dataLabel = "deaths from COVID-19"; }
    else if (chart.dataSelection == 'recovered') { dataLabel = "recoveries"; }
  
    return `<div class="tip-country">${d.country} &ndash; Day ${d.dayCounter}</div>
            <div class="tip-details" style="border-bottom: solid 1px black; padding-bottom: 2px;"><b>${d.cases.toLocaleString()}</b> ${dataLabel}${s2} on ${d.date} (<b>${d.dayCounter}</b> days after reaching ${chart.y0} ${dataLabel}${s2})</div>
            <div class="tip-details"><i>Avg. geometric growth: <b>${geometicGrowth.toFixed(2)}x</b> /day</i></div>`;
  }
};

var render = function(chart) {
  var maxDayRendered = chart.xMax;
  var margin = { top: 10, right: 20, bottom: 40, left: 60 };

  var cur_width = $("#sizer").width();
  _client_width = cur_width;

  var width = cur_width - margin.right - margin.left;
  var height = 500;

  var isSmall = false;
  if (width < 400) {
    height = 300;
    isSmall = true;
  }

  // X-axis scale (days)
  var daysScale = d3.scaleLinear()
                    .domain([0, maxDayRendered])
                    .range([0, width]);

  // Y-axis scale (# of cases)                    
  var casesScale;
  if (chart.scale == "log") { casesScale = d3.scaleLog(); }
  else { casesScale = d3.scaleLinear(); }
  casesScale.domain([chart.y0, chart.yMax]).range([height, 0]);
  
  // Color Scale
  var colorScale = d3.scaleOrdinal(d3.schemeCategory10);

  // SVG
  $("#" + chart.id).html("");
  var svg = d3.select("#" + chart.id)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("width", width + margin.left + margin.right)
    .style("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Mouseovers
  var tip = d3.tip().attr('class', 'd3-tip').html(tip_html(chart));
  svg.call(tip);

  // Axes
  var x_axis = d3.axisBottom(daysScale);
  svg.append('g')
     .attr("transform", "translate(0, " + height + ")")
     .attr("class", "axis")
     .call(x_axis);  
  
  var x_grid = d3.axisBottom(daysScale).tickSize(-height).tickFormat("");
  svg.append('g')
     .attr("transform", "translate(0, " + height + ")")
     .attr("class", "grid")
     .call(x_grid);

  // Have tickValues at 1, 5, 10, 50, 100, ...
  var tickValue = 1;
  var tickValueIncrease = 5; 
  var tickValues = [];
  while (tickValue <= 1e6) {
    if (tickValue >= chart.y0) { tickValues.push(tickValue); }
    tickValue *= tickValueIncrease;

    if (tickValueIncrease == 5) { tickValueIncrease = 2; }
    else { tickValueIncrease = 5; }
  }

  var y_axis = d3.axisLeft(casesScale).tickFormat(d3.format("0,")); 
  if (chart.scale == "log") { y_axis.tickValues(tickValues); }
  
  svg.append('g')
    .attr("class", "axis")
    .call(y_axis);  

  var y_grid = d3.axisLeft(casesScale).tickSize(-width).tickFormat("");
  svg.append('g')
     .attr("class", "grid")
     .call(y_grid);
    


  // Add Data

  // Create 35%-line
  var cases = chart.y0, day = 0;
  var pctLine = [];
  while (cases < 2 * chart.yMax) {
    pctLine.push({
      dayCounter: day,
      cases: cases
    })

    day++;
    cases *= 1.35;
  }

  svg.datum(pctLine)
    .append("path")
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", 12)
    .attr("d", d3.line()
      .x(function (d) { return daysScale(d.dayCounter); })
      .y(function (d) { return casesScale(d.cases); })
    );

  svg.append("text")
    .attr("fill", colorScale(i))
    .attr("class", "label-country")
    .attr("x", daysScale( Math.log( chart.yMax / chart.y0 ) ) / Math.log( 1.35 ) + 2 )
    .attr("y", casesScale( chart.yMax ) + 12 )
    .attr("fill", "black")
    //.attr("alignment-baseline", "middle")    
    .text((!isSmall) ? "1.35x daily growth" : "1.35x daily");

  var xAxisLabel = `Days since ${chart.y0} `
  if (chart.dataSelection == 'cases') { xAxisLabel += "case"; if (chart.y0 != 1) { xAxisLabel += "s"; }}
  else if (chart.dataSelection == 'active') { xAxisLabel += "active case"; if (chart.y0 != 1) { xAxisLabel += "s"; }}
  else if (chart.dataSelection == 'deaths') { xAxisLabel += "death"; if (chart.y0 != 1) { xAxisLabel += "s"; } }
  else if (chart.dataSelection == 'recovered') { xAxisLabel += "recover"; if (chart.y0 != 1) { xAxisLabel += "ies"; } else { xAxisLabel += "y"; }}
  if (chart.normalizePopulation) {
    xAxisLabel += "/1m people";
  }

  svg.append("text")
     .attr("x", width - 5)
     .attr("y", height - 5)
     .attr("class", "axis-title")
     .attr("text-anchor", "end")
     .text(xAxisLabel);

  var yAxisLabel = "";
  if (chart.dataSelection == 'cases') { yAxisLabel += "Confirmed Cases"; }
  else if (chart.dataSelection == 'active') { yAxisLabel += "Active Cases"; }
  else if (chart.dataSelection == 'deaths') { yAxisLabel += "COVID-19 Deaths"; }
  else if (chart.dataSelection == 'recovered') { yAxisLabel += "Recoveries" }
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

  svg.append("text")
    .attr("x", width)
    .attr("y", height + 32)
    .attr("class", "text-credits")
    .attr("text-anchor", "end")
    .text(`Data Source: Johns Hopkins CSSE; Updated: ${_dateUpdated}`);

  /*
  svg.append("text")
    .attr("x", width)
    .attr("y", height + 32)
    .attr("text-anchor", "end")
    .attr("class", "text-credits")
    .text("A 91-DIVOC project to \"flip the script\" on COVID-19.  By: @profwade_");
  */

  last_index = -1;
  for (var i = 0; i < chart.data.length; i++) {
    colorScale(i);
    if (chart.data[i].data[0].country == chart.highlight) {
      last_index = i;
    }
  }

  var renderLineChart = function(svg, i) {
    var countryData = chart.data[i];

    svg.datum(countryData.data)
      .append("path")
      .attr("fill", "none")
      .attr("stroke", colorScale(i) )
      .attr("stroke-width", function (d) {
        if (d[0].country == chart.highlight) { return 4; }
        else { return 1; }
      })
      .style("opacity", function (d) {
        if (d[0].country == chart.highlight) { return 1; }
        else { return 0.3; }
      })      
      .attr("d", d3.line()
        .x(function (d) { return daysScale(d.dayCounter); })
        .y(function (d) { return casesScale(d.cases); })
      );

    svg.selectAll("countries")
      .data(countryData.data)
      .enter()
      .append("circle")
      .attr("cx", function (d) { return daysScale(d.dayCounter); } )
      .attr("cy", function (d) { return casesScale(d.cases); } )
      .style("opacity", function (d) {
        if (d.country == chart.highlight) { return 1; }
        else { return 0.3; }
      })
      .attr("r", function (d) {
        if (d.country == chart.highlight) { return 4; }
        else { return 3; }
      })
      .attr("fill", colorScale(i))
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide);

    var countryText = svg.append("text")
      .attr("fill", colorScale(i))
      .attr("class", "label-country")
      .style("opacity", function () {
        if (countryData.data[0].country == chart.highlight) { return 1; }
        else { return 0.3; }
      })
      .style("font-size", function () {
        if (countryData.data[0].country == chart.highlight) { return "15px"; }
        else { return null; }
      })
      .text(countryData.country);

    if (countryData.maxDay < maxDayRendered) { 
      countryText
        .attr("x", 5 + daysScale(countryData.maxDay) )
        .attr("y", casesScale(countryData.maxCases) )
        .attr("alignment-baseline", "middle")
    } else {
      countryText
        .attr("x", daysScale(maxDayRendered) - 5 )
        .attr("y", casesScale(countryData.data[maxDayRendered - 1].cases) - 5 )
        .attr("text-anchor", "end")
    }
  };

  for (var i = 0; i < chart.data.length; i++) {
    if (i != last_index) { renderLineChart(svg, i); }
  }

  if (last_index != -1) {
    renderLineChart(svg, last_index);
  }



};