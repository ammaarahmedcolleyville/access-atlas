/* Access Atlas - shared utilities used across pages. */

const AccessAtlas = (() => {
  let countiesCache = null;

  async function loadCounties() {
    if (countiesCache) return countiesCache;
    const res = await fetch("data/counties.json");
    if (!res.ok) throw new Error("Failed to load county data");
    countiesCache = await res.json();
    return countiesCache;
  }

  async function loadGeoJSON() {
    const res = await fetch("data/tx_counties.geojson");
    if (!res.ok) throw new Error("Failed to load county boundaries");
    return res.json();
  }

  function fmt(value, opts = {}) {
    if (value === null || value === undefined || Number.isNaN(value)) return "Not available";
    const { suffix = "", digits = 1, compact = false } = opts;
    if (compact) {
      return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value) + suffix;
    }
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(value) + suffix;
  }

  function fmtMoney(value) {
    if (value === null || value === undefined) return "Not available";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
  }

  // Metric registry: single source of truth for labels, units, and "higher is better?"
  const METRICS = {
    uninsured_pct: { label: "Uninsured adults", unit: "%", higherIsBetter: false, group: "Access" },
    pcp_rate_per_100k: { label: "Primary care physicians", unit: " per 100,000 residents", higherIsBetter: true, group: "Access" },
    mental_health_provider_rate_per_100k: { label: "Mental health providers", unit: " per 100,000 residents", higherIsBetter: true, group: "Access" },
    dentist_rate_per_100k: { label: "Dentists", unit: " per 100,000 residents", higherIsBetter: true, group: "Access" },
    hpsa_active_count: { label: "Active primary care shortage designations", unit: "", higherIsBetter: false, group: "Access" },
    preventable_hospitalization_rate: { label: "Preventable hospitalizations", unit: " per 100,000 (Medicare)", higherIsBetter: false, group: "Access" },
    annual_checkup_pct: { label: "Adults with an annual checkup", unit: "%", higherIsBetter: true, group: "Access" },

    life_expectancy_years: { label: "Life expectancy", unit: " years", higherIsBetter: true, group: "Outcomes" },
    diabetes_pct: { label: "Diagnosed diabetes", unit: "%", higherIsBetter: false, group: "Outcomes" },
    high_blood_pressure_pct: { label: "High blood pressure", unit: "%", higherIsBetter: false, group: "Outcomes" },
    obesity_pct: { label: "Obesity", unit: "%", higherIsBetter: false, group: "Outcomes" },
    asthma_pct: { label: "Current asthma", unit: "%", higherIsBetter: false, group: "Outcomes" },
    heart_disease_pct: { label: "Coronary heart disease", unit: "%", higherIsBetter: false, group: "Outcomes" },
    depression_pct: { label: "Depression", unit: "%", higherIsBetter: false, group: "Outcomes" },
    frequent_mental_distress_pct: { label: "Frequent mental distress", unit: "%", higherIsBetter: false, group: "Outcomes" },
    fair_or_poor_health_pct: { label: "Fair or poor self-rated health", unit: "%", higherIsBetter: false, group: "Outcomes" },
    no_physical_activity_pct: { label: "No leisure-time physical activity", unit: "%", higherIsBetter: false, group: "Outcomes" },

    median_household_income: { label: "Median household income", unit: "", higherIsBetter: true, group: "Context", money: true },
    child_poverty_pct: { label: "Children in poverty", unit: "%", higherIsBetter: false, group: "Context" },
    rural_pct: { label: "Rural population", unit: "%", higherIsBetter: null, group: "Context" },
    population: { label: "Population", unit: "", higherIsBetter: null, group: "Context" },
  };

  function metricValue(county, key) {
    return county[key];
  }

  return { loadCounties, loadGeoJSON, fmt, fmtMoney, METRICS, metricValue };
})();
