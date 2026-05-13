// src/components/dashboard/SDGScoreGrid.tsx
//
// Heatmap layout:
//   Rows 1–8   → Top 8 EU countries by CSI (descending)
//   Row 9      → Visual separator  "···  N more countries"
//   Rows 10–11 → Bottom 2 EU countries by CSI (lowest)
//
// Live data:   SDG 5 / 6 / 7  → GET /sdg-scores/{country}  (FastAPI backend)
// Pending:     SDG 8 / 11 / 12 → backend returns null  →  shown as "—"
// All 12 SDGs: 3,5,6,7,8,9,10,11,12,13,15,17 (per spec)

import { useQueries } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { LiveCountryRecord } from "@/types/countryTypes";
import { COUNTRY_SDG_SCORES, SDG_DEFINITIONS } from "@/data/sdgData";

// ─── Config ────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL ?? "http://187.127.164.121:8000";

/** SDGs the Python/FastAPI backend currently serves live historical data for */
const LIVE_SDG_IDS = new Set([5, 6, 7]);

/** SDGs whose backend models are still in development → always show "—" */
const PENDING_SDG_IDS = new Set([8, 11, 12]);

// ─── Types ─────────────────────────────────────────────────────────────────
interface SdgEntry {
  id: number;
  slug: string;
  score: number | null;
}

interface CountryScoreResponse {
  country: string;
  countryCode: string;
  compositeCsi: number | null;
  sdgScores: Record<string, SdgEntry>;
  /** ISO-8601 timestamp from Python backend */
  timestamp: string;
  dataSource: string;
}

// ─── Country row builder ────────────────────────────────────────────────────
function buildCountryRows(countries: typeof COUNTRY_SDG_SCORES = COUNTRY_SDG_SCORES) {
  return [...countries].sort((a, b) => b.csi - a.csi);
}

// ─── Style helpers ──────────────────────────────────────────────────────────
function cellStyle(score: number | null, isPending = false): React.CSSProperties {
  if (isPending || score === null) return { background: "#f8fafc", color: "#cbd5e1" };
  if (score >= 80) return { background: "#dcfce7", color: "#15803d" };
  if (score >= 70) return { background: "#dbeafe", color: "#1d4ed8" };
  if (score >= 55) return { background: "#fef9c3", color: "#a16207" };
  if (score >= 40) return { background: "#ffedd5", color: "#c2410c" };
  return { background: "#fee2e2", color: "#b91c1c" };
}

function csiChipClass(csi: number): string {
  if (csi >= 80) return "bg-green-100 text-green-700 border border-green-200";
  if (csi >= 68) return "bg-blue-100  text-blue-700  border border-blue-200";
  if (csi >= 55) return "bg-yellow-100 text-yellow-700 border border-yellow-200";
  if (csi >= 50) return "bg-violet-100 text-violet-700 border border-violet-200";
  return "bg-red-100 text-red-700 border border-red-200";
}

// ─── Fetch function (FastAPI / Python backend) ──────────────────────────────
async function fetchCountryScores(countryName: string): Promise<CountryScoreResponse> {
  const res = await fetch(`${API_BASE}/sdg-scores/${encodeURIComponent(countryName)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${countryName}`);
  return res.json() as Promise<CountryScoreResponse>;
}

// ─── Heatmap row sub-component ───────────────────────────────────────────────
interface RowProps {
  row:        typeof COUNTRY_SDG_SCORES[0];
  rankLabel:  string;   // "1"…"8" | "43"…"44" etc.
  rankClass:  string;   // Tailwind classes for rank badge
  liveData:   CountryScoreResponse | undefined;
  isLoading:  boolean;
  isError:    boolean;
}

function HeatmapRow({ row, rankLabel, rankClass, liveData, isLoading, isError }: RowProps) {
  const liveCsi    = liveData?.compositeCsi ?? null;
  const displayCsi = liveCsi ?? row.csi;

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors group">

      {/* ── Rank ── */}
      <td className="px-3 py-2.5 text-center sticky left-0 bg-white group-hover:bg-slate-50/60
                     z-10 border-r border-slate-100 w-9">
        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full
                          text-[10px] font-black ${rankClass}`}>
          {rankLabel}
        </span>
      </td>

      {/* ── Country ── */}
      <td className="px-4 py-2.5 sticky left-9 bg-white group-hover:bg-slate-50/60
                     z-10 border-r border-slate-100 min-w-[152px]">
        <p className="font-bold text-slate-800 text-xs leading-tight">{row.country}</p>
        <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
          {row.countryCode}
          {isError && (
            <span className="ml-1 text-amber-500" title="API unavailable — showing local cache">
              ⚠
            </span>
          )}
        </p>
      </td>

      {/* ── SDG cells ── */}
      {SDG_DEFINITIONS.map(sdg => {
        const isLive    = LIVE_SDG_IDS.has(sdg.id);
        const isPending = PENDING_SDG_IDS.has(sdg.id);

        let score: number | null = null;
        let usedMock = false;

        if (isPending) {
          score = null;
        } else if (isLoading) {
          score = null;
        } else if (liveData && isLive) {
          const entry = Object.values(liveData.sdgScores).find(e => e.id === sdg.id);
          score = entry?.score ?? null;
        } else if (isError && isLive) {
          // API failed — degrade gracefully to local mock
          score    = (row.sdgScores as Record<number, number>)[sdg.id] ?? null;
          usedMock = true;
        } else {
          // Non-live, non-pending SDG → local mock data
          score    = (row.sdgScores as Record<number, number>)[sdg.id] ?? null;
          usedMock = true;
        }

        const style = cellStyle(score, isPending);

        return (
          <td
            key={sdg.id}
            className="px-1 py-2.5 text-center transition-colors"
            style={style}
            title={
              isPending
                ? `SDG ${sdg.id}: backend model in development`
                : usedMock
                ? `SDG ${sdg.id} ${sdg.shortTitle}: ${score} (local cache — API offline)`
                : score !== null
                ? `SDG ${sdg.id} ${sdg.shortTitle}: ${score}`
                : `SDG ${sdg.id}: data unavailable`
            }
          >
            {isLoading && isLive ? (
              <span className="inline-block w-6 h-2.5 bg-slate-200 rounded animate-pulse" />
            ) : isPending ? (
              <span className="text-[10px] text-slate-300">—</span>
            ) : score !== null ? (
              <span className={`font-bold text-xs tabular-nums ${usedMock ? "opacity-50" : ""}`}>
                {Math.round(score)}
              </span>
            ) : (
              <span className="text-[10px] text-slate-300">—</span>
            )}
          </td>
        );
      })}

      {/* ── CSI chip ── */}
      <td className="px-3 py-2.5 text-center border-l border-slate-100 min-w-[64px]">
        <span className={`inline-block px-1.5 py-0.5 rounded font-black text-xs tabular-nums
                          ${csiChipClass(displayCsi)}`}>
          {displayCsi.toFixed(1)}
        </span>
        {liveCsi !== null && (
          <span className="block text-[8px] text-green-500 leading-none mt-0.5 font-semibold">
            ● live
          </span>
        )}
      </td>
    </tr>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
interface Props {
  /** Live country records from backend (fallback to mock if not provided) */
  liveCountries?: LiveCountryRecord[];
}

export default function SDGScoreGrid({ liveCountries }: Props) {
  // Build country rows from live data if available, otherwise use mock data
  const ALL_COUNTRY_ROWS    = buildCountryRows(
    liveCountries && liveCountries.length > 0 ? liveCountries : COUNTRY_SDG_SCORES
  );
  const TOP_ROWS            = ALL_COUNTRY_ROWS.slice(0, 8);
  const BOTTOM_ROWS         = ALL_COUNTRY_ROWS.slice(-2);

  // Deduplicated fetch list (handles edge-case where total countries < 10)
  const UNIQUE_FETCH_ROWS   = [...TOP_ROWS, ...BOTTOM_ROWS].filter(
    (r, i, arr) => arr.findIndex(x => x.country === r.country) === i,
  );

  // Parallel queries — one per unique country; 15-min cache
  const queries = useQueries({
    queries: UNIQUE_FETCH_ROWS.map(row => ({
      queryKey:  ["sdg-scores", row.country] as const,
      queryFn:   () => fetchCountryScores(row.country),
      staleTime: 1000 * 60 * 15,
      retry:     1,
    })),
  });

  // Build lookup: country → { data, isLoading, isError }
  const byCountry: Record<string, {
    data?:      CountryScoreResponse;
    isLoading:  boolean;
    isError:    boolean;
  }> = {};
  UNIQUE_FETCH_ROWS.forEach((row, i) => {
    byCountry[row.country] = {
      data:      queries[i].data,
      isLoading: queries[i].isLoading,
      isError:   queries[i].isError,
    };
  });

  const loadedCount    = queries.filter(q => q.isSuccess).length;
  const errorCount     = queries.filter(q => q.isError).length;
  const totalCount     = queries.length;
  const allDone        = queries.every(q => !q.isLoading);
  const lastTimestamp  = queries.find(q => q.data)?.data?.timestamp;
  const totalCountries = ALL_COUNTRY_ROWS.length;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">

      {/* ── Header ── */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-start
                      justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-800 text-sm">SDG Score Heatmap</h3>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
            Last known <strong>Eurostat historical</strong> values (not forecast) ·
            Top 8 + Bottom 2 EU countries by CSI ·{" "}
            <strong className="text-green-600">SDG 5 / 6 / 7</strong> live via FastAPI ·{" "}
            <strong className="text-slate-400">SDG 8 / 11 / 12</strong> model pending
            {lastTimestamp && (
              <>
                {" · "}fetched at{" "}
                {new Date(lastTimestamp).toLocaleTimeString([], {
                  hour: "2-digit", minute: "2-digit",
                })}
              </>
            )}
          </p>
        </div>

        {/* Status pill + colour legend */}
        <div className="flex items-center gap-2 flex-wrap">
          {!allDone ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold
                             text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Fetching {loadedCount}/{totalCount}…
            </span>
          ) : errorCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold
                             text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
              ⚠ {errorCount} API error · rest live
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold
                             text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {loadedCount} countries live
            </span>
          )}

          {/* Colour scale legend */}
          <div className="flex items-center gap-1 flex-wrap">
            {([
              { label: "≥80",   bg: "#dcfce7", fg: "#15803d" },
              { label: "70–79", bg: "#dbeafe", fg: "#1d4ed8" },
              { label: "55–69", bg: "#fef9c3", fg: "#a16207" },
              { label: "40–54", bg: "#ffedd5", fg: "#c2410c" },
              { label: "<40",   bg: "#fee2e2", fg: "#b91c1c" },
            ] as const).map(l => (
              <span
                key={l.label}
                className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                style={{ background: l.bg, color: l.fg }}
              >
                {l.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">

          {/* Column headers */}
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {/* Rank */}
              <th className="px-3 py-2.5 text-[10px] font-bold text-slate-400 uppercase
                             tracking-wide sticky left-0 bg-slate-50 z-20 border-r border-slate-200
                             w-9 text-center">
                #
              </th>
              {/* Country */}
              <th className="px-4 py-2.5 text-left text-[11px] font-bold text-slate-500
                             uppercase tracking-wide sticky left-9 bg-slate-50 z-20
                             border-r border-slate-200 min-w-[152px]">
                Country
              </th>
              {/* SDG columns — all 12 SDGs per spec */}
              {SDG_DEFINITIONS.map(sdg => {
                const isLive    = LIVE_SDG_IDS.has(sdg.id);
                const isPending = PENDING_SDG_IDS.has(sdg.id);
                return (
                  <th
                    key={sdg.id}
                    className="px-1 py-2.5 text-center border-r border-slate-100 last:border-r-0"
                    style={{ minWidth: 52 }}
                  >
                    <Link
                      to={`/sdg/${sdg.slug}`}
                      className="flex flex-col items-center gap-1 group"
                      title={`SDG ${sdg.id}: ${sdg.shortTitle}`}
                    >
                      <span
                        className="w-6 h-6 rounded text-[10px] font-black flex items-center
                                   justify-center group-hover:scale-110 transition-transform"
                        style={{ background: sdg.bgColor, color: sdg.color }}
                      >
                        {sdg.id}
                      </span>
                      <span
                        className="text-[9px] text-slate-400 font-normal leading-tight text-center"
                        style={{ maxWidth: 48 }}
                      >
                        {sdg.shortTitle}
                      </span>
                      {isLive ? (
                        <span className="text-[8px] text-green-500 font-semibold leading-none">
                          live
                        </span>
                      ) : isPending ? (
                        <span className="text-[8px] text-slate-300 italic leading-none">
                          pending
                        </span>
                      ) : (
                        <span className="text-[8px] text-slate-400 font-medium leading-none">
                          mock
                        </span>
                      )}
                    </Link>
                  </th>
                );
              })}
              {/* CSI */}
              <th className="px-3 py-2.5 text-center text-[11px] font-bold text-slate-500
                             uppercase tracking-wide border-l border-slate-200 min-w-[64px]">
                CSI
              </th>
            </tr>
          </thead>

          <tbody>
            {/* Top 8 rows */}
            {TOP_ROWS.map((row, i) => {
              const q = byCountry[row.country];
              return (
                <HeatmapRow
                  key={row.country}
                  row={row}
                  rankLabel={String(i + 1)}
                  rankClass="bg-green-100 text-green-700"
                  liveData={q?.data}
                  isLoading={q?.isLoading ?? false}
                  isError={q?.isError ?? false}
                />
              );
            })}

            {/* Separator */}
            <tr className="border-b border-dashed border-slate-200 bg-slate-50/50">
              <td className="px-3 py-1.5 text-center sticky left-0 bg-slate-50/50 z-10
                             border-r border-slate-100">
                <span className="text-slate-300 text-[10px] font-bold">⋯</span>
              </td>
              <td className="px-4 py-1.5 sticky left-9 bg-slate-50/50 z-10 border-r border-slate-100">
                <span className="text-[10px] text-slate-300 italic">
                  {totalCountries - 10} more countries not shown
                </span>
              </td>
              {SDG_DEFINITIONS.map(sdg => (
                <td key={sdg.id} className="py-1.5 border-r border-slate-100" />
              ))}
              <td className="py-1.5 border-l border-slate-100" />
            </tr>

            {/* Bottom 2 rows */}
            {BOTTOM_ROWS.map((row, i) => {
              const q            = byCountry[row.country];
              const absoluteRank = totalCountries - (BOTTOM_ROWS.length - 1 - i);
              return (
                <HeatmapRow
                  key={row.country}
                  row={row}
                  rankLabel={String(absoluteRank)}
                  rankClass="bg-red-100 text-red-600"
                  liveData={q?.data}
                  isLoading={q?.isLoading ?? false}
                  isError={q?.isError ?? false}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Footer ── */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap
                      items-center justify-between gap-2">
        <p className="text-[10px] text-slate-400">
          <strong className="text-green-600">SDG 5</strong> = Gender Employment Gap
          (<code className="bg-slate-100 px-1 rounded">tesem060 / lfsi_emp_a</code>) ·{" "}
          <strong className="text-green-600">SDG 6</strong> = Water Exploitation Index WEI+
          (<code className="bg-slate-100 px-1 rounded">sdg_06_60</code>) ·{" "}
          <strong className="text-green-600">SDG 7</strong> = Renewable Energy Share
          (<code className="bg-slate-100 px-1 rounded">sdg_07_40</code>)
        </p>
        <p className="text-[10px] text-slate-300">
          Historical Eurostat data · not forecast · SDG 8 / 11 / 12 backend models in development
        </p>
      </div>
    </div>
  );
}