---
layout: project

title: Guide to "An interactive visualization of the exponential spread of COVID-19"

desc: 91-DIVOC provides a data-froward visualization of COVID-19 data in the United States and globally.  This guide will provide you an exploration of many of the graphs you can create using the data visualization.
---

## Data Sources

All of the data presented on this visualization comes from either Johns Hopkins University, Oxford University (Our World in Data), or The Atlantic (COVID Tracking Project).  By default, all data is sourced from Johns Hopkins University.  You can switch between the data sources by using the "Data Source" control at the top of the visualization.

### Regions

In addition to the country and state data provided by the data sources, several regions are added for additional context.  These regions include:

1. All [World Health Organization (WHO) regions](https://en.wikipedia.org/wiki/WHO_regions), which includes:
  - African Region (WHO-AFRO)
  - Region of the Americas (WHO-PAHO)
  - South-East Asia Region (WHO-SEARO)
  - European Region (WHO-EURO)
  - Eastern Mediterranean Region (WHO-EMRO)
  - Western Pacific Region (WHO-WPRO)

2. The [European Union, based off the current union of 27 members states ("EU-27")](https://en.wikipedia.org/wiki/European_Union).

3. The four [United States' US Census Bureau-designated regions](https://en.wikipedia.org/wiki/List_of_regions_of_the_United_States#Census_Bureau-designated_regions_and_divisions):
  - Northeast, which includes New Jersey and Pennsylvania and states further to the northeast
  - South, which includes Delaware, Maryland, West Virginia, Kentucky, Arkansas, Oklahoma, Texas, and all states south and east of those.
  - Midwest, which includes the Dakotas, Nebraska and Kansas
  - West, which includes Hawaii and Alaska

<hr>

## 91-DIVOC Visualization

The 91-DIVOC visualization has two major ares: the visualization and the visualization controls found below the visualization.  When you
first arrive at the visualization, you will see a visualization of the 7-day average of the total number of confirmed cases per day.

<p style="text-align: center">
  <img src="legend.png" class="img-fluid" style="max-width: 80%;"><br>
</p>

<hr>

### Data Options

In the visualization controls, the "Data" selection allows you view various different data about COVID-19 in Illinois.  Currently, the following data choices are available:

1. [**Confirmed COVID-19 Cases**](../?data=cases-daily-7#countries), reporting the total number of people in Illinois who has received a positive COVID-19 test.
2. [**Confirmed COVID-19 Deaths**](../?data=deaths-daily-7#countries), reporting the total number of deaths confirmed to be caused by COVID-19.
3. [**COVID-19 Tests**](../?data=tests-daily-7#countries), reporting the total number of COVID-19 tests administered.
4. [**Test Positivity**](../?data=testPositivityRate-daily-7#countries), the percentage of tests administered that returned a positive result.
  - This value can be computed approximately by taking the number of confirmed cases divided by the total number of tests.
  - The Illinois Department of Health also provides this value at a region-level.
5. [**ICU Utilization**](../?data=icu-daily-7#countries), reporting the capacity of Intensive Care Units (ICUs).
6. [**Ventilators in Use**](../?data=ventilators-daily-7#countries), reporting the use of available ventilators.
7. [**Medical Beds in Use**](../?data=beds-daily-7#countries), reporting the use of medical/surgical beds in hospitals.


#### Restore Illinois Phase 3/Phase 4 Threshold

On the "Restore Illinois" page, the Department of Health shows gauge visualization of six factors including test positivity, ICU utilization, ventilator use, and medical/surgical beds.  When viewing those charts, displays this gauge as a dashed red line showing when the gauge would reach the "Phase 3" threshold.

<div class="row text-center">
  <div class="col-md-6 mb-3">
    <a href="/pages/interactive-visualziation-of-covid-19-in-illinois/?chart=countries&highlight=Cook&show=25&y=highlight&scale=linear&data=testPositivity-daily-7&data-source=il-dph&xaxis=right-12wk&extra=#countriess">
      <img src="testPositivity-Cook.png" class="img-fluid" style="max-width: 80%; border: solid 1px black;"><br>
      <i style="font-size: 12px;">Click to view the interactive version of this visualization.<br></i>
      Test Positivity of Cook County
    </a>
  </div>
  <div class="col-md-6">
    <a href="/pages/interactive-visualziation-of-covid-19-in-illinois/?chart=countries&highlight=(All%20Regions)&show=25&y=highlight&scale=linear&data=icu-daily-7&data-source=il-dph&xaxis=right-12wk#countries">
      <img src="icu-Regions.png" class="img-fluid" style="max-width: 80%; border: solid 1px black;"><br>
      <i style="font-size: 12px;">Click to view the interactive version of this visualization.<br></i>
      ICU Utilization of All Regions
    </a>
  </div>
</div>

<hr>

### Highlight Options

In the visualization controls, the "Highlight" selection allows you view various data on different regions and counties across Illinois.

- At the top of the list, "(None)" and "(All Regions)" allow you to highlight nothing or all four regions.
- Below that, every Illinois county with COVID-19 is available.  You can select to view counties like [**Cook County**](../?highlight=Cook#countries), [**Lake County**](../?highlight=Lake#countries), [**Champaign County**](../?highlight=Champaign#countries), and over 100 others.


#### Additional Highlights

It is often useful to highlight multiple counties to compare case data between various counties.  Towards the bottom of the visualization controls, the "+Add Additional Highlight" allows you to highlight multiple regions/counties at once.  For example, we can compare the number of tests administered in Lake County vs. Cook County or the test positivity of Cook and Lake Counties:

<div class="row text-center">
  <div class="col-md-6 mb-3">
    <a href="/pages/interactive-visualziation-of-covid-19-in-illinois/?chart=countries&highlight=Lake&show=25&y=highlight&scale=linear&data=cases-daily-7&data-source=il-dph&xaxis=right-12wk&extra=Champaign#countries">
      <img src="cases-Lake-Champaign.png" class="img-fluid" style="max-width: 80%; border: solid 1px black;"><br>
      <i style="font-size: 12px;">Click to view the interactive version of this visualization.<br></i>
      New Confirmed Cases in Lake and Champaign Counties per Day
    </a>
  </div>
  <div class="col-md-6">
    <a href="/pages/interactive-visualziation-of-covid-19-in-illinois/?chart=countries&highlight=Cook&show=25&y=highlight&scale=linear&data=testPositivity-daily-7&data-source=il-dph&xaxis=right-12wk&extra=Lake#countries">
      <img src="tests-Lake-Champaign.png" class="img-fluid" style="max-width: 80%; border: solid 1px black;"><br>
      <i style="font-size: 12px;">Click to view the interactive version of this visualization.<br></i>
      Daily COVID-19 Tests in Lake and Champaign Counties
    </a>
  </div>
</div>

<hr>

## Normalized by Population

All data presented can be viewed either as raw numbers (the first visualization displayed) or normalized by the county population (the second visualization displayed).  In both visualizations, the same data is displayed except that the normalized data is divided by the county population.  The normalized data is then presented as **per 1,000,000 people**.

As an example, consider the testing data of both Cook County (Illinois' largest county, containing Chicago) and Champaign County (a mid-sized county, containing the University of Illinois at Urbana-Champaign).

- As of July 20, Cook County has administered 467,104 COVID-19 tests.  With a county population of 5,150,233 people, Cook County has 0.090696 tests /person -- or **90,696 tests /1,000,000 people**.

- As of July 20, Champaign County has administered 52,555 COVID-19 tests.  With a county population of 209,689 people, Champaign County has 0.250633 tests /person -- or **250,633 tests /1,000,000 people**.

This normalized view of the data allows each county to be compared in a way that focuses on how each individual person in the county is doing and provides a good county-to-county comparison.

<div class="row text-center">
  <div class="col-md-6 mb-3">
    <a href="/pages/interactive-visualziation-of-covid-19-in-illinois/?chart=countries&highlight=Cook&show=25&y=highlight&scale=linear&data=tests&data-source=il-dph&xaxis=right-12wk&extra=Champaign#countries">
      <img src="tests-Cook-Champaign.png" class="img-fluid" style="max-width: 80%; border: solid 1px black;"><br>
      <i style="font-size: 12px;">Click to view the interactive version of this visualization.<br></i>
      Cook vs. Champaign County Total Tests (Raw)
    </a>
  </div>
  <div class="col-md-6">
    <a href="/pages/interactive-visualziation-of-covid-19-in-illinois/?chart=countries-normalized&highlight=Cook&show=25&y=highlight&scale=linear&data=tests&data-source=il-dph&xaxis=right-12wk&extra=Champaign#countries-normalized">
      <img src="tests-normalized-Cook-Champaign.png" class="img-fluid" style="max-width: 80%; border: solid 1px black;"><br>
      <i style="font-size: 12px;">Click to view the interactive version of this visualization.<br></i>
      Cook vs. Champaign County Total Tests (Normalized)
    </a>
  </div>
</div>

<hr>

## Show Options

Behind the highlighted data, other data is shown slightly faded to provide greater prospective on the highlighted data.  By default, the highlighted data is displayed along with the "Top 25" counties in Illinois.  There are several different options to choose by controlling the "Show" options in the visualization controls:

- **Highlight Only**, showing no faded data at all and only displaying the data you selected to highlight.
- **Specific Regions Only**, showing only counties to a specific region (ex: "Northeast", "North Central", etc).
- **By Data**, showing the specific number of counties based on their current data values (ex: "Top 25", "Bottom 10", etc).
- **Regions/Cities Only**, showing only the region lines themselves without any county-level information.  Data for "Chicago" is shown when available.
- **Everything**, showing everything without filtering any data.  Given the huge amount of data, this can sometimes create a quite messy visualization.

<div class="row text-center">
  <div class="col-md-6 mb-3">
    <a href="/pages/interactive-visualziation-of-covid-19-in-illinois/?chart=countries-normalized&highlight=Region%3A%20Northeast&show=Region%3A%20Northeast&y=highlight&scale=linear&data=cases-daily-7&data-source=il-dph&xaxis=right-12wk#countries-normalized">
      <img src="cases-NE-show_NE.png" class="img-fluid" style="max-width: 80%; border: solid 1px black;"><br>
      <i style="font-size: 12px;">Click to view the interactive version of this visualization.<br></i>
      Northeast Region <b>showing Only Northeast Region Counties</b>, normalized by population
    </a>
  </div>
  <div class="col-md-6">
    <a href="/pages/interactive-visualziation-of-covid-19-in-illinois/?chart=countries-normalized&highlight=Region%3A%20Northeast&show=all&y=highlight&scale=linear&data=cases-daily-7&data-source=il-dph&xaxis=right-12wk#countries-normalized">
      <img src="cases-NE-show_everything.png" class="img-fluid" style="max-width: 80%; border: solid 1px black;"><br>
      <i style="font-size: 12px;">Click to view the interactive version of this visualization.<br></i>
      Northeast Region <b>showing Everything</b>, normalized by population
    </a>
  </div>
</div>

<hr>

## Many More Options

This guide only begins to explore the different options available.  Additional options include:

- Using **X-Axis** options to control the amount of days/weeks of data is displayed.
- Using **Y-Axis** options to adjust the scale of the y-axis to zoom in/out of the data.
- Using **Scale** to switch between a linear and logarithmic view of the data.
- Using **Animate** to animate the graph.
- Using **Save** to save the current image (as a PNG or SVG), the current animation (as a GIF or WebM), or the current data (as a CSV).
- Using **Generate Report** to generate a report showing the largest increases/decreases of the data currently being shown.

### Direct Link

Finally, every change you make to the visualization will generate a "Direct Link" that will link to the specific visualization you have created.  You can bookmark this link to view it later or share it with friends/family to help them understand COVID-19 data.

<hr>

<div class="card">
  <a href="../">View It -- Interactive Visualization of COVID-19 in Illinois &gt;&gt;</a>
</div>