---
layout: project

title: "Overview of 91-DIVOC"
desc: 

---

<style>
  footer {
    margin-top: 40px;
  }
</style>


### Overview

One thing that has impressed me the most is the vast amount of high-quality, organized data around COVID-19.  One of the leaders since the early days of COVID-19 has been <a href="https://systems.jhu.edu/" target="_blank">John Hopkins' Center for Systems Science and Engineering</a>.  As part of making an <a href="https://www.arcgis.com/apps/opsdashboard/index.html">incredible visual map of the outbreak</a>, they <a href="https://github.com/CSSEGISandData/COVID-19">open-sourced all of their data collection on GitHub</a>.

While exploring this dataset, I wanted to find what others have created.  There were a lot of maps <a href="https://coronavirus.jhu.edu/map.html">similar to John Hopkins</a> that displayed the number of active cases as a "heat map".  This is informative, but they did not provide any direct insight on how the situation was evolving <b>right now</b>.

The visualization that inspired me the most was one I found created by <a href="https://twitter.com/jburnmurdoch" target="_blank">John Burn-Murdoch</a> that overlapped the number of cases in various countries <a href="https://www.ft.com/content/a26fbf7e-48f8-11ea-aeb3-955839e06441" target="_blank">based on the day when each country had the their 100th person infected</a>. <b>I love it!</b>

However, they were **just images**.  I loved it, but I cannot nerd out with the data and understand the growth and answer my own questions.  This motivated the creation of DIVOC-91.  Having cancelled my plans to travel over Spring Break at The University of Illinois (where I am privileged to be a professor of Computer Science), I used the Johns Hopkins dataset along with a visualization library called <a href="https://d3js.org/" target="_blank">d3.js</a>, to create an interactive visualization that allows a user to mouseover any point to explore the data, change the scale for logarithmic (better at showing exponentially increasing data) to linear (better at showing the human impact), and change what country is highlighted.

Since the launch in March, this visualization has evolved with a community of amazing people across social media.  Recent changes are detailed in the [change log](./changes.html) and the visualization really has evolved into a powerful tool to nerd out with data.


### Motivations and Acknowledgments

- [John Burn-Murdoch](https://www.ft.com/john-burn-murdoch)'s fantastic visualizations at the [Financial Times](https://www.ft.com/coronavirus-latest).
- [Johns Hopkins University's Coronavirus Resource Center](https://coronavirus.jhu.edu/data)
- [An amazing community of people suggesting improvements](https://twitter.com/profwade_/status/1241453184255774727)!


### Notable Mentions of 91-DIVOC

- Gov. Inslee of Washington presented the visualization in one of his COVID-19 press conferences and [tweeted about it later](https://twitter.com/GovInslee/status/1243306792232177665).
- Gov. Beshear of Kentucky presented the visualization in one of [his daily press conferences](https://www.youtube.com/watch?v=gSzUuOTzGE8&feature=youtu.be&t=1595).
- The Verge named [91-DIVOC one of the six best visualizations for tracking COVID-19](https://www.theverge.com/2020/4/2/21201832/novel-coronavirus-covid-19-best-graphs-tracking-data).
- [Computer Science](http://cs.illinois.edu/) at [The University of Illinois](https://illinois.edu/), where I'm privileged to be a professor, shared an article and interview I did with them over 91-DIVOC called ["A Desire for Data Accessibility Sparked the Creation of a Viral Visualization"](https://cs.illinois.edu/news/desire-data-accessibility-sparked-creation-viral-visualization)
- Used as a motivation and starting code for [UC-Berkeley's COVIDVIS project on COVID-19](https://covidvis.berkeley.edu/).
- ...and more...


### Author

Hi!  I'm <a href="https://waf.cs.illinois.edu/">Wade</a>, you can reach me across the social media (listed at the bottom of each page) or via e-mail at waf@illinois.edu.