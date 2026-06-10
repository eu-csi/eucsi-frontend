import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { LiveCountryRecord } from "@/types/countryTypes";
import { COUNTRY_SDG_SCORES, SDG_DEFINITIONS } from "@/data/sdgData";
import { fetchSDGScoresBySDGYear } from "@/services/sdgScoresApi";

const LIVE_SDG_IDS = new Set([3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 17]);
const PENDING_SDG_IDS = new Set<number>([]);

type BaseCountryRow = (typeof COUNTRY_SDG_SCORES)[0];

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
  if (csi >= 68) return "bg-blue-100 text-blue-700 border border-blue-200";
  if (csi >= 55) return "bg-yellow-100 text-yellow-700 border border-yellow-200";
  if (csi >= 50) return "bg-violet-100 text-violet-700 border border-violet-200";
  return "bg-red-100 text-red-700 border border-red-200";
}

function normalizeCountryRows(input: LiveCountryRecord[] | BaseCountryRow[]): BaseCountryRow[] {
  return input
    .map((item: any) => {
      if ("country" in item && "countryCode" in item && "sdgScores" in item) {
        return item as BaseCountryRow;
      }

      return {
        country: item.country ?? item.name ?? item.country_name ?? "Unknown",
        countryCode: (item.countryCode ?? item.iso2 ?? item.country_iso2 ?? "XX").toUpperCase(),
        csi: Number(item.csi ?? item.compositeCsi ?? item.composite_csi ?? 0),
        sdgScores: item.sdgScores ?? {},
      } as BaseCountryRow;
    })
    .sort((a, b) => (b.csi ?? 0) - (a.csi ?? 0));
}

interface RowProps {
  row: BaseCountryRow;
  rankLabel: string;
  rankClass: string;
  countryScores: Record<number, number> | undefined;
  isLoading: boolean;
  isError: boolean;
}

function HeatmapRow({ row, rankLabel, rankClass, countryScores, isLoading, isError }: RowProps) {
  const liveSdgScores = countryScores
    ? Object.values(countryScores).filter((val): val is number => val !== null && val !== undefined)
    : [];

  const displayCsi =
    liveSdgScores.length > 0
      ? liveSdgScores.reduce((a, b) => a + b, 0) / liveSdgScores.length
      : row.csi;

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors group">
      <td className="px-3 py-2.5 text-center sticky left-0 bg-white group-hover:bg-slate-50/60 z-10 border-r border-slate-100 w-9">
        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black ${rankClass}`}>
          {rankLabel}
        </span>
      </td>

      <td className="px-4 py-2.5 sticky left-9 bg-white group-hover:bg-slate-50/60 z-10 border-r border-slate-100 min-w-[152px]">
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

      {SDG_DEFINITIONS.map((sdg) => {
        const isLive = LIVE_SDG_IDS.has(sdg.id);
        const isPending = PENDING_SDG_IDS.has(sdg.id);

        let score: number | null = null;
        let usedMock = false;

        if (isPending) {
          score = null;
        } else if (isLoading) {
          score = null;
        } else if (countryScores && countryScores[sdg.id] !== undefined && countryScores[sdg.id] !== null) {
          score = countryScores[sdg.id];
        } else if (isError && isLive) {
          score = (row.sdgScores as Record<number, number>)[sdg.id] ?? null;
          usedMock = true;
        } else {
          score = (row.sdgScores as Record<number, number>)[sdg.id] ?? null;
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

      <td className="px-3 py-2.5 text-center border-l border-slate-100 min-w-[64px]">
        <span className={`inline-block px-1.5 py-0.5 rounded font-black text-xs tabular-nums ${csiChipClass(displayCsi)}`}>
          {displayCsi.toFixed(1)}
        </span>
        {countryScores && liveSdgScores.length > 0 && (
          <span className="block text-[8px] text-green-500 leading-none mt-0.5 font-semibold">● live</span>
        )}
      </td>
    </tr>
  );
}

interface Props {
  liveCountries?: LiveCountryRecord[];
  selectedYear: number;
}

export default function SDGScoreGrid({ liveCountries, selectedYear }: Props) {
  const allCountryRows = useMemo(
    () =>
      normalizeCountryRows(
        liveCountries && liveCountries.length > 0 ? liveCountries : COUNTRY_SDG_SCORES
      ),
    [liveCountries]
  );

  const topRows = allCountryRows.slice(0, 8);
  const bottomRows = allCountryRows.slice(-2);

  const queries = useQueries({
    queries: SDG_DEFINITIONS.map((sdg) => ({
      queryKey: ["sdg-scores-by-sdg", sdg.id, selectedYear] as const,
      queryFn: () => fetchSDGScoresBySDGYear(sdg.id, selectedYear),
      staleTime: 1000 * 60 * 15,
      retry: 1,
    })),
  });

  const byCountryAndSdg: Record<string, Record<number, number>> = {};
  queries.forEach((q, idx) => {
    const sdgId = SDG_DEFINITIONS[idx].id;
    if (q.data) {
      q.data.forEach((item: any) => {
        const iso2 = item.country_iso2.toUpperCase();
        if (!byCountryAndSdg[iso2]) byCountryAndSdg[iso2] = {};
        byCountryAndSdg[iso2][sdgId] = item.normalised_score;
      });
    }
  });

  const loadedCount = queries.filter((q) => q.isSuccess).length;
  const errorCount = queries.filter((q) => q.isError).length;
  const totalCount = queries.length;
  const allDone = queries.every((q) => !q.isLoading);
  const totalCountries = allCountryRows.length;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-800 text-sm">SDG Score Heatmap</h3>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
            Last known <strong>Eurostat historical</strong> values · Top 8 + Bottom 2 EU countries by CSI ·{" "}
            <strong className="text-green-600">All 12 SDGs</strong> live via FastAPI &amp; PostgreSQL
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!allDone ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Fetching {loadedCount}/{totalCount}…
            </span>
          ) : errorCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
              ⚠ {errorCount} API error · rest live
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {loadedCount} SDGs live
            </span>
          )}

          <div className="flex items-center gap-1 flex-wrap">
            {[
              { label: "≥80", bg: "#dcfce7", fg: "#15803d" },
              { label: "70–79", bg: "#dbeafe", fg: "#1d4ed8" },
              { label: "55–69", bg: "#fef9c3", fg: "#a16207" },
              { label: "40–54", bg: "#ffedd5", fg: "#c2410c" },
              { label: "<40", bg: "#fee2e2", fg: "#b91c1c" },
            ].map((l) => (
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

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-3 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide sticky left-0 bg-slate-50 z-20 border-r border-slate-200 w-9 text-center">
                #
              </th>
              <th className="px-4 py-2.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wide sticky left-9 bg-slate-50 z-20 border-r border-slate-200 min-w-[152px]">
                Country
              </th>

              {SDG_DEFINITIONS.map((sdg) => {
                const isLive = LIVE_SDG_IDS.has(sdg.id);
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
                        className="w-6 h-6 rounded text-[10px] font-black flex items-center justify-center group-hover:scale-110 transition-transform"
                        style={{ background: sdg.bgColor, color: sdg.color }}
                      >
                        <div
                          className={`w-1 h-1 rounded-full mb-1 ${
                            isLive ? "bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.6)]" : "bg-red-500"
                          }`}
                        />
                        {sdg.id}
                      </span>
                      <span
                        className="text-[9px] text-slate-400 font-normal leading-tight text-center"
                        style={{ maxWidth: 48 }}
                      >
                        {sdg.shortTitle}
                      </span>
                      {isLive ? (
                        <span className="text-[8px] text-green-500 font-semibold leading-none">live</span>
                      ) : isPending ? (
                        <span className="text-[8px] text-slate-300 italic leading-none">pending</span>
                      ) : (
                        <span className="text-[8px] text-slate-400 font-medium leading-none">mock</span>
                      )}
                    </Link>
                  </th>
                );
              })}

              <th className="px-3 py-2.5 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wide border-l border-slate-200 min-w-[64px]">
                CSI
              </th>
            </tr>
          </thead>

          <tbody>
            {topRows.map((row, i) => {
              const countryScores = byCountryAndSdg[row.countryCode.toUpperCase()];
              return (
                <HeatmapRow
                  key={row.country}
                  row={row}
                  rankLabel={String(i + 1)}
                  rankClass="bg-green-100 text-green-700"
                  countryScores={countryScores}
                  isLoading={!allDone}
                  isError={errorCount > 0}
                />
              );
            })}

            <tr className="border-b border-dashed border-slate-200 bg-slate-50/50">
              <td className="px-3 py-1.5 text-center sticky left-0 bg-slate-50/50 z-10 border-r border-slate-100">
                <span className="text-slate-300 text-[10px] font-bold">⋯</span>
              </td>
              <td className="px-4 py-1.5 sticky left-9 bg-slate-50/50 z-10 border-r border-slate-100">
                <span className="text-[10px] text-slate-300 italic">
                  {Math.max(totalCountries - 10, 0)} more countries not shown
                </span>
              </td>
              {SDG_DEFINITIONS.map((sdg) => (
                <td key={sdg.id} className="py-1.5 border-r border-slate-100" />
              ))}
              <td className="py-1.5 border-l border-slate-100" />
            </tr>

            {bottomRows.map((row, i) => {
              const countryScores = byCountryAndSdg[row.countryCode.toUpperCase()];
              const absoluteRank = totalCountries - (bottomRows.length - 1 - i);
              return (
                <HeatmapRow
                  key={row.country}
                  row={row}
                  rankLabel={String(absoluteRank)}
                  rankClass="bg-red-100 text-red-600"
                  countryScores={countryScores}
                  isLoading={!allDone}
                  isError={errorCount > 0}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] text-slate-400">
          Historical Eurostat data loaded for 12 SDGs including Gender Equality, Water Exploitation, and Renewable Energy Share
        </p>
        <p className="text-[10px] text-slate-300">Database-backed live rankings and metrics</p>
      </div>
    </div>
  );
}