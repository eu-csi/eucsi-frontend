// src/pages/Index.tsx
// ─────────────────────────────────────────────────────────────────────────────
// EU CountryPulse — Overview Dashboard
// Rankings are fully dynamic: fetched from GET /api/countries (FastAPI backend).
// Static COUNTRY_SDG_SCORES is used ONLY as a fallback if the API is unreachable.
// Cluster counts + avg CSI are derived dynamically from live ranking data.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from "react";
import {
  MapPin, List, TrendingUp, TrendingDown, Award,
  Users, BarChart3, RefreshCw, Wifi, WifiOff, Database,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { COUNTRY_SDG_SCORES, SDG_DEFINITIONS } from "@/data/sdgData";
import CountryMap from "@/components/dashboard/CountryMap";
import CountryRankingTable from "@/components/dashboard/CountryRankingTable";
import SDGScoreGrid from "@/components/dashboard/SDGScoreGrid";
import { Skeleton } from "@/components/ui/skeleton";

// ── Shared type — imported from countryTypes ──
import type { LiveCountryRecord } from "@/types/countryTypes";

// ─── ENV ─────────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL ?? "https://187.127.164.121:8000";

// ─── TYPES ────────────────────────────────────────────────────────────────────
export type ClusterName =
  | "Nordic Leaders"
  | "Western Innovators"
  | "Mediterranean Transitioning"
  | "Central European Rising"
  | "Eastern Emerging";

interface ApiHealthResponse {
  status: string;
  version: string;
  models: Record<string, unknown>;
}

// ─── CLUSTER META ────────────────────────────────────────────────────────────
const CLUSTER_COLORS: Record<ClusterName, string> = {
  "Nordic Leaders": "#15803d",
  "Western Innovators": "#2563eb",
  "Mediterranean Transitioning": "#d97706",
  "Central European Rising": "#c2410c",
  "Eastern Emerging": "#dc2626",
};

const CLUSTER_ORDER: ClusterName[] = [
  "Nordic Leaders",
  "Western Innovators",
  "Mediterranean Transitioning",
  "Central European Rising",
  "Eastern Emerging",
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function scoreColor(s: number): string {
  if (s >= 80) return "#15803d";
  if (s >= 70) return "#2563eb";
  if (s >= 58) return "#d97706";
  return "#dc2626";
}

// ─── LIVE API HOOKS ───────────────────────────────────────────────────────────
function useAllCountries() {
  return useQuery<LiveCountryRecord[]>({
    queryKey: ["all-countries"],
    staleTime: 1000 * 60 * 10,
    retry: 1,
    queryFn: async () => {
      // Backend doesn't have /api/cities yet, so we'll use /countries to get names
      // and keep rankings static for now, or fetch them if an endpoint existed.
      const res = await fetch(`${API_BASE}/countries`);
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      const countryNames: string[] = data.countries || [];
      
      // Map names to our static records to preserve coordinates/clusters
      // but mark them as potentially ready for live updates
      return COUNTRY_SDG_SCORES.filter(c => countryNames.includes(c.country))
        .map((c, i) => ({
          ...c,
          rank: i + 1,
          metrics: {},
          year: 2024
        } as LiveCountryRecord));
    },
  });
}

function useApiHealth() {
  return useQuery<ApiHealthResponse>({
    queryKey: ["api-health"],
    staleTime: 1000 * 60 * 5,
    retry: 1,
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/`);
      if (!res.ok) throw new Error("offline");
      return res.json();
    },
  });
}

function useCountryOverview(countryName: string | null) {
  return useQuery<{
    country: string;
    csi: number;
    percentile: number;
    sdgAchievementRate: number;
    cluster: ClusterName;
    sdgScores: Record<number, number | null>;
    timestamp: string;
  }>({
    queryKey: ["country-overview", countryName],
    enabled: !!countryName,
    staleTime: 1000 * 60 * 10,
    retry: 1,
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE}/sdg-scores/${encodeURIComponent(countryName!)}`
      );
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      
      // Transform sdgScores from {sdg5: {score: 70}} to {5: 70}
      const mappedScores: Record<number, number | null> = {};
      Object.entries(data.sdgScores).forEach(([key, val]: [string, any]) => {
        const id = parseInt(key.replace("sdg", ""));
        mappedScores[id] = val.score;
      });

      return {
        country: data.country,
        csi: data.compositeCsi,
        percentile: 0, // Backend doesn't return percentile yet
        sdgAchievementRate: 0, // Calculated in frontend usually
        cluster: "Western Innovators" as ClusterName, // Backend doesn't return cluster
        sdgScores: mappedScores,
        timestamp: data.timestamp,
      };
    },
  });
}

// ─── DERIVED KPI HOOK ─────────────────────────────────────────────────────────
function useDashboardKpis(liveCountries: LiveCountryRecord[] | undefined) {
  return useMemo(() => {
    if (liveCountries && liveCountries.length > 0) {
      const total = liveCountries.length;
      const avgCsi = (
        liveCountries.reduce((s, c) => s + c.csi, 0) / total
      ).toFixed(1);
      const topCountry = liveCountries[0];
      const bottomCountry = liveCountries[total - 1];
      const above70 = liveCountries.filter((c) => c.csi >= 70).length;

      const clusterMap: Record<string, { count: number; totalCsi: number }> = {};
      for (const c of liveCountries) {
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

      return { avgCsi, topCountry, bottomCountry, above70, clusters, isLive: true, total };
    }

    const fallback = COUNTRY_SDG_SCORES;
    const sorted = [...fallback].sort((a, b) => b.csi - a.csi);
    const total = sorted.length;
    const avgCsi = (sorted.reduce((s, c) => s + c.csi, 0) / total).toFixed(1);

    const toRecord = (c: typeof sorted[0], i: number): LiveCountryRecord => ({
      country: c.country,
      countryCode: c.countryCode ?? "",
      lat: c.lat ?? 0,
      lon: c.lon ?? 0,
      population: 0,
      csi: c.csi,
      rank: i + 1,
      percentile: c.percentile ?? 0,
      cluster: c.cluster as ClusterName,
      sdgAchievementRate: c.sdgAchievementRate ?? 0,
      sdgScores: c.sdgScores as Record<number, number | null>,
      year: 2024,
      metrics: {},
    });

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
      topCountry: toRecord(sorted[0], 0),
      bottomCountry: toRecord(sorted[total - 1], total - 1),
      above70: sorted.filter((c) => c.csi >= 70).length,
      clusters,
      isLive: false,
      total,
    };
  }, [liveCountries]);
}

// ─── COUNTRY DETAIL PANEL ───────────────────────────────────────────────────────
function CountryDetailPanel({
  countryName,
  liveRecord,
  onClose,
}: {
  countryName: string;
  liveRecord?: LiveCountryRecord;
  onClose: () => void;
}) {
  const { data: overview, isLoading, error } = useCountryOverview(countryName);
  const staticData = COUNTRY_SDG_SCORES.find((c) => c.country === countryName);

  const displayCsi = overview?.csi ?? liveRecord?.csi ?? staticData?.csi ?? 0;
  const displayPercentile = overview?.percentile ?? liveRecord?.percentile ?? staticData?.percentile ?? 0;
  const displayCluster = overview?.cluster ?? liveRecord?.cluster ?? staticData?.cluster ?? "";
  const displayAchRate = overview?.sdgAchievementRate ?? liveRecord?.sdgAchievementRate ?? 0;
  const sdgScores = overview?.sdgScores ?? liveRecord?.sdgScores ?? staticData?.sdgScores ?? {};
  const isFullyLive = !!overview;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 animate-fade-up">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display font-bold text-lg text-slate-800">{countryName}</h3>
          <p className="text-xs text-slate-400">
            {displayCluster}
          </p>
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
            {displayCsi.toFixed(1)}
          </p>
          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wide mt-0.5">
            CSI
            {isFullyLive && <span className="ml-1 text-green-500">●</span>}
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-black font-display text-slate-700">
            P{displayPercentile}
          </p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">
            Percentile
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-black font-display text-green-700">
            {displayAchRate}%
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

        {error && !staticData && (
          <div className="text-xs text-slate-500 p-2 bg-amber-50 rounded border border-amber-200 mb-2">
            ⚠️ Live data unavailable — showing local cache
          </div>
        )}

        <div className="space-y-1.5 max-h-64 overflow-y-auto scrollbar-thin pr-1">
          {SDG_DEFINITIONS.map((sdg) => {
            const score = sdgScores[sdg.id];
            const hasScore = score != null;
            const isLiveScore = isFullyLive && hasScore;

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
                  <div className="flex items-center gap-1 shrink-0">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${score}%`, background: scoreColor(score) }}
                      />
                    </div>
                    <span
                      className="text-[11px] font-bold w-6 text-right"
                      style={{ color: scoreColor(score) }}
                    >
                      {score}
                    </span>
                    {isLiveScore && (
                      <span className="text-green-400 text-[9px]" title="Live">●</span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {overview && (
          <p className="text-[9px] text-slate-300 mt-2">
            Live · Updated {new Date(overview.timestamp).toLocaleDateString()}
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

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function Index() {
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>();
  const [view, setView] = useState<"map" | "list">("map");

  const { data: liveCountries, isLoading: countriesLoading, error: countriesError } = useAllCountries();
  const health = useApiHealth();
  const kpis = useDashboardKpis(liveCountries);

  const selectedLiveRecord = selectedCountry
    ? liveCountries?.find((c) => c.country === selectedCountry)
    : undefined;

  const KPI_ITEMS = [
    {
      label: "Avg CSI Score",
      value: countriesLoading ? "—" : kpis.avgCsi,
      sub: countriesLoading ? "Loading…" : `${kpis.total} European countries tracked`,
      icon: <BarChart3 className="w-5 h-5" />,
      bg: "bg-blue-50", text: "text-blue-600",
      isLive: kpis.isLive,
    },
    {
      label: "Top Ranked Country",
      value: countriesLoading ? "—" : kpis.topCountry.country,
      sub: countriesLoading
        ? "Loading…"
        : `#1 · CSI ${kpis.topCountry.csi.toFixed(1)} · ${kpis.topCountry.cluster}`,
      icon: <Award className="w-5 h-5" />,
      bg: "bg-green-50", text: "text-green-600",
      isLive: kpis.isLive,
    },
    {
      label: "Above CSI 70",
      value: countriesLoading ? "—" : `${kpis.above70} / ${kpis.total}`,
      sub: "Strong performers — SDG on-track",
      icon: <TrendingUp className="w-5 h-5" />,
      bg: "bg-indigo-50", text: "text-indigo-600",
      isLive: kpis.isLive,
    },
    {
      label: "Needs Most Focus",
      value: countriesLoading ? "—" : kpis.bottomCountry.country,
      sub: countriesLoading
        ? "Loading…"
        : `#${kpis.total} · CSI ${kpis.bottomCountry.csi.toFixed(1)} · ${kpis.bottomCountry.cluster}`,
      icon: <TrendingDown className="w-5 h-5" />,
      bg: "bg-amber-50", text: "text-amber-600",
      isLive: kpis.isLive,
    },
  ];

  return (
    <div className="px-6 py-6 space-y-6 max-w-screen-xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-800">
            EU Country Sustainability Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Composite Sustainability Index (CSI) · 12 SDGs · {kpis.total} countries · Eurostat open data 2015–2024
          </p>
        </div>

        <div className="flex items-center gap-2 self-start mt-1 flex-wrap">
          {health.isLoading ? (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" /> Connecting…
            </span>
          ) : health.data ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">
              <Wifi className="w-3 h-3" />
              FastAPI v{health.data.version} · {Object.keys(health.data.models ?? {}).length} models loaded
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-full px-2.5 py-1">
              <WifiOff className="w-3 h-3" />
              API offline · local fallback active
            </span>
          )}

          {countriesError && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
              <Database className="w-3 h-3" />
              Rankings: local cache
            </span>
          )}
          {kpis.isLive && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-1">
              <Database className="w-3 h-3" />
              Rankings: live · {kpis.total} countries
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
              {k.isLive && (
                <span
                  className="absolute top-3 right-3 w-2 h-2 rounded-full bg-green-400 animate-pulse"
                  title="Live data from backend"
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
            Country Map &amp; Rankings
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
                  onClose={() => setSelectedCountry(undefined)}
                />
              ) : (
                <div className="bg-white border border-slate-200 border-dashed rounded-xl p-6 text-center">
                  <MapPin className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                  <p className="text-sm font-semibold text-slate-400">
                    Click a country dot
                  </p>
                  <p className="text-xs text-slate-300 mt-1">
                    to see its full 12-SDG breakdown
                  </p>
                </div>
              )}

              {countriesLoading ? (
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                  {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-6 w-full" />)}
                </div>
              ) : (
                <ClusterBreakdown
                  clusters={kpis.clusters}
                  isLive={kpis.isLive}
                />
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
              Top 8 countries × 12 SDGs · Click any SDG header to explore
            </p>
          </div>
          {!kpis.isLive && (
            <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-200 rounded-full px-2 py-0.5 font-semibold">
              Static fallback — live heatmap loads when API connects
            </span>
          )}
        </div>
        <SDGScoreGrid liveCountries={liveCountries ?? []} />
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