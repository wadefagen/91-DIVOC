---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults

layout: home
---

<h3>#01 - COVID-19 Dataset</h3>

<p>
  One thing that has impressed me the most is the vast amount of high-quality, organized data around COVID-19.  One of the leaders
  since the early days of COVID-19 has been <a href="https://systems.jhu.edu/" target="_blank">John Hopkins' Center for Systems Science and Engineering</a>.
  As part of making an <a href="https://www.arcgis.com/apps/opsdashboard/index.html">incredible visual map of the outbreak</a>,
  they <a href="https://github.com/CSSEGISandData/COVID-19">open-sourced all of their data collection on GitHub</a>.
</p>

<p>
  <ul>
    <li>
      <b>Dataset</b>: 2019 Novel Coronavirus COVID-19 (2019-nCoV) Data Repository by Johns Hopkins CSSE
    </li>
    <li>
      <b>Format</b>: Comma-Separated Values (CSV) &ndash; Opens in Excel, Google Docs, etc
    </li>
    <li>
      <b>My Short Description</b>: This dataset contains the number of confirmed cases, number of recoveries, and number of deaths for every country,
      listed by the cumulative count for each day since Jan. 18, 2020.  Data files are extremely self-descriptive.
    </li>
    <li>
      <b>Link:</b> <a href="https://github.com/CSSEGISandData/COVID-19/tree/master/csse_covid_19_data/csse_covid_19_time_series">https://github.com/CSSEGISandData/COVID-19/tree/master/csse_covid_19_data/csse_covid_19_time_series</a>
    </li>
  </ul>
</p>

<p>
  While exploring this dataset, I wanted to find what others have created.  There were a lot of maps
  <a href="https://coronavirus.jhu.edu/map.html">similar to John Hopkins</a> that displayed the number of active cases as a "heat map".  This is
  informative, but they did not provide any direct insight on how the situation was evolving <b>right now</b>.
</p>

<p>
  The visualization that inspired me the most was one I found created by <a href="https://twitter.com/jburnmurdoch" target="_blank">John Burn-Murdoch</a>
  that overlapped the number of cases in various countries
  <a href="https://www.ft.com/content/a26fbf7e-48f8-11ea-aeb3-955839e06441" target="_blank">based on the day when each country had the their 100th person infected</a>.
  <b>I love it!</b>
</p>

<p>
  With this first 91-DIVOC project, my goal is to create my own version of the overlapping countries visualization.  I used the dataset linked above, along with
  a visualization library called <a href="https://d3js.org/" target="_blank">d3.js</a>, to create an interactive visualization that allows a user to mouseover any point to explore the data,
  change the scale for logarithmic (better at showing exponentially increasing data) to linear (better at showing the human impact), and
  change what country is highlighted.  Here's what I created:
</p>

<div class="card">
  <a href="pages/covid-visualization/">My interactive visualization of the exponential spread of COVID-19 &gt;&gt;</a>
</div>

<p>
  I hope you will download the dataset and play with it!  The dataset opens in Excel, in Google Sheets, and is easily readable using Python and
  JavaScript -- it is data that is impacting this world more than anything else right now and you have access to it!  I would love to see
  and share what you create, be sure to use <b>#91-divoc</b> and <b>#91-divoc-01</b>.  Go start creating! :)
</p>
