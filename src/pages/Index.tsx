// src/pages/Index.tsx

import { useMemo, useState } from "react";
import {
  MapPin,
  List,
  TrendingUp,
  TrendingDown,
  Award,
  Users,
  BarChart3,
  RefreshCw,
  Wifi,
  WifiOff,
  Database,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQueries, useQuery } from "@tanstack/react-query";
import { COUNTRY_SDG_SCORES, SDG_DEFINITIONS } from "@/data/sdgData";
import CountryMap from "@/components/dashboard/CountryMap";
import CountryRankingTable from "@/components/dashboard/CountryRankingTable";
import SDGScoreGrid from "@/components/dashboard/SDGScoreGrid";
import { Skeleton } from "@/components/ui/skeleton";
import type { LiveCountryRecord } from "@/types/countryTypes";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://187.127.164.121:8002";

type ClusterName =
  | "Nordic Leaders"
  | "Western Innovators"
  | "Mediterranean Transitioning"
  | "Central European Rising"
  | "Eastern Emerging";

interface ApiHealthResponse {
  status?: string;
  database?: string;
  countries_loaded?: number;
  metrics_loaded?: number;
  date_range?: string;
  timestamp?: string;
}

interface ApiCountry {
  iso2: string;
  name: string;
  region: string;
  is_eu27: boolean;
  latitude: number;
  longitude: number;
}

interface ApiSdgScoreRow {
  country_iso2: string;
  country_name: string;
  sdg_id: number;
  sdg_title: string;
  year: number;
  normalised_score: number;
  data_type: string;
}

const EU27_CODES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
  "DE", "EL", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
  "PL", "PT", "RO", "SK", "SI", "ES", "SE",
]);

const CLUSTER_COLORS: Record<ClusterName, string> = {
  "Nordic Leaders": "#15803d",
  "Western Innovators": "#2563eb",
  "Mediterranean Transitioning": "#d97706",
  "Central European Rising": "#7c3aed",
  "Eastern Emerging": "#dc2626",
};

const CLUSTER_ORDER: ClusterName[] = [
  "Nordic Leaders",
  "Western Innovators",
  "Mediterranean Transitioning",
  "Central European Rising",
  "Eastern Emerging",
];

function scoreColor(score: number): string {
  if (score >= 80) return "#15803d";
  if (score >= 70) return "#2563eb";
  if (score >= 55) return "#d97706";
  if (score >= 50) return "#7c3aed";
  return "#dc2626";
}

function getCluster(score: number): ClusterName {
  if (score >= 80) return "Nordic Leaders";
  if (score >= 68) return "Western Innovators";
  if (score >= 55) return "Mediterranean Transitioning";
  if (score >= 50) return "Central European Rising";
  return "Eastern Emerging";
}

function isEu27MockCountry(country: any): boolean {
  const code = country?.countryCode?.toUpperCase?.();
  if (!code) return false;

  if (typeof country?.is_eu27 === "boolean") return country.is_eu27;
  if (typeof country?.isEU === "boolean") return country.isEU;
  if (typeof country?.isEu27 === "boolean") return country.isEu27;

  return EU27_CODES.has(code);
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

function buildFallbackCountries(selectedYear: number): LiveCountryRecord[] {
  const eu27Rows = COUNTRY_SDG_SCORES.filter(isEu27MockCountry);
  const sorted = [...eu27Rows]
    .map((country) => {
      const values = Object.values(country.sdgScores ?? {}).filter(
        (v): v is number => typeof v === "number"
      );
      const csi = values.length > 0 ? average(values) : country.csi;

      return {
        country: country.country,
        countryCode: country.countryCode ?? "",
        lat: country.lat ?? 0,
        lon: country.lon ?? 0,
        population: 0,
        csi,
        rank: 0,
        percentile: 0,
        cluster: getCluster(csi),
        sdgAchievementRate:
          values.length > 0
            ? Math.round((values.filter((v) => v >= 70).length / values.length) * 100)
            : 0,
        sdgScores: (country.sdgScores ?? {}) as Record<number, number | null>,
        year: selectedYear,
        metrics: {} as LiveCountryRecord["metrics"],
      } as LiveCountryRecord;
    })
    .sort((a, b) => b.csi - a.csi)
    .map((country, index, arr) => ({
      ...country,
      rank: index + 1,
      percentile: Math.round(((arr.length - index) / arr.length) * 100),
    }));

  return sorted;
}

function useApiHealth() {
  return useQuery<ApiHealthResponse>({
    queryKey: ["api-health"],
    staleTime: 1000 * 60 * 5,
    retry: 1,
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/health`);
      if (!res.ok) throw new Error("offline");
      return res.json();
    },
  });
}

function useEu27Countries() {
  return useQuery<ApiCountry[]>({
    queryKey: ["eu27-countries"],
    staleTime: 1000 * 60 * 30,
    retry: 1,
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/countries`);
      if (!res.ok) {
        throw new Error("Failed to fetch countries");
      }

      const allCountries: ApiCountry[] = await res.json();
      return allCountries.filter((c) => c.is_eu27 === true);
    },
  });
}

function useAllCountries(selectedYear: number) {
  const countriesQuery = useEu27Countries();

  const sdgQueries = useQueries({
    queries: (countriesQuery.data ?? []).map((country) => ({
      queryKey: ["country-sdg-scores", country.iso2, selectedYear],
      queryFn: async (): Promise<ApiSdgScoreRow[]> => {
        const res = await fetch(
          `${API_BASE}/api/sdg-scores/country/${country.iso2}/year/${selectedYear}`
        );

        if (!res.ok) {
          if (res.status === 404) return [];
          throw new Error(`Failed SDG fetch for ${country.iso2}`);
        }

        return res.json();
      },
      enabled: !!countriesQuery.data?.length,
      staleTime: 1000 * 60 * 15,
      retry: 1,
    })),
  });

  const data = useMemo<LiveCountryRecord[]>(() => {
    const countries = countriesQuery.data ?? [];
    if (!countries.length) return [];

    const fallbackMap = new Map(
      COUNTRY_SDG_SCORES
        .filter(isEu27MockCountry)
        .map((c) => [c.countryCode?.toUpperCase(), c] as const)
    );

    const rows: LiveCountryRecord[] = countries.map((country, index) => {
      const query = sdgQueries[index];
      const sdgRows = query?.data ?? [];
      const fallback = fallbackMap.get(country.iso2.toUpperCase());

      const sdgScores: Record<number, number | null> = {};

      SDG_DEFINITIONS.forEach((sdg) => {
        const match = sdgRows.find((row) => row.sdg_id === sdg.id);
        sdgScores[sdg.id] = typeof match?.normalised_score === "number"
  ? match.normalised_score
  : null;
        // sdgScores[sdg.id] =
        //   typeof match?.normalised_score === "number"
        //     ? match.normalised_score
        //     : (fallback?.sdgScores?.[sdg.id] ?? null);
      });

      const validScores = Object.values(sdgScores).filter(
        (v): v is number => typeof v === "number"
      );

      const csi =
        validScores.length > 0
          ? average(validScores)
          : fallback?.csi ?? 0;

      const sdgAchievementRate =
        validScores.length > 0
          ? Math.round((validScores.filter((v) => v >= 70).length / validScores.length) * 100)
          : fallback?.sdgAchievementRate ?? 0;

      return {
        country: country.name,
        countryCode: country.iso2.toUpperCase(),
        lat: country.latitude,
        lon: country.longitude,
        population: 0,
        csi: Number(csi.toFixed(2)),
        rank: 0,
        percentile: 0,
        cluster: getCluster(csi),
        sdgAchievementRate,
        sdgScores,
        year: selectedYear,
        metrics: {} as LiveCountryRecord["metrics"],
      };
    });

    return rows
      .sort((a, b) => b.csi - a.csi)
      .map((row, index, arr) => ({
        ...row,
        rank: index + 1,
        percentile: Math.round(((arr.length - index) / arr.length) * 100),
      }));
  }, [countriesQuery.data, sdgQueries, selectedYear]);

  const isLoading =
    countriesQuery.isLoading ||
    (countriesQuery.data?.length
      ? sdgQueries.some((q) => q.isLoading)
      : false);

  const isError =
    countriesQuery.isError ||
    sdgQueries.some((q) => q.isError);

  return {
    data: data.length > 0 ? data : isError ? buildFallbackCountries(selectedYear) : [],
    isLoading,
    isError,
  };
}

function useCountryOverview(countryName: string | null, selectedYear: number) {
  const countriesQuery = useEu27Countries();

  return useQuery<{
    country: string;
    csi: number | null;
    percentile: number | null;
    sdgAchievementRate: number;
    cluster: ClusterName | null;
    sdgScores: Record<number, number | null>;
    liveSDGIds: Set<number>;
    timestamp: string;
  }>({
    queryKey: ["country-overview-sdg-only", countryName, selectedYear],
    enabled: !!countryName && !!countriesQuery.data?.length,
    staleTime: 1000 * 60 * 10,
    retry: 1,
    queryFn: async () => {
      const country = countriesQuery.data!.find(
        (c) => c.name.toLowerCase() === countryName!.toLowerCase()
      );

      if (!country) {
        throw new Error(`Country not found in EU-27 list: ${countryName}`);
      }

      const res = await fetch(
        `${API_BASE}/api/sdg-scores/country/${country.iso2}/year/${selectedYear}`
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch SDG scores for ${country.iso2}`);
      }

      const sdgRows: ApiSdgScoreRow[] = await res.json();
      const sdgScores: Record<number, number | null> = {};
      const liveSDGIds = new Set<number>();

      SDG_DEFINITIONS.forEach((sdg) => {
        const match = sdgRows.find((row) => row.sdg_id === sdg.id);
        if (match && typeof match.normalised_score === "number") {
          sdgScores[sdg.id] = match.normalised_score;
          liveSDGIds.add(sdg.id);
        } else {
          sdgScores[sdg.id] = null;
        }
      });

      const values = Object.values(sdgScores).filter(
        (v): v is number => typeof v === "number"
      );

      const csi = values.length > 0 ? average(values) : null;
      const sdgAchievementRate =
        values.length > 0
          ? Math.round((values.filter((v) => v >= 70).length / values.length) * 100)
          : 0;

      return {
        country: country.name,
        csi: csi !== null ? Number(csi.toFixed(2)) : null,
        percentile: null,
        sdgAchievementRate,
        cluster: csi !== null ? getCluster(csi) : null,
        sdgScores,
        liveSDGIds,
        timestamp: new Date().toISOString(),
      };
    },
  });
}

function useDashboardKpis(liveCountries: LiveCountryRecord[] | undefined, selectedYear: number) {
  return useMemo(() => {
    const rows =
      liveCountries && liveCountries.length > 0
        ? liveCountries
        : buildFallbackCountries(selectedYear);

    const total = rows.length;
    const sorted = [...rows].sort((a, b) => b.csi - a.csi);
    const avgCsi = total > 0 ? (sorted.reduce((s, c) => s + c.csi, 0) / total).toFixed(1) : "0.0";
    const topCountry = sorted[0];
    const bottomCountry = sorted[total - 1];
    const above60 = sorted.filter((c) => c.csi >= 60).length;

    const clusterMap: Record<string, { count: number; totalCsi: number }> = {};
    for (const c of sorted) {
      if (!clusterMap[c.cluster]) clusterMap[c.cluster] = { count: 0, totalCsi: 0 };
      clusterMap[c.cluster].count++;
      clusterMap[c.cluster].totalCsi += c.csi;
    }

    const clusters = CLUSTER_ORDER.map((name) => ({
      name,
      count: clusterMap[name]?.count ?? 0,
      avgCsi: clusterMap[name]
        ? parseFloat((clusterMap[name].totalCsi / clusterMap[name].count).toFixed(1))
        : 0,
      color: CLUSTER_COLORS[name],
    }));

    return {
      avgCsi,
      topCountry,
      bottomCountry,
      above60,
      clusters,
      isLive: !!liveCountries?.length,
      total,
    };
  }, [liveCountries, selectedYear]);
}

function CountryDetailPanel({
  countryName,
  liveRecord,
  selectedYear,
  onClose,
}: {
  countryName: string;
  liveRecord?: LiveCountryRecord;
  selectedYear: number;
  onClose: () => void;
}) {
  const { data: overview, isLoading, error } = useCountryOverview(countryName, selectedYear);
  const staticData = COUNTRY_SDG_SCORES.find((c) => c.country === countryName);

  const rawCsi = overview?.csi ?? liveRecord?.csi ?? staticData?.csi ?? null;
  const displayCsiStr = rawCsi !== null ? rawCsi.toFixed(1) : "N/A";

  const rawPercentile = liveRecord?.percentile ?? null;
  const displayPercentileStr = rawPercentile !== null ? `P${Math.round(rawPercentile)}` : "N/A";

  const displayCluster = overview?.cluster ?? liveRecord?.cluster ?? staticData?.cluster ?? "";
  const displayAchRate = overview?.sdgAchievementRate ?? liveRecord?.sdgAchievementRate ?? 0;

  const sdgScores = overview?.sdgScores ?? staticData?.sdgScores ?? {};
  const liveSDGIds = overview?.liveSDGIds ?? new Set<number>();
  const hasLiveData = !!overview;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 animate-fade-up">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display font-bold text-lg text-slate-800">{countryName}</h3>
          <p className="text-xs text-slate-400">{displayCluster}</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-300 hover:text-slate-600 text-xl leading-none transition-colors"
          aria-label="Close panel"
        >
          ×
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-black font-display text-blue-700">
            {isLoading ? "…" : displayCsiStr}
          </p>
          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wide mt-0.5">
            CSI
          </p>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-black font-display text-slate-700">
            {displayPercentileStr}
          </p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">
            Percentile
          </p>
        </div>

        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-black font-display text-green-700">
            {isLoading ? "…" : `${displayAchRate}%`}
          </p>
          <p className="text-[10px] font-bold text-green-500 uppercase tracking-wide mt-0.5">
            SDGs ≥70
          </p>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          SDG Breakdown — 12 Goals
        </p>

        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        )}

        {error && (
          <div className="text-xs text-slate-500 p-2 bg-amber-50 rounded border border-amber-200 mb-2">
            ⚠️ Live SDG data unavailable
          </div>
        )}

        <div className="space-y-1.5 max-h-64 overflow-y-auto scrollbar-thin pr-1">
          {SDG_DEFINITIONS.map((sdg) => {
            const score = (sdgScores as Record<number, number | null>)[sdg.id];
            const hasScore = score != null;
            const isLiveScore = hasLiveData && liveSDGIds.has(sdg.id);

            return (
              <Link
                key={sdg.id}
                to={`/sdg/${sdg.slug}`}
                className="flex items-center gap-2 group"
              >
                <span
                  className="w-5 h-5 rounded text-[10px] font-black flex items-center justify-center shrink-0"
                  style={{ background: sdg.bgColor, color: sdg.color }}
                >
                  {sdg.id}
                </span>

                <span className="text-[11px] text-slate-500 truncate flex-1 group-hover:text-slate-800 transition-colors">
                  {sdg.shortTitle}
                </span>

                {!hasScore ? (
                  <span className="text-[10px] text-slate-300 italic shrink-0">N/A</span>
                ) : (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div
                      className={`w-1 h-1 rounded-full ${
                        isLiveScore
                          ? "bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.6)]"
                          : "bg-amber-400"
                      }`}
                    />
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${score}%`, background: scoreColor(score) }}
                      />
                    </div>
                    <span
                      className="text-[11px] font-bold w-8 text-right tabular-nums"
                      style={{ color: scoreColor(score) }}
                    >
                      {score.toFixed(1)}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {overview && (
          <p className="text-[9px] text-slate-300 mt-2">
            SDG-derived CSI · Updated {new Date(overview.timestamp).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}

function ClusterBreakdown({
  clusters,
  isLive,
}: {
  clusters: { name: string; count: number; avgCsi: number; color: string }[];
  isLive: boolean;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center gap-1.5 mb-3">
        <Users className="w-3.5 h-3.5 text-slate-400" />
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Country Clusters
        </p>
        {isLive && (
          <span className="ml-auto text-[9px] text-green-500 font-bold">● LIVE</span>
        )}
      </div>

      <div className="space-y-2.5">
        {clusters.map((cl) => (
          <div key={cl.name}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cl.color }} />
                <span className="text-xs text-slate-600 font-medium">{cl.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">{cl.count} countries</span>
                <span className="text-xs font-bold" style={{ color: cl.color }}>
                  {cl.avgCsi || "—"}
                </span>
              </div>
            </div>

            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${cl.avgCsi}%`, background: cl.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
      <Skeleton className="w-9 h-9 rounded-lg" />
      <Skeleton className="h-7 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-2/3 mt-2" />
    </div>
  );
}

export default function Index() {
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>();
  const [view, setView] = useState<"map" | "list">("map");
  const [selectedYear, setSelectedYear] = useState<number>(2025);

  const { data: liveCountries, isLoading: countriesLoading, isError: countriesError } =
    useAllCountries(selectedYear);

  const health = useApiHealth();
  const kpis = useDashboardKpis(liveCountries, selectedYear);

  const selectedLiveRecord = selectedCountry
    ? liveCountries?.find((c) => c.country === selectedCountry)
    : undefined;

  const KPI_ITEMS = [
    {
      label: "Avg CSI Score",
      value: countriesLoading ? "—" : kpis.avgCsi,
      sub: countriesLoading ? "Loading…" : `${kpis.total} EU-27 countries tracked`,
      icon: <BarChart3 className="w-5 h-5" />,
      bg: "bg-blue-50",
      text: "text-blue-600",
      isLive: kpis.isLive,
    },
    {
      label: "Top Ranked Country",
      value: countriesLoading ? "—" : (kpis.topCountry?.country ?? "—"),
      sub: countriesLoading
        ? "Loading…"
        : kpis.topCountry
        ? `#1 · CSI ${kpis.topCountry.csi.toFixed(1)} · ${kpis.topCountry.cluster}`
        : "No data",
      icon: <Award className="w-5 h-5" />,
      bg: "bg-green-50",
      text: "text-green-600",
      isLive: kpis.isLive,
    },
    {
  label: "Above CSI 60",
  value: countriesLoading ? "—" : `${kpis.above60} / ${kpis.total}`,
  sub: "Based on SDG-derived CSI",
  icon: <TrendingUp className="w-5 h-5" />,
  bg: "bg-indigo-50",
  text: "text-indigo-600",
  isLive: kpis.isLive,
},
    {
      label: "Needs Most Focus",
      value: countriesLoading ? "—" : (kpis.bottomCountry?.country ?? "—"),
      sub: countriesLoading
        ? "Loading…"
        : kpis.bottomCountry
        ? `#${kpis.total} · CSI ${kpis.bottomCountry.csi.toFixed(1)} · ${kpis.bottomCountry.cluster}`
        : "No data",
      icon: <TrendingDown className="w-5 h-5" />,
      bg: "bg-amber-50",
      text: "text-amber-600",
      isLive: kpis.isLive,
    },
  ];

  return (
    <div className="px-6 py-6 space-y-6 max-w-screen-xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-800">
            EU-27 Sustainability Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            CSI calculated from SDG score APIs only · EU-27 countries · 12-goal average for selected year
          </p>
        </div>

        <div className="flex items-center gap-2 self-start mt-1 flex-wrap">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Year:</span>
           <select
  className="text-xs font-bold text-slate-700 bg-transparent border-none outline-none cursor-pointer"
  value={selectedYear}
  onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
>
  {Array.from({ length: 2035 - 2015 + 1 }, (_, i) => 2015 + i).map((y) => (
    <option key={y} value={y}>
      {y}
    </option>
  ))}
</select>
          </div>

          {health.isLoading ? (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" /> Connecting…
            </span>
          ) : health.data ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">
              <Wifi className="w-3 h-3" />
              FastAPI connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-full px-2.5 py-1">
              <WifiOff className="w-3 h-3" />
              API offline
            </span>
          )}

          {countriesError && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
              <Database className="w-3 h-3" />
              Static fallback active
            </span>
          )}

          {!countriesError && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-1">
              <Database className="w-3 h-3" />
              SDG API source · EU-27 only
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_ITEMS.map((k) =>
          countriesLoading ? (
            <KpiSkeleton key={k.label} />
          ) : (
            <div
              key={k.label}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative"
            >
              {k.isLive ? (
                <span
                  className="absolute top-3 right-3 w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]"
                  title="Live data from SDG backend"
                />
              ) : (
                <span
                  className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-400"
                  title="Fallback data"
                />
              )}

              <div className={`w-9 h-9 rounded-lg ${k.bg} ${k.text} flex items-center justify-center mb-3`}>
                {k.icon}
              </div>

              <p className="text-xl font-black font-display text-slate-800 leading-none truncate">
                {k.value}
              </p>
              <p className="text-xs text-slate-400 mt-0.5 leading-snug">{k.sub}</p>
              <p className="text-[11px] font-semibold text-slate-500 mt-2 border-t border-slate-100 pt-2">
                {k.label}
              </p>
            </div>
          )
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-slate-800">
            Country Map & Rankings
          </h2>

          <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white">
            {(["map", "list"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors ${
                  view === v
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                {v === "map" ? <MapPin className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
                {v === "map" ? "Map" : "Table"}
              </button>
            ))}
          </div>
        </div>

        {view === "map" ? (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
            <div className="min-h-[420px]">
              <CountryMap
                selectedCountry={selectedCountry ?? ""}
                onCountryClick={setSelectedCountry}
                liveCountries={liveCountries ?? []}
              />
            </div>

            <div className="flex flex-col gap-3">
              {selectedCountry ? (
                <CountryDetailPanel
                  countryName={selectedCountry}
                  liveRecord={selectedLiveRecord}
                  selectedYear={selectedYear}
                  onClose={() => setSelectedCountry(undefined)}
                />
              ) : (
                <div className="bg-white border border-slate-200 border-dashed rounded-xl p-6 text-center">
                  <MapPin className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                  <p className="text-sm font-semibold text-slate-400">
                    Click an EU-27 country
                  </p>
                  <p className="text-xs text-slate-300 mt-1">
                    to see its SDG-derived CSI and 12-goal breakdown
                  </p>
                </div>
              )}

              {countriesLoading ? (
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-6 w-full" />
                  ))}
                </div>
              ) : (
                <ClusterBreakdown clusters={kpis.clusters} isLive={kpis.isLive} />
              )}
            </div>
          </div>
        ) : (
          <CountryRankingTable
            selectedCountry={selectedCountry}
            onCountrySelect={setSelectedCountry}
            liveCountries={liveCountries ?? []}
            isLoading={countriesLoading}
          />
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-display font-semibold text-slate-800">
              SDG Score Heatmap
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              EU-27 only · CSI and grid both derived from SDG score APIs
            </p>
          </div>

          {countriesError && (
            <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-200 rounded-full px-2 py-0.5 font-semibold">
              Static fallback active
            </span>
          )}
        </div>

        <SDGScoreGrid liveCountries={liveCountries ?? []} selectedYear={selectedYear} />
      </div>

      <div>
        <h2 className="font-display font-semibold text-slate-800 mb-3">
          Explore by SDG
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
          {SDG_DEFINITIONS.map((sdg) => (
            <Link
              key={sdg.id}
              to={`/sdg/${sdg.slug}`}
              className="bg-white border border-slate-200 rounded-xl p-3.5 text-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div
                className="w-11 h-11 rounded-xl mx-auto mb-2 flex items-center justify-center text-lg font-black font-display"
                style={{ background: sdg.bgColor, color: sdg.color }}
              >
                {sdg.id}
              </div>

              <p className="text-xs font-semibold text-slate-700 group-hover:text-blue-700 transition-colors leading-tight">
                {sdg.shortTitle}
              </p>

              <span
                className={`mt-1.5 inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  sdg.type === "direct"
                    ? "bg-blue-50 text-blue-600"
                    : "bg-amber-50 text-amber-600"
                }`}
              >
                {sdg.type}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}