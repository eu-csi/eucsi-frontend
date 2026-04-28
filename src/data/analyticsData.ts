import { CITY_SDG_SCORES, SDG_DEFINITIONS, YEARS_RANGE } from "./sdgData";

// ─── Domain labels per SDG ────────────────────────────────────────────────────
export const SDG_FORECAST_LABELS: Record<number, { title: string; metric: string; unit: string }> = {
  3:  { title: "Health Risk Trajectory",           metric: "Health Risk Score",            unit: "/100" },
  5:  { title: "Gender Parity Forecast",           metric: "Gender Employment Gap",         unit: "%" },
  6:  { title: "Water Stress Projection",          metric: "WEI+ Index",                   unit: "%" },
  7:  { title: "Energy Need Forecast",             metric: "AIM Forecast",                 unit: "GWh" },
  8:  { title: "Economic Growth Projection",       metric: "GDP Per Capita",               unit: "€k" },
  9:  { title: "Infrastructure Modernity Forecast",metric: "Infrastructure Index",          unit: "/100" },
  10: { title: "Inequality Reduction Trajectory",  metric: "GDP Disparity Index",          unit: "%" },
  11: { title: "Air Quality & Urban Forecast",     metric: "PM2.5 AQI",                    unit: "µg/m³" },
  12: { title: "Waste Reduction Trajectory",       metric: "Waste Per Capita",             unit: "kg/yr" },
  13: { title: "Emissions Reduction Pathway",      metric: "GHG Per Capita",               unit: "tCO₂eq" },
  15: { title: "Urban Green Space Forecast",       metric: "Urban Green Coverage",         unit: "%" },
  17: { title: "Data Coverage Projection",         metric: "Dataset Coverage Score",       unit: "%" },
};

// ─── Forecast data (2015–2030 with confidence bands) ─────────────────────────
export interface ForecastPoint {
  year: number;
  actual: number | null;
  projected: number | null;
  upper: number | null;
  lower: number | null;
  eu27: number | null;
  target: number | null;
  isProjected: boolean;
}

export function generateForecastData(sdgId: number, city: string): ForecastPoint[] {
  const cityRow  = CITY_SDG_SCORES.find(c => c.city === city);
  const base     = cityRow?.sdgScores[sdgId] ?? 60;
  const allYears = [...YEARS_RANGE, 2025, 2026, 2027, 2028, 2029, 2030];

  // Per-SDG target for ref line
  const targetMap: Record<number, number> = {
    3: 25, 5: 3, 6: 20, 7: 42.5, 8: 80, 9: 75, 10: 5, 11: 10, 12: 65, 13: 4.5, 15: 40, 17: 100,
  };
  const target = targetMap[sdgId] ?? 70;

  // Gradient: slope trends score toward target
  const historicalBase = base - 14;
  const slope = (base - historicalBase) / 9;

  return allYears.map((year, i) => {
    const isProjected = year > 2024;
    const trend = historicalBase + slope * i;
    const noise = Math.sin(i * 1.7 + sdgId) * 2.1;
    const value = Math.max(0, Math.min(100, trend + noise));
    const eu27  = Math.max(0, Math.min(100, 52 + i * 0.8 + Math.cos(i) * 1.3));

    if (isProjected) {
      const projIdx = year - 2024;
      const proj    = value + projIdx * 1.4;
      return {
        year,
        actual:    null,
        projected: +proj.toFixed(1),
        upper:     +(proj + 4 + projIdx * 0.9).toFixed(1),
        lower:     +(proj - 3 - projIdx * 0.7).toFixed(1),
        eu27:      +eu27.toFixed(1),
        target,
        isProjected: true,
      };
    }
    return {
      year, actual: +value.toFixed(1), projected: null, upper: null, lower: null,
      eu27: +eu27.toFixed(1), target, isProjected: false,
    };
  });
}

// ─── Anomaly detection ────────────────────────────────────────────────────────
export interface Anomaly {
  year: number;
  value: number;
  expected: number;
  deviation: number;  // z-score
  label: string;
  severity: "critical" | "warning" | "positive";
  description: string;
}

const GLOBAL_ANOMALY_EVENTS: Record<number, { label: string; description: string; direction: "down" | "up" }> = {
  2020: { label: "COVID-19 Impact",     description: "Pandemic disrupted economic activity, mobility, and data collection across all cities.", direction: "down" },
  2022: { label: "Energy Crisis",       description: "Russia-Ukraine conflict caused energy price spikes, supply chain disruptions, and inflation.", direction: "up" },
  2018: { label: "Extreme Heat Events", description: "Record heatwaves across Western Europe affecting air quality, energy demand, and health risk.", direction: "up" },
};

const SDG_SPECIFIC_ANOMALIES: Record<number, Record<number, { label: string; severity: "critical"|"warning"|"positive"; description: string }>> = {
  7:  {
    2020: { label: "Renewable Surge",    severity: "positive",  description: "COVID lockdowns caused fossil fuel demand collapse; renewable share spiked." },
    2022: { label: "Energy Price Shock", severity: "critical",  description: "Gas prices tripled, triggering emergency energy savings programs across EU." },
  },
  13: {
    2020: { label: "Emissions Collapse", severity: "positive",  description: "Transport and industrial shutdowns caused largest single-year emissions drop on record." },
    2022: { label: "Emissions Rebound",  severity: "warning",   description: "Post-lockdown recovery and coal substitution reversed 2020 gains." },
  },
  8:  {
    2020: { label: "GDP Crash",          severity: "critical",  description: "EU GDP contracted ~6% — worst peacetime recession. Employment rate fell sharply." },
    2021: { label: "Strong Recovery",    severity: "positive",  description: "Unprecedented fiscal stimulus drove V-shaped economic recovery in most EU cities." },
  },
  11: {
    2020: { label: "Air Quality Bonus",  severity: "positive",  description: "Traffic reduction improved PM2.5 levels by 20–40% across major EU cities." },
    2018: { label: "Heatwave AQI Spike", severity: "critical",  description: "O3 and PM2.5 surged during prolonged summer heat, exceeding WHO limits." },
  },
  5:  {
    2021: { label: "Employment Recovery",severity: "positive",  description: "Female employment recovered faster than male post-COVID — gap narrowed." },
  },
  6:  {
    2018: { label: "Severe Drought",     severity: "critical",  description: "Heatwave + drought caused WEI+ to breach 'Severe Stress' threshold in S. Europe." },
    2022: { label: "Water Restrictions", severity: "warning",   description: "Multiple cities imposed water restrictions due to below-average rainfall." },
  },
  12: {
    2020: { label: "Waste Data Gap",     severity: "warning",   description: "Collection and reporting disruptions caused data gaps for 2020 recycling rates." },
  },
};

export function detectAnomalies(sdgId: number, city: string): Anomaly[] {
  const data = generateForecastData(sdgId, city).filter(d => !d.isProjected && d.actual !== null);
  // Compute rolling mean and std
  const values = data.map(d => d.actual as number);
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const std  = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length) || 1;

  const anomalies: Anomaly[] = [];
  data.forEach((d, i) => {
    const val = d.actual as number;
    const expected = i > 0 ? (values[i-1] + values[Math.min(i+1, values.length-1)]) / 2 : mean;
    const z   = (val - mean) / std;

    const sdgSpecific = SDG_SPECIFIC_ANOMALIES[sdgId]?.[d.year];
    const globalEvent = GLOBAL_ANOMALY_EVENTS[d.year];

    if (Math.abs(z) >= 1.4 || sdgSpecific) {
      const sev = sdgSpecific?.severity ?? (z < -1.5 ? "critical" : z > 1.5 ? "positive" : "warning");
      anomalies.push({
        year:        d.year,
        value:       val,
        expected:    +expected.toFixed(1),
        deviation:   +z.toFixed(2),
        label:       sdgSpecific?.label ?? globalEvent?.label ?? (z > 0 ? "Above-average spike" : "Below-average dip"),
        severity:    sev,
        description: sdgSpecific?.description ?? globalEvent?.description ?? `Score deviated ${Math.abs(z).toFixed(1)}σ from historical mean.`,
      });
    }
  });
  return anomalies;
}

// ─── Benchmark data ───────────────────────────────────────────────────────────
export interface MetricBenchmark {
  metricKey: string;
  metricLabel: string;
  unit: string;
  cityValue: number;
  cityLabel: string;
  eu27Avg: number;
  topCity: string;
  topValue: number;
  bottomCity: string;
  bottomValue: number;
  euTarget: number | null;
  whoThreshold: number | null;
  higherIsBetter: boolean;
  performanceGap: number;    // vs EU27 (positive = better than avg)
  targetGap: number | null;  // vs target (positive = meeting target)
}

export function getBenchmarks(sdgId: number, selectedCity: string): MetricBenchmark[] {
  const sdg         = SDG_DEFINITIONS.find(s => s.id === sdgId);
  if (!sdg) return [];
  const cityRow     = CITY_SDG_SCORES.find(c => c.city === selectedCity);
  const cityScore   = cityRow?.sdgScores[sdgId] ?? 65;

  return sdg.metrics
    .filter(m => m.type !== "category")
    .map(metric => {
      const k = cityScore / 100;

      // Build mock values for all cities
      const allVals = CITY_SDG_SCORES.map(c => {
        const cs   = c.sdgScores[sdgId] ?? 60;
        const km   = cs / 100;
        const BASE_VALS: Record<string, (k: number) => number> = {
          genderEmploymentGap:    km => +(22 - km * 18).toFixed(1),
          femaleEmploymentRate:   km => +(45 + km * 40).toFixed(1),
          genderGapTrend:         km => +(-0.9 + km * 0.8).toFixed(2),
          weiPlus:                km => +(40 - km * 35).toFixed(1),
          waterPerCapita:         km => Math.round(220 - km * 110),
          waterAbstractionTrend:  km => +(-0.5 - km * 0.8).toFixed(2),
          renewableShare:         km => +(10 + km * 55).toFixed(1),
          energyIntensity:        km => +(8 - km * 5).toFixed(2),
          aimForecast:            km => Math.round(800 + km * 2200),
          distributionLosses:     km => Math.round(200 - km * 130),
          gdpPerCapita:           km => Math.round(15000 + km * 55000),
          employmentRate:         km => +(55 + km * 30).toFixed(1),
          carbonIntensity:        km => Math.round(400 - km * 260),
          gdpGrowthTrend:         km => +(0.5 + km * 3).toFixed(1),
          aqiPm25:                km => +(35 - km * 28).toFixed(1),
          greenSpacePerCapita:    km => +(4 + km * 25).toFixed(1),
          greenInfraShare:        km => +(15 + km * 35).toFixed(1),
          populationDensity:      km => Math.round(1500 + (1 - km) * 5000),
          publicTransportShare:   km => +(25 + km * 50).toFixed(1),
          trafficCongestionIndex: km => +(50 - km * 38).toFixed(1),
          recyclingRate:          km => +(25 + km * 50).toFixed(1),
          wastePerCapita:         km => Math.round(700 - km * 280),
          compostingRate:         km => +(5 + km * 25).toFixed(1),
          wasteReductionTrend:    km => +(-15 + km * 10).toFixed(1),
          ghgPerCapita:           km => +(14 - km * 11).toFixed(1),
          carbonIntensityEconomy: km => Math.round(550 - km * 400),
          totalGhgEmissions:      km => +(18 - km * 14).toFixed(1),
          emissionsReductionTrend:km => +(km * 6).toFixed(1),
          datasetCoverage:        km => +(60 + km * 40).toFixed(1),
          dataFreshnessIndex:     km => +(3 - km * 2.2).toFixed(1),
          openDataCompliance:     km => +(70 + km * 30).toFixed(1),
          crossSdgCoverage:       km => Math.round(6 + km * 7),
          healthRiskScore:        km => +(80 - km * 65).toFixed(1),
          airPollutionExposure:   km => +(35 - km * 28).toFixed(1),
          greenSpaceDeficit:      km => +Math.max(0, 9 - (4 + km * 25)).toFixed(1),
          infrastructureModernity:km => +(30 + km * 65).toFixed(1),
          energyProductivity:     km => +(3 + km * 8).toFixed(1),
          transportInfraScore:    km => +(25 + km * 65).toFixed(1),
          gdpDisparityIndex:      km => +Math.abs(50 - km * 80).toFixed(1),
          interCityInequalityScore:km => +(35 - km * 28).toFixed(1),
          urbanGreenCoverage:     km => +(15 + km * 35).toFixed(1),
          greenInfraGap:          km => +Math.max(0, 40 - (15 + km * 35)).toFixed(1),
          urbanBiodiversityProxy: km => +(25 + km * 65).toFixed(1),
        };
        const fn = BASE_VALS[metric.key];
        return { city: c.city, val: fn ? +fn(km) : cs };
      });

      const fn2 = allVals.find(v => v.city === selectedCity);
      const cityValue = fn2 ? fn2.val : +( metric.higherIsBetter ? 55 + k*30 : 40 - k*20 ).toFixed(1);
      const sorted  = [...allVals].sort((a, b) => metric.higherIsBetter ? b.val - a.val : a.val - b.val);
      const topCity = sorted[0];
      const botCity = sorted[sorted.length - 1];
      const eu27Avg = +(allVals.reduce((s, v) => s + v.val, 0) / allVals.length).toFixed(1);

      const target  = metric.euTarget ?? metric.whoThreshold ?? null;
      const tGap    = target !== null ? +(metric.higherIsBetter ? cityValue - target : target - cityValue).toFixed(1) : null;
      const pGap    = +(metric.higherIsBetter ? cityValue - eu27Avg : eu27Avg - cityValue).toFixed(1);

      return {
        metricKey:     metric.key,
        metricLabel:   metric.label,
        unit:          metric.unit,
        cityValue,
        cityLabel:     selectedCity,
        eu27Avg,
        topCity:       topCity.city,
        topValue:      topCity.val,
        bottomCity:    botCity.city,
        bottomValue:   botCity.val,
        euTarget:      metric.euTarget ?? null,
        whoThreshold:  metric.whoThreshold ?? null,
        higherIsBetter: metric.higherIsBetter,
        performanceGap: pGap,
        targetGap:      tGap,
      };
    });
}
