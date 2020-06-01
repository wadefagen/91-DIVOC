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

