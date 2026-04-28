import { useState } from "react";
import { MapPin, List, TrendingUp, TrendingDown, Award, Users, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { CITY_SDG_SCORES, SDG_DEFINITIONS } from "@/data/sdgData";
import CityMap from "@/components/dashboard/CityMap";
import CityRankingTable from "@/components/dashboard/CityRankingTable";
import SDGScoreGrid from "@/components/dashboard/SDGScoreGrid";

const CLUSTERS = [
  { name: "Nordic Leaders",              count: 5,  avgCsi: 86.8, color: "#15803d" },
  { name: "Western Innovators",          count: 14, avgCsi: 74.2, color: "#2563eb" },
  { name: "Mediterranean Transitioning", count: 11, avgCsi: 61.5, color: "#d97706" },
  { name: "Central European Rising",     count: 7,  avgCsi: 57.8, color: "#c2410c" },
  { name: "Eastern Emerging",            count: 7,  avgCsi: 50.8, color: "#dc2626" },
];

function scoreColor(s: number) {
  if (s >= 80) return "#15803d";
  if (s >= 70) return "#2563eb";
  if (s >= 58) return "#d97706";
  return "#dc2626";
}

export default function Index() {
  const [selectedCity, setSelectedCity] = useState<string | undefined>();
  const [view, setView] = useState<"map" | "list">("map");

  const cities     = CITY_SDG_SCORES;
  const avgCsi     = (cities.reduce((s, c) => s + c.csi, 0) / cities.length).toFixed(1);
  const topCity    = [...cities].sort((a, b) => b.csi - a.csi)[0];
  const bottomCity = [...cities].sort((a, b) => a.csi - b.csi)[0];
  const above70    = cities.filter(c => c.csi >= 70).length;
  const cityData   = selectedCity ? cities.find(c => c.city === selectedCity) : null;

  // mock YoY trend from city name hash
  const yoy = (c: string) => {
    const h = c.split("").reduce((a, ch) => a + ch.charCodeAt(0), 0);
    return ((h % 80) - 30) / 10;
  };

  const KPI_ITEMS = [
    { label: "Avg CSI Score", value: avgCsi, sub: "44 EU cities", icon: <BarChart3 className="w-5 h-5" />, bg: "bg-blue-50", text: "text-blue-600" },
    { label: "Top City",      value: topCity.city, sub: `CSI ${topCity.csi}`, icon: <Award className="w-5 h-5" />, bg: "bg-green-50", text: "text-green-600" },
    { label: "Above CSI 70", value: `${above70} / ${cities.length}`, sub: "Strong performers", icon: <TrendingUp className="w-5 h-5" />, bg: "bg-indigo-50", text: "text-indigo-600" },
    { label: "Needs Focus",   value: bottomCity.city, sub: `CSI ${bottomCity.csi} · ${bottomCity.country}`, icon: <TrendingDown className="w-5 h-5" />, bg: "bg-amber-50", text: "text-amber-600" },
  ];

  return (
    <div className="px-6 py-6 space-y-6 max-w-screen-xl mx-auto">

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-800">EU City Sustainability Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Composite Sustainability Index (CSI) · 12 SDGs · 44 cities · Eurostat open data 2015–2024
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_ITEMS.map(k => (
          <div key={k.label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-9 h-9 rounded-lg ${k.bg} ${k.text} flex items-center justify-center mb-3`}>{k.icon}</div>
            <p className="text-xl font-black font-display text-slate-800 leading-none">{k.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{k.sub}</p>
            <p className="text-[11px] font-semibold text-slate-500 mt-2 border-t border-slate-100 pt-2">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Map / Table Toggle */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-slate-800">City Map &amp; Rankings</h2>
          <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white">
            {(["map","list"] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors ${
                  view === v ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-700"
                }`}
              >
                {v === "map" ? <MapPin className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
                {v === "map" ? "Map" : "Table"}
              </button>
            ))}
          </div>
        </div>

        {view === "map" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <CityMap selectedCity={selectedCity} onCityClick={setSelectedCity} />
            </div>

            {/* Right Panel */}
            <div className="space-y-3">
              {/* City Detail */}
              {cityData ? (
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 animate-fade-up">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display font-bold text-lg text-slate-800">{cityData.city}</h3>
                      <p className="text-xs text-slate-400">{cityData.country} · {cityData.cluster}</p>
                    </div>
                    <button onClick={() => setSelectedCity(undefined)} className="text-slate-300 hover:text-slate-600 text-lg leading-none">×</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-black font-display text-blue-700">{cityData.csi.toFixed(1)}</p>
                      <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wide mt-0.5">CSI Score</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-black font-display text-slate-700">P{cityData.percentile}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">EU Percentile</p>
                    </div>
                  </div>

                  {/* SDG Scores mini */}
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">SDG Breakdown</p>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin pr-1">
                      {SDG_DEFINITIONS.map(sdg => {
                        const s = cityData.sdgScores[sdg.id] ?? 0;
                        return (
                          <Link key={sdg.id} to={`/sdg/${sdg.slug}`} className="flex items-center gap-2 group">
                            <span className="w-5 h-5 rounded text-[10px] font-black flex items-center justify-center shrink-0"
                              style={{ background: sdg.bgColor, color: sdg.color }}>{sdg.id}</span>
                            <span className="text-[11px] text-slate-500 truncate flex-1 group-hover:text-slate-800 transition-colors">{sdg.shortTitle}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width:`${s}%`, background: scoreColor(s) }} />
                              </div>
                              <span className="text-[11px] font-bold w-5 text-right" style={{ color: scoreColor(s) }}>{s}</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 border-dashed rounded-xl p-6 text-center">
                  <MapPin className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                  <p className="text-sm font-semibold text-slate-400">Click a city dot</p>
                  <p className="text-xs text-slate-300 mt-1">to see its full SDG breakdown</p>
                </div>
              )}

              {/* Cluster Summary */}
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">City Clusters</p>
                </div>
                <div className="space-y-2.5">
                  {CLUSTERS.map(cl => (
                    <div key={cl.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cl.color }} />
                          <span className="text-xs text-slate-600 font-medium">{cl.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">{cl.count} cities</span>
                          <span className="text-xs font-bold" style={{ color: cl.color }}>{cl.avgCsi}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${cl.avgCsi}%`, background: cl.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <CityRankingTable selectedCity={selectedCity} onCitySelect={setSelectedCity} />
        )}
      </div>

      {/* SDG Heatmap */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-display font-semibold text-slate-800">SDG Score Heatmap</h2>
            <p className="text-xs text-slate-400 mt-0.5">Top 8 cities × 12 SDGs — click any SDG header to explore</p>
          </div>
        </div>
        <SDGScoreGrid />
      </div>

      {/* SDG Cards Grid */}
      <div>
        <h2 className="font-display font-semibold text-slate-800 mb-3">Explore by SDG</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
          {SDG_DEFINITIONS.map(sdg => (
            <Link key={sdg.id} to={`/sdg/${sdg.slug}`}
              className="bg-white border border-slate-200 rounded-xl p-3.5 text-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="w-11 h-11 rounded-xl mx-auto mb-2 flex items-center justify-center text-lg font-black font-display"
                style={{ background: sdg.bgColor, color: sdg.color }}>{sdg.id}</div>
              <p className="text-xs font-semibold text-slate-700 group-hover:text-blue-700 transition-colors leading-tight">{sdg.shortTitle}</p>
              <span className={`mt-1.5 inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                sdg.type === "direct" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
              }`}>{sdg.type}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
