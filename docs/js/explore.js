/* Access Atlas - explore.html map logic */

(async function () {
  const SEQ_RAMP = ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95", "#0d366b"];
  const NO_DATA_COLOR = "#e1e0d9";

  const metricSelect = document.getElementById("metric-select");
  const legendRamp = document.getElementById("legend-ramp");
  const legendMin = document.getElementById("legend-min");
  const legendMax = document.getElementById("legend-max");
  const legendTitle = document.getElementById("legend-title");
  const metricHint = document.getElementById("metric-hint");
  const panelContent = document.getElementById("panel-content");
  const countySearch = document.getElementById("county-search");
  const countyList = document.getElementById("county-list");
  const tableToggle = document.getElementById("table-view-toggle");
  const tableView = document.getElementById("table-view");

  let counties, geojson, countyByFips, layerByFips, geoLayer, currentMetric;

  // --- populate metric dropdown, grouped ---
  function buildMetricOptions() {
    const groups = {};
    for (const [key, m] of Object.entries(AccessAtlas.METRICS)) {
      if (m.higherIsBetter === null) continue; // skip context-only metrics like population/rural% from the map
      (groups[m.group] ||= []).push([key, m]);
    }
    for (const [group, items] of Object.entries(groups)) {
      const optgroup = document.createElement("optgroup");
      optgroup.label = group;
      for (const [key, m] of items) {
        const opt = document.createElement("option");
        opt.value = key;
        opt.textContent = m.label;
        optgroup.appendChild(opt);
      }
      metricSelect.appendChild(optgroup);
    }
    metricSelect.value = "hpsa_active_count";
  }

  function quantileBreaks(values, n) {
    const sorted = values.slice().sort((a, b) => a - b);
    const breaks = [];
    for (let i = 1; i < n; i++) {
      const idx = Math.floor((i / n) * sorted.length);
      breaks.push(sorted[Math.min(idx, sorted.length - 1)]);
    }
    return breaks;
  }

  function colorFor(value, breaks) {
    if (value === null || value === undefined) return NO_DATA_COLOR;
    for (let i = 0; i < breaks.length; i++) {
      if (value <= breaks[i]) return SEQ_RAMP[i];
    }
    return SEQ_RAMP[SEQ_RAMP.length - 1];
  }

  function metricValues(key) {
    return counties.map(c => c[key]).filter(v => v !== null && v !== undefined && !Number.isNaN(v));
  }

  function renderLegend(key, breaks, vals) {
    const m = AccessAtlas.METRICS[key];
    legendTitle.textContent = m.label + " — county color scale";
    legendRamp.innerHTML = "";
    for (const color of SEQ_RAMP) {
      const span = document.createElement("span");
      span.style.background = color;
      legendRamp.appendChild(span);
    }
    legendMin.textContent = AccessAtlas.fmt(Math.min(...vals), { digits: 0 }) + (m.money ? "" : m.unit);
    legendMax.textContent = AccessAtlas.fmt(Math.max(...vals), { digits: 0 }) + (m.money ? "" : m.unit);
    const direction = m.higherIsBetter === true ? "Higher values are generally better."
      : m.higherIsBetter === false ? "Higher values generally indicate greater need."
      : "";
    metricHint.textContent = `Gray counties have no reliable published value for this metric. ${direction}`;
  }

  function styleFeature(feature) {
    const fips = feature.properties.fips;
    const county = countyByFips[fips];
    const value = county ? county[currentMetric] : null;
    return {
      fillColor: colorFor(value, window.__breaks),
      weight: 1,
      color: "#ffffff",
      fillOpacity: 0.9,
    };
  }

  function renderDetailPanel(county) {
    if (!county) {
      panelContent.innerHTML = '<p class="empty-state">Click a county on the map, or search for one, to see its full data profile here.</p>';
      return;
    }
    panelContent.innerHTML = "";
    const h2 = document.createElement("h2");
    h2.textContent = `${county.county_name} County`;
    panelContent.appendChild(h2);

    if (county.hpsa_active_count > 0) {
      const badge = document.createElement("span");
      badge.className = "badge badge-critical";
      badge.textContent = `${county.hpsa_active_count} active shortage designation${county.hpsa_active_count > 1 ? "s" : ""}`;
      panelContent.appendChild(badge);
    } else {
      const badge = document.createElement("span");
      badge.className = "badge badge-good";
      badge.textContent = "No active shortage designation";
      panelContent.appendChild(badge);
    }

    const ul = document.createElement("ul");
    ul.className = "metric-list";
    ul.style.marginTop = "16px";
    const order = ["population", "pcp_rate_per_100k", "mental_health_provider_rate_per_100k",
      "dentist_rate_per_100k", "uninsured_pct", "annual_checkup_pct", "preventable_hospitalization_rate",
      "life_expectancy_years", "diabetes_pct", "high_blood_pressure_pct", "obesity_pct",
      "depression_pct", "median_household_income", "child_poverty_pct", "rural_pct"];
    for (const key of order) {
      const m = AccessAtlas.METRICS[key];
      const li = document.createElement("li");
      const labelSpan = document.createElement("span");
      labelSpan.className = "m-label";
      labelSpan.textContent = m.label;
      const valueSpan = document.createElement("span");
      valueSpan.className = "m-value";
      valueSpan.textContent = m.money ? AccessAtlas.fmtMoney(county[key]) : AccessAtlas.fmt(county[key], { unit: m.unit, digits: 1 }) + (county[key] != null ? m.unit : "");
      li.append(labelSpan, valueSpan);
      ul.appendChild(li);
    }
    panelContent.appendChild(ul);

    const link = document.createElement("p");
    link.style.marginTop = "14px";
    const a = document.createElement("a");
    a.href = `compare.html?counties=${county.fips}`;
    a.textContent = "Add this county to comparison →";
    link.appendChild(a);
    panelContent.appendChild(link);
  }

  function selectCounty(fips) {
    const county = countyByFips[fips];
    renderDetailPanel(county);
    const layer = layerByFips[fips];
    if (layer) {
      layer.bringToFront();
      layer.setStyle({ weight: 3, color: "#0b0b0b" });
      geoLayer.eachLayer(l => { if (l !== layer) geoLayer.resetStyle(l); });
      const map = window.__map;
      map.fitBounds(layer.getBounds(), { maxZoom: 8, padding: [20, 20] });
    }
  }

  function renderTable() {
    const m = AccessAtlas.METRICS[currentMetric];
    const rows = counties.slice().sort((a, b) => (b[currentMetric] ?? -Infinity) - (a[currentMetric] ?? -Infinity));
    const table = document.createElement("table");
    table.className = "compare-table";
    const caption = document.createElement("caption");
    caption.textContent = `All 254 counties by ${m.label}`;
    table.appendChild(caption);
    const thead = document.createElement("thead");
    thead.innerHTML = "<tr><th>County</th><th>Value</th></tr>";
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    for (const c of rows) {
      const tr = document.createElement("tr");
      const tdName = document.createElement("td");
      tdName.textContent = c.county_name;
      const tdVal = document.createElement("td");
      tdVal.textContent = m.money ? AccessAtlas.fmtMoney(c[currentMetric]) : AccessAtlas.fmt(c[currentMetric]) + (c[currentMetric] != null ? m.unit : "");
      tr.append(tdName, tdVal);
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    tableView.innerHTML = "";
    tableView.appendChild(table);
  }

  function updateMap() {
    currentMetric = metricSelect.value;
    const vals = metricValues(currentMetric);
    window.__breaks = quantileBreaks(vals, SEQ_RAMP.length);
    renderLegend(currentMetric, window.__breaks, vals);
    geoLayer.setStyle(styleFeature);
    geoLayer.eachLayer(layer => {
      const fips = layer.feature.properties.fips;
      const county = countyByFips[fips];
      const value = county ? county[currentMetric] : null;
      const m = AccessAtlas.METRICS[currentMetric];
      const text = `${county ? county.county_name : layer.feature.properties.name} County: ${value != null ? AccessAtlas.fmt(value) + m.unit : "no data"}`;
      layer.unbindTooltip();
      layer.bindTooltip(text, { sticky: true, className: "county-tooltip" });
    });
    if (!tableView.hidden) renderTable();
  }

  try {
    [counties, geojson] = await Promise.all([AccessAtlas.loadCounties(), AccessAtlas.loadGeoJSON()]);
  } catch (e) {
    document.getElementById("map").innerHTML = "<p style='padding:20px;'>Map data failed to load. Please refresh the page.</p>";
    console.error(e);
    return;
  }

  countyByFips = Object.fromEntries(counties.map(c => [c.fips, c]));
  layerByFips = {};

  // populate search datalist
  for (const c of counties.slice().sort((a, b) => a.county_name.localeCompare(b.county_name))) {
    const opt = document.createElement("option");
    opt.value = c.county_name;
    countyList.appendChild(opt);
  }

  buildMetricOptions();

  const map = L.map("map", { scrollWheelZoom: false }).setView([31.2, -99.3], 6);
  window.__map = map;
  L.control.attribution({ prefix: false }).addTo(map)
    .setPrefix('Boundaries: U.S. Census Bureau');

  geoLayer = L.geoJSON(geojson, {
    style: styleFeature,
    onEachFeature: (feature, layer) => {
      layerByFips[feature.properties.fips] = layer;
      layer.on("click", () => selectCounty(feature.properties.fips));
      layer.on("keypress", (e) => { if (e.originalEvent.key === "Enter") selectCounty(feature.properties.fips); });
    },
  }).addTo(map);

  updateMap();
  metricSelect.addEventListener("change", updateMap);

  countySearch.addEventListener("change", () => {
    const match = counties.find(c => c.county_name.toLowerCase() === countySearch.value.toLowerCase());
    if (match) selectCounty(match.fips);
  });

  tableToggle.addEventListener("click", (e) => {
    e.preventDefault();
    tableView.hidden = !tableView.hidden;
    tableToggle.textContent = tableView.hidden ? "View this data as a table instead" : "Hide table view";
    if (!tableView.hidden) renderTable();
  });

  // deep link support: explore.html?county=48453
  const params = new URLSearchParams(location.search);
  const initialFips = params.get("county");
  if (initialFips && countyByFips[initialFips]) selectCounty(initialFips);
})();
