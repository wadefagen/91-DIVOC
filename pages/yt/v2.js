var _data;
var _xMax;

$(window).resize(function () {
  render();
});

var render = function() {
  let cur_width = $("#sizer").width();
  let margin = { top: 10, right: 20, bottom: 45, left: 40 };

  let width = cur_width;
  let height = 500;

  $("#chart").html("");


  let casesScale = d3.scaleLog()
  .domain([100, _xMax])
  .range([height, 0]);

  let daysScale = d3.scaleLinear()
  .domain([0, _yMax])
  .range([0, width]);

  let svg = d3.select("#chart")
  .append("svg")
  .attr("version", 1.1)
  .attr("xmlns", "http://www.w3.org/2000/svg")      
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .style("width", width + margin.left + margin.right)
  .style("height", height + margin.top + margin.bottom);  

  svg = svg.append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  let x_grid = d3.axisBottom(daysScale);
  svg.append("g")
  .attr("transform", "translate(" + 0 + "," + height + ")")
  .call(x_grid);

  let y_grid = d3.axisLeft(casesScale);
  svg.append("g")
  .call(y_grid);


  let colorScale = d3.scaleOrdinal(d3.schemeCategory10);

  let data = _data.filter(function(d) { return d["Day_Counter"] !== undefined && d["Confirmed"]; } )

  console.log(data);

  svg.selectAll(".data")
  .data(data)
  .enter()
  .append("circle")
  .attr("cy", (d) => casesScale(d.Confirmed) )
  .attr("cx", (d) => daysScale(d.Day_Counter) )
  .attr("fill", (d) => colorScale(d.Country_Region) )
  .attr("r", function (d) {
    if ( d["Country_Region"] == "United States" ) {
      return 4;
    } else {
      return 2;
    }
  })
  .style("opacity", function (d) {
    if ( d["Country_Region"] == "United States" ) {
      return 1;
    } else {
      return 0.4;
    }
  })  
  .on('mouseover', function (d) {
    console.log(d);
  })


};

$(function() {
  d3.csv("../jhu.csv").then(function (data) {
    _xMax = 0;
    _yMax = 0;

    daysCt = {};

    data.forEach(function (row) {
      row["Active"] = +row["Active"];
      row["Confirmed"] = +row["Confirmed"];
      row["Recovered"] = +row["Recovered"];
      row["Deaths"] = +row["Deaths"];
      row["People_Tested"] = +row["People_Tested"];
      row["People_Hospitalized"] = +row["People_Hospitalized"];

      if (row["Date"] > "2020-05-01") { return; }

      if (row["Province_State"] != "") { return; }

      let country = row["Country_Region"];
      if (!daysCt[country] && row["Confirmed"] > 100) {
        console.log(country);
        daysCt[country] = 0;
      }

      if (daysCt[country] !== undefined) {
        row["Day_Counter"] = daysCt[country];
        daysCt[country]++;
      }

      if (row["Confirmed"] > _xMax) { _xMax = row["Confirmed"]; }
      if (row["Day_Counter"] > _yMax) { _yMax = row["Day_Counter"]; }
    });

    _data = data;
    render();
  });

})