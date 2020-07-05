---
---

## 91-DIVOC Major Updates

This page archives all major updates to 91-DIVOC.  Click on any update to view the details/post, or visit the visualization to see the latest!

<hr>

{% assign updates = site.updates | sort: 'date' | reverse %}

<ul>
{% for update in updates %}

{% if update.visualization == 1 or update.newVisualization == 1 %}
{% assign viz = "91-DIVOC-01: &quot;An interactive visualization of the exponential spread of COVID-19&quot;" %}
{% assign viz_url = "/pages/covid-visualization/" %}

{% elsif update.visualization == 2 or update.newVisualization == 2 %}
{% assign viz = "91-DIVOC-02: &quot;COVID-19 Data for Locations of People You Love&quot;" %}
{% assign viz_url = "/pages/covid-by-your-locations/" %}

{% elsif update.visualization == 3 or update.newVisualization == 3 %}
{% assign viz = "91-DIVOC-03: &quot;Coronavirus Visualized as a 1,000-Person Community&quot;" %}
{% assign viz_url = "/pages/coronavirus-1000-person-community/" %}

{% elsif update.visualization == 4 or update.newVisualization == 4 %}
{% assign viz = "91-DIVOC-04: &quot;Coronavirus Contribution by State&quot;" %}
{% assign viz_url = "/pages/coronavirus-contribution-by-state/" %}
{% endif %}

<li>
  {{ update.date | date: "%B %-d, %Y" }}
  &ndash;
  <a href="{{update.url}}">{{ update.title }}</a>
  <div style="font-size: 12px;" class="mb-2">
  {% if update.visualization %}
  Updated the visualization: <a href="{{viz_url}}">{{viz}}</a>
  {% endif %}
  {% if update.newVisualization %}
  <b>NEW</b> Visualization: <a href="{{viz_url}}">{{viz}}</a>
  {% endif %}
  </div>  
</li>
{% endfor %}

<li>
  <b>Note</b>: Updates to existing visualizations made before April 1, 2020 were listed in the <a href="/pages/covid-visualization/changes.html">Change Log for 91-DIVOC-01</a> instead of on this page.
</li>

</ul>
