export const EU_COUNTRIES = [
  "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czechia", "Denmark",
  "Estonia", "Finland", "France", "Germany", "Greece", "Hungary", "Ireland",
  "Italy", "Latvia", "Lithuania", "Luxembourg", "Malta", "Netherlands",
  "Poland", "Portugal", "Romania", "Slovakia", "Slovenia", "Spain", "Sweden"
];

export const YEARS = Array.from({ length: 10 }, (_, i) => 2015 + i);

export interface KPIData {
  label: string;
  value: string;
  unit: string;
  yoy: number;
  percentile: number;
  targetGap: number;
  icon: string;
}

export const KPI_DATA: KPIData[] = [
  { label: "Composite Sustainability Index", value: "72.4", unit: "/100", yoy: 3.2, percentile: 68, targetGap: -7.6, icon: "gauge" },
  { label: "Emissions per Capita", value: "5.8", unit: "tCO₂e", yoy: -4.1, percentile: 55, targetGap: -1.2, icon: "cloud" },
  { label: "Renewable Energy Share", value: "34.2", unit: "%", yoy: 5.8, percentile: 72, targetGap: -5.8, icon: "zap" },
  { label: "Air Pollution Index", value: "18.3", unit: "µg/m³", yoy: -2.4, percentile: 61, targetGap: -3.3, icon: "wind" },
  { label: "GDP per Capita", value: "42,180", unit: "€", yoy: 2.1, percentile: 78, targetGap: 0, icon: "euro" },
  { label: "Water Usage Efficiency", value: "82.1", unit: "%", yoy: 1.7, percentile: 64, targetGap: -7.9, icon: "droplets" },
];

export const TREND_DATA = YEARS.map((year) => ({
  year,
  csi: 55 + Math.random() * 20 + (year - 2015) * 1.5,
  emissions: 8.5 - (year - 2015) * 0.25 + Math.random() * 0.5,
  renewable: 18 + (year - 2015) * 1.8 + Math.random() * 3,
  airPollution: 28 - (year - 2015) * 0.9 + Math.random() * 2,
}));

export const BENCHMARK_DATA = [
  { metric: "Emissions", country: 5.8, peerAvg: 6.2, eu27: 6.8, topPerformer: 3.1 },
  { metric: "Renewable", country: 34.2, peerAvg: 30.1, eu27: 22.1, topPerformer: 62.4 },
  { metric: "Air Quality", country: 18.3, peerAvg: 20.1, eu27: 21.5, topPerformer: 8.2 },
  { metric: "Water Eff.", country: 82.1, peerAvg: 75.3, eu27: 70.2, topPerformer: 95.1 },
  { metric: "Green Space", country: 45.2, peerAvg: 38.4, eu27: 35.0, topPerformer: 68.0 },
  { metric: "Transport", country: 62.1, countryAvg: 55.8, eu27: 48.3, topPerformer: 85.2 },
];

export const RADAR_DATA = [
  { subject: "Environmental", country: 72, peerAvg: 65, eu27: 58, fullMark: 100 },
  { subject: "Social", country: 68, peerAvg: 62, eu27: 55, fullMark: 100 },
  { subject: "Economic", country: 78, peerAvg: 70, eu27: 65, fullMark: 100 },
  { subject: "Transport", country: 62, peerAvg: 56, eu27: 48, fullMark: 100 },
  { subject: "Energy", country: 74, peerAvg: 60, eu27: 52, fullMark: 100 },
  { subject: "Governance", country: 70, peerAvg: 64, eu27: 60, fullMark: 100 },
];

export const CORRELATION_MATRIX = [
  { x: "Renewable", y: "Emissions", value: -0.78 },
  { x: "Renewable", y: "Air Quality", value: 0.62 },
  { x: "Renewable", y: "GDP", value: 0.45 },
  { x: "Emissions", y: "Air Quality", value: -0.71 },
  { x: "Emissions", y: "GDP", value: 0.32 },
  { x: "Air Quality", y: "GDP", value: -0.28 },
  { x: "Transport", y: "Emissions", value: -0.55 },
  { x: "Transport", y: "Air Quality", value: 0.48 },
  { x: "Green Space", y: "Air Quality", value: 0.67 },
];

export const TARGET_TRACKING = [
  { metric: "Emissions Reduction", current: 42, target2030: 55, target2035: 70, unit: "%" },
  { metric: "Renewable Energy", current: 34.2, target2030: 42.5, target2035: 60, unit: "%" },
  { metric: "Air Quality (PM2.5)", current: 18.3, target2030: 15, target2035: 10, unit: "µg/m³" },
  { metric: "Waste Recycling", current: 48, target2030: 65, target2035: 80, unit: "%" },
  { metric: "Public Transport", current: 62, target2030: 75, target2035: 85, unit: "%" },
  { metric: "Water Efficiency", current: 82.1, target2030: 90, target2035: 95, unit: "%" },
];

export const FORECAST_DATA = Array.from({ length: 15 }, (_, i) => {
  const year = 2015 + i;
  const isProjection = year > 2024;
  const base = 55 + (year - 2015) * 1.8;
  return {
    year,
    actual: isProjection ? null : base + Math.random() * 5,
    projected: year >= 2022 ? base + Math.random() * 3 : null,
    upperBound: year >= 2022 ? base + 8 : null,
    lowerBound: year >= 2022 ? base - 4 : null,
    isProjection,
  };
});

export const CLUSTER_DATA = [
  { name: "Nordic Leaders", countries: ["Sweden", "Denmark", "Finland"], csi: 85, color: "eu-success" },
  { name: "Western Innovators", countries: ["Germany", "France", "Netherlands", "Belgium", "Austria", "Luxembourg", "Ireland"], csi: 78, color: "eu-blue-light" },
  { name: "Mediterranean Transitioning", countries: ["Spain", "Italy", "Portugal", "Greece", "Malta", "Cyprus"], csi: 65, color: "eu-gold" },
  { name: "Central European Rising", countries: ["Poland", "Czechia", "Slovakia", "Hungary", "Slovenia", "Croatia"], csi: 58, color: "eu-warning" },
  { name: "Eastern Emerging", countries: ["Romania", "Bulgaria", "Estonia", "Latvia", "Lithuania"], csi: 48, color: "eu-danger" },
];

export const EUROSTAT_DATASETS = [
  "sdg_07_40", "env_air_gge", "env_wasmun", "sdg_06_60", "env_wat_abs",
  "urb_cpop1", "urb_cenv", "tran_hv_psmod", "nrg_ind_ei", "tesem060",
  "sdg_11_50", "nama_10_gdp"
];

