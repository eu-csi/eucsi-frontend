import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { SDG_DEFINITIONS } from "@/data/sdgData";

const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";
// const API_BASE =
//   import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://187.127.164.121:8002";

const UI_TO_DB_METRIC_MAP: Record<string, string> = {
  airPollutionExposure: "SDG3_AIR_POLLUTION_EXPOSURE",
  greenSpaceDeficit: "SDG3_GREEN_SPACE_DEFICIT",
  healthRiskScore: "SDG3_HEALTH_RISK_PROXY_SCORE",
  genderEmploymentGap: "SDG5_GENDER_GAP",
  weiPlus: "SDG6_WEI_PLUS",
  renewableShare: "SDG7_RES",
  energyIntensity: "SDG7_ENERGY_CONSUMPTION",
  aimForecast: "SDG7_AIM",
  distributionLosses: "SDG7_DL",
  gdpPerCapita: "SDG8_GDP_PER_CAPITA",
  employmentRate: "SDG8_EMPLOYMENT_RATE",
  gdpGrowthTrend: "SDG8_GDP_GROWTH_TREND",
  infrastructureModernity: "SDG9_INFRASTRUCTURE_MODERNITY_INDEX",
  energyProductivity: "SDG9_ENERGY_PRODUCTIVITY_SCORE",
  transportInfraScore: "SDG9_TRANSPORT_MODAL_SPLIT",
  genderEmploymentGapSdg10: "SDG10_GENDER_EMPLOYMENT_GAP",
  gdpDisparityIndex: "SDG10_GDP_PER_CAPITA",
  interCountryInequalityScore: "SDG10_INTER_CITY_INEQUALITY_SCORE",
  aqiPm25: "SDG11_AQI_PM25_EXPOSURE",
  greenSpacePerCapita: "SDG11_GREEN_SPACE_PER_CAPITA",
  greenInfraShare: "SDG11_GREEN_INFRASTRUCTURE_SHARE",
  populationDensity: "SDG11_SETTLEMENT_AREA_PER_CAPITA",
  publicTransportShare: "SDG11_PUBLIC_TRANSPORT_MODAL_SPLIT",
  trafficCongestionIndex: "SDG11_TRAFFIC_CONGESTION_INDEX",
  recyclingRate: "SDG12_RECYCLING_RATE",
  wastePerCapita: "SDG12_MUNICIPAL_WASTE_PER_CAPITA",
  compostingRate: "SDG12_COMPOSTING_RATE",
  wasteReductionTrend: "SDG12_WASTE_REDUCTION_TREND",
  ghgPerCapita: "SDG13_GHG_EMISSIONS_PER_CAPITA",
  carbonIntensityEconomy: "SDG13_CARBON_INTENSITY",
  totalGhgEmissions: "SDG13_TOTAL_GHG_EMISSIONS",
  emissionsReductionTrend: "SDG13_EMISSIONS_REDUCTION_TREND",
  urbanGreenCoverage: "SDG15_URBAN_GREEN_COVERAGE",
  greenSpacePerCapitaSdg15: "SDG15_GREEN_SPACE_PER_CAPITA",
  greenInfraGap: "SDG15_GREEN_INFRASTRUCTURE_GAP",
  urbanBiodiversityProxy: "SDG15_URBAN_BIODIVERSITY_PROXY_SCORE",
  datasetCoverage: "SDG17_DATASET_COVERAGE_SCORE",
  dataFreshnessIndex: "SDG17_DATA_FRESHNESS_INDEX",
  openDataCompliance: "SDG17_OPEN_DATA_COMPLIANCE_RATE",
  crossSdgCoverage: "SDG17_CROSS_SDG_COVERAGE_RATE",
};

export function getDbMetricName(sdgId: number, uiKey: string): string {
  if (uiKey === "genderEmploymentGap") {
    return sdgId === 10 ? "SDG10_GENDER_EMPLOYMENT_GAP" : "SDG5_GENDER_GAP";
  }
  if (uiKey === "greenSpacePerCapita") {
    return sdgId === 15 ? "SDG15_GREEN_SPACE_PER_CAPITA" : "SDG11_GREEN_SPACE_PER_CAPITA";
  }
  return (
    UI_TO_DB_METRIC_MAP[uiKey] ||
    `SDG${sdgId}_${uiKey.replace(/([A-Z])/g, "_$1").toUpperCase()}`
  );
}

async function apiFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Request failed: ${response.status} ${path} ${text}`);
  }

  return response.json() as Promise<T>;
}

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeIso2(value: unknown): string {
  return String(value ?? "").trim().toUpperCase();
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export type ClusterName =
  | "Nordic Leaders"
  | "Western Innovators"
  | "Mediterranean Transitioning"
  | "Central European Rising"
  | "Eastern Emerging";

export interface Country {
  country_id: number;
  iso2: string;
  iso3: string;
  name: string;
  is_eu27: boolean;
  latitude: number;
  longitude: number;
  region: string;
}

export interface SDGInfo {
  sdg_id: number;
  number: number;
  title: string;
  description: string;
}

export interface Metric {
  metric_id: number;
  sdg_id: number;
  name: string;
  source_dataset: string;
  unit: string;
  direction: "higher_better" | "lower_better";
  frequency: string;
}

export interface CSIScore {
  country_id: number;
  country_iso2: string;
  country_name: string;
  year: number;
  csi_score: number;
  sdg_count: number;
  eu_rank: number | null;
  eu_percentile: number | null;
  cluster: string | null;
  data_type: string;
}

export interface SDGScore {
  country_id: number;
  country_iso2: string;
  country_name: string;
  sdg_id: number;
  sdg_number: number;
  sdg_title: string;
  year: number;
  normalised_score: number | null;
  data_type: string;
}

export interface SDGRankingRow {
  rank: number;
  country_id: number;
  iso2: string;
  name: string;
  region: string;
  score: number;
  year: number;
}

export interface CountryRankingResponse {
  rank: number;
  country_id: number;
  iso2: string;
  name: string;
  region: string;
  is_eu27: boolean;
  csi_score: number;
  cluster: string;
  year: number;
}

export interface MetricValue {
  metric_id: number;
  country_id: number;
  year: number;
  raw_value: number;
  normalised_score: number | null;
  data_type: string;
}

export interface AnomalyResponse {
  metric_id: number;
  country_id: number;
  year: number;
  raw_value: number;
  flag_reason: string;
}

export interface StatsResponse {
  total_countries: number;
  total_sdgs: number;
  total_metrics: number;
  total_metric_values: number;
  total_anomalies: number;
  years_covered: number[];
  latest_year: number;
  earliest_year: number;
}

export interface ApiHealthResponse {
  status: string;
  database: string;
  countries_loaded: number;
  timestamp: string;
  models: string[];
}

export interface CountrySdgMetric {
  id: number;
  name: string;
  value: number | string;
  trend?: number;
  benchmark?: number;
  category?: string;
  unit?: string;
}

export interface CountrySdgScore {
  id: number;
  sdgId: number;
  label: string;
  title: string;
  score: number | null;
  trend: number;
  rank: number;
  metrics: CountrySdgMetric[];
  year: number;
  euComparison?: string;
  waterStress?: string;
  status?: string;
  note?: string;
}

export interface DashboardScoresResponse {
  country: string;
  csi: number | null;
  percentile: number | null;
  sdgAchievementRate: number;
  cluster: ClusterName | null;
  sdgScores: Record<number, number | null>;
  liveSDGIds: number[];
  timestamp: string;
}

export interface FetchCountrySdgScoresResponse {
  country: {
    id: number;
    name: string;
    iso2: string;
    region: string;
  };
  compositeCsi: number | null;
  percentile?: number | null;
  cluster?: ClusterName | null;
  timestamp: string;
  dataSource: string;
  sdgScores: CountrySdgScore[];
}

export interface IndicatorPoint {
  year: number;
  value: number;
  is_forecast?: boolean;
  conf_low?: number | null;
  conf_high?: number | null;
}

export interface IndicatorSeries {
  metricId: number;
  metricKey?: string;
  metricName: string;
  unit: string;
  direction: "higher_better" | "lower_better";
  data: IndicatorPoint[];
}

export interface FetchIndicatorDataResponse {
  data: IndicatorSeries[];
}

export interface MetricBenchmarkCountryValue {
  country: string;
  iso2: string;
  value: number;
}

function calculateTrend(current: number | null, previous?: number | null): number {
  if (typeof current !== "number" || typeof previous !== "number") return 0;
  return Number((current - previous).toFixed(2));
}

function toClusterName(value?: string | null): ClusterName | null {
  if (
    value === "Nordic Leaders" ||
    value === "Western Innovators" ||
    value === "Mediterranean Transitioning" ||
    value === "Central European Rising" ||
    value === "Eastern Emerging"
  ) {
    return value;
  }
  return null;
}

async function fetchCountriesRaw(region?: string): Promise<Country[]> {
  const [listRaw, detailsRaw] = await Promise.all([
    apiFetch<any[]>("/api/countries-list").catch(() => []),
    apiFetch<any[]>("/api/countries").catch(() => []),
  ]);

  const list = safeArray<any>(listRaw);
  const details = safeArray<any>(detailsRaw);

  const merged = list.map((item, index) => {
    const detail = details.find((d) => normalizeIso2(d.iso2) === normalizeIso2(item.iso2));
    return {
      country_id: toNumber(item.country_id ?? index + 1),
      iso2: String(item.iso2 ?? "").toUpperCase(),
      iso3: String(item.iso3 ?? item.iso2 ?? "").toUpperCase(),
      name: String(item.name ?? detail?.name ?? ""),
      is_eu27: Boolean(item.is_eu27 ?? detail?.is_eu27 ?? false),
      latitude: toNumber(detail?.latitude, 0),
      longitude: toNumber(detail?.longitude, 0),
      region: String(detail?.region ?? item.region ?? "Other"),
    } as Country;
  });

  if (region) {
    return merged.filter((c) => c.region.toLowerCase() === region.toLowerCase());
  }

  return merged;
}

export async function fetchCountriesList(region?: string): Promise<Country[]> {
  return fetchCountriesRaw(region);
}

export async function fetchCountryById(countryId: number): Promise<Country> {
  const countries = await fetchCountriesRaw();
  const match = countries.find((c) => c.country_id === countryId);
  if (!match) throw new Error(`Country not found by ID: ${countryId}`);
  return match;
}

export async function fetchCountryByIso2(iso2: string): Promise<Country> {
  const countries = await fetchCountriesRaw();
  const match = countries.find((c) => c.iso2.toUpperCase() === iso2.toUpperCase());
  if (!match) throw new Error(`Country not found by ISO2: ${iso2}`);
  return match;
}

export async function fetchSDGs(): Promise<SDGInfo[]> {
  return SDG_DEFINITIONS.map((d) => ({
    sdg_id: d.id,
    number: d.id,
    title: d.title,
    description: d.description,
  }));
}

export async function fetchSDGById(sdgId: number): Promise<SDGInfo> {
  const match = SDG_DEFINITIONS.find((d) => d.id === sdgId);
  if (!match) throw new Error(`SDG not found: ${sdgId}`);
  return {
    sdg_id: match.id,
    number: match.id,
    title: match.title,
    description: match.description,
  };
}

export async function fetchMetrics(sdgId?: number): Promise<Metric[]> {
  const data = await apiFetch<any[]>("/api/metrics").catch(() => []);
  return safeArray<any>(data)
    .filter((d) => sdgId === undefined || d.sdg_id === sdgId)
    .map((d, i) => {
      const sdgDef = SDG_DEFINITIONS.find((s) => s.id === d.sdg_id);
      const uiMetricKey =
        Object.keys(UI_TO_DB_METRIC_MAP).find((key) => UI_TO_DB_METRIC_MAP[key] === d.metric_name) ||
        d.metric_name;
      const uiMetric = sdgDef?.metrics.find((m) => m.key === uiMetricKey);

      return {
        metric_id: toNumber(d.metric_id ?? i + 1),
        sdg_id: toNumber(d.sdg_id),
        name: String(d.metric_name ?? d.name ?? ""),
        source_dataset: String(d.source_dataset ?? sdgDef?.datasets?.[0] ?? "Eurostat"),
        unit: String(uiMetric?.unit ?? d.unit ?? "%"),
        direction: uiMetric?.higherIsBetter ? "higher_better" : "lower_better",
        frequency: String(d.frequency ?? "annual"),
      } as Metric;
    });
}

export async function fetchMetricById(metricId: number): Promise<Metric> {
  const all = await fetchMetrics();
  const match = all.find((m) => m.metric_id === metricId);
  if (!match) throw new Error(`Metric not found by ID: ${metricId}`);
  return match;
}

function normalizeCsiRow(d: any, countries: Country[]): CSIScore {
  const iso2 = normalizeIso2(d.country_iso2 ?? d.countryCode ?? d.iso2);
  const match = countries.find((c) => c.iso2 === iso2);

  return {
    country_id: match?.country_id ?? 0,
    country_iso2: iso2,
    country_name: String(d.country_name ?? d.name ?? match?.name ?? iso2),
    year: toNumber(d.year),
    csi_score: toNumber(d.csi_score),
    sdg_count: toNumber(d.sdg_count),
    eu_rank: d.eu_rank == null ? null : toNumber(d.eu_rank),
    eu_percentile: d.eu_percentile == null ? null : toNumber(d.eu_percentile),
    cluster: d.cluster ?? null,
    data_type: String(d.data_type ?? "historical"),
  };
}

export async function fetchLatestCSIScores(): Promise<CSIScore[]> {
  const [data, countries] = await Promise.all([
    apiFetch<any[]>("/api/csi-scores/latest"),
    fetchCountriesRaw(),
  ]);
  return safeArray<any>(data).map((d) => normalizeCsiRow(d, countries));
}

export async function fetchCSIScoresByCountry(countryId: number, year?: number): Promise<CSIScore[]> {
  const country = await fetchCountryById(countryId);
  const [data, countries] = await Promise.all([
    apiFetch<any[]>(`/api/csi-scores/country/${country.iso2}`),
    fetchCountriesRaw(),
  ]);

  const mapped = safeArray<any>(data).map((d) => normalizeCsiRow(d, countries));
  return typeof year === "number" ? mapped.filter((d) => d.year === year) : mapped;
}

export async function fetchCSIScoresByYear(year: number): Promise<CSIScore[]> {
  const [data, countries] = await Promise.all([
    apiFetch<any[]>(`/api/csi-scores/year/${year}`),
    fetchCountriesRaw(),
  ]);

  const mapped = safeArray<any>(data).map((d) => normalizeCsiRow(d, countries));
  const historical = mapped.filter((d) => d.data_type === "historical");
  // FIX: fall back to all data (including forecast) if no historical rows found
  return historical.length > 0 ? historical : mapped;
}

function normalizeSdgRow(d: any, countries: Country[], fallbackCountryId?: number): SDGScore {
  const iso2 = normalizeIso2(
    // FIX: API returns country_iso2 (with underscore) — check that first
    d.country_iso2 ?? d.countryiso2 ?? d.countryCode ?? d.iso2
  );
  const match = countries.find((c) => c.iso2 === iso2);

  return {
    country_id: fallbackCountryId ?? match?.country_id ?? 0,
    country_iso2: iso2,
    // FIX: API returns country_name (with underscore) — check that first
    country_name: String(
      d.country_name ?? d.countryname ?? d.name ?? match?.name ?? iso2
    ),
    sdg_id: toNumber(d.sdg_id ?? d.sdgId),
    sdg_number: toNumber(d.sdg_number ?? d.sdg_id ?? d.sdgId),
    sdg_title: String(d.sdg_title ?? d.sdgTitle ?? d.title ?? `SDG ${d.sdg_id ?? d.sdgId}`),
    year: toNumber(d.year),
    // FIX: API returns normalised_score (with underscore) — already handled but be explicit
    normalised_score:
      d.normalised_score != null
        ? toNullableNumber(d.normalised_score)
        : toNullableNumber(d.score ?? d.normalisedscore),
    data_type: String(d.data_type ?? d.dataType ?? "historical"),
  };
}

export async function fetchSDGScoresByCountryYear(countryId: number, year: number): Promise<SDGScore[]> {
  const country = await fetchCountryById(countryId);
  const [data, countries] = await Promise.all([
    apiFetch<any[]>(`/api/sdg-scores/country/${country.iso2}/year/${year}`),
    fetchCountriesRaw(),
  ]);

  const mapped = safeArray<any>(data).map((d) => normalizeSdgRow(d, countries, countryId));
  const historical = mapped.filter((d) => d.data_type === "historical");
  // FIX: fall back to all data types (forecast/projected) if no historical exists for this year
  return historical.length > 0 ? historical : mapped;
}

// FIX: This is the key function for Country Rankings tab.
// The API returns { country_name, country_iso2, normalised_score } (all with underscores).
// Previous normalizeSdgRow didn't prioritise underscore variants, so all rows were empty
// strings and got filtered out. Fixed in normalizeSdgRow above.
export async function fetchSDGScoresBySDGYear(sdgId: number, year: number): Promise<SDGScore[]> {
  const [data, countries] = await Promise.all([
    apiFetch<any[]>(`/api/sdg-scores/sdg/${sdgId}/year/${year}`),
    fetchCountriesRaw(),
  ]);

  const mapped = safeArray<any>(data).map((d) => normalizeSdgRow(d, countries));
  const historical = mapped.filter((d) => d.data_type === "historical");
  // FIX: fall back to forecast data when no historical rows exist for selected year
  return historical.length > 0 ? historical : mapped;
}

export async function fetchMetricValues(_metricId: number, _countryId?: number): Promise<MetricValue[]> {
  return [];
}

export async function fetchMetricValuesForCountryYear(
  _countryId: number,
  _year: number
): Promise<MetricValue[]> {
  return [];
}

export async function fetchCSIRankings(year: number): Promise<CountryRankingResponse[]> {
  const [data, countries] = await Promise.all([
    apiFetch<any[]>(`/api/rankings/csi/${year}`).catch(() => []),
    fetchCountriesRaw(),
  ]);

  return safeArray<any>(data).map((d, index) => {
    const iso2 = normalizeIso2(d.iso2 ?? d.country_iso2);
    const match = countries.find((c) => c.iso2 === iso2);

    return {
      rank: toNumber(d.rank ?? index + 1),
      country_id: match?.country_id ?? 0,
      iso2,
      name: String(d.name ?? d.country_name ?? match?.name ?? iso2),
      region: String(d.region ?? match?.region ?? "Other"),
      is_eu27: Boolean(d.is_eu27 ?? match?.is_eu27 ?? false),
      csi_score: toNumber(d.csi_score),
      cluster: String(d.cluster ?? ""),
      year: toNumber(d.year ?? year),
    };
  });
}

export async function fetchSDGRankings(sdgId: number, year: number): Promise<SDGRankingRow[]> {
  const [scores, countries] = await Promise.all([
    fetchSDGScoresBySDGYear(sdgId, year),
    fetchCountriesRaw(),
  ]);

  return scores
    .filter((row) => typeof row.normalised_score === "number")
    .sort((a, b) => (b.normalised_score ?? 0) - (a.normalised_score ?? 0))
    .map((row, index) => {
      const country = countries.find((c) => c.iso2 === row.country_iso2);
      return {
        rank: index + 1,
        country_id: country?.country_id ?? row.country_id ?? 0,
        iso2: row.country_iso2,
        name: row.country_name,
        region: country?.region ?? "Other",
        score: row.normalised_score ?? 0,
        year: row.year,
      };
    });
}

export async function fetchAnomalies(metricId?: number, countryId?: number): Promise<AnomalyResponse[]> {
  const params = new URLSearchParams();
  if (typeof countryId === "number") {
    const country = await fetchCountryById(countryId);
    params.set("country_code", country.iso2);
  }
  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await apiFetch<any[]>(`/api/anomalies${query}`).catch(() => []);
  return safeArray<any>(response).map((a) => ({
    metric_id: metricId ?? 0,
    country_id: countryId ?? 0,
    year: parseInt(String(a.date ?? "").substring(0, 4), 10) || 0,
    raw_value: toNumber(a.value),
    flag_reason: a.confidence < 0.5 ? "Low confidence" : "Extreme deviation",
  }));
}

export async function fetchStats(): Promise<StatsResponse> {
  const data = await apiFetch<any>("/api/stats");
  return {
    total_countries: toNumber(data.total_countries),
    total_sdgs: 12,
    total_metrics: toNumber(data.total_metrics),
    total_metric_values: toNumber(data.total_rows ?? data.total_metric_values),
    total_anomalies: 0,
    years_covered: safeArray<number>(data.years_covered).map((y) => toNumber(y)),
    latest_year: toNumber(data.latest_year),
    earliest_year: toNumber(data.earliest_year),
  };
}

export async function fetchHealth(): Promise<ApiHealthResponse> {
  const health = await apiFetch<{
    status: string;
    database: string;
    countries_loaded: number;
    timestamp: string;
    models?: string[];
  }>("/health");

  return {
    status: health.status,
    database: health.database,
    countries_loaded: toNumber(health.countries_loaded),
    timestamp: health.timestamp,
    models: Array.isArray(health.models)
      ? health.models
      : ["countries", "sdg_scores", "csi_scores", "metric_values", "anomalies"],
  };
}

export async function resolveCountryId(countryNameOrCode: string): Promise<number | null> {
  const normalized = countryNameOrCode.trim().toLowerCase();
  if (!normalized) return null;

  const countries = await fetchCountriesRaw();
  const match = countries.find(
    (country) =>
      country.name.toLowerCase() === normalized ||
      country.iso2.toLowerCase() === normalized ||
      (country.iso3 && country.iso3.toLowerCase() === normalized)
  );

  return match?.country_id ?? null;
}

export function getScoreColor(score: number | null): string {
  if (score === null) return "text-slate-400";
  if (score >= 80) return "text-green-700";
  if (score >= 70) return "text-blue-700";
  if (score >= 60) return "text-yellow-700";
  if (score >= 50) return "text-orange-700";
  return "text-red-700";
}

export function getScoreBgColor(score: number | null): string {
  if (score === null) return "bg-slate-50";
  if (score >= 80) return "bg-green-50";
  if (score >= 70) return "bg-blue-50";
  if (score >= 60) return "bg-yellow-50";
  if (score >= 50) return "bg-orange-50";
  return "bg-red-50";
}

export async function fetchCountrySdgScores(
  countryNameOrCode: string,
  year?: number
): Promise<FetchCountrySdgScoresResponse> {
  const stats = await fetchStats();
  const effectiveYear = year ?? stats.latest_year;

  const normalizedInput = countryNameOrCode.trim();
  if (!normalizedInput) {
    throw new Error("Country code or name is required");
  }

  const countries = await fetchCountriesRaw();
  const normalizedLower = normalizedInput.toLowerCase();

  const matchedCountry =
    countries.find((c) => c.iso2.toLowerCase() === normalizedLower) ||
    countries.find((c) => c.iso3.toLowerCase() === normalizedLower) ||
    countries.find((c) => c.name.toLowerCase() === normalizedLower);

  if (!matchedCountry) {
    throw new Error(`Country not found: ${countryNameOrCode}`);
  }

  const countryId = matchedCountry.country_id;

  const [scores, previousScores, csiRows, rankings] = await Promise.all([
    fetchSDGScoresByCountryYear(countryId, effectiveYear),
    fetchSDGScoresByCountryYear(countryId, effectiveYear - 1).catch(() => []),
    fetchCSIScoresByCountry(countryId, effectiveYear).catch(() => []),
    fetchCSIRankings(effectiveYear).catch(() => []),
  ]);

  const previousMap = new Map<number, number | null>(
    previousScores.map((item): [number, number | null] => [item.sdg_id, item.normalised_score])
  );

  const sortedScores = [...scores].sort((a, b) => a.sdg_number - b.sdg_number);

  const sdgScores: CountrySdgScore[] = sortedScores.map((item, index) => ({
    id: item.sdg_id,
    sdgId: item.sdg_id,
    label: item.sdg_title,
    title: item.sdg_title,
    score: item.normalised_score,
    trend: calculateTrend(item.normalised_score, previousMap.get(item.sdg_id)),
    rank: index + 1,
    metrics: [],
    year: item.year,
    euComparison: undefined,
    waterStress: undefined,
    status: item.normalised_score == null ? "No data" : undefined,
    note: item.normalised_score == null ? `No ${effectiveYear} score returned by API` : undefined,
  }));

  const yearCsi = csiRows.find((row) => row.year === effectiveYear) ?? null;
  const ranking = rankings.find((row) => row.country_id === countryId);

  return {
    country: {
      id: matchedCountry.country_id,
      name: matchedCountry.name,
      iso2: matchedCountry.iso2,
      region: matchedCountry.region,
    },
    compositeCsi: yearCsi?.csi_score ?? null,
    percentile:
      ranking && rankings.length > 0
        ? Number((((rankings.length - ranking.rank + 1) / rankings.length) * 100).toFixed(2))
        : yearCsi?.eu_percentile ?? null,
    cluster: toClusterName(ranking?.cluster ?? yearCsi?.cluster ?? null),
    timestamp: new Date().toISOString(),
    dataSource: "FastAPI",
    sdgScores,
  };
}

export async function fetchSDGScores(
  countryNameOrCode: string,
  year?: number
): Promise<DashboardScoresResponse> {
  const detailed = await fetchCountrySdgScores(countryNameOrCode, year);

  const sdgScoresRecord = Object.fromEntries(
    detailed.sdgScores.map((item) => [item.sdgId, item.score])
  ) as Record<number, number | null>;

  const liveSDGIds = detailed.sdgScores
    .filter((item) => typeof item.score === "number")
    .map((item) => item.sdgId);

  const validScores = detailed.sdgScores
    .map((item) => item.score)
    .filter((score): score is number => typeof score === "number");

  const sdgAchievementRate =
    validScores.length > 0
      ? Number(
        ((validScores.filter((score) => score >= 70).length / validScores.length) * 100).toFixed(2)
      )
      : 0;

  return {
    country: detailed.country.name,
    csi: detailed.compositeCsi,
    percentile: detailed.percentile ?? null,
    sdgAchievementRate,
    cluster: detailed.cluster ?? null,
    sdgScores: sdgScoresRecord,
    liveSDGIds,
    timestamp: detailed.timestamp,
  };
}

export async function fetchIndicatorData(
  sdgId: number,
  country: string,
  limitMetrics?: number
): Promise<FetchIndicatorDataResponse> {
  const sdgDef = SDG_DEFINITIONS.find((s) => s.id === sdgId);
  if (!sdgDef) return { data: [] };

  const selectedMetrics =
    limitMetrics !== undefined ? sdgDef.metrics.slice(0, limitMetrics) : sdgDef.metrics;

  const series: IndicatorSeries[] = await Promise.all(
    selectedMetrics.map(async (metric, idx) => {
      const dbMetricName = getDbMetricName(sdgId, metric.key);
      try {
        const response = await apiFetch<any>(
          `/api/indicator/${dbMetricName}?country=${encodeURIComponent(country)}&start_year=2015&end_year=2035`
        );

        const rawData = safeArray<any>(response.data);
        const dataPoints = rawData
          .map((d: any) => ({
            year: parseInt(String(d.date ?? "").substring(0, 4), 10),
            value: toNumber(d.value),
            is_forecast: Boolean(d.is_forecast ?? d.isforecast ?? false),
            conf_low: d.conf_low ?? d.conflow ?? null,
            conf_high: d.conf_high ?? d.confhigh ?? null,
          }))
          .filter((d) => Number.isFinite(d.year));

        return {
          metricId: sdgId * 100 + idx + 1,
          metricKey: metric.key,
          metricName: metric.label,
          unit: metric.unit,
          direction: metric.higherIsBetter ? "higher_better" : "lower_better",
          data: dataPoints,
        };
      } catch (err) {
        console.error(`Failed to fetch indicator data for ${dbMetricName}:`, err);
        return {
          metricId: sdgId * 100 + idx + 1,
          metricKey: metric.key,
          metricName: metric.label,
          unit: metric.unit,
          direction: metric.higherIsBetter ? "higher_better" : "lower_better",
          data: [],
        };
      }
    })
  );

  return { data: series };
}

export async function fetchMetricBenchmarkByCountryYear(
  sdgId: number,
  metricKey: string,
  year: number
): Promise<MetricBenchmarkCountryValue[]> {
  const countries = await fetchCountriesRaw();
  const dbMetricName = getDbMetricName(sdgId, metricKey);

  const rows = await Promise.all(
    countries.map(async (country) => {
      try {
        const response = await apiFetch<any>(
          `/api/indicator/${dbMetricName}?country=${encodeURIComponent(country.name)}&start_year=${year}&end_year=${year}`
        );

        const rawData = safeArray<any>(response.data);

        // FIX: also accept forecast data if no historical point exists for this year
        const exact =
          rawData.find((d) => {
            const pointYear = parseInt(String(d.date ?? "").substring(0, 4), 10);
            const isForecast = Boolean(d.is_forecast ?? d.isforecast ?? false);
            return pointYear === year && !isForecast;
          }) ??
          rawData.find((d) => {
            const pointYear = parseInt(String(d.date ?? "").substring(0, 4), 10);
            return pointYear === year;
          });

        if (!exact) return null;

        const value = toNullableNumber(exact.value);
        if (value === null) return null;

        return {
          country: country.name,
          iso2: country.iso2,
          value,
        } as MetricBenchmarkCountryValue;
      } catch {
        return null;
      }
    })
  );

  return rows.filter((row): row is MetricBenchmarkCountryValue => row !== null);
}

export function useSDGScores(
  countryNameOrCode: string | null,
  year?: number
): UseQueryResult<FetchCountrySdgScoresResponse, Error> {
  return useQuery<FetchCountrySdgScoresResponse, Error>({
    queryKey: ["country-sdg-scores", countryNameOrCode, year],
    queryFn: () => fetchCountrySdgScores(countryNameOrCode as string, year),
    enabled: Boolean(countryNameOrCode),
  });
}