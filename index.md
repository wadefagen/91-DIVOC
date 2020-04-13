---
layout: home
---

<h3>Projects</h3>

<ul>
  <li>
    #02: <a href="pages/covid-by-your-locations/">COVID-19 Data for Locations of People You Love</a>
  </li>
  <li>
    #01: <a href="pages/covid-visualization/">An interactive visualization of the exponential spread of COVID-19</a>
  </li>
</ul>

<hr>

<h3>#02 - Local Storage - April 5, 2020</h3>

<p>
  A lot of people had amazing suggestions on the COVID-19 visualization and I implemented many of them to make the visualization as useful to as
  many people as possible.  One specific suggestion -- to allow the visualization to "remember" your previous choice -- was added with a quick bit
  of code to use a cookie to remember your previously selected county and state.
</p>

<p>
  Even though this feature was added nearly two weeks ago, I was never entirely happy with it.  Specifically, when a cookie is used, all of the
  data stored in the cookie is sent to the server every time a page is loaded.  For this site, that is absolutely not needed -- the highlighting
  of a selected country on the COVID-19 visualization is done inside of your web browser and not by the server.   I was certain there was a way
  to do this better: <i>How can I store user settings without needing to send the data to the server?</i>
</p>

<p>
  The goal of my second 91-DIVOC project was to explore the storage options available for "remembering" user preferences without a database.
  I found that every modern browser supports three ways:
</p>

<ul>
  <li>
    <b>Cookies</b>: Stores up to 4,096 bytes, accessible via JavaScript, and sent to the server along with every request (as part of the HTTP header).
  </li>
  <li>
    <b>Web Storage</b>: Stores up to ~5 MB, accessible via JavaScript, and <b>not sent</b> to the server.  Two sub-types:
    <ul>
      <li>
        <code>sessionStorage</code>, stores data for the current session but <b>lost when the browser is closed</b>
      </li>
      <li>
        <code>localStorage </code>, stores data with no expiration date and <b>persists when the browser is closed</b>
      </li>
    </ul>
  </li>
</ul>

<p>
  So <code>localStorage</code> is the winner -- a large amount of data can be stored, the data is private (never sent to the server), and
  persists for a long time.  But how can I build something to explore this technology?
</p>

<p>
  Reflecting on the past week, I found myself caring less and less on the depressing global statistics and focusing more on the cases and
  deaths in the communities where I have people I love.  The University of Illinois is located in Champaign County, Illinois and, as April 5, 2020,
  the cases have started to explode -- 400% growth, from 11 to 55 cases, all in the past week.
</p>

<p>
  My second project was to create a COVID-19 tool that shows <b>only</b> the data from the locations that means the most to you:
</p>

<div class="card">
  <a href="pages/covid-by-your-locations/">COVID-19 Data for Locations of People You Love &gt;&gt;</a>
</div>

<p>
  If you have never created something that has had user preferences saved locally -- not without a database or other infrastructure -- this
  was <b>surprisingly easy</b>.  It's worth getting it a shot and I hope you go start creating! :)
</p>


<hr>


<h3>#01 - COVID-19 Dataset - March 21, 2020</h3>

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
  and share what you create, be sure to use <b>#91divoc</b>.  Go start creating! :)
</p>
