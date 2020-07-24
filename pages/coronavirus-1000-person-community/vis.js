var _options = [];
var _dict = {};
var _factor = 1000;
var _date;
var _selection = "United States";

const generatePeople = (n) => {
  const svg_person = `<svg viewBox="0 0 37 95"><use xlink:href="#svg-person"></use></svg>`;
  const svg_person_width = 14.11;

  let s = "";

  let whole = Math.floor(n);
  for (let i = 1; i < n; i++) {
    s += `<div class="frac">${svg_person}</div>`;
  }

  let frac = n - whole;

  if (frac >= 0.05) {
    s += `<div class="frac" style="width: ${svg_person_width * frac}px;">${svg_person}</div>`;
  } else if (n == 0) {
    s += `<span style="position: relative; top: -20px;">0</span>`;
  } else if (n < 1) {
    s += `<div class="frac" style="width: 1px;">${svg_person}</div>`;
  }

  return s;
};

$(function() {

  $.ajax({
    type: "GET",
    url: "data.csv",
    dataType: "text",
    success: function(response) {
      data = $.csv.toObjects(response);

      for (var d of data) {
        for (var field of ["Confirmed", "Deaths", "Recovered", "Active", "People_Tested", "dWeek_Confirmed", "dWeek_Deaths", "dWeek_Recovered", "dWeek_Active", "dWeek_People_Tested", "Population"]) {
          d[field] = +d[field];
        }

        // For `devbridgeAutocomplete`:
        value = d.Province_State;
        d.key = value;
        _dict[value] = d;

        _options.push({
          value: value,
          data: d
        });
      }

      $('#locationSelection').devbridgeAutocomplete({
        lookup: _options,
        onSelect: function (d) {
          _selection = d.data.Province_State;

          $(".loading").show();
          $(".content").hide();
          setTimeout( () => { visualize(d.data); }, 0 );          
          gtag("event", "03_select", {event_category: _selection});
        }
      });

      console.log( $("#locationSelection").attr('value') );

      visualize( _dict[_selection] );
    }
  });
});

const f = (n, digits = 1) => {
  let result = "0";
  while (result == "0" && n > 0 && digits <= 5) {
    result = n.toLocaleString("en-US", {maximumFractionDigits: digits});
    digits++;
  }
  
  return result;
};

const abbr_and_value = (q, str, n, digits = 1, unit = "") => {
  var n_str = f(n, digits);
  $(q).html(`<abbr title="${str}">${n_str}${unit}</abbr>`);
};

const updateFactor = (n) => {
  $(".easteregg").hide();
  $(".easteregg-1").show();  

  _factor = n;
  $(".lead").html(  $(".lead").html().replace(/1,000/g, f(n)) );
  $(".loading").show();
  $(".content").hide();  
  setTimeout( () => { visualize(_dict[_selection]); }, 0 );          
  gtag("event", "03_updateFactor", {event_category: _selection, event_label: n});
}

var visualize = (d) => {
  let pop = d.Population;
  let confirmed = d.Confirmed;
  let deaths = d.Deaths;
  let tested = d.People_Tested;
  let recovered = d.Recovered;
  let active = d.Active;
  let unknown = pop - confirmed - tested;

  let dateParts;

  dateParts = d.Date.split("-");
  let date = new Date(parseInt(dateParts[2]), parseInt(dateParts[0]) - 1, parseInt(dateParts[1]));

  dateParts = d.dWeek_Date.split("-");
  let dWeek_Date = new Date(parseInt(dateParts[2]), parseInt(dateParts[0]) - 1, parseInt(dateParts[1]));

  _date = date_str = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  dWeek_date_str = dWeek_Date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })


  if (recovered == 0) {
    $(".has-recovered-data").hide();
  } else {
    $(".has-recovered-data").show();
  }

  let unknown_1k = (unknown / pop) * _factor;
  let neg_1k = ((tested - confirmed) / pop) * _factor;
  let pos_1k = (confirmed / pop) * _factor;
  let died_1k = (deaths / pop) * _factor;
  let recovered_1k = (recovered / pop) * _factor;
  let active_1k = (active / pop) * _factor;
  let location = d.Province_State;
  let location_b = `<b>${location}</b>`;

  
  if (location == "United States") {
    location = "the " + location;
    location_b = "the " + location_b;
  } 

  $(`[data-field="location"]`).html(location);
  $(`[data-field="location-b"]`).html(location_b);
  $(`[data-field="date"]`).html(date_str);

  if (_factor != 1000) {
    $(`[data-field="factor"]`).html("&#x1F338;" + f(_factor) + "&#x1F338;");
  } else {
    $(`[data-field="factor"]`).html(f(_factor));
  }

  abbr_and_value(`[data-field="population"]`, `Source: Wikipedia`, pop, 0);
  abbr_and_value(`[data-field="population_1k"]`, `= ${f(pop)} (the population of ${location}) / ${f(_factor)}`, pop / _factor, 0)
  abbr_and_value(`[data-field="mortality-rate"]`, `= ${f(deaths)} fatalities / ${f(confirmed)} confirmed cases\nThe lower this number the better.`, 100 * deaths / confirmed, 1, "%");
  abbr_and_value(`[data-field="test-positivity"]`, `= ${f(confirmed)} confirmed cases / ${f(tested)} total tests\nThe lower this number the better.`, 100 * confirmed / tested, 1, "%");

  abbr_and_value("b.person-unknown", `~${f(unknown)} people with unknown/unconfirmed CVOID-19 status in ${location}`, unknown_1k);
  abbr_and_value("b.person-tested-neg", `${f(tested - confirmed)} negative tests in ${location}`, neg_1k);
  
  abbr_and_value("b.person-tested-pos", `${f(confirmed)} confirmed COVID-19 cases in ${location}`, pos_1k)
  abbr_and_value("b.person-died", `${f(deaths)} fatalities due to COVID-19 in ${location}`, died_1k)
  abbr_and_value("b.person-recovered", `${f(recovered)} confirmed recovered from COVID-19 in ${location}`, recovered_1k);

  $("div.person-unknown").html(generatePeople( unknown_1k ));
  $("div.person-recovered").html(generatePeople( recovered_1k ));
  $("div.person-tested-neg").html(generatePeople(neg_1k));
  $("div.person-tested-pos").html(generatePeople( pos_1k - recovered_1k - died_1k ));
  $("div.person-died").html(generatePeople(died_1k));

  let dWeek_Confirmed = d.dWeek_Confirmed;
  let dWeek_Confirmed_1k = (dWeek_Confirmed / pop) * _factor;

  let dWeek_Deaths = d.dWeek_Deaths;
  let dWeek_Deaths_1k = (dWeek_Deaths / pop) * _factor;

  let dWeek_People_Tested = d.dWeek_People_Tested;
  let dWeek_Negative = dWeek_People_Tested - dWeek_Deaths - dWeek_Confirmed;  
  let dWeek_Negative_1k = (dWeek_Negative / pop) * _factor;

  let dWeek_Recovered = d.dWeek_Recovered;
  let dWeek_Recovered_1k = (dWeek_Recovered / pop) * _factor;

  $("div.person-newTesting").html(generatePeople(dWeek_Confirmed_1k + dWeek_Negative_1k));
  $("div.person-newCases").html(generatePeople(dWeek_Confirmed_1k));
  $("div.person-newNeg").html(generatePeople(dWeek_Negative_1k));

  abbr_and_value(`[data-field="new-pos"]`, `${f(dWeek_Confirmed)} new confirmed COVID-19 cases over the past week in ${location}`, dWeek_Confirmed_1k, 2);
  abbr_and_value(`[data-field="new-neg"]`, `${f(dWeek_Negative)} new negative COVID-19 tests over the past week in ${location}`, dWeek_Negative_1k, 2);
  abbr_and_value(`[data-field="new-recovered"]`, `${f(dWeek_Recovered)} new recoveries over the past week in ${location}`, dWeek_Recovered_1k, 2);
  abbr_and_value(`[data-field="new-dead"]`, `${f(dWeek_Deaths)} new fatalities over the past week in ${location}`, dWeek_Deaths_1k, 2);

  
  $(`[data-field="dWeek-date"]`).html( dWeek_date_str );


  $("div.person-newRecoveredOrDied").html(generatePeople(dWeek_Recovered_1k + dWeek_Deaths_1k));
  $("div.person-newRecovered").html(generatePeople(dWeek_Recovered_1k));
  $("div.person-newDeaths").html(generatePeople(dWeek_Deaths_1k));


  $(".loading").hide();
  $(".content").show();

  gtag("event", "03_render", {event_category: _selection});
};

