/* Access Atlas - compare.html logic */

(async function () {
  const CAT_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#e87ba4"]; // slots 1,2,3 (all-pairs safe) + slot 5 as 4th w/ direct labels
  const MAX_COUNTIES = 4;

  const picker = document.getElementById("picker");
  const results = document.getElementById("results");

  let counties;
  try {
    counties = await AccessAtlas.loadCounties();
  } catch (e) {
    results.innerHTML = "<p>County data failed to load. Please refresh the page.</p>";
    console.error(e);
    return;
  }
  const sorted = counties.slice().sort((a, b) => a.county_name.localeCompare(b.county_name));
  const byFips = Object.fromEntries(counties.map(c => [c.fips, c]));

  const params = new URLSearchParams(location.search);
  const urlFips = (params.get("counties") || "").split(",").filter(Boolean);
  const defaults = urlFips.length ? urlFips : findDefaultPair();

  function findDefaultPair() {
    // Editorial default: one large urban county, one small rural county — both real, not cherry-picked outcomes
    const travis = counties.find(c => c.county_name === "Travis");
    const zavala = counties.find(c => c.county_name === "Zavala");
    return [travis?.fips, zavala?.fips].filter(Boolean);
  }

  const selects = [];
  for (let i = 0; i < MAX_COUNTIES; i++) {
    const wrap = document.createElement("div");
    const label = document.createElement("label");
    label.className = "visually-hidden";
    label.htmlFor = `county-${i}`;
    label.textContent = `County ${i + 1}`;
    const select = document.createElement("select");
    select.id = `county-${i}`;
    const noneOpt = document.createElement("option");
    noneOpt.value = "";
    noneOpt.textContent = i < 2 ? `Select county ${i + 1}` : "(optional) Select a county";
    select.appendChild(noneOpt);
    for (const c of sorted) {
      const opt = document.createElement("option");
      opt.value = c.fips;
      opt.textContent = `${c.county_name} County`;
      select.appendChild(opt);
    }
    select.value = defaults[i] || "";
    select.addEventListener("change", render);
    wrap.append(label, select);
    picker.appendChild(wrap);
    selects.push(select);
  }

  function selectedCounties() {
    return selects.map(s => s.value).filter(Boolean).map(fips => byFips[fips]).filter(Boolean);
  }

  function render() {
    const chosen = selectedCounties();
    results.innerHTML = "";
    if (chosen.length < 2) {
      results.innerHTML = '<p class="text-muted">Choose at least two counties to compare.</p>';
      return;
    }

    // --- comparison table ---
    const table = document.createElement("table");
    table.className = "compare-table";
    const caption = document.createElement("caption");
    caption.textContent = "Full metric comparison";
    table.appendChild(caption);
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    headRow.appendChild(document.createElement("th"));
    chosen.forEach((c, i) => {
      const th = document.createElement("th");
      th.textContent = `${c.county_name} County`;
      th.style.color = CAT_COLORS[i];
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    for (const [key, m] of Object.entries(AccessAtlas.METRICS)) {
      const tr = document.createElement("tr");
      const th = document.createElement("th");
      th.scope = "row";
      th.style.fontWeight = "600";
      th.style.background = "transparent";
      th.textContent = m.label + (m.unit && !m.money ? ` (${m.unit.trim()})` : "");
      tr.appendChild(th);
      for (const c of chosen) {
        const td = document.createElement("td");
        td.textContent = m.money ? AccessAtlas.fmtMoney(c[key]) : AccessAtlas.fmt(c[key]) + (c[key] != null ? m.unit : "");
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    results.appendChild(table);

    // --- bar chart rows, grouped ---
    const groups = ["Access", "Outcomes"];
    for (const group of groups) {
      const rowWrap = document.createElement("div");
      rowWrap.className = "bar-chart-row";
      const h3 = document.createElement("h3");
      h3.textContent = group === "Access" ? "Healthcare access" : "Health outcomes";
      rowWrap.appendChild(h3);

      // legend
      const legend = document.createElement("div");
      legend.style.cssText = "display:flex;gap:16px;flex-wrap:wrap;margin-bottom:14px;font-size:0.85rem;";
      chosen.forEach((c, i) => {
        const item = document.createElement("span");
        item.style.cssText = "display:inline-flex;align-items:center;gap:6px;";
        item.innerHTML = `<span style="width:12px;height:12px;border-radius:3px;background:${CAT_COLORS[i]};display:inline-block;"></span>`;
        const textNode = document.createElement("span");
        textNode.textContent = c.county_name + " County";
        item.appendChild(textNode);
        legend.appendChild(item);
      });
      rowWrap.appendChild(legend);

      for (const [key, m] of Object.entries(AccessAtlas.METRICS)) {
        if (m.group !== group) continue;
        const vals = chosen.map(c => c[key]).filter(v => v != null);
        if (!vals.length) continue;
        const max = Math.max(...vals, 0.0001);

        const item = document.createElement("div");
        item.className = "bar-chart";
        const title = document.createElement("div");
        title.style.cssText = "font-weight:600;font-size:0.88rem;margin-top:14px;";
        title.textContent = m.label;
        item.appendChild(title);

        chosen.forEach((c, i) => {
          const value = c[key];
          const row = document.createElement("div");
          row.className = "bar-chart-item";
          const label = document.createElement("span");
          label.className = "text-muted";
          label.textContent = c.county_name;
          const track = document.createElement("div");
          track.className = "bar-track";
          const fill = document.createElement("div");
          fill.className = "bar-fill";
          fill.style.background = CAT_COLORS[i];
          fill.style.width = value != null ? `${Math.max((value / max) * 100, 3)}%` : "0%";
          track.appendChild(fill);
          const valSpan = document.createElement("span");
          valSpan.className = "bar-value";
          valSpan.textContent = value != null ? AccessAtlas.fmt(value, { digits: 1 }) : "N/A";
          row.append(label, track, valSpan);
          item.appendChild(row);
        });
        rowWrap.appendChild(item);
      }
      results.appendChild(rowWrap);
    }
  }

  render();
})();
