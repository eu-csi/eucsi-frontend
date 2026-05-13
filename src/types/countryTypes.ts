// ─────────────────────────────────────────────────────────────────────────────
// EU CountryPulse — Shared Type Definitions
// Generated from: EU CountryPulse Backend Data Specification & Forecasting Guide
// Covers: all 12 SDGs, CSI pipeline, forecasts, anomalies, benchmarks
// ─────────────────────────────────────────────────────────────────────────────

import { Dispatch, SetStateAction } from "react";

// ─── ENUMS ───────────────────────────────────────────────────────────────────

export type CountryCluster =
  | "Nordic Leaders"
  | "Western Innovators"
  | "Mediterranean Transitioning"
  | "Central European Rising"
  | "Eastern Emerging";

export type WaterStressCategory = "No Stress" | "Low" | "Stress" | "Severe";

export type EnergyCategoryLabel = "High" | "Med" | "Low";

export type AnomalySeverity = "critical" | "warning" | "positive";

export type ForecastMethod =
  | "linear_regression"
  | "arima"
  | "exponential_smoothing"
  | "exponential_decay"
  | "var"
  | "seasonal_decomposition"
  | "step_function";

export type SDGId = 3 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 15 | 17;

// ─── SDG SCORES MAP ──────────────────────────────────────────────────────────

export type SDGScores = {
  [K in SDGId]?: number; // 0–100 normalized score
};

// ─── RAW METRICS PER SDG ─────────────────────────────────────────────────────

export interface SDG3Metrics {
  healthRiskScore: number;       // composite 0–100, lower=better
  airPollutionExposure: number;  // µg/m³ PM2.5, lower=better; target EU 10, WHO 5
  greenSpaceDeficit: number;     // m²/person shortfall below WHO 9 m², lower=better
}

export interface SDG5Metrics {
  genderEmploymentGap: number;   // % gap male−female, lower=better; EU target 3
  femaleEmploymentRate: number;  // % employed women 20–64, higher=better; EU target 78
  genderGapTrend: number;        // pp/yr annual change (negative = closing), lower=better
}

export interface SDG6Metrics {
  weiPlus: number;               // Water Exploitation Index %, lower=better; EU target <20
  waterPerCapita: number;        // L/day per person, lower=better; EU target 120
  waterAbstractionTrend: number; // %/yr YoY change, lower=better
  waterStressCategory: WaterStressCategory; // informational badge only
}

export interface SDG7Metrics {
  renewableShare: number;        // % gross final energy, higher=better; EU 2030 target 42.5
  energyIntensity: number;       // MJ/€ GDP, lower=better
  aimForecast: number;           // GWh available to internal market, higher=better
  distributionLosses: number;    // GWh lost in grid, lower=better
  energyCategoryLabel: EnergyCategoryLabel; // informational badge only
}

export interface SDG8Metrics {
  gdpPerCapita: number;          // € PPP-adjusted, higher=better; EU target 35,000
  employmentRate: number;        // % 20–64, higher=better; EU target 78
  carbonIntensity: number;       // tCO₂/M€ GDP, lower=better
  gdpGrowthTrend: number;        // %/yr YoY growth, higher=better; EU target 2.5
}

export interface SDG9Metrics {
  infrastructureModernity: number; // 0–100 composite, higher=better
  energyProductivity: number;      // kgoe GDP/unit energy, higher=better
  transportInfraScore: number;     // 0–100 public transport benchmark, higher=better
}

export interface SDG10Metrics {
  gdpDisparityIndex: number;        // % deviation from EU27 avg, lower=better
  interCountryInequalityScore: number; // pts CSI spread within region, lower=better
}

export interface SDG11Metrics {
  aqiPm25: number;               // µg/m³ PM2.5 AQI, lower=better; EU 10, WHO 5
  greenSpacePerCapita: number;   // m²/person accessible, higher=better; WHO 9
  greenInfraShare: number;       // % of urban area, higher=better; EU 40
  populationDensity: number;     // inh/km², lower=better
  publicTransportShare: number;  // % modal split, higher=better; EU 60
  trafficCongestionIndex: number; // extra travel time %, lower=better
}

export interface SDG12Metrics {
  recyclingRate: number;         // % municipal waste recycled+composted, higher=better; EU 65
  wastePerCapita: number;        // kg/yr per person, lower=better; EU 530
  compostingRate: number;        // % organic diversion, higher=better; EU 20
  wasteReductionTrend: number;   // kg/yr YoY change (negative=reducing), lower=better
}

export interface SDG13Metrics {
  ghgPerCapita: number;              // tCO₂eq/person, lower=better; EU 4.5
  carbonIntensityEconomy: number;    // tCO₂/M€ GDP, lower=better
  totalGhgEmissions: number;         // MtCO₂eq country total, lower=better
  emissionsReductionTrend: number;   // %/yr reduction rate, higher=better; EU 5.5
}

export interface SDG15Metrics {
  urbanGreenCoverage: number;    // % of urban land, higher=better; EU 40
  greenSpacePerCapita: number;   // m²/person, higher=better; WHO 9
  greenInfraGap: number;         // shortfall below 40%, lower=better
  urbanBiodiversityProxy: number; // 0–100 composite, higher=better
}

export interface SDG17Metrics {
  datasetCoverage: number;       // % of 12 datasets complete, higher=better
  dataFreshnessIndex: number;    // yrs lag, lower=better
  openDataCompliance: number;    // % from open Eurostat sources, higher=better
  crossSdgCoverage: number;      // count of SDGs operationalised (max 17), higher=better
}

export interface AllSDGMetrics {
  sdg3?: SDG3Metrics;
  sdg5?: SDG5Metrics;
  sdg6?: SDG6Metrics;
  sdg7?: SDG7Metrics;
  sdg8?: SDG8Metrics;
  sdg9?: SDG9Metrics;
  sdg10?: SDG10Metrics;
  sdg11?: SDG11Metrics;
  sdg12?: SDG12Metrics;
  sdg13?: SDG13Metrics;
  sdg15?: SDG15Metrics;
  sdg17?: SDG17Metrics;
}

// ─── FORECAST & ANOMALY SHAPES ───────────────────────────────────────────────

/** One data point in a forecast series (2015–2029) */
export interface ForecastDataPoint {
  year: number;
  actual: number | null;      // populated for 2015–2024 (historical)
  projected: number | null;   // populated for 2025–2029 (forecast)
  upper: number | null;       // upper confidence bound
  lower: number | null;       // lower confidence bound
  eu27: number | null;        // EU27 average reference line
  target: number | null;      // EU 2030 target constant
  isProjected: boolean;
}

export interface AnomalyRecord {
  year: number;
  value: number;
  expected: number;
  deviation: number;           // z-score
  label: string;               // e.g. "COVID-19 Impact"
  severity: AnomalySeverity;
  description: string;
}

export interface BenchmarkRecord {
  metricKey: string;
  countryValue: number;
  eu27Avg: number;
  topCountry: string;
  topValue: number;
  euTarget: number | null;
  performanceGap: number;
  targetGap: number;
}

export interface SDGForecastResponse {
  sdgId: SDGId;
  country: string;
  countryCode: string;
  metric: string;
  unit: string;
  forecastMethod: ForecastMethod;
  generatedAt: string;          // ISO timestamp
  dataPoints: ForecastDataPoint[];
  anomalies: AnomalyRecord[];
  benchmarks: BenchmarkRecord[];
}

// ─── CORE COUNTRY RECORD ─────────────────────────────────────────────────────────

/**
 * LiveCountryRecord — the full country object returned by
 * GET /api/countries  and  GET /api/countries/:country/overview
 * Maps 1:1 to the "Complete Country Record" in the spec.
 */
export interface LiveCountryRecord {
  // Identity
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
  population: number;
  year: number;

  // CSI Pipeline outputs (computed by backend)
  csi: number;                  // 0–100 Composite Sustainability Index
  rank: number;                 // Ranking position (1–44)
  percentile: number;           // rank among 44 countries → 0–100
  sdgAchievementRate: number;   // % of SDGs scoring ≥ 70
  cluster: CountryCluster;

  // Per-SDG scores (0–100, computed from normalized metrics)
  sdgScores: SDGScores;

  // Raw metric values (used to compute sdgScores)
  metrics: AllSDGMetrics;
}

// ─── MAP / LIGHTWEIGHT SHAPES ─────────────────────────────────────────────────

/** Lighter shape used for the map marker layer — avoids shipping full metrics */
export interface CountryMapMarker {
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
  csi: number;
  cluster: CountryCluster;
  percentile: number;
  sdgAchievementRate: number;
}

// ─── RANKINGS ─────────────────────────────────────────────────────────────────

export interface CountryRankingEntry {
  rank: number;
  country: string;
  countryCode: string;
  cluster: CountryCluster;
  sdgScore: number;
  csi: number;
  trend: "up" | "down" | "flat";
}

// ─── COMPONENT PROP SHAPES ───────────────────────────────────────────────────

/** Props for <CountryMap /> */
export interface CountryMapProps {
  selectedCountry: string;
  onCountryClick: Dispatch<SetStateAction<string | undefined>>;
  liveCountries: LiveCountryRecord[];
}

/** Props for <CountryOverview /> */
export interface CountryOverviewProps {
  country: LiveCountryRecord;
}

/** Props for <CountryRankingTable /> */
export interface CountryRankingTableProps {
  selectedCountry: string | undefined;
  onCountrySelect: (country: string | undefined) => void;
  liveCountries: LiveCountryRecord[];
  isLoading: boolean;
}

/** Props for <SDGScoreGrid /> */
export interface SDGScoreGridProps {
  liveCountries: LiveCountryRecord[];
}

/** Props for <SDGAnalytics /> */
export interface SDGAnalyticsProps {
  selectedCountry: string;
  selectedSdg: SDGId;
  forecastData: SDGForecastResponse | null;
  isLoading: boolean;
}

// ─── API RESPONSE WRAPPERS ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  generatedAt: string;
  cached: boolean;
}

export interface CountriesApiResponse extends ApiResponse<LiveCountryRecord[]> {}
export interface CountryOverviewApiResponse extends ApiResponse<LiveCountryRecord> {}
export interface ForecastApiResponse extends ApiResponse<SDGForecastResponse> {}
export interface RankingsApiResponse extends ApiResponse<CountryRankingEntry[]> {}