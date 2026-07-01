import { useState, useMemo, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Database,
  TrendingUp,
  TrendingDown,
  Info,
  BarChart2,
  Table2,
  BookOpen,
  Minus,
  AlertTriangle,
  Zap,
  Target,
  RefreshCw,
} from "lucide-react";
import { useQuery, useQueries } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Cell,
  LabelList,
} from "recharts";

import {
  fetchIndicatorData,
  fetchCountriesList,
  fetchSDGScoresBySDGYear,
  fetchCountrySdgScores,
  fetchMetricBenchmarkByCountryYear,
  getDbMetricName,
  getScoreColor,
  type Country,
  type IndicatorSeries,
  type SDGScore,
  type FetchCountrySdgScoresResponse,
  type MetricBenchmarkCountryValue,
} from "../services/sdgScoresApi";

import { SDGDEFINITIONS } from "../data/sdgData";

const API_BASE =import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://187.127.164.121:8002";

const LIVE_SDG_IDS: number[] = [3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 17];

const TABS = [
  "Overview",
  "Forecast",
  "Benchmarks",
  "Anomalies",
  "Country Rankings",
  "Metric Guide",
] as const;

type Tab = (typeof TABS)[number];

const TAB_ICONS = {
  Overview: BarChart2,
  Forecast: Zap,
  Benchmarks: Target,
  Anomalies: AlertTriangle,
  "Country Rankings": Table2,
  "Metric Guide": BookOpen,
};

type MetricValueView = {
  value: string | number;
  trend?: number;
  benchmark?: number | null;
  category?: string;
};

type BenchmarkRow = {
  metricKey: string;
  metricLabel: string;
  unit: string;
  countryValue: number;
  eu27Avg: number;
  topCountry: string;
  topValue: number;
  bottomCountry: string;
  bottomValue: number;
  performanceGap: number;
  targetGap: number | null;
  euTarget?: number | null;
  whoThreshold?: number | null;
};

type AnomalyView = {
  year: number;
  metric: string;
  value: number;
  confidence: number;
  plow: number | null;
  phigh: number | null;
  label: string;
  description: string;
  severity: "critical" | "warning";
  deviation: number;
  expected: string;
};

type ForecastPoint = {
  year: number;
  actual?: number;
  projected?: number;
  upper?: number;
  lower?: number;
  isProjected?: boolean;
};

type TrendPoint = {
  year: number;
  value: number;
  eu27: number | null;
};

type RankingPoint = {
  rank: number;
  countryname: string;
  countryiso2: string;
  score: number;
};

function scoreHex(s: number) {
  if (s >= 78) return "#15803d";
  if (s >= 65) return "#2563eb";
  if (s >= 55) return "#d97706";
  return "#dc2626";
}

function formatDisplayValue(rawValue: unknown, unit: string): string {
  if (rawValue === undefined || rawValue === null || rawValue === "") return "—";
  if (typeof rawValue === "string") return rawValue;

  const num = Number(rawValue);
  if (Number.isNaN(num)) return String(rawValue);

  if (unit.includes("€") && num > 9999) return Math.round(num).toLocaleString("en-US");
  if (Number.isInteger(num) || Math.abs(num) >= 100) return Math.round(num).toString();
  if (Math.abs(num) >= 10) return num.toFixed(1);
  return num.toFixed(2);
}

function average(nums: number[]) {
  if (!nums.length) return null;
  return Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2));
}

function yearValue(
  series?: IndicatorSeries,
  year?: number,
  forecast?: boolean
): number | null {
  if (!series?.data?.length || typeof year !== "number") return null;

  const findValForYear = (yr: number): number | null => {
    if (yr < 2015) return null;

    // Filter points for year yr
    const yrPoints = series.data.filter((d: any) => d.year === yr);
    if (yrPoints.length > 0) {
      const validVals = yrPoints.map((d: any) => d.value).filter((v) => v !== null && v !== 0);
      if (validVals.length > 0) {
        return validVals.reduce((a, b) => a + b, 0) / validVals.length;
      }
    }

    // Try previous year recursively
    return findValForYear(yr - 1);
  };

  const val = findValForYear(year);
  if (val !== null) return val;

  // Last resort fallback
  const fallbackMatch = series.data.find((d: any) => d.year === year);
  return fallbackMatch ? fallbackMatch.value : null;
}

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-sm min-w-[160px]">
      <p className="font-bold text-slate-800 mb-2">{label}</p>
      {payload
        .filter((p: any) => p.value != null)
        .map((p: any) => (
          <div key={p.dataKey || p.name} className="flex justify-between gap-4 text-xs mb-0.5">
            <span style={{ color: p.color || p.stroke }} className="font-medium">
              {p.name}
            </span>
            <span className="font-bold text-slate-700">
              {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
            </span>
          </div>
        ))}
    </div>
  );
}

function MetricBlock({ metric, vals, color }: any) {
  const [open, setOpen] = useState(false);
  if (!vals) return null;

  const isMissing = vals.value === "" || vals.value == null;

  if (isMissing) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 opacity-70 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-300 rounded-l-xl" />
        <div className="flex items-start justify-between gap-2 mb-2 pl-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide leading-tight">
            {metric.label}
          </p>
          <Info className="w-3.5 h-3.5 text-slate-300 shrink-0" />
        </div>
        <div className="pl-2">
          <span className="text-2xl font-black text-slate-300 font-display">—</span>
          <p className="text-[10px] font-semibold text-slate-400 mt-1.5 border-t border-slate-200/60 pt-1.5">
            No database record for this year
          </p>
        </div>
      </div>
    );
  }

  const isCategory = metric.type === "category" && vals.category;
  const numVal = parseFloat(String(vals.value));
  const target = metric.euTarget ?? metric.whoThreshold;
  let status: "good" | "warn" | "bad" | null = null;

  if (target !== undefined && !Number.isNaN(numVal) && !isCategory) {
    const d = metric.higherIsBetter ? numVal - target : target - numVal;
    status = d >= 0 ? "good" : d >= -Math.abs(target * 0.2) ? "warn" : "bad";
  }

  const catColors: Record<string, string> = {
    "No Stress": "#15803d",
    Low: "#2563eb",
    Stress: "#d97706",
    Severe: "#dc2626",
    High: "#15803d",
    Med: "#2563eb",
  };

  return (
    <div
      onClick={() => setOpen(!open)}
      className="bg-white border border-slate-200 rounded-xl p-4 cursor-pointer hover:shadow-md transition-all relative overflow-hidden group"
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ background: color }}
      />

      <div className="flex items-start justify-between gap-2 mb-2 pl-2">
        <div className="flex items-center gap-1.5">
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              metric.isLive
                ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                : "bg-red-500"
            }`}
          />
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide leading-tight">
            {metric.label}
          </p>
        </div>
        <Info className="w-3.5 h-3.5 text-slate-300 shrink-0" />
      </div>

      {isCategory ? (
        <div className="pl-2">
          <span
            className="inline-block px-3 py-1 rounded-full text-sm font-bold"
            style={{
              background: `${catColors[vals.category ?? ""] ?? "#64748b"}20`,
              color: catColors[vals.category ?? ""] ?? "#64748b",
            }}
          >
            {vals.category ?? "—"}
          </span>
        </div>
      ) : (
        <div className="pl-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-display" style={{ color }}>
              {formatDisplayValue(vals.value, metric.unit)}
            </span>
            <span className="text-xs text-slate-400">{metric.unit}</span>
          </div>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {vals.trend !== undefined ? (
              vals.trend > 0 ? (
                <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-green-600">
                  <TrendingUp className="w-3 h-3" />
                  {vals.trend.toFixed(1)} YoY
                </span>
              ) : vals.trend < 0 ? (
                <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-red-500">
                  <TrendingDown className="w-3 h-3" />
                  {Math.abs(vals.trend).toFixed(1)} YoY
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 text-[11px] text-slate-400">
                  <Minus className="w-3 h-3" />
                  Stable
                </span>
              )
            ) : null}

            {status && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  status === "good"
                    ? "bg-green-100 text-green-700"
                    : status === "warn"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {status === "good" ? "On Target" : status === "warn" ? "Near" : "Off Track"}
              </span>
            )}
          </div>
        </div>
      )}

      {open && (
        <div className="mt-3 pt-3 border-t border-slate-100 pl-2 space-y-1.5 animate-fade-up">
          <p className="text-[11px] text-slate-500 leading-relaxed">{metric.description}</p>

          {vals.benchmark != null && (
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">EU27 avg</span>
              <span className="font-semibold text-slate-700">
                {formatDisplayValue(vals.benchmark, metric.unit)} {metric.unit}
              </span>
            </div>
          )}

          {target != null && (
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">
                {metric.euTarget != null ? "EU Target" : "WHO Threshold"}
              </span>
              <span className="font-semibold text-slate-700">
                {target} {metric.unit}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SDGDetail() {
  const { sdgSlug } = useParams<{ sdgSlug: string }>();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>("Overview");
  const [country, setCountry] = useState("Sweden");
  const [selectedYear, setSelectedYear] = useState<number>(2023);

  const sdg = SDGDEFINITIONS.find((s) => s.slug === sdgSlug);

  if (!sdg) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        <div className="text-center">
          <p className="font-bold text-xl mb-2">SDG not found</p>
          <Link to="/" className="text-blue-600">
            Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { data: countriesList = [] } = useQuery<Country[]>({
    queryKey: ["countries-list"],
    queryFn: () => fetchCountriesList(),
    staleTime: 1000 * 60 * 60,
  });

  useEffect(() => {
    if (!countriesList.length) return;
    const exists = countriesList.some((c) => c.name === country);
    if (!exists) setCountry(countriesList[0].name);
  }, [countriesList, country]);

  const countryIso2 = useMemo(() => {
    const match = countriesList.find((c) => c.name === country);
    return match?.iso2 ?? null;
  }, [countriesList, country]);

  const allSdgs = SDGDEFINITIONS;
  const idx = allSdgs.findIndex((s) => s.slug === sdgSlug);
  const prevSdg = allSdgs[idx - 1];
  const nextSdg = allSdgs[idx + 1];

  const { data: countryYearScores, isLoading: scoreLoading } =
    useQuery<FetchCountrySdgScoresResponse>({
      queryKey: ["country-sdg-scores-direct", countryIso2, selectedYear],
      queryFn: () => fetchCountrySdgScores(countryIso2 as string, selectedYear),
      enabled: !!countryIso2,
      staleTime: 1000 * 60 * 15,
    });

  // FIX: sdgScores is CountrySdgScore[] — each item has .sdgId and .score
  // Previously was trying sdg_id / normalised_score which don't exist on this type
  const liveSdgScore = useMemo(() => {
    if (!countryYearScores?.sdgScores?.length) return null;
    const match = countryYearScores.sdgScores.find(
      (s) => s.sdgId === sdg.id || s.id === sdg.id
    );
    return match?.score ?? null;
  }, [countryYearScores, sdg.id]);

  const displayScore = liveSdgScore;

  const { data: liveMetricSeries, isLoading: metricsLoading } = useQuery<{
    data: IndicatorSeries[];
  }>({
    queryKey: ["indicator-all-metrics", sdg.id, country],
    queryFn: () => fetchIndicatorData(sdg.id, country),
    enabled: !!country && !!sdg.id,
    staleTime: 1000 * 60 * 15,
  });

  const { data: liveForecast, isLoading: forecastLoading } = useQuery<{
    data: IndicatorSeries[];
  }>({
    queryKey: ["indicator-forecast", sdg.id, country],
    queryFn: () => fetchIndicatorData(sdg.id, country, 1),
    enabled: !!country && !!sdg.id && tab === "Forecast",
    staleTime: 1000 * 60 * 15,
  });

  // FIX: fetchSDGScoresBySDGYear returns SDGScore[] directly (not wrapped)
  // normalizeSdgRow in sdgScoresApi now correctly reads country_name / country_iso2 / normalised_score
  const { data: liveRankings = [] } = useQuery<SDGScore[]>({
    queryKey: ["sdg-rankings", sdg.id, selectedYear],
    queryFn: () => fetchSDGScoresBySDGYear(sdg.id, selectedYear),
    enabled: !!sdg.id,
    staleTime: 1000 * 60 * 15,
  });

  const benchmarkQueries = useQueries({
    queries: sdg.metrics.map((metric) => ({
      queryKey: ["metric-benchmark", sdg.id, metric.key, selectedYear],
      queryFn: (): Promise<MetricBenchmarkCountryValue[]> =>
        fetchMetricBenchmarkByCountryYear(sdg.id, metric.key, selectedYear),
      enabled: tab === "Benchmarks" || tab === "Overview",
      staleTime: 1000 * 60 * 15,
    })),
  });

  const { data: liveAnomalies = [] } = useQuery<AnomalyView[]>({
    queryKey: ["anomalies", countryIso2, sdg.id],
    queryFn: async (): Promise<AnomalyView[]> => {
      if (!countryIso2) return [];

      const res = await fetch(`${API_BASE}/api/anomalies?country_code=${countryIso2}`);
      if (!res.ok) return [];

      const data: any[] = await res.json();
      const sdgMetricNames = sdg.metrics.map((m) => getDbMetricName(sdg.id, m.key));

      return data
        .filter((a) => sdgMetricNames.includes(a.metric_name))
        .map((a): AnomalyView => {
          const severity: "critical" | "warning" =
            (a.confidence ?? 0.5) > 0.4 ? "critical" : "warning";

          return {
            year: parseInt(String(a.date ?? "").substring(0, 4), 10),
            metric: String(a.metric_name),
            value: Number(a.value ?? 0),
            confidence: Number(a.confidence ?? 0),
            plow: a.plow ?? null,
            phigh: a.phigh ?? null,
            label: `${a.metric_name} anomaly`,
            description: `Detected anomaly in ${a.metric_name} on ${a.date}. Value ${
              a.value?.toFixed?.(2) ?? a.value
            }.`,
            severity,
            deviation:
              a.value != null && a.plow != null ? Number((a.value - a.plow).toFixed(2)) : 0,
            expected: a.plow != null ? Number(a.plow).toFixed(2) : "NA",
          };
        })
        .sort((a, b) => b.year - a.year)
        .slice(0, 20);
    },
    enabled: !!countryIso2,
    staleTime: 1000 * 60 * 15,
  });

  const metricSeriesMap = useMemo(() => {
    const map: Record<string, IndicatorSeries> = {};
    (liveMetricSeries?.data ?? []).forEach((series) => {
      if ((series as any).metricKey) map[(series as any).metricKey] = series;
    });
    return map;
  }, [liveMetricSeries]);

  const metricVals = useMemo<Record<string, MetricValueView>>(() => {
    const result: Record<string, MetricValueView> = {};

    sdg.metrics.forEach((m, idx) => {
      const series = metricSeriesMap[m.key];
      const currentValue = yearValue(series, selectedYear, false);
      const prevValue = yearValue(series, selectedYear - 1, false);
      const benchmarkRows = (benchmarkQueries[idx]?.data ?? []) as MetricBenchmarkCountryValue[];
      const benchmark = average(benchmarkRows.map((r) => r.value));

      if (currentValue !== null && currentValue !== undefined) {
        result[m.key] = {
          value: currentValue,
          trend:
            prevValue != null ? Number((currentValue - prevValue).toFixed(2)) : undefined,
          benchmark: benchmark ?? null,
        };
      } else {
        result[m.key] = {
          value: "",
          trend: undefined,
          benchmark: benchmark ?? null,
        };
      }
    });

    return result;
  }, [sdg.metrics, metricSeriesMap, selectedYear, benchmarkQueries]);

  const filteredMetrics = useMemo(() => {
    return sdg.metrics.filter((m) => {
      const vals = metricVals[m.key];
      return (
        vals &&
        vals.value !== "" &&
        vals.value !== null &&
        vals.value !== undefined &&
        vals.value !== 0 &&
        vals.value !== "0"
      );
    });
  }, [sdg.metrics, metricVals]);

  const metricAvailability = filteredMetrics.length > 0;

  const trendSeries = useMemo<TrendPoint[]>(() => {
    const firstSeries = liveMetricSeries?.data?.find((s) =>
      s.data?.some((d: any) => !d.is_forecast)
    );

    if (!firstSeries?.data?.length) return [];

    return firstSeries.data
      .filter((d: any) => !d.is_forecast)
      .sort((a, b) => a.year - b.year)
      .map((d) => ({
        year: d.year,
        value: d.value,
        eu27: null,
      }));
  }, [liveMetricSeries]);

  const forecastSeries = useMemo<ForecastPoint[]>(() => {
    const firstSeries = liveForecast?.data?.[0];
    if (!firstSeries?.data?.length) return [];

    const grouped: Record<number, ForecastPoint> = {};

    firstSeries.data.forEach((d: any) => {
      if (!grouped[d.year]) grouped[d.year] = { year: d.year };

      if (d.is_forecast) {
        grouped[d.year].projected = d.value;
        grouped[d.year].upper = d.conf_high ?? d.value * 1.05;
        grouped[d.year].lower = d.conf_low ?? d.value * 0.95;
        grouped[d.year].isProjected = true;
      } else {
        grouped[d.year].actual = d.value;
      }
    });

    return Object.values(grouped).sort((a, b) => a.year - b.year);
  }, [liveForecast]);

  // FIX: liveRankings is now SDGScore[] from fetchSDGScoresBySDGYear.
  // normalizeSdgRow correctly maps country_name → country_name, country_iso2 → country_iso2,
  // normalised_score → normalised_score. So we read those fields directly here.
  const allLiveRankings = useMemo<RankingPoint[]>(() => {
    const rows = Array.isArray(liveRankings) ? liveRankings : [];

    if (!rows.length) return [];

    return rows
      .map((r: SDGScore) => ({
        rank: 0,
        countryname: r.country_name,
        countryiso2: r.country_iso2,
        score: r.normalised_score,
      }))
      .filter(
        (r): r is { rank: number; countryname: string; countryiso2: string; score: number } =>
          !!r.countryname &&
          r.score !== null &&
          r.score !== undefined &&
          Number.isFinite(r.score)
      )
      .sort((a, b) => b.score - a.score)
      .map((r, i) => ({
        rank: i + 1,
        countryname: r.countryname,
        countryiso2: r.countryiso2,
        score: Number(r.score.toFixed(1)),
      }));
  }, [liveRankings]);

  const displayTopCountries = useMemo(() => allLiveRankings.slice(0, 6), [allLiveRankings]);

  const benchmarkRows = useMemo<BenchmarkRow[]>(() => {
    return sdg.metrics
      .map((m, idx) => {
        const metricValue = metricVals[m.key];
        const rows = (benchmarkQueries[idx]?.data ?? []) as MetricBenchmarkCountryValue[];

        if (!metricValue || metricValue.value === "" || typeof metricValue.value !== "number")
          return null;
        if (!rows.length) return null;

        const selectedCountryRow =
          rows.find((r: any) => r.country === country || r.iso2 === countryIso2) ?? null;
        if (!selectedCountryRow) return null;

        const sorted = [...rows].sort((a, b) =>
          m.higherIsBetter ? b.value - a.value : a.value - b.value
        );

        const eu27Avg = average(rows.map((r) => r.value)) ?? 0;
        const top = sorted[0];
        const bottom = sorted[sorted.length - 1];
        const target = m.euTarget ?? m.whoThreshold ?? null;

        const performanceGap = Number(
          (
            m.higherIsBetter
              ? selectedCountryRow.value - eu27Avg
              : eu27Avg - selectedCountryRow.value
          ).toFixed(2)
        );

        const targetGap =
          target != null
            ? Number(
                (
                  m.higherIsBetter
                    ? selectedCountryRow.value - target
                    : target - selectedCountryRow.value
                ).toFixed(2)
              )
            : null;

        return {
          metricKey: m.key,
          metricLabel: m.label,
          unit: m.unit,
          countryValue: Number(selectedCountryRow.value.toFixed(2)),
          eu27Avg,
          topCountry: top?.country ?? "",
          topValue: Number((top?.value ?? 0).toFixed(2)),
          bottomCountry: bottom?.country ?? "",
          bottomValue: Number((bottom?.value ?? 0).toFixed(2)),
          performanceGap,
          targetGap,
          euTarget: m.euTarget ?? null,
          whoThreshold: m.whoThreshold ?? null,
        } as BenchmarkRow;
      })
      .filter(Boolean) as BenchmarkRow[];
  }, [sdg.metrics, metricVals, benchmarkQueries, country, countryIso2]);

  const hasLiveTrend = trendSeries.length > 0;
  const hasLiveTopCountries = displayTopCountries.length > 0;
  const anomalies = liveAnomalies ?? [];

  useEffect(() => {
    if (!TABS.includes(tab)) setTab("Overview");
  }, [tab]);

  return (
    <div className="px-6 py-6 max-w-screen-xl mx-auto space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Link
            to="/"
            className="text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-semibold text-slate-700">{sdg.shortTitle}</span>
        </div>

        <div className="flex gap-2">
          {prevSdg && (
            <button
              onClick={() => navigate(`/sdg/${prevSdg.slug}`)}
              className="flex items-center gap-1 text-xs border border-slate-200 rounded-lg px-3 py-1.5 text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              {prevSdg.shortTitle}
            </button>
          )}
          {nextSdg && (
            <button
              onClick={() => navigate(`/sdg/${nextSdg.slug}`)}
              className="flex items-center gap-1 text-xs border border-slate-200 rounded-lg px-3 py-1.5 text-slate-500 hover:bg-slate-50 transition-colors"
            >
              {nextSdg.shortTitle}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div
        className="rounded-2xl p-6 border"
        style={{
          background: `linear-gradient(135deg, ${sdg.bgColor} 0%, white 100%)`,
          borderColor: `${sdg.color}25`,
        }}
      >
        <div className="flex flex-wrap gap-5 items-start">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black font-display shadow-md text-white"
            style={{ background: sdg.color }}
          >
            {sdg.id}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold font-display text-slate-800">{sdg.title}</h1>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  sdg.type === "direct"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {sdg.type === "direct" ? "Direct" : "Indirect"}
              </span>

              {anomalies.length > 0 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {anomalies.length} anomalies detected
                </span>
              )}
            </div>

            <p className="text-sm text-slate-500 leading-relaxed">{sdg.description}</p>

            <div className="flex flex-wrap gap-1.5 mt-3">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                Datasets
              </span>
              {sdg.datasets.map((d) => (
                <code
                  key={d}
                  className="text-[10px] bg-white/70 border border-slate-200 px-1.5 py-0.5 rounded font-mono text-slate-600"
                >
                  {d}
                </code>
              ))}
            </div>
          </div>

          <div className="bg-white/80 rounded-xl p-4 border border-slate-200/60 min-w-[220px]">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Viewing Country
            </label>
            <select
              className="w-full text-sm font-bold text-slate-800 bg-transparent border-none outline-none cursor-pointer"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              {countriesList.map((c) => (
                <option key={c.iso2} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-2.5 mb-1.5">
              Viewing Year
            </label>
            <select
              className="w-full text-xs font-bold text-slate-800 bg-transparent border-none outline-none cursor-pointer"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            >
              {/* FIX: default to 2015–2025 to stay within realistic historical data range */}
              {Array.from({ length: 2035 - 2015 + 1 }, (_, i) => 2015 + i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <div className="mt-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[11px] text-slate-400">SDG Score</span>
                  {scoreLoading ? (
                    <span className="text-[9px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded-full inline-block mt-0.5">
                      Loading
                    </span>
                  ) : liveSdgScore != null ? (
                    <span className="text-[9px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded-full inline-block mt-0.5">
                      Live
                    </span>
                  ) : (
                    <span className="text-[9px] text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded-full inline-block mt-0.5">
                      Unavailable
                    </span>
                  )}
                </div>

                <span className={`text-2xl font-black font-display ${getScoreColor(displayScore)}`}>
                  {liveSdgScore != null ? displayScore?.toFixed(1) : "—"}
                </span>
              </div>

              {liveSdgScore != null && (
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${displayScore}%`,
                      background: sdg.color,
                    }}
                  />
                </div>
              )}

              <p className="text-[10px] text-slate-400 mt-1">
                {countryYearScores?.cluster ?? ""}
                {countryYearScores?.percentile != null
                  ? ` • P${countryYearScores.percentile}`
                  : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-0.5 border-b border-slate-200 bg-white rounded-t-xl px-2 overflow-x-auto scrollbar-thin">
        {TABS.map((t) => {
          const Icon = TAB_ICONS[t];
          const isAnomaly = t === "Anomalies" && anomalies.length > 0;
          const hasLiveIndicator = LIVE_SDG_IDS.includes(sdg.id);

          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
                tab === t
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-400 hover:text-slate-700"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    hasLiveIndicator
                      ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                      : "bg-red-500"
                  }`}
                />
                <Icon className="w-3.5 h-3.5" />
                {t}
              </div>

              {isAnomaly && (
                <span className="ml-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
                  {anomalies.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === "Overview" && (
        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-display font-bold text-slate-800">Key Metrics · {country}</h2>
                <p className="text-xs text-slate-400">Live indicator values by metric</p>
              </div>
            </div>

            {metricsLoading ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
                <p className="font-semibold">Loading live metrics...</p>
              </div>
            ) : !metricAvailability ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
                <p className="font-semibold">No live metric values available for this country and year</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMetrics.map((m) => (
                  <MetricBlock
                    key={m.key}
                    metric={{ ...m, isLive: true }}
                    vals={metricVals[m.key]}
                    color={sdg.color}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-display font-semibold text-slate-800 mb-1">
                Metric Trend · 2015–{selectedYear}
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                {country} live time series
                {hasLiveTrend ? (
                  <span className="ml-2 text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                    Live DB
                  </span>
                ) : (
                  <span className="ml-2 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                    No data
                  </span>
                )}
              </p>

              {hasLiveTrend ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={trendSeries}>
                    <defs>
                      <linearGradient id={`ov-${sdg.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={sdg.color} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={sdg.color} stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis
                      dataKey="year"
                      tick={{ fontSize: 10, fill: "#94A3B8" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#94A3B8" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<ChartTip />} />
                    <Area
                      dataKey="value"
                      name={country}
                      stroke={sdg.color}
                      fill={`url(#ov-${sdg.id})`}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: sdg.color, stroke: "white", strokeWidth: 1.5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-sm text-slate-400">
                  Trend data unavailable
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-display font-semibold text-slate-800 mb-1">Top 6 Countries</h3>
              <p className="text-xs text-slate-400 mb-4">
                Ranked by {sdg.shortTitle} score · {selectedYear}
                {hasLiveTopCountries ? (
                  <span className="ml-2 text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                    Live DB
                  </span>
                ) : (
                  <span className="ml-2 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                    No data
                  </span>
                )}
              </p>

              {hasLiveTopCountries ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={displayTopCountries} layout="vertical" margin={{ left: 0, right: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tick={{ fontSize: 10, fill: "#94A3B8" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      dataKey="countryname"
                      type="category"
                      tick={{ fontSize: 11, fill: "#475569", fontWeight: 600 }}
                      tickLine={false}
                      axisLine={false}
                      width={85}
                    />
                    <Tooltip content={<ChartTip />} cursor={{ fill: "#F8FAFC" }} />
                    <Bar dataKey="score" name="Score" radius={[0, 6, 6, 0]} barSize={16}>
                      {displayTopCountries.map((_, i) => (
                        <Cell key={i} fill={sdg.color} fillOpacity={1 - i * 0.13} />
                      ))}
                      <LabelList
                        dataKey="score"
                        position="right"
                        style={{ fontSize: 11, fill: "#64748B", fontWeight: 700 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-sm text-slate-400">
                  Ranking data unavailable
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "Forecast" && (
        <div className="space-y-5">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5">
            <div className="flex flex-wrap items-center gap-3">
              <Zap className="w-5 h-5 text-blue-600" />
              <div>
                <div className="flex flex-wrap items-baseline gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] self-center" />
                  <h2 className="font-display font-bold text-slate-800">Predictive Forecast</h2>
                  <span className="text-sm font-semibold text-blue-700 bg-blue-100/50 px-2 py-0.5 rounded border border-blue-200/50">
                    {sdg.metrics[0]?.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Historical machine learning projected values for the primary indicator {sdg.metrics[0]?.unit}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 min-h-[400px] flex flex-col">
            {forecastLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
                  <p className="text-sm text-slate-500">Loading forecast...</p>
                </div>
              </div>
            ) : forecastSeries.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                Forecast unavailable for this metric
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={340}>
                <ComposedChart data={forecastSeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ci-band" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<ChartTip />} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />

                  <Area dataKey="upper" name="Upper bound" stroke="none" fill="url(#ci-band)" legendType="none" />
                  <Area dataKey="lower" name="Lower bound" stroke="none" fill="white" legendType="none" />

                  <Line
                    dataKey="actual"
                    name={`${country} actual`}
                    stroke={sdg.color}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: sdg.color, stroke: "white", strokeWidth: 1.5 }}
                    connectNulls
                  />
                  <Line
                    dataKey="projected"
                    name={`${country} forecast`}
                    stroke={sdg.color}
                    strokeWidth={2}
                    strokeDasharray="7 4"
                    dot={{ r: 2.5, fill: sdg.color, stroke: "white", strokeWidth: 1 }}
                    connectNulls
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: `Current ${selectedYear}`,
                val:
                  forecastSeries.find((d) => d.year === selectedYear)?.actual ??
                  forecastSeries.find((d) => d.year === selectedYear)?.projected,
                color: sdg.color,
              },
              {
                label: "Projected 2030",
                val: forecastSeries.find((d) => d.year === 2030)?.projected,
                color: "#2563eb",
              },
              {
                label: "Upper 2030",
                val: forecastSeries.find((d) => d.year === 2030)?.upper,
                color: "#15803d",
              },
            ].map((item) => (
              <div key={item.label} className="bg-white border border-slate-200 rounded-xl p-4 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {item.label}
                </p>
                <p className="text-3xl font-black font-display" style={{ color: item.color }}>
                  {item.val != null ? Number(item.val.toFixed(1)) : "—"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "Benchmarks" && (
        <div className="space-y-5">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-green-600" />
              <div>
                <h2 className="font-display font-bold text-slate-800">Metric Benchmarking · {country}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live metric value against the same metric across countries and configured targets
                </p>
              </div>
              <span className="ml-auto text-[10px] font-semibold text-green-700 bg-green-100 border border-green-200 rounded-full px-2.5 py-1">
                Live model
              </span>
            </div>
          </div>

          {benchmarkRows.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
              <p className="font-semibold">No live benchmark data available for this SDG</p>
            </div>
          ) : (
            <div className="space-y-4">
              {benchmarkRows.map((b) => {
                const isGood = b.performanceGap >= 0;
                const targetMet = b.targetGap != null ? b.targetGap >= 0 : false;
                const maxVal =
                  Math.max(
                    b.countryValue,
                    b.eu27Avg,
                    b.topValue,
                    b.bottomValue,
                    b.euTarget ?? 0,
                    b.whoThreshold ?? 0
                  ) * 1.15;

                const barW = (v: number) => Math.min(100, (v / (maxVal || 1)) * 100);

                return (
                  <div key={b.metricKey} className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      <h3 className="font-semibold text-slate-800">{b.metricLabel}</h3>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            isGood ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                          }`}
                        >
                          {Math.abs(b.performanceGap).toFixed(1)} vs EU27
                        </span>

                        {b.targetGap != null && (
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              targetMet
                                ? "bg-blue-100 text-blue-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {targetMet ? "Target met" : `${Math.abs(b.targetGap).toFixed(1)} to target`}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {[
                        { label: country, val: b.countryValue, color: sdg.color, bold: true },
                        { label: "EU27 Average", val: b.eu27Avg, color: "#64748B", bold: false },
                        { label: `Best: ${b.topCountry}`, val: b.topValue, color: "#15803d", bold: false },
                        { label: `Worst: ${b.bottomCountry}`, val: b.bottomValue, color: "#dc2626", bold: false },
                        ...(b.euTarget != null
                          ? [{ label: "EU Target", val: b.euTarget, color: "#F59E0B", bold: false }]
                          : []),
                        ...(b.whoThreshold != null
                          ? [{ label: "WHO Threshold", val: b.whoThreshold, color: "#8B5CF6", bold: false }]
                          : []),
                      ].map((row) => (
                        <div key={row.label} className="flex items-center gap-3">
                          <span
                            className={`text-xs w-36 shrink-0 truncate ${
                              row.bold ? "font-bold text-slate-800" : "text-slate-500"
                            }`}
                          >
                            {row.label}
                          </span>
                          <div className="flex-1 h-5 bg-slate-100 rounded-lg overflow-hidden">
                            <div
                              className="h-full rounded-lg transition-all duration-500"
                              style={{
                                width: `${barW(row.val)}%`,
                                background: row.color,
                                opacity: row.bold ? 1 : 0.75,
                              }}
                            />
                          </div>
                          <span
                            className="text-xs font-bold w-16 text-right shrink-0"
                            style={{ color: row.color }}
                          >
                            {Number(row.val.toFixed(1))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "Anomalies" && (
        <div className="space-y-5">
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <h2 className="font-display font-bold text-slate-800">Anomaly Detection · {country}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live anomaly feed filtered to the selected SDG metrics
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                {anomalies.length > 0 ? (
                  <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full">
                    {anomalies.length} detected
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-green-700 bg-green-100 border border-green-200 rounded-full px-2.5 py-1">
                    No anomalies
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-display font-semibold text-slate-800 mb-1">
              Timeline with Anomaly Markers
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Flagged years are marked on the live trend line
            </p>

            {hasLiveTrend ? (
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={trendSeries}>
                  <defs>
                    <linearGradient id={`ov-anom-${sdg.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={sdg.color} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={sdg.color} stopOpacity={0.01} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 10, fill: "#94A3B8" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#94A3B8" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<ChartTip />} />

                  {anomalies.map((a) => (
                    <ReferenceLine
                      key={`${a.year}-${a.metric}`}
                      x={a.year}
                      stroke={a.severity === "critical" ? "#dc2626" : "#d97706"}
                      strokeDasharray="4 3"
                      strokeWidth={1.5}
                    />
                  ))}

                  <Area
                    dataKey="value"
                    name={country}
                    stroke={sdg.color}
                    fill={`url(#ov-anom-${sdg.id})`}
                    strokeWidth={2.5}
                    dot={(props: any) => {
                      const isAnom = anomalies.some((a) => a.year === props.payload?.year);
                      return isAnom ? (
                        <circle
                          key={props.key}
                          cx={props.cx}
                          cy={props.cy}
                          r={6}
                          fill="#dc2626"
                          stroke="white"
                          strokeWidth={2}
                        />
                      ) : (
                        <circle
                          key={props.key}
                          cx={props.cx}
                          cy={props.cy}
                          r={3}
                          fill={sdg.color}
                          stroke="white"
                          strokeWidth={1.5}
                        />
                      );
                    }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-slate-400">
                Trend data unavailable
              </div>
            )}
          </div>

          {anomalies.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
              <p className="font-semibold">No statistically significant anomalies detected for {country}</p>
              <p className="text-sm mt-1">Data appears consistent with expected historical trends</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {anomalies.map((a, idx) => {
                const colors: Record<
                  string,
                  { bg: string; border: string; text: string; badge: string }
                > = {
                  critical: {
                    bg: "bg-red-50",
                    border: "border-red-200",
                    text: "text-red-700",
                    badge: "bg-red-100 text-red-600",
                  },
                  warning: {
                    bg: "bg-amber-50",
                    border: "border-amber-200",
                    text: "text-amber-700",
                    badge: "bg-amber-100 text-amber-700",
                  },
                };

                const c = colors[a.severity] ?? colors.warning;

                return (
                  <div
                    key={`${a.metric}-${a.year}-${idx}`}
                    className={`${c.bg} border ${c.border} rounded-xl p-4`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${c.text}`}>
                          {a.year}
                        </span>
                        <h4 className="font-bold text-slate-800 mt-0.5">{a.label}</h4>
                      </div>
                      <div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${c.badge}`}>
                          {a.severity === "critical" ? "Critical" : "Warning"}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed mb-3">{a.description}</p>

                    <div className="flex gap-4 text-xs">
                      <div>
                        <span className="text-slate-400">Observed</span>
                        <p className="font-bold text-slate-800">{Number(a.value.toFixed(1))}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Expected</span>
                        <p className="font-bold text-slate-800">{a.expected}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Deviation</span>
                        <p className={`font-bold ${c.text}`}>
                          {a.deviation > 0 ? "+" : ""}
                          {a.deviation}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "Country Rankings" && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-slate-800">
                All Country Rankings · {sdg.shortTitle}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {allLiveRankings.length} countries · {selectedYear} · click a row to switch country
              </p>
            </div>
            <span className="text-xs text-slate-400 border border-slate-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1">
              <Database className="w-3 h-3" />
              {sdg.datasets[0]}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["#", "Country", "ISO2", "SDG Score"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allLiveRankings.map((c) => {
                  const s = c.score;
                  const col = scoreHex(s);

                  return (
                    <tr
                      key={`${c.countryname}-${c.countryiso2}`}
                      onClick={() => setCountry(c.countryname)}
                      className={`border-b border-slate-50 cursor-pointer transition-colors ${
                        c.countryname === country ? "bg-blue-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="px-4 py-3 text-xs text-slate-400 font-mono">{c.rank}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{c.countryname}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                          {c.countryiso2}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${s}%`, background: col }}
                            />
                          </div>
                          <span className="text-sm font-bold" style={{ color: col }}>
                            {s.toFixed(1)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {allLiveRankings.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                      No ranking data available for {selectedYear}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "Metric Guide" && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex flex-wrap gap-6 items-center">
            <div>
              <h3 className="font-display font-bold text-blue-800 mb-1">CSI Calculation Formula</h3>
              <p className="text-xs text-blue-600">
                Each SDG contributes equally to the Composite Sustainability Index
              </p>
            </div>
            <div className="bg-white rounded-xl px-5 py-3 border border-blue-200 text-center">
              <p className="font-mono text-blue-700 font-bold text-base">
                CSI = Average of 12 SDG scores
              </p>
              <p className="text-xs text-blue-400 mt-1">
                12 SDGs · scale 0–100 · Achievement rate based on available SDG scores
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-display font-bold text-slate-800">Metric Definitions</h2>
              <p className="text-xs text-slate-400 mt-0.5">Source: {sdg.datasets.join(", ")}</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {["Metric", "Unit", "Direction", "EU Target", "WHO Threshold", "Description"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {sdg.metrics.map((m, i) => (
                    <tr key={m.key} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                      <td className="px-5 py-3 font-semibold text-slate-800">{m.label}</td>
                      <td className="px-5 py-3">
                        <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                          {m.unit}
                        </code>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            m.higherIsBetter
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {m.higherIsBetter ? "Higher" : "Lower"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-600">
                        {m.euTarget != null ? `${m.euTarget} ${m.unit}` : "—"}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-600">
                        {m.whoThreshold != null ? `${m.whoThreshold} ${m.unit}` : "—"}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500 max-w-xs leading-relaxed">
                        {m.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}