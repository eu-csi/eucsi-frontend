import { useQuery, UseQueryResult } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";

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
  normalised_score: number;
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
  score: number;
  trend: number;
  rank: number;
  metrics: CountrySdgMetric[];
  year: number;
}

export interface DashboardScoresResponse {
  country: string;
  csi: number;
  percentile: number;
  sdgAchievementRate: number;
  cluster: ClusterName;
  sdgScores: Record<number, number>;
  liveSDGIds: Set<number>;
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
  timestamp: string;
  sdgScores: CountrySdgScore[];
}

export interface IndicatorPoint {
  year: number;
  value: number;
}

export interface IndicatorSeries {
  metricId: number;
  metricName: string;
  unit: string;
  direction: "higher_better" | "lower_better";
  data: IndicatorPoint[];
}

export interface FetchIndicatorDataResponse {
  data: IndicatorSeries[];
}

async function fetchCountriesRaw(region?: string): Promise<Country[]> {
  const query = region ? `?region=${encodeURIComponent(region)}` : "";
  return apiFetch<Country[]>(`/api/countries${query}`);
}

export async function fetchCountriesList(region?: string): Promise<Country[]> {
  return fetchCountriesRaw(region);
}

export async function fetchCountryById(countryId: number): Promise<Country> {
  return apiFetch<Country>(`/api/countries/${countryId}`);
}

export async function fetchCountryByIso2(iso2: string): Promise<Country> {
  return apiFetch<Country>(`/api/countries/iso2/${iso2.toUpperCase()}`);
}

export async function fetchSDGs(): Promise<SDGInfo[]> {
  return apiFetch<SDGInfo[]>("/api/sdgs");
}

export async function fetchSDGById(sdgId: number): Promise<SDGInfo> {
  return apiFetch<SDGInfo>(`/api/sdgs/${sdgId}`);
}

export async function fetchMetrics(sdgId?: number): Promise<Metric[]> {
  const query = typeof sdgId === "number" ? `?sdg_id=${sdgId}` : "";
  return apiFetch<Metric[]>(`/api/metrics${query}`);
}

export async function fetchMetricById(metricId: number): Promise<Metric> {
  return apiFetch<Metric>(`/api/metrics/${metricId}`);
}

export async function fetchLatestCSIScores(): Promise<CSIScore[]> {
  return apiFetch<CSIScore[]>("/api/csi-scores/latest");
}

export async function fetchCSIScoresByCountry(
  countryId: number,
  year?: number
): Promise<CSIScore[]> {
  const query = typeof year === "number" ? `?year=${year}` : "";
  return apiFetch<CSIScore[]>(`/api/csi-scores/country/${countryId}${query}`);
}

export async function fetchCSIScoresByYear(year: number): Promise<CSIScore[]> {
  return apiFetch<CSIScore[]>(`/api/csi-scores/year/${year}`);
}

export async function fetchSDGScoresByCountryYear(
  countryId: number,
  year: number
): Promise<SDGScore[]> {
  return apiFetch<SDGScore[]>(`/api/sdg-scores/country/${countryId}/year/${year}`);
}

export async function fetchSDGScoresBySDGYear(
  sdgId: number,
  year: number
): Promise<SDGScore[]> {
  return apiFetch<SDGScore[]>(`/api/sdg-scores/sdg/${sdgId}/year/${year}`);
}

export async function fetchMetricValues(
  metricId: number,
  countryId?: number
): Promise<MetricValue[]> {
  const query = typeof countryId === "number" ? `?country_id=${countryId}` : "";
  return apiFetch<MetricValue[]>(`/api/metric-values/metric/${metricId}${query}`);
}

export async function fetchMetricValuesForCountryYear(
  countryId: number,
  year: number
): Promise<MetricValue[]> {
  return apiFetch<MetricValue[]>(`/api/metric-values/country/${countryId}/year/${year}`);
}

export async function fetchCSIRankings(year: number): Promise<CountryRankingResponse[]> {
  return apiFetch<CountryRankingResponse[]>(`/api/rankings/csi/${year}`);
}

export async function fetchSDGRankings(
  sdgId: number,
  year: number
): Promise<SDGRankingRow[]> {
  return apiFetch<SDGRankingRow[]>(`/api/rankings/sdg/${sdgId}/${year}`);
}

export async function fetchAnomalies(
  metricId?: number,
  countryId?: number
): Promise<AnomalyResponse[]> {
  const params = new URLSearchParams();
  if (typeof metricId === "number") params.set("metric_id", String(metricId));
  if (typeof countryId === "number") params.set("country_id", String(countryId));
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiFetch<AnomalyResponse[]>(`/api/anomalies${query}`);
}

export async function fetchStats(): Promise<StatsResponse> {
  return apiFetch<StatsResponse>("/api/stats");
}

export async function fetchHealth(): Promise<ApiHealthResponse> {
  const health = await apiFetch<{
    status: string;
    database: string;
    countries_loaded: number;
    timestamp: string;
  }>("/health");

  return {
    ...health,
    models: ["countries", "sdg_scores", "csi_scores", "metric_values", "anomalies"],
  };
}

export async function resolveCountryId(
  countryNameOrCode: string
): Promise<number | null> {
  const normalized = countryNameOrCode.trim().toLowerCase();
  if (!normalized) return null;

  const countries = await fetchCountriesRaw();
  const match = countries.find(
    (country) =>
      country.name.toLowerCase() === normalized ||
      country.iso2.toLowerCase() === normalized ||
      country.iso3.toLowerCase() === normalized
  );

  return match?.country_id ?? null;
}

function calculateTrend(current: number, previous?: number): number {
  if (typeof previous !== "number") return 0;
  return Number((current - previous).toFixed(2));
}

function toClusterName(value?: string | null): ClusterName {
  if (
    value === "Nordic Leaders" ||
    value === "Western Innovators" ||
    value === "Mediterranean Transitioning" ||
    value === "Central European Rising" ||
    value === "Eastern Emerging"
  ) {
    return value;
  }
  return "Western Innovators";
}

export async function fetchCountrySdgScores(
  countryNameOrCode: string,
  year?: number
): Promise<FetchCountrySdgScoresResponse> {
  const stats = await fetchStats();
  const effectiveYear = year ?? stats.latest_year;

  const countryId = await resolveCountryId(countryNameOrCode);
  if (!countryId) {
    throw new Error(`Country not found: ${countryNameOrCode}`);
  }

  const country = await fetchCountryById(countryId);

  const [scores, previousScores, csiRows] = await Promise.all([
    fetchSDGScoresByCountryYear(countryId, effectiveYear),
    fetchSDGScoresByCountryYear(countryId, effectiveYear - 1).catch(() => []),
    fetchCSIScoresByCountry(countryId, effectiveYear).catch(() => []),
  ]);

  const previousEntries: Array<[number, number]> = previousScores.map(
    (item): [number, number] => [item.sdg_id, item.normalised_score]
  );
  const previousMap = new Map<number, number>(previousEntries);

  const allMetrics = await fetchMetrics();

  const sdgScores: CountrySdgScore[] = scores
    .sort((a, b) => a.sdg_number - b.sdg_number)
    .map((item, index) => {
      const relatedMetrics = allMetrics
        .filter((metric) => metric.sdg_id === item.sdg_id)
        .slice(0, 3)
        .map((metric, metricIndex) => ({
          id: metric.metric_id,
          name: metric.name,
          value: item.normalised_score,
          trend: calculateTrend(item.normalised_score, previousMap.get(item.sdg_id)),
          benchmark: 100,
          category:
            metric.direction === "higher_better" ? "higher_better" : "lower_better",
          unit: metric.unit || "",
        }));

      if (relatedMetrics.length === 0) {
        relatedMetrics.push({
          id: item.sdg_id * 100 + 1,
          name: item.sdg_title,
          value: item.normalised_score,
          trend: calculateTrend(item.normalised_score, previousMap.get(item.sdg_id)),
          benchmark: 100,
          category: "score",
          unit: "",
        });
      }

      return {
        id: item.sdg_id,
        sdgId: item.sdg_id,
        label: item.sdg_title,
        score: item.normalised_score,
        trend: calculateTrend(item.normalised_score, previousMap.get(item.sdg_id)),
        rank: index + 1,
        metrics: relatedMetrics,
        year: item.year,
      };
    });

  return {
    country: {
      id: country.country_id,
      name: country.name,
      iso2: country.iso2,
      region: country.region,
    },
    compositeCsi: csiRows[0]?.csi_score ?? null,
    timestamp: new Date().toISOString(),
    sdgScores,
  };
}

export async function fetchSDGScores(
  countryNameOrCode: string,
  year?: number
): Promise<DashboardScoresResponse> {
  const detailed = await fetchCountrySdgScores(countryNameOrCode, year);
  const stats = await fetchStats();
  const effectiveYear = year ?? stats.latest_year;
  const rankings = await fetchCSIRankings(effectiveYear).catch(() => []);
  const countryId = detailed.country.id;

  const ranking = rankings.find((row) => row.country_id === countryId);
  const percentile =
    rankings.length > 0 && ranking
      ? Number((((rankings.length - ranking.rank + 1) / rankings.length) * 100).toFixed(2))
      : 0;

  const sdgScoresRecord = Object.fromEntries(
    detailed.sdgScores.map((item) => [item.sdgId, item.score])
  ) as Record<number, number>;

  const liveSDGIds = new Set<number>(detailed.sdgScores.map((item) => item.sdgId));
  const sdgAchievementRate =
    detailed.sdgScores.length > 0
      ? Number(
        (
          detailed.sdgScores.filter((item) => item.score >= 70).length /
          detailed.sdgScores.length *
          100
        ).toFixed(2)
      )
      : 0;

  return {
    country: detailed.country.name,
    csi: detailed.compositeCsi ?? 0,
    percentile,
    sdgAchievementRate,
    cluster: toClusterName(ranking?.cluster),
    sdgScores: sdgScoresRecord,
    liveSDGIds,
    timestamp: detailed.timestamp,
  };
}

export async function fetchIndicatorData(
  sdgId: number,
  countryId?: number,
  limitMetrics = 3
): Promise<FetchIndicatorDataResponse> {
  const metrics = await fetchMetrics(sdgId);
  const selectedMetrics = metrics.slice(0, limitMetrics);

  const series: IndicatorSeries[] = await Promise.all(
    selectedMetrics.map(async (metric) => {
      const values = await fetchMetricValues(metric.metric_id, countryId);
      const filtered = values
        .filter((row) => typeof row.raw_value === "number")
        .sort((a, b) => a.year - b.year);

      return {
        metricId: metric.metric_id,
        metricName: metric.name,
        unit: metric.unit,
        direction: metric.direction,
        data: filtered.map((row) => ({
          year: row.year,
          value: row.raw_value,
        })),
      };
    })
  );

  return { data: series };
}

export function useSDGScores(
  countryNameOrCode: string,
  year?: number
): UseQueryResult<FetchCountrySdgScoresResponse, Error> {
  return useQuery<FetchCountrySdgScoresResponse, Error>({
    queryKey: ["country-sdg-scores", countryNameOrCode, year],
    queryFn: () => fetchCountrySdgScores(countryNameOrCode, year),
    enabled: Boolean(countryNameOrCode),
  });
}