// src/components/dashboard/CountryRankingTable.tsx
import { useState, useMemo } from "react";
import {
  ArrowUpDown, ArrowUp, ArrowDown, Search,
  TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import { COUNTRY_SDG_SCORES } from "@/data/sdgData";
import type { LiveCountryRecord } from "@/types/countryTypes";
import { Link } from "react-router-dom";

// ─── Types ─────────────────────────────────────────────────────────────────
type SortKey = "country" | "csi" | "percentile" | "sdgAchievementRate";
type SortDir = "asc" | "desc";

// ─── Constants ─────────────────────────────────────────────────────────────
// Correct cluster names from spec — 5 clusters matching CSI ranges
const CLUSTERS = [
  "All",
  "Nordic Leaders",
  "Western Innovators",
  "Mediterranean Transitioning",
  "Central European Rising",
  "Eastern Emerging",
] as const;

const CLUSTER_STYLES: Record<string, string> = {
  "Nordic Leaders":               "bg-green-100 text-green-700 border border-green-200",
  "Western Innovators":           "bg-blue-100  text-blue-700  border border-blue-200",
  "Mediterranean Transitioning":  "bg-orange-100 text-orange-700 border border-orange-200",
  "Central European Rising":      "bg-violet-100 text-violet-700 border border-violet-200",
  "Eastern Emerging":             "bg-red-100   text-red-700   border border-red-200",
};

// ─── Sub-components ─────────────────────────────────────────────────────────
function CsiPill({ score }: { score: number }) {
  const cls =
    score >= 80 ? "bg-green-100 text-green-700 border border-green-200" :
    score >= 68 ? "bg-blue-100  text-blue-700  border border-blue-200"  :
    score >= 55 ? "bg-orange-100 text-orange-700 border border-orange-200" :
    score >= 50 ? "bg-violet-100 text-violet-700 border border-violet-200" :
                  "bg-red-100   text-red-700   border border-red-200";
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold tabular-nums ${cls}`}
    >
      {score.toFixed(1)}
    </span>
  );
}

function TrendBadge({ change }: { change: number }) {
  if (change > 0.5)
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
        <TrendingUp className="w-3 h-3" />+{change.toFixed(1)}
      </span>
    );
  if (change < -0.5)
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
        <TrendingDown className="w-3 h-3" />{change.toFixed(1)}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
      <Minus className="w-3 h-3" />—
    </span>
  );
}

/** Deterministic pseudo-random YoY trend from country name (no Math.random) */
function deterministicTrend(country: string): number {
  const hash = country.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) & 0xffff, 0);
  // Maps 0–65535 → -3.5 to +5.0
  return Math.round(((hash % 850) - 350) / 100);
}

// ─── Props ──────────────────────────────────────────────────────────────────
interface Props {
  selectedCountry?: string;
  onCountrySelect?: (country: string | undefined) => void;
  /** Live country records from backend (fallback to mock if not provided) */
  liveCountries?: LiveCountryRecord[];
  /** Indicate loading state */
  isLoading?: boolean;
  /** Limit rows shown (e.g. on homepage preview) */
  limit?: number;
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function CountryRankingTable({ 
  selectedCountry, 
  onCountrySelect, 
  liveCountries,
  isLoading = false,
  limit 
}: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("csi");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [search, setSearch] = useState("");
  const [clusterFilter, setClusterFilter] = useState<string>("All");

  const sorted = useMemo(() => {
    // Use live countries if provided, otherwise fall back to mock data
    let data = (liveCountries && liveCountries.length > 0)
      ? liveCountries.map(c => {
          // If it's the backend response structure, map it
          if ('compositeCsi' in c) {
            const staticMatch = COUNTRY_SDG_SCORES.find(s => s.country === c.country);
            return {
              country: c.country,
              countryCode: c.countryCode,
              csi: c.compositeCsi ?? 0,
              percentile: staticMatch?.percentile ?? 50,
              sdgAchievementRate: staticMatch?.sdgAchievementRate ?? 0,
              cluster: staticMatch?.cluster ?? "EU Region",
              isLive: true,
              sdgScores: Object.entries(c.sdgScores).reduce((acc: any, [key, val]: [string, any]) => {
                const id = parseInt(key.replace('sdg', ''));
                acc[id] = val.score;
                return acc;
              }, {})
            };
          }
          return { ...c, isLive: false };
        })
      : COUNTRY_SDG_SCORES.map(c => ({ ...c, isLive: false }));

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        c =>
          c.country.toLowerCase().includes(q) ||
          c.countryCode.toLowerCase().includes(q),
      );
    }

    // Filter by cluster
    if (clusterFilter !== "All") {
      data = data.filter(c => c.cluster === clusterFilter);
    }

    // Sort
    data.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const dir = sortDir === "asc" ? 1 : -1;
      if (typeof av === "string" && typeof bv === "string")
        return av.localeCompare(bv) * dir;
      return ((av as number) - (bv as number)) * dir;
    });

    return limit ? data.slice(0, limit) : data;
  }, [sortKey, sortDir, search, clusterFilter, limit, liveCountries]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k)
      return <ArrowUpDown className="w-3 h-3 text-slate-300" />;
    return sortDir === "asc"
      ? <ArrowUp className="w-3 h-3 text-blue-600" />
      : <ArrowDown className="w-3 h-3 text-blue-600" />;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">

      {/* ── Filters bar ── */}
      <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg
                       bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200
                       placeholder:text-slate-400"
            placeholder="Search country or code…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Cluster filter */}
        <select
          className="text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50
                     focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer"
          value={clusterFilter}
          onChange={e => setClusterFilter(e.target.value)}
        >
          {CLUSTERS.map(c => <option key={c}>{c}</option>)}
        </select>

        {/* Row count */}
        <span className="text-xs text-slate-400 ml-auto tabular-nums">
          {sorted.length} / {COUNTRY_SDG_SCORES.length} countries
        </span>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-left">
              <th className="px-3 py-3 text-center text-[10px] font-bold text-slate-400
                             uppercase tracking-wide w-10">
                #
              </th>

              <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                <button
                  className="flex items-center gap-1 hover:text-slate-800 transition-colors"
                  onClick={() => handleSort("country")}
                >
                  Country <SortIcon k="country" />
                </button>
              </th>

              <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                Cluster
              </th>

              <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                <button
                  className="flex items-center gap-1 hover:text-slate-800 transition-colors"
                  onClick={() => handleSort("csi")}
                >
                  CSI Score <SortIcon k="csi" />
                </button>
              </th>

              <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                <button
                  className="flex items-center gap-1 hover:text-slate-800 transition-colors"
                  onClick={() => handleSort("percentile")}
                >
                  EU Rank <SortIcon k="percentile" />
                </button>
              </th>

              <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                YoY ▲
              </th>

              <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                <button
                  className="flex items-center gap-1 hover:text-slate-800 transition-colors"
                  onClick={() => handleSort("sdgAchievementRate")}
                >
                  SDG Achieved <SortIcon k="sdgAchievementRate" />
                </button>
              </th>

              <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                Explore
              </th>
            </tr>
          </thead>

          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="py-12 text-center text-sm text-slate-400"
                >
                  No countries match your search.
                </td>
              </tr>
            ) : (
              sorted.map((country, idx) => {
                const yoy = deterministicTrend(country.country);
                return (
                  <tr
                    key={country.country}
                    className={`border-b border-slate-100 cursor-pointer transition-colors
                      hover:bg-slate-50 ${country.country === selectedCountry ? "bg-blue-50/70" : ""}`}
                    onClick={() => onCountrySelect?.(country.country)}
                  >
                    {/* Rank */}
                    <td className="px-3 py-2.5 text-center text-slate-400 font-mono text-[11px]">
                      <div className="flex items-center justify-center gap-1.5">
                        {country.isLive && (
                          <div className="w-1 h-1 rounded-full bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.6)]" />
                        )}
                        {idx + 1}
                      </div>
                    </td>

                    {/* Country */}
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800 text-xs">{country.country}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{country.countryCode}</span>
                      </div>
                    </td>

                    {/* Cluster */}
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold
                          ${CLUSTER_STYLES[country.cluster] ?? "bg-slate-100 text-slate-600"}`}
                      >
                        {country.cluster}
                      </span>
                    </td>

                    {/* CSI pill */}
                    <td className="px-4 py-2.5">
                      <CsiPill score={country.csi} />
                    </td>

                    {/* EU rank / percentile */}
                    <td className="px-4 py-2.5">
                      <span className="text-xs font-semibold tabular-nums">
                        P{country.percentile}
                      </span>
                    </td>

                    {/* YoY trend */}
                    <td className="px-4 py-2.5">
                      <TrendBadge change={yoy} />
                    </td>

                    {/* SDG achievement bar */}
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${country.sdgAchievementRate}%`,
                              background:
                                country.sdgAchievementRate >= 80 ? "#16a34a" :
                                country.sdgAchievementRate >= 65 ? "#2563eb" :
                                "#f59e0b",
                            }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold tabular-nums">
                          {country.sdgAchievementRate}%
                        </span>
                      </div>
                    </td>

                    {/* Explore link — links to country dashboard */}
                    <td className="px-4 py-2.5">
                      <Link
                        to={`/country/${encodeURIComponent(country.country)}`}
                        onClick={e => e.stopPropagation()}
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline
                                   font-semibold transition-colors"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer ── */}
      {limit && sorted.length < COUNTRY_SDG_SCORES.length && (
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-center">
          <Link
            to="/countries"
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            View all {COUNTRY_SDG_SCORES.length} countries →
          </Link>
        </div>
      )}
    </div>
  );
}