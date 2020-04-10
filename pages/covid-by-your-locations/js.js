var options = [];
var dict = {};
var localStorage = window.localStorage;
var nextId = 0;

var storedLocations = [];
if (localStorage['storedLocations']) {
  storedLocations = JSON.parse(localStorage['storedLocations']);
  console.log(storedLocations);
}


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

var populateByKey = function(key) {
  var d = dict[key];
  if (!d) { console.log("Bad key: " + key); removeByKey(key); return ""; }

  var location = d.key;

  if (d.City) { location += ` (${d.City})`; }

  var html =
    `<tr>
      <td>
        ${location}
        <div><button style="font-size: 12px;" onclick="removeByKey('${d.key}')">Remove Location</button></div>
      </td>
      <td>
        ${cases(d, "Confirmed")}
        <div style="font-size: 12px;">${pctGrowth(d, "Confirmed")}</div>
      </td>
      <td>
        ${cases(d, "Deaths")}
        <div style="font-size: 12px;">${pctGrowth(d, "Deaths")}</div>
      </td>
    </tr>`;

  return html;
};

var addByKey = function(key) {
  var e = $("#datatable");
  var html = e.html();
  $("#datatable").html(html + populateByKey(key));
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




$(function() {

  $.ajax({
    type: "GET",
    url: "jhu-county-data.csv?d=20200406",
    dataType: "text",
    success: function(response) {
      data = $.csv.toObjects(response);

      for (var d of data) {
        d.Confirmed = +d.Confirmed;
        d.Deaths = +d.Deaths;
        d.dWeek_Confirmed = +d.dWeek_Confirmed;
        d.dYesterday_Confirmed = +d.dYesterday_Confirmed;
        d.dWeek_Deaths = +d.dWeek_Deaths;
        d.dYesterday_Deaths = +d.dYesterday_Deaths;

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

      for (var key of storedLocations) {
        addByKey(key);
      }

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