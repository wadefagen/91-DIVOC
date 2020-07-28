var options = [];
var dict = {};
var localStorage = window.localStorage;
var nextId = 0;

var storedLocations = [];
if (localStorage['storedLocations']) {
  storedLocations = JSON.parse(localStorage['storedLocations']);
} else {
  storedLocations = ["New York City, New York", "Los Angeles, California"];
}

// Resize
$(window).resize(function () {
  if (options.length > 0) {
    renderAll();
  }
});

var pctGrowth = function(d, str) {
  var pct = (d[str] / (d[str] - d["dWeek_" + str])) - 1;
  pct *= 100;

  var humanStr = "cases";
  if (str == "Deaths") { humanStr = "deaths"; }

  if (d["dWeek_" + str] == 0 || isNaN(pct)) {
    return `No new ${humanStr} over the past week.`;
  }

  if (d[str] - d["dWeek_" + str] == 0) {
    return `All ${humanStr} happened within the past week.`;
  }
  
  if (pct > 10) { pct = pct.toFixed(0); }
  else { pct = pct.toFixed(2); }

  return pct + `% growth over the past week (+${ parseInt(d["dWeek_" + str]).toLocaleString("en-US", {maximumFractionDigits: 0}) })`;
};

var population = function(d, str) {
  if (!d.Population) {
    return "No population information available.";
  }

  var val = d[str];
  if (!isNaN(val)) {
    val = (val / d.Population) * 100;
    num = val.toLocaleString("en-US", {maximumFractionDigits: 3});
    return `...or <b>${num}</b>% of the population.`;
  }

  return "No population information available.";
};

var per100k = function(d, str) {
  if (!d.Population) {
    return "No population information available.";
  }

  var val = d[str];
  if (!isNaN(val)) {
    val = (val / d.Population) * 1e5;
    num = val.toLocaleString("en-US", {maximumFractionDigits: 2});
    return `...or <b>${num}</b> deaths /100k residents`;
  }

  return "No population information available.";
};


var cases = function(d, str) {
  var val = d[str];
  var num = "0";
  if (!isNaN(val)) { num = parseInt(d[str]).toLocaleString("en-US", {maximumFractionDigits: 0}); }

  var val = d[str];
  var dY = "0";
  if (!isNaN(val)) { dY = parseInt(d["dYesterday_" + str]).toLocaleString("en-US", {maximumFractionDigits: 0}); }

  return `<b>${num}</b> <i>(+${dY} yesterday)</i>`;
};


var removeByKey = function(key) {
  storedLocations = storedLocations.filter(function (e) {
    return e != key;
  });

  $("#datatable").html("");

  for (var key of storedLocations) {
    addByKey(key);
  }

  localStorage['storedLocations'] = JSON.stringify(storedLocations);
};


var _renderTip = function (d, dataKey) {
  let days = `${d.daysAgo} days ago`;
  if (d.daysAgo == 1) { days = "yesterday"; }

  return `<b>${d[dataKey].toLocaleString("en-US", {maximumFractionDigits: 0})}</b> new ${dataKey} ${days}`;
};

var renderTip = {
  "cases": function (d) { return _renderTip(d, "cases"); },
  "deaths": function (d) { return _renderTip(d, "deaths"); }
};

var render = function (svg, d, dataKey) {
  // -- bar chart --
  var margin = { top: 5, right: 0, bottom: 5, left: 30 };
  let width = ($(`#th-${dataKey}`).width()) - margin.left - margin.right,
      height = 50 - margin.top - margin.bottom;

  svg = svg.append("svg")
  .attr("version", 1.1)
  .attr("xmlns", "http://www.w3.org/2000/svg")    
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .style("width", width + margin.left + margin.right)
  .style("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  let daysToRender = 28;
  if (width < 300) { daysToRender = 14; }

  var tip = d3.tip().attr('class', 'd3-tip').html( renderTip[dataKey] );
  svg.call(tip);

  let casesScaleMax = d.max[dataKey];
  if (casesScaleMax == 0) { casesScaleMax = 1; }
  let casesScale = d3.scaleLinear().domain([0, casesScaleMax]).range([height, 0]);
  let daysScale = d3.scaleBand()
  .paddingInner(0.1)
  .domain( d3.range(1, daysToRender + 1) )
  .range([width, 0]);

  let y_axis_tickFormat = function (val) {
    var oom = Math.log10(val);

    let suffix = "";
    let factor = 1;
    
    if (oom < 3) { return val; }
    else if (oom < 6) { factor = 1e3; suffix = "k"; }
    else if (oom < 9) { factor = 1e6; suffix = "m"; }

    if (val % factor < factor / 10) { return (val / factor).toFixed(0) + suffix; }
    else { return (val / factor).toFixed(1) + suffix; }      
  }

  let caseData = _.filter(d.caseData, function (d) {
    return (d.daysAgo <= daysToRender);
  });
 
  svg.selectAll("bars")
  .data(caseData)
  .enter()
  .append("rect")
  .attr("x", function (d) { return daysScale(d.daysAgo); })
  .attr("y", function (d) { return casesScale(d[dataKey]); })
  .attr("width", daysScale.bandwidth())
  .attr("height", function (d) {
    let h = height - casesScale(d[dataKey]);
    if (h < 0) { h = 0; }
    return h;
  })
  .attr("fill", function (d) {
    if (d.daysAgo == 1) { return "hsla(199, 100%, 40%, 1)"; }
    if (d.daysAgo == 2) { return "hsla(199, 100%, 30%, 1)"; }
    if (d.daysAgo == 3) { return "hsla(199, 100%, 20%, 1)"; }
    else { return "hsla(199, 100%, 10%, 1)"; }
  })
  .on("mouseover", tip.show)
  .on("mouseout", tip.hide);



  let y_axis = d3.axisLeft(casesScale).tickFormat(y_axis_tickFormat).ticks(2);
  svg.append('g').attr("class", "axis").call(y_axis);  

  var y_grid = d3.axisLeft(casesScale).tickSize(-width).tickFormat("").ticks(2);
  svg.append('g').attr("class", "grid").call(y_grid);

  let x_axis = d3.axisBottom(daysScale).tickFormat("").tickSize(3);
  svg.append('g').attr("class", "axis").attr('transform', `translate(0, ${height})`).call(x_axis);  

};



var populateByKey = function(key) {
  var d = dict[key];
  if (!d) { console.log("Bad key: " + key); removeByKey(key); return ""; }

  var location = d.key;

  if (d.City) { location += ` (${d.City})`; }

  let table = d3.select("#datatable");

  let tr = table.append("tr");

  tr.append("td")
  .html(`
    ${location}
    <div><button style="font-size: 12px;" onclick="removeByKey('${d.key}')">Remove Location</button></div>
  `);

  let svg;

  // Cases
  svg = tr.append("td")
  .html(`
    ${cases(d, "Confirmed")}
    <div style="font-size: 12px;">${population(d, "Confirmed")}</div>
    <div style="font-size: 12px;">${pctGrowth(d, "Confirmed")}</div>
    <h6 style="border-top: solid 1px #ddd; padding-top: 5px; margin-top: 5px; margin-bottom: 0px; font-size: 12px;">New Cases/day:</h6>
  `);
  render(svg, d, "cases");

  // Deaths
  svg = tr.append("td")
  .html(`
    ${cases(d, "Deaths")}
    <div style="font-size: 12px;">${per100k(d, "Deaths")}</div>
    <div style="font-size: 12px;">${pctGrowth(d, "Deaths")}</div>
    <h6 style="border-top: solid 1px #ddd; padding-top: 5px; margin-top: 5px; margin-bottom: 0px; font-size: 12px;">New Deaths/day:</h6>
  `);
  render(svg, d, "deaths");
  svg.append("div")
  .style("text-align", "right")
  .append("a")
  .style("font-size", "12px")
  .attr("href", `/pages/covid-visualization/?chart=states&highlight=${d['Province_State']}#states`)
  .text(`View ${d['Province_State']} Graph >`)

};

var addByKey = function(key) {
  populateByKey(key);
};

var storeAndAddKey = function(key) {
  var loc = storedLocations.indexOf(key);
  if (loc == -1) {
    storedLocations.push(key);
    localStorage['storedLocations'] = JSON.stringify(storedLocations);
    addByKey(key);

    var e = $("#datatable tr:last");
    e.effect("highlight", {}, 500);
  } else {
    var e = $(`#datatable tr:nth-of-type(${loc + 1})`);
    console.log(e);
    e.effect("highlight", {}, 500);    
  }
};

var renderAll = function() {
  $("#datatable").html("");
  for (var key of storedLocations) {
    addByKey(key);
  }
};



$(function() {

  $.ajax({
    type: "GET",
    url: "jhu-county-data.csv?d=20200406",
    dataType: "text",
    success: function(response) {
      data = $.csv.toObjects(response);

      for (var d of data) {

        for (var key in d) {
          if (key != "Admin2" && key != "City" && key != "Date" && key != "Province_State" && key != "key") {
            d[key] = +d[key];
          }
        }

        let caseData = [];
        let max_cases = -1, max_deaths = -1;
        for (let i = 1; i <= 28; i++) {
          let cases = d[`d${i}_Confirmed`];
          let deaths = d[`d${i}_Deaths`];
          if (cases > max_cases) { max_cases = cases; }
          if (deaths > max_deaths) { max_deaths = deaths; }
          caseData.push({daysAgo: i, cases: cases, deaths: deaths});
          delete d[`d${i}_Confirmed`];
          delete d[`d${i}_Deaths`];
        }
        d.caseData = caseData;
        d.max = { cases: max_cases, deaths: max_deaths };

        var value = `${d.Admin2}, ${d.Province_State}`;
        if (d.Province_State == "District of Columbia") {
          value = "District of Columbia (Washington DC)";
        }
        
        d.key = value;
        dict[value] = d;

        if (d.City) { value += ` (${d.City})`; }

        options.push({
          value: value,
          data: d
        });
      }

      renderAll();

      $('#addLocation').devbridgeAutocomplete({
        lookup: options,
        onSelect: function (d) {
          console.log(d.data.key);
          storeAndAddKey(d.data.key);
          $('#addLocation').val("");
        }
      });

    }
  });
});