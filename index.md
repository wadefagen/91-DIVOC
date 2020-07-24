---
layout: home
---

<h3>91-DIVOC Visualizations</h3>

<ul>
  <li>
    #01: <a href="pages/covid-visualization/">An interactive visualization of the exponential spread of COVID-19</a>
  </li>
  <li>
    #02: <a href="pages/covid-by-your-locations/">COVID-19 Data for Locations of People You Love</a>
  </li>
  <li>
    #03: <a href="pages/coronavirus-1000-person-community/">Coronavirus Visualized as a 1,000-Person Community</a>
  </li>
  <li>
    #04: <a href="pages/coronavirus-contribution-by-state/">Coronavirus Contribution by State</a>
  </li>
  <li>
    <b>NEW</b> #05: <a href="pages/interactive-visualziation-of-covid-19-in-illinois/">Interactive Visualization of COVID-19 in Illinois</a>
  </li>
</ul>

{% assign updates = site.updates | sort: 'date' | reverse | limit: 5 %}

{% for update in updates limit: 5 %}

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

{% elsif update.visualization == 5 or update.newVisualization == 5 %}
{% assign viz = "91-DIVOC-05: &quot;Interactive Visualization of COVID-19 in Illinois&quot;" %}
{% assign viz_url = "/pages/interactive-visualziation-of-covid-19-in-illinois/" %}

{% endif %}

{% if viz_url %}
{% assign img_url = viz_url %}
{% endif %}

{% if update.img_url %}
{% assign img_url = update.img_url %}
{% endif %}

<hr>

{% if update.img %}
  {% if img_url %}<a href="{{img_url}}">{% endif %}
  <img alt="{{viz}}" src="/updates/{{update.img}}" class="img-fluid m-2" style="border: solid 1px black; max-width: 40%; max-height: 200px; text-align: center; float: right;">
  {% if img_url %}</a>{% endif %}
{% endif %}

<h3 class="mb-0">{{ update.date | date: "%B %-d, %Y" }} &ndash; {{ update.title }}</h3>

<div style="font-size: 12px;" class="mb-2">
{% if update.visualization %}
Updated the visualization: <a href="{{viz_url}}">{{viz}}</a>
{% endif %}
{% if update.newVisualization %}
<b>NEW</b> Visualization: <a href="{{viz_url}}">{{viz}}</a>
{% endif %}
</div>

{{update.content}}

<div style="clear: both;"></div>

{% endfor %}

<hr>

<div class="card">
  <a href="pages/updates/">View All Recent 91-DIVOC Updates &gt;&gt;</a>
</div>
