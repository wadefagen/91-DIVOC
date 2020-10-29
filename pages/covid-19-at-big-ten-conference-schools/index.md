---
layout: bare-with-title
title: COVID-19 at Big Ten Conference Schools
# slug: Perception of Probability Words

description: Interactive, data-forward visualization of publicly-reported COVID-19 data from Big Ten schools.  Customizable views of confirmed cases, tests administered,  test positivity, and more. Updated daily.

jhuUpdated: true

date: 2020-10-01

social-img: https://91-divoc.com/pages/covid-19-at-big-ten-conference-schools/social.png
author:
- Wade Fagen-Ulmschneider
---
<style>svg{background-color:#fcfbfd}.lesser-used-options .input-group-text{background-color:#fce5ff}.input-group-prepend .input-group-text{border-top-right-radius:0;border-bottom-right-radius:0}.form-control{border-top-left-radius:0!important;border-bottom-left-radius:0!important}.svg-hover-highlight{opacity:1!important}path.svg-hover-highlight{stroke-width:2px}circle.svg-hover-highlight{stroke:#000;stroke-width:.5px}text.C_highlight{stroke:#000;stroke-width:.3px}text.svg-hover-highlight{font-size:15px;stroke:#000;stroke-width:.3px}.chart-viz{background-color:#fcfbfd;border-left:solid 1px #ccc;border-right:solid 1px #ccc;border-top:solid 1px #ccc}.chart-header,.chart-header h2{text-align:left;font-family:Roboto,sans-serif;font-size:1.3em;font-weight:700;padding:0;border-bottom-width:0}.chart-footer{background-color:#fcfbfd;border:solid 1px #ccc;padding:5px}.axis text{font-weight:700;font-family:Montserrat,sans-serif}.axis-title{font-size:14px;font-weight:700;font-family:Montserrat,sans-serif}.grid{stroke-opacity:.15;color:#7f59a5}.tip-country{font-weight:700;border-bottom:solid 1px #000}.tip-details{font-size:12px}.text-credits{opacity:.3;font-weight:700;font-size:12px;font-family:Montserrat,sans-serif}.label-country{font-size:10px;font-weight:700;font-family:Montserrat,sans-serif}i{color:#aaa}.data-scale-float{float:right;text-align:right}.data-scale-float>div{padding-bottom:3px}.d3-tip{line-height:1;padding:4px;background:rgba(255,255,255,.9);color:#000;border-radius:2px;pointer-events:none;border:solid 1px #000;margin-bottom:200px;width:200px;text-align:center}.d3-tip:after{box-sizing:border-box;display:inline;font-size:10px;width:100%;line-height:1;color:rgba(0,0,0,.8);position:absolute;pointer-events:none}.d3-tip.n:after{content:"\25BC";margin:-1px 0 0 0;top:100%;left:0;text-align:center}.d3-tip.e:after{content:"\25C0";margin:-4px 0 0 0;top:50%;left:-8px}.d3-tip.s:after{content:"\25B2";margin:0 0 1px 0;top:-8px;left:0;text-align:center}.d3-tip.w:after{content:"\25B6";margin:-4px 0 0 -1px;top:50%;left:100%}.query-string{display:none;border-top:dashed 1px #aaa;overflow-wrap:break-word;word-wrap:break-word;-ms-word-break:break-all;word-break:break-all;word-break:break-word;-ms-hyphens:auto;-moz-hyphens:auto;-webkit-hyphens:auto;hyphens:auto}.saveOptions{padding-top:3px;margin-top:3px;border-top:dashed 1px #aaa}.addOptions{line-height:175%}.addOptions a{white-space:nowrap}@media (min-width:501px){.divoc-graph-loading{height:555px}.divoc-graph-loading>.spinner-border{margin-top:250px}}@media (max-width:500px){.divoc-graph-loading{height:355px}.divoc-graph-loading>.spinner-border{margin-top:150px}}div.card{background-color:#cfe}div.card>a{color:#064}section{margin-bottom:30px}.btn-group{margin-bottom:2px}</style>

<style>


.card-full {
  margin-bottom: 15px;
}

.card-full > div > div:first-child {
  text-align: center;
  padding: 2px;
}


@media (min-width: 768px) {
  .card-full > div > div:first-child {
    border-right: solid 1px #ccc;
  }
}

@media (max-width: 767px) {
  .card-full .title {
    border-top: solid 1px #ccc;
    padding-left: 4px; padding-right: 4px;
  }

  .card-full .authors {
    padding-left: 4px; padding-right: 4px;
  }
}

.card-full .title, .vcard .title {
  font-size: 1.3rem;
  font-weight: bold;
  color: hsl(173, 30%, 50%);
}

.vcard a {
  text-decoration: none;
}


.card-full img {
  max-height: 150px;
}

a.card {
  padding: 5px 5px;
  text-align: center;
  font-weight: bold;
  background-color: hsla(173, 30%, 95%, 1);
}
</style>

<div id="sizer"></div>
{% include_relative _chart.html %}


<hr>

<!--
<h3>Analysis</h3>

Several faculty and I are collaborating on analysis of this data and related collegiate COVID-19 data, you can view the analysis COVID-19 trends at in our <a href="https://waf.cs.illinois.edu/covid-analysis/">Data-Forward Collegiate COVID-19 Analysis</a> website.

<a href="https://waf.cs.illinois.edu/covid-analysis/" class="card">
  Data-Forward Collegiate COVID-19 Analysis &gt;&gt;
</a>

<hr>
-->

<h3>Visualization Overview</h3>

The data on this visualization is sourced daily from the COVID-19 dashboards of the Big Ten Conference Universities:

- University of Illinois, [https://go.illinois.edu/COVIDTestingData](https://go.illinois.edu/COVIDTestingData)
- Indiana University, [https://fall2020.iu.edu/dashboards/](https://fall2020.iu.edu/dashboards/)
- Maryland, [https://umd.edu/covid-19-dashboard](https://umd.edu/covid-19-dashboard)
- Michigan, [https://campusblueprint.umich.edu/dashboard/](https://campusblueprint.umich.edu/dashboard/)
- Michigan State, [https://msu.edu/together-we-will/testing-reporting/](https://msu.edu/together-we-will/testing-reporting/)
- Ohio State, [https://safeandhealthy.osu.edu/dashboard](https://safeandhealthy.osu.edu/dashboard)
- Penn State, [https://virusinfo.psu.edu/covid-19-dashboard](https://virusinfo.psu.edu/covid-19-dashboard)
- Rutgers, [https://coronavirus.rutgers.edu/health-and-safety/testing-program-dashboard/](https://coronavirus.rutgers.edu/health-and-safety/testing-program-dashboard/)
- Nebraska, [https://covid19.unl.edu/unl-covid-19-dashboard](https://covid19.unl.edu/unl-covid-19-dashboard)
- Minnesota, [https://safe-campus.umn.edu/return-campus/covid-19-dashboard](https://safe-campus.umn.edu/return-campus/covid-19-dashboard)
- Iowa, [https://coronavirus.uiowa.edu/covid-19-numbers](https://coronavirus.uiowa.edu/covid-19-numbers)
- Northwestern, [https://www.northwestern.edu/coronavirus-covid-19-updates/developments/confirmed-cases.html](https://www.northwestern.edu/coronavirus-covid-19-updates/developments/confirmed-cases.html)
- Purdue, [https://protect.purdue.edu/dashboard/](https://protect.purdue.edu/dashboard/)
- UW-Madison, [https://smartrestart.wisc.edu/dashboard/](https://smartrestart.wisc.edu/dashboard/)

Each day, I am updating the data for this visualization between 6:00pm and 10:00am (central time zone) to publish a new version of this page each day with the latest data.  I am also providing the raw data in this visualization as part of my [College COVID-19 Dataset available on GitHub](https://github.com/wadefagen/college-covid19-dataset).



<h4>Data Collection</h4>

This visualization currently shows the total number of cases among **all members of each campus** -- students, faculty, and staff.  Some dashboards split this data into various segments (ex: students and faculty/staff individually) and, in those cases, the data from all groups are added together.  The collection of data for this visualization started on Wednesday, Aug. 26.  Some schools only report aggravated data and on/around Aug. 26 when the data collection started.

If you have any ideas for this data visualization or know of other sources of data, feel free to reach out to me at <b>waf@illinois.edu</b>! :)

<hr>

<div class="explore-more" style="margin-top: 15px;">
  <h6>Explore More 91-DIVOC</h6>
  <ul>
    <li><a href="../covid-visualization/"><b>91-DIVOC #01</b>: An interactive visualization of the exponential spread of COVID-19</a></li>
    <li><a href="../covid-by-your-locations/"><b>91-DIVOC #02</b>: COVID-19 Data for Locations of People You Love</a></li>
    <li><a href="../coronavirus-1000-person-community/"><b>91-DIVOC #03</b>: Coronavirus Visualized as a 1,000-Person Community</a></li>
    <li><a href="../coronavirus-contribution-by-state/"><b>91-DIVOC #04</b>: Coronavirus Contribution by State</a></li>
    <li><a href="../interactive-visualziation-of-covid-19-in-illinois/"><b>91-DIVOC #05</b>: Interactive Visualization of COVID-19 in Illinois</a></li>
    <li>Once Monthly Visualization Updates: <a href="https://forms.gle/oLXWdijmr9i2Yxau9" rel="noreferrer" target="_blank">Join Prof. Wade's e-mail list</a>, creator of 91-DIVOC</li>
  </ul>      
</div> 

<hr>

<!-- GA/Display--><ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-9247209205736147" data-ad-slot="3955045624" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script>



<script defer src="https://code.jquery.com/jquery-3.5.1.min.js" integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0=" crossorigin="anonymous"></script>
<script defer src="https://cdn.jsdelivr.net/npm/lodash@4.17.19/lodash.min.js" integrity="sha256-Jvh9+A4HNbbWsWl1Dw7kAzNsU3y8elGIjLnUSUNMtLg=" crossorigin="anonymous"></script>
<script defer src="https://d3js.org/d3.v5.min.js" crossorigin="anonymous"></script>

<script defer src="/static/js/d3-tip.js"></script>
<script defer src="src/updated.js"></script>
<script defer src="src/vis.js"></script>
