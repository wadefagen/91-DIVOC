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

### April 10 &ndash; Dynamic Trendlines

- Added logic to create dynamic trendlines from a highlighted country, allowing a visual indication of future progress at current growth rates.
- Added new UI option "Trendline" to show the trend of the currently highlighted country.
- By default, the original 35% trendline **and** a 1-week trend for the highlighted country are now displayed.
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

