import { useState, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Search, TrendingUp, TrendingDown } from "lucide-react";
import { CITY_SDG_SCORES } from "@/data/sdgData";
import { Link } from "react-router-dom";

type SortKey = "city" | "country" | "csi" | "percentile" | "sdgAchievementRate";
type SortDir = "asc" | "desc";

function CsiPill({ score }: { score: number }) {
  const cls = score >= 78 ? "csi-pill-high" : score >= 65 ? "csi-pill-mid" : "csi-pill-low";
  return <span className={`csi-pill ${cls}`}>{score.toFixed(1)}</span>;
}

function TrendBadge({ change }: { change: number }) {
  if (change > 0) return (
    <span className="badge-success inline-flex items-center gap-1">
      <TrendingUp className="w-3 h-3" /> +{change.toFixed(1)}
    </span>
  );
  if (change < 0) return (
    <span className="badge-danger inline-flex items-center gap-1">
      <TrendingDown className="w-3 h-3" /> {change.toFixed(1)}
    </span>
  );
  return <span className="badge-neutral">—</span>;
}

const CLUSTER_COLORS: Record<string, string> = {
  "Nordic Leaders": "bg-green-100 text-green-700",
  "Western Innovators": "bg-blue-100 text-blue-700",
  "Mediterranean Transitioning": "bg-orange-100 text-orange-700",
  "Central European Rising": "bg-yellow-100 text-yellow-700",
  "Eastern Emerging": "bg-red-100 text-red-700",
};

interface Props {
  selectedCity?: string;
  onCitySelect?: (city: string) => void;
  limit?: number;
}

export default function CityRankingTable({ selectedCity, onCitySelect, limit }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("csi");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [search, setSearch] = useState("");
  const [clusterFilter, setClusterFilter] = useState("All");

  const clusters = ["All", "Nordic Leaders", "Western Innovators", "Mediterranean Transitioning", "Central European Rising", "Eastern Emerging"];

  const sorted = useMemo(() => {
    let data = [...CITY_SDG_SCORES];

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(c => c.city.toLowerCase().includes(q) || c.country.toLowerCase().includes(q));
    }
    if (clusterFilter !== "All") {
      data = data.filter(c => c.cluster === clusterFilter);
    }

    data.sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      const dir = sortDir === "asc" ? 1 : -1;
      if (typeof av === "string" && typeof bv === "string") return av.localeCompare(bv) * dir;
      return ((av as number) - (bv as number)) * dir;
    });

    return limit ? data.slice(0, limit) : data;
  }, [sortKey, sortDir, search, clusterFilter, limit]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ArrowUpDown className="w-3 h-3 text-muted-foreground/50" />;
    return sortDir === "asc"
      ? <ArrowUp className="w-3 h-3 text-blue-600" />
      : <ArrowDown className="w-3 h-3 text-blue-600" />;
  }

  // Mock YoY trend (-3 to +5)
  const trend = (city: string) => {
    const hash = city.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return ((hash % 80) - 30) / 10;
  };

  return (
    <div className="card-base overflow-hidden">
      {/* Filters */}
      <div className="px-4 py-3 border-b border-border flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Search city or country…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="text-sm border border-border rounded-lg px-2.5 py-1.5 bg-muted/30 focus:outline-none cursor-pointer"
          value={clusterFilter}
          onChange={e => setClusterFilter(e.target.value)}
        >
          {clusters.map(c => <option key={c}>{c}</option>)}
        </select>
        <span className="text-xs text-muted-foreground ml-auto">{sorted.length} cities</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-10 text-center">#</th>
              <th>
                <button className="flex items-center gap-1 hover:text-foreground transition-colors" onClick={() => handleSort("city")}>
                  City <SortIcon k="city" />
                </button>
              </th>
              <th>
                <button className="flex items-center gap-1 hover:text-foreground transition-colors" onClick={() => handleSort("country")}>
                  Country <SortIcon k="country" />
                </button>
              </th>
              <th>Cluster</th>
              <th>
                <button className="flex items-center gap-1 hover:text-foreground transition-colors" onClick={() => handleSort("csi")}>
                  CSI Score <SortIcon k="csi" />
                </button>
              </th>
              <th>
                <button className="flex items-center gap-1 hover:text-foreground transition-colors" onClick={() => handleSort("percentile")}>
                  EU Rank <SortIcon k="percentile" />
                </button>
              </th>
              <th>YoY ▲</th>
              <th>
                <button className="flex items-center gap-1 hover:text-foreground transition-colors" onClick={() => handleSort("sdgAchievementRate")}>
                  SDG Achieved <SortIcon k="sdgAchievementRate" />
                </button>
              </th>
              <th>Explore</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((city, idx) => (
              <tr
                key={city.city}
                className={`cursor-pointer transition-colors ${city.city === selectedCity ? "bg-blue-50/70" : ""}`}
                onClick={() => onCitySelect?.(city.city)}
              >
                <td className="text-center text-muted-foreground font-mono text-xs">{idx + 1}</td>
                <td>
                  <span className="font-semibold text-foreground">{city.city}</span>
                </td>
                <td>
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <span className="font-mono text-[11px] bg-muted/60 px-1.5 py-0.5 rounded">{city.countryCode}</span>
                    <span className="hidden sm:inline">{city.country}</span>
                  </span>
                </td>
                <td>
                  <span className={`badge text-[11px] ${CLUSTER_COLORS[city.cluster] || "badge-neutral"}`} style={{ fontSize: "11px" }}>
                    {city.cluster}
                  </span>
                </td>
                <td><CsiPill score={city.csi} /></td>
                <td>
                  <span className="text-sm font-medium">P{city.percentile}</span>
                </td>
                <td><TrendBadge change={trend(city.city)} /></td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="progress-track w-20">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${city.sdgAchievementRate}%`,
                          background: city.sdgAchievementRate >= 80 ? "#16a34a" : city.sdgAchievementRate >= 65 ? "#2563eb" : "#f59e0b",
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium">{city.sdgAchievementRate}%</span>
                  </div>
                </td>
                <td>
                  <Link
                    to={`/sdg/sdg-11`}
                    onClick={e => e.stopPropagation()}
                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
