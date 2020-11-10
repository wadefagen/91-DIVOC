---
layout: project

title: "Change Log for 91-DIVOC #01"
desc: This change log lists the major changes made to "An interactive visualization of the exponential spread of COVID-19".
---

<style>

  footer {
    margin-top: 40px;
  }
</style>

<div class="card">
  <a href="/pages/covid-visualization/">An interactive visualization of the exponential spread of COVID-19 &gt;&gt;</a>
</div>

## Nov. 2 -- Improving the Y-Axis on Log Scaling

With the introduction of derivative charts, the new code for log scaling on some graphs (particularly those with large values, like a graph of cumulative deaths) left a lot of whitespace at the bottom of the graph due to x-intercept of the y-axis was "fixed" at starting at 0.001.

Log scales are tricky as they are undefined at 0, so you are unable to start the y-axis labeling as 0 and visualizations are forced to choose a non-zero value.  (This differs from a linear scale, where best practices dictate that -- unless it's both obvious to the reader and for a clear reason -- an honest visualization will always start with the y-axis at zero.)  With today's update, I've implemented new code to calculate the starting value (x-intercept) for the log scales.

In general, the scale for all log graphs will start at the 10<sup><code>x</code></sup> power such that 10<sup><code>x</code></sup> is lower than the lowest positive data point, with two exceptions:
- The lowest value for `x` is -3 (or 0.001), even if data values are smaller than 0.001 (ex: less than 0.001 cases /100k).  These points, will be displayed as a data point below the x-axis (slightly outside of the graph region).
- If the graph spans over 5 orders of magnitude, `x` is increased (up to a maximum of `x=0` or 1) to attempt to show 5 orders of magnitude.  Since `x` is capped at `x=0`, graphs with large values may still show many more orders of magnitude.


## Oct. 30 - More Derivative Charts

I received a number of questions (and a lot of interest) on the derivative charts that were recently added -- the charts helped show the overall trends, but the day-of-week swings in the underlying data made the chart less useful beyond that.  To help provide more context around the derivative charts, I've added derivative charts of the "One-Week Rolling Averages" to answer the question: *What is the daily change in the 1-week rolling average?*  Additionally, this new derivative can also be viewed, itself, as a one-week average.

- Add four more derivative charts, all of the one-week rolling average values
- Fixed a typo in the mouseover tooltip on the derivative charts.


## Oct. 28 - Derivative and Experimental Charts

Added several new data selections:

- "Derivative Charts" that show the change of the daily cases.  A positive derivative indicates that the there is currently the daily cases are increasing at an increasing rate, a zero derivative indicates that there is no change in daily cases (the same number of new cases were detected yesterday and today), and a negative derivative indicates that there is a deceasing number of new daily cases (fewer new cases were detected today than yesterday).

- "Experimental Charts" that are playing around with non-transitional charts (mostly out of request from others).  The current two show a the current case fatality rate using a 2-week or 4-week lagged number of cases.


## Oct. 18 - New Guide and Normalized Graph Improvements 

I've added a [small guide](/pages/covid-visualization/#guide) to the visualization, providing an overview of the key aspects of the visualization including the data sources, regions, normalized data, and more.  Additionally:

- Normalized populations are now displayed /100k instead of /1m people in all of the normalized visualizations
- On the normalized visualizations, the default "Show" option is now "Top 25 by Data w/ Pop. >1m".  The previous default, "Top 25 by Data" (without any filters) is still available as a selection.  This was done as the default display was dominated by two small countries, The Holy See and Andorra, having 5-10x the normalized cases /day than the rest of the world.
- The default state has been changed from New York to California.


## Oct. 15 - Big Ten School Visualization Colors

Starting a bit over a month ago, Johns Hopkins University has stopped reporting any state-level hospitalization data (you can see [the empty column in their raw data](https://github.com/CSSEGISandData/COVID-19/blob/master/csse_covid_19_data/csse_covid_19_daily_reports_us/10-14-2020.csv)).  Fortunately, the COVID Tracking Project by The Atlantic continues to report this data and, when choosing state-level hospitalization data graphs, you are prompted to select the COVID Tracking Project data source to view the data.  (It appears they're not tracking every state, but they're getting data from the majority of the states.)

Additionally, the mobile layout labels were getting extremely cluttered -- the latest update cleans up the spacing on x-axis labels when viewing the visualization on a mobile layout. 🎉


## Oct. 1 - New Visualization: COVID-19 at Big Ten Conference Schools

The University of Illinois has been widely reported in national media for testing every single student twice a week -- how are they doing?  How do they compare to their peer schools within the Big Ten Conference?

The newest 91-DIVOC visualization explores [COVID-19 at Big Ten Conference Schools](/pages/covid-19-at-big-ten-conference-schools/), tracking the number of confirmed cases of COVID-19, total COVID-19 tests administered, and the test positivity.

As with all of the visualization, the visualization is updated daily. :)


## Sept. 30 - Removed Filter on "Top 10" on Normalized Graphs

In the early days of the COVID era, [The Holy See (Vatican City)](https://91-divoc.com/pages/covid-visualization/?chart=countries-normalized&highlight=Holy%20See&show=25&y=both&scale=linear&data=cases-daily-7&data-source=jhu&xaxis=left#countries-normalized) confirmed 3 cases on March 24th, 2 more on March 28th, and another 5 cases in April.  At that time, the Holy See dominated the normalized cases having an official population of just 799 residents.

As part of today's update, I removed this filter completely -- the normalized data no longer filters small countries.  This is notable as Johns Hopkins University tracks the microstate of Andorra [(Wikipedia)](https://en.wikipedia.org/wiki/Andorra) -- with a ~100 new cases and a population of 77,543, Andorra has been the location of one of fastest spread of COVID-19 on a population-normalized basis [(91-DIVOC Graph)](https://91-divoc.com/pages/covid-visualization/?chart=countries-normalized&highlight=Andorra&show=25&y=both&scale=linear&data=cases-daily-7&data-source=jhu&xaxis=left#countries-normalized).

Additionally, a few tooltips were cleaned up.  Look for a brand new visualization tomorrow! :)


## Sept. 18 - Normalized "Top 25" shows data based on normalized-values

Selecting "Top 25" (or other similar options) on a normalized chart now works more as expected, showing the top 25 **normalized** values instead of the top 25 raw values.


## Sept. 10 - Added Normalized/Non-normalized Statistics

For all mouseovers in area where the population is known, the mouseover will provide a normalized value for the data (ex: "3 cases /100k") in addition to the raw data.  When viewing a normalized chart, the raw data value is also given.

Additionally, the data stream from Our World In Data is now updated daily providing global testing data. 🎉


## August 7 - US-Total, Computed

Johns Hopkins University has always reported the "United States" as part of their list of countries and, in a second dataset, reported the 50 states and US territories as individual locations.  The number of confirmed cases and deaths between the "United States" total and the sum of the 50 states' data has always varied slightly, accounting for the cases is the US territories, cruise ships, repatriation flights, and more.  Previous cases of large discrepancies between the data have always been paired with a spike in a single state data where a number of previously unreported cases were reported in a single day.

Recently, the difference between the sums (particularly in the number of deaths) has become significant without a known cause.  To help dive deep into this difference, I've added a new "Data" value in the graphs of the US states:

- Added "Data" value "US-Total, Computed*" to the two graphs of the US states.  This data is computed based off the sum of the 50 individual states' data instead of using the "United States" value.
- You can compare the difference between the two values by choosing one and them using "+Add Additional Data".  You can add this to the "global" graph by choosing "+Add US State" (since the data is computed via the state-level data).


## August 5

Over the past few months, one of the most common question I was asked was "how did you get started?" or "how was this created?".  Over the past week, I created a video that dives into how 91-DIVOC was created:

<iframe width="560" height="315" src="https://www.youtube.com/embed/FSY12kiK1_o" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

This is my first exploration of video, so I'd love your feedback!  I believe it should give you some insight in how this visualization is created. :)


## August 3

- Allowed the display of "log-scale" graphs on percentage graphs (ex: test positivity, case fatality rates).
- Improved the title on normalized percentage graphs ("test positivity" is never normalized, as it's a percentage).
- Wrote a article, ["Minimizing Overlapping Labels in Interactive Visualizations"](https://towardsdatascience.com/minimizing-overlapping-labels-in-interactive-visualizations-b0eabd62ef0), for Towards Data Science about the new label layout algorithms for the right-align graphs.

## July 30

- Added new "Highlight" option, "(None, without dimming)" to show all of the data without the non-highlight opacity filter applied.
- Non-highlighted data lines will now stay the same color when animated (from [#57](https://github.com/wadefagen/91-DIVOC/issues/57) from [@kidinthehall](https://github.com/kidinthehall)).

## July 29

- Added "Data Source" to individual graph pages.
- Added Testing data to the `countries-normalized` graph.
- Modified the Our World in Data processing script to show no data after the last change in total tests.  (Previously, the data would show 0 new tests /day when the data had the same total number of tests.)

## July 27

- Improve "left-align" label placement to prevent text from going off the visualization.

## July 25

- Fixed [#54](https://github.com/wadefagen/91-DIVOC/issues/54) found by [@jasonbuechler](https://github.com/jasonbuechler)
- Updated logic for loading data files from server to (hopefully) improve robustness.  If you ever have the visualization fail to load, please let me know!
- Updated visualization to pass automated "Mobile-Ready" with minor tweaks.

## July 24 - Quality

In all of these visualizations, I created visualizations that helped me make sense of the COVID-19 data.  At this point, I can spend hours diving into the data and there's few questions that I am unable to answer using 91-DIVOC graphs.  Therefore, for the next week, I'm looking to explore better documentation of this tool, fix any remaining bugs, and focus on quality improvements.  As part of this, I have already:

- Resolved or labeled all issues and pull requests on the [91-DIVOC github page](https://github.com/wadefagen/91-DIVOC).
- Created a [guide](/pages/interactive-visualziation-of-covid-19-in-illinois/guide/) for the Illinois-specific visualization detailing the various features of the visualization.
- Fixed several bugs that were brought to my attention via e-mail.

Additionally, I've started some initial work on some visualizations beyond COVID-19.  If you'd like to get a once-a-month update on data-forward visualizations, I [have an e-mail list](https://forms.gle/oLXWdijmr9i2Yxau9) that I'll be  providing a monthly update of all the latest visualizations to nerd out with.

Let me know if you find any bugs and thanks for all the support! :)


## July 21 - Interactive Visualization of COVID-19 in Illinois

- Launched [91-DIVOC-05: "Interactive Visualization of COVID-19 in Illinois"](/pages/interactive-visualziation-of-covid-19-in-illinois/) containing detailed COVID-19 data from the Illinois Dept. of Health.


## July 20 - Dynamic Label Placement

- Added a new algorithm to allow labels to be dynamically moved (slightly) to minimize the overlap of labels to increase readability.
- Using Shift+Click to add an additional highlight now updates your custom link immediately.
- Improved scaling when "(None)" is selected as the highlight option.
- Backend updates for 91-DIVOC #05 launch tomorrow! :)


## July 18

- Several small fixes improving on yesterday's update.


## July 17 -- Our World in Data

This is the most significant update to 91-DIVOC in quite some time, adding a new data source from [Our World in Data (Oxford University, et al)](https://ourworldindata.org/).  The Our World in Data dataset provides testing data for a number of global countries, allowing for "COVID-19 Tests" and "Test Positivity" in the "Data" selection on the countries graph, and other changes:

- Added testing and test positivity to the countries graph.
- Added new "Y-Axis" option: "Current Highlight Value".
- Renamed the "Y-Axis" options to make what they do a little more clear.
- Added "X-Axis" option "Days Ago, recent 12 weeks".


As part of working with Our World in Data, a few bugs were fixed and other minor display changes:

- The date now displays as "YYYY-MM-DD" (ex: 2020-07-17) instead of "MM-DD-YYYY".
- Tooltips now show the correct data when mousing over a multi-day average (ex: 1 week, or 1 month average).


The default data selection is now "Johns Hopkins & Our World in Data", using Our World in Data for the countries graph and Johns Hopkins for the United States data.  The data source will always be displayed at the bottom of the graph.



## July 16

- Renamed "Mortality Rate" to "Case Fatality Rate".


## July 15 -- GIF and WebM Animation Saving

Animations can now be saved right in your web browser!

- Added new "Save" options: GIF and WebM.

  - GIF takes a bit longer to encode and may sometimes be of lower quality, but should work on almost all web browsers.
  - WebM is a open video format that is just starting to see wide-spread adoption.  WebM should work on Chrome, but may fail on other browsers.


In addition, the saving of PNG images also improved:

- PNG images now save a "Desktop-sized" chart that is sized better for sharing, instead of the mobile view.
- PNG images now include the chart header instead of just the graph.
- (These changes also appear in the animation creation above.)



## July 13 -- Improved Tooltip

- Improved mouseover tooltip display of decimal places for states/countries with very small numbers (ex: Japan, normalized by population).  The number of decimals shown is now based on the magnitude of the data.  ([Suggested on @ernest-tg on github#51](https://github.com/wadefagen/91-DIVOC/issues/51).)
- Improved the code used to save the image as a PNG in preparation for future features.


## July 9 - Region Enhancements

The most recent update enhances the region selections -- we can explore now, for example, how the United States might compare to various WHO regions as a whole.

- Added new global regions based on the [World Health Organization](https://en.wikipedia.org/wiki/WHO_regions) designated regions. 
- Added a new "Show" selection to show only the regions for a specific graph (ex: WHO, US regions, etc).


Additionally, the code was refactored to allow for better exploration of regions in future updates:

- Refactored the region code to allow for code-defined regions (instead of defining the regions in pre-processing).  In a future update, this can be expanded to allow for "custom regions".
- Removed the "Exclude NY/NJ/CT" region in favor of future custom regions.
- Updated "Change Log" code to allow images to point to specific graphs instead of just the visualization.


## July 6 - Additional Global "Show" Options

- Added Additional "Show" Options for the Global Graphs (including population-based, WHO regions, and EU-27).
- Added the "+Add Additional Data" selections to the custom/saved URL.

- Added 1-week and 1-month case mortality rates to the "Data" selection.

- Added informative loading messages while the visualization is initially loading.
- Improved the responsiveness of the visualization while the graphs are initially loading.



### July 5 - Animation Optimization

- Improved and optimized the "Animate" option.
- Fixed a bug related to "Additional Data" causing "Animate" to break.


### July 4 - "Add Additional Data" Improvements

- When the primary data view is a ratio (eg: mortality rate, test positivity), the graph will no longer scale to above 100% (even if additional data is above that).
- When you "+Add Additional Data" to a ratio chart, you the default is now to "Scale Separately".
- Clicking "+Add Additional Data" will now always, immediately, add the additional data.  (This fixes a bug that, in certain cases, you had to change the additional data before it displayed).
- Fixed the additional data labels to show a percentage when adding additional data that is a percentage (eg: test positivity).
- When calculating the test positivity for a country that reported zero cases and zero tests over the past week, the value now displays as 0% positivity instead of "infinity".

Many thanks to [@TheWheelMe](https://twitter.com/TheWheelMe) for the [initial report](https://twitter.com/TheWheelMe/status/1279280304255983617).


### July 2 - Add Additional Data

- Added new feature: "+Add Additional Data" to show additional data in the same visualization.
  - You can to overlay single-day data on top of the seven-day rolling average (using "Scale Using Graph Units")
  - You can also overlay completely different data to see if there's a correlation between two different pieces of data (using "Scale Separately")

- Added logic to store your processed data to speed up the visualization when processing data you've processed previously.
  - Previously, if you change the "Data" from "New Cases" to "New Deaths" and then back to "New Cases", the graph re-processed all of the data.  This is no longer required and should significantly speed up the visualization. :)

- Renamed "Y-Axis" value of "Fixed" to a more descriptive name "Scale to All-time Max".



### July 1 - CSV Export

- Added "CSV" as an option under "Save Current Image/Data" to save the current visualization's underlying data for further analysis.


### June 30

- Added "EU" to normalized data charts.
- Fixed a bug when "(None)" is selected on the visualizations of US states.
- Improved report formatting.


### June 29 - Generate Report

- New option: "Generate Report" to generate textual report on recent increases/decreases within the graphed data.
  - The report can be generated on any graph with any data.
  - The report must be re-generated any time data selection options are changed.


### June 26 - Released 91-DIVOC-04

- New Visualization: ["Coronavirus Contribution by State"](../coronavirus-contribution-by-state/)

- Backend change to how data is loaded to reduce bandwidth.
- Fixed animations when X-Axis is right-aligned with selection of a specific number of weeks.
- Used mobile display of Y-Axis values for all displays.


### June 23 - Added EU

- Added country option "EU" that tracks just the EU countries in Europe.


### June 18 - Default to Linear

- Changed default scale to "Linear" from "Log" on all graphs.
  - You can still change each graph to "Log" by using the button, by saving a log-graph link, or by including <code>?scale=log</code> at the end of the URL.

- Added new "Highlight": "Scale to Highlight and Current Max" that combines both "Scale to Highlight" and "Current Max":
  - This will always show ALL of countries or states, as it will scale to the maximum current value.
  - Additionally, it will show ALL of the data in your highlighted countries, as it will scale to the maximum value among all of your highlights.
  - Whichever one of these is larger will be used for your y-axis scale.

- Modified the query string processing logic to apply your saved options to ALL graphs, not just the selected one, where possible.


### June 17 - Add US States to Countries Map

- Added information on the current processing task when the graphs are in a loading state.
- Slightly optimized the data processing.

- Added new option "+Add US State" to the country graphs.
  - This allows you to compare, for example, Sweden vs. California vs. Texas normalized by population.
- Now displaying "Georgia" (the country in Europe) as "Georgia (EU)" to avoid the name conflict with the US state.


### June 16

- Added "Y-Axis" option "Scale to Max Value". This will scale your y-axis value to the current maximum value, which will help for graphs with high outliers that crowd the rest of the data into a small portion in the graph.
- The "Show": "Top 10/Top 25/etc" US graphs will no longer show regions, only states.

- Changed default to right-align to view same-day comparisons of US states.  Left-align still available in "X-Axis" options.
- Chrome-specific Fix: The graph will now display the options Chrome "remembers" for you in your drop-down selections (instead of using the default values), which will fix a UI display bug for Chrome users who arrive at the page via a back/forward button.


### June 14 - US Regions

- Non-highlighted data points now render fewer mouseover circles for data over a month old.  Even fewer for data over two months old.
  - The line will always be correct, using every daily data point.
  - Highlighted data will always render all circles.
  - This should significantly speed up rendering time for the graphs.

- Added US regions to US graphs based on the [United States Census Bureau's regions](https://en.wikipedia.org/wiki/United_States_Census_Bureau): "US-South", "US-Midwest", "US-Northeast", and "US-West".
- Improved calculation of "Global" when using Johns Hopkins Data.


### June 11

- Fixed a bug in the calculation of the "7-day average" for ratios (test positivity, mortality rate) introduced in yesterday's update (the underlying data was taking cumulative data and averaging it, instead of daily data).


### June 10 - Multiple Data Sources

- Added a global "Data Source" selection allowing you to select your data source.
- Refactored the use of [Johns Hopkins Data](https://github.com/CSSEGISandData/COVID-19) as a data source.
- Added [The COVID Tracking Project](https://covidtracking.com/api) as a data source.
- Added a new URL parameter (`data-source`) to store the data source logic.

- Improved the "7-day average" for ratios (test positivity, mortality rate) to take 7 days of underlying data instead of averaging 7 one-day values.


### June 9

- Added "United States" on the normalized state data visualization to compare vs. United States as a whole.
- Your previously selected state/country are now stored in local storage instead of an unnecessary cookie.


### June 7 - Global and Europe

- Added "Global" as a data point for the world visualizations
- Added "Europe" based on the [World Health Organization EURO region](https://en.wikipedia.org/wiki/WHO_regions).
- Improved label placement logic for countries outside of the range of the visualization (eg: "Global")
- Improved additional highlight display logic (will now show the range of the longest highlight)
- Fixed sorting of countries for "Top/Bottom X" on normalized graphs 


### June 3

- Modified the "align-right" labels to show off the right-side of the graph.
- Modified labeling the "align-right" dates when two dates are extremely close (eg: June 1 and June 2).
- Fix: US territories will now correctly highlight when "All States & DC" is selected.


### June 1

- Fixed [#46](https://github.com/wadefagen/91-DIVOC/issues/46): "Y-axis scale to highlight, takes into account out-of-window data #46"


### May 27 - Cumulative Mortality Rate

- Added "Cumulative Mortality Rate" to all graphs, allowing you to view the current mortality rate for every country/state.
- Added "Test Positivity" to the normalized graphs (which is identical in display to the non-normalized graphs).
- UI Fix: The display of "X Days Ago" should only show a whole number.
- Redesigned the "Explore 91-DIVOC" box between the visualizations.


### May 26

- Fixed an UI bug where the "scale to highlight" message appeared even when no highlighted data was displayed.
- Released [91-DIVOC #03: Coronavirus Visualized as a 1,000-Person Community](../coronavirus-1000-person-community/)


### May 24 - Test Positivity Rate

- Added "Test Positivity Data" to graph of US States.
- Added a small note below the graph when all highlighted data appears only in the lowest 1/3rd of the graph to suggest scaling y-axis to highlight.
- Changed default view of states to "US States" instead of "All" (hiding territories by default).

### May 22

- Mobile-specific fix: Y-axis labels for values over 1,000,000 no longer get cut off.


### May 21 - Saving Image

- Added "Save Current Image" to save the image as a PNG or SVG file.
- Copy/Paste: Fixed "Direct Link w/ Your Options" link for countries with spaces in their name.


### May 19 - Easy Multi-Selection on Desktop

- On Desktop (or any device with shift), a "shift-click" action will now add the country as an additional highlight.
- Added this feature as small text on the bottom of non-mobile tooltips.
- Added several options for "Show" on US state graphs.
  - Region-based categories are based on the [Census Bureau-designated regions and divisions](https://en.wikipedia.org/wiki/List_of_regions_of_the_United_States#Census_Bureau-designated_regions_and_divisions).


### May 18 - Animation

- Added an "Animation" button to animate the graph through the full data set.
  - Try it with "Y-Axis": "Scale to Highlight" for a really interesting visualization!
- Re-added the bottom of the tooltip showing geometric growth rates that was unintentionally removed yesterday.


### May 16+17 - Right-align by Date

- Added "X-Axis" selection allowing you to select to right-align data by the number of days ago.
- Added a light highlight for the most recent two weeks when viewing "right-align".
- Added a "Remove" option for additional highlights.
- Highlights full data on mouseover/tap in addition to the tooltip.
- Added "days ago" to the mouseover tooltip.
- Removed trendline option from the UI.
- Improved layout of "Data" selector by grouping data types together and adding dividers.
- Added "New Hospitalized /Day" and "New Hospitalized /Day, 1 Week Average" as "Data" options for US States.
- Added "New Recoveries /Day" and "New Recoveries /Day, 1 Week Average" as "Data" option for countries.
- Browser-specific fix: Added `dominant-baseline` for label positioning on Firefox.
- Mobile-specific fix: Added decimal point to non-exact y-axis labels (ex: "1k" -> "1.2k").
- Fixed various render failures and JavaScript errors related to selecting "(None)" as the highlight.


### May 12

- Bugfix for day-of-week tooltip for iOS devices.


### May 11 - Weeks Matter

- X-axis now shows gridlines at one-week intervals instead of intervals of 10.
- Tooltip now shows day-of-week. (Suggestion by [@tommyd_tech](https://twitter.com/tommyd_tech/status/1259927464840769538))
- Fixed bug with being unable to highlight countries with <10 million population


### May 10 

- Improved scaling when choosing "Y-Axis": "Highlight"
- Improved error messages when data does not successfully load.
- Fixed bug when calculating averages with 0 daily cases.


### May 6 &mdash; Cases per Day

- Default view on the page is now new cases /day instead of total confirmed cases.
  - You can still view (and bookmark) the old default of "Total Confirmed Cases" by choosing that in the "Data".
- Added "Loading" animation between graph changes.
- The chart titles now accurately reflect your chosen "Data" view.
- Direct links shown on single-page visualizations (May 4th Update) now provide links to the single-page visualizations.
- Scaling for "1 Wk. Avg." graphs now scale to the one-week average data (before it scaled to the underlying, non-average raw data).
- Several algorithm optimizations to speed up data processing.
- Normalized country data now shows "Top 25 with over 10,000,000 population".
  - You can still view all countries by showing "View": "All" or selecting them as highlights, their data isn't gone. :)


### May 4 &mdash; Individual Visualizations

- Created individual pages for each graph, useful for devices that run out of memory rendering all of the graphs:
  * [Raw Data by Country](countries.html)
  * [Raw Data by State](states.html)
  * [Population Normalized Data by Country](countries-normalized.html)
  * [Population Normalized Data by State](states-normalized.html)
- All pages uses the same JavaScript, so updates to one will update them all! :)


### April 30 &mdash; Mobile Improvements

- Greatly improved mobile display including axis labels, country text placement, and more.
- Fixed "saved links" for daily and weekly averaged cases.
- Changed default "Show" to 25 countries to reduce rendering time on phones/tablets.  Custom links can be bookmarked to show all, 50, etc.


### April 24 &mdash; Hospitalizations and COVID-19 Tests for US States

- Added four new "Data" selection for US states: "Hospitalized Cases", "Total COVID-19 Tests", "New Tests /Day", "New Tests, 1 Wk. Avg.".
- The data from Johns Hopkins starts on Apr. 12, so the total graphs are a little uninteresting right now.  However, I believe the trends will become interesting over time and the daily tests already show useful insights.
- FIX: Fixed link to normalized charts.
- UI Improvement: No longer displays a message of "(None)" having nothing to highlight.

### April 21

- 1/3/7-day trendline is drawn for only seven days forward, not forever, to avoid extreme extrapolation.


### April 20

- Upon changing any default values, a URL now appears below the graph with your saved options.
- Bookmark or share the URL to go directly to the graph with your chosen options.


### April 17

- Minor UI Enhancement: First "Highlight" option is now "(None)" to highlight no country/state.
- UI Fix: Country/state labels were incorrect positioned on the newly added average graphs if the most recent raw data value was 0 (eg: 0 new deaths).  Fixed and now appears correctly positioned.



### April 16 &mdash; One Week Average Cases/Deaths

- Added two new "Data" options: "New Cases /Day, 1 Week Average" and "New Deaths /Day, 1 Week Average".
- Both options show a 7-day trailing average of the new daily cases/deaths, with detailed tap/mouseovers showing the the actual cases data and the trailing average data.


### April 15 &mdash; Overview Page

- Added an ["Overview" page](./overview.html) documenting how the visualization was created, the motivations, and other bits.
- Handled countries with no data gracefully and included message below graph when nothing is available to highlight.
- Sorting on normalized "Top 10" / "Top 50" is now based on normalized data.


### April 13

- Added "Show" option "Top 10" to show only the 10 countries/states with the largest values.
- The "New {Cases\|Deaths} /Day" now is based on the same start date as the "{Confirmed Cases\|Deaths}" instead of being based on a /Day threshold.
- Data points that are zero or negative are now rendered a data point below the x-axis when a country is highlighted to allow tap/mouseover interaction with the data.  (Line charts still do not connect these points that are outside of the grid.)


### April 12 &ndash; Multiple Highlights

- New UI "Add Additional Highlight" to allow highlighting any number of countries!
- Changed default trendline to only show the original 35% trendline.

### April 11 &ndash; "Highlight Only" View (and Mobile Improvements)

- The "Show" UI options has been redesigned, allowing you to "Show: Highlight Only" to view only one country.
- All countries in the dataset are now listed in "Highlight" and the "Show" will move to "All" if needed when in "Top 50" view.
- Several layout improvements specifically to remove some text overlap on mobile.
 

### April 10 &ndash; Dynamic Trendlines

- Added logic to create dynamic trendlines from a highlighted country, allowing a visual indication of future progress at current growth rates.
- Added new UI option "Trendline" to show the trend of the currently highlighted country.
- By default, the original 35% trendline and a 1-week trend for the highlighted country are now displayed.
- Redesign of trendline label positioning.
- Various other minor UI tweaks to clean up the visualization with the display of trendlends.

- Minor UI Improvement: In the normalized data charts the default scale was based off the largest value in the dataset before the data was filtered.  Now, the default view is based off only the data displayed.

### April 9 &ndash; Axis Zoom

- Changed the default (full) from being the next power of 10 to being 1.2x the maximum value.
- Add new UI option "Y-Axis" allowing you to switch between the default (full) scale and a scale focused on your highlighted country/state.
- Added (this) change log file.

### March 21 &ndash; April 8

- Various updates.

### March 21 &ndash; Initial Release

- Initial release

