---
layout: default
title: Gallery
permalink: /gallery/
---

# Trip Gallery

<p class="gallery-intro">Photos and videos from all 12 days, in order.</p>

{% assign day_pages = site.days | sort: "day_number" %}

<nav class="gallery-jump" aria-label="Jump to day">
  {% for day in site.data.gallery.days %}
  <a href="#day-{{ day.day_number }}" class="gallery-jump-chip">Day {{ day.day_number }}</a>
  {% endfor %}
</nav>

{% for day in site.data.gallery.days %}
  {% assign match = day_pages | where: "day_number", day.day_number | first %}
  <section class="gallery-day" id="day-{{ day.day_number }}">
    <h2 class="gallery-day-heading">
      Day {{ day.day_number }}
      <span class="gallery-day-date">{{ day.date | date: "%b %-d" }}</span>
      {% if match %}<span class="gallery-day-title">{{ match.title }}</span>{% endif %}
    </h2>
    <div class="gallery-grid">
      {% for item in day.items %}
      <button type="button" class="gallery-thumb{% if item.type == 'video' %} is-video{% endif %}"
        {% if item.type == 'video' %}data-full="{{ '/assets/gallery/full/' | append: item.file | append: '.mp4' | relative_url }}"{% else %}data-full="{{ '/assets/gallery/full/' | append: item.file | append: '.jpg' | relative_url }}"{% endif %}
        data-type="{{ item.type }}"
        data-day="{{ day.day_number }}"
        data-index="{{ forloop.index0 }}">
        <img src="{{ '/assets/gallery/thumb/' | append: item.file | append: '.jpg' | relative_url }}"
             loading="lazy" alt="Day {{ day.day_number }} {{ item.type }}">
        {% if item.type == 'video' %}<span class="gallery-play" aria-hidden="true">▶</span>{% endif %}
      </button>
      {% endfor %}
    </div>
  </section>
{% endfor %}

<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Photo and video viewer" hidden>
  <button class="lightbox-close" aria-label="Close">&times;</button>
  <button class="lightbox-prev" aria-label="Previous">&larr;</button>
  <div class="lightbox-stage" id="lightbox-stage"></div>
  <button class="lightbox-next" aria-label="Next">&rarr;</button>
</div>
