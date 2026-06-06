import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Database, TrendingUp, TrendingDown,
  Info, BarChart2, Table2, BookOpen, Minus, AlertTriangle, Zap, Target, RefreshCw,
} from "lucide-react";
import {
  SDG_DEFINITIONS, COUNTRY_SDG_SCORES, getTopCountriesForSdg, generateSdgTrendData,
} from "@/data/sdgData";
import {
  generateForecastData, detectAnomalies, getBenchmarks, SDG_FORECAST_LABELS,
} from "@/data/analyticsData";
import { useSDGScores, fetchIndicatorData, fetchCountriesList } from "@/services/sdgScoresApi";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ReferenceLine, Cell, LabelList, Scatter, ScatterChart, ZAxis,
} from "recharts";

// ─── Config ──────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL ?? "http://187.127.164.121:8002";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function scoreColor(s: number) {
  if (s >= 78) return "#15803d";
  if (s >= 65) return "#2563eb";
  if (s >= 55) return "#d97706";
  return "#dc2626";
}

/**
 * Format a value for metric card display.
 * Live DB values come as raw numbers (e.g. 53830 for GDP). This ensures they
 * display with proper comma separation and decimal rounding.
 */
function formatDisplayValue(rawValue: any, unit: string): string {
  if (rawValue === undefined || rawValue === null) return "—";
  if (typeof rawValue === "string" && rawValue !== "") return rawValue; // already formatted
  const num = Number(rawValue);
  if (isNaN(num)) return String(rawValue);
  // GDP (€) or other large numbers → integer with comma thousands separator
  if (unit === "€" || num > 9_999) return Math.round(num).toLocaleString("en-US");
  // Integers or numbers ≥ 100 → no decimals
  if (Number.isInteger(num) || num >= 100) return Math.round(num).toString();
  // Small decimals
  if (num >= 10) return num.toFixed(1);
  return num.toFixed(2);
}

function getMockMetricValues(sdgId: number, country: string): Record<string, { value: string | number; trend?: number; benchmark?: number; category?: string }> {
  const countryData = COUNTRY_SDG_SCORES.find(c => c.country === country);
  const score = countryData?.sdgScores[sdgId] ?? 65;
  const m = score / 100;
  const maps: Record<number, Record<string, any>> = {
    5:  { genderEmploymentGap: { value: +(22-m*18).toFixed(1), trend: -0.4, benchmark: 10.1 }, femaleEmploymentRate: { value: +(45+m*40).toFixed(1), trend: 1.2, benchmark: 68.4 }, genderGapTrend: { value: +(-0.9+m*0.8).toFixed(2), trend: 0.1, benchmark: -0.2 } },
    6:  { weiPlus: { value: +(40-m*35).toFixed(1), trend: -1.1, benchmark: 18.4 }, waterPerCapita: { value: Math.round(220-m*110), trend: -2.3, benchmark: 155 }, waterStressCategory: { value: "", category: m>=0.8?"No Stress":m>=0.65?"Low":m>=0.5?"Stress":"Severe" }, waterAbstractionTrend: { value: +(-0.5-m*0.8).toFixed(2), trend: -0.2, benchmark: -0.3 } },
    7:  { renewableShare: { value: +(10+m*55).toFixed(1), trend: 5.8, benchmark: 22.1 }, energyIntensity: { value: +(8-m*5).toFixed(2), trend: -0.4, benchmark: 5.2 }, aimForecast: { value: Math.round(800+m*2200), trend: 3.1, benchmark: 1450 }, distributionLosses: { value: Math.round(200-m*130), trend: -3.1, benchmark: 120 }, energyCategoryLabel: { value: "", category: m>=0.75?"High":m>=0.55?"Med":"Low" } },
    8:  { gdpPerCapita: { value: Math.round(18000+m*112000).toLocaleString(), trend: 2.1, benchmark: 31200 }, employmentRate: { value: +(55+m*30).toFixed(1), trend: 1.4, benchmark: 72.1 }, carbonIntensity: { value: Math.round(400-m*260), trend: -4.2, benchmark: 240 }, gdpGrowthTrend: { value: +(0.5+m*3).toFixed(1), trend: 0.3, benchmark: 1.8 } },
    11: { aqiPm25: { value: +(35-m*28).toFixed(1), trend: -2.1, benchmark: 18.3 }, greenSpacePerCapita: { value: +(4+m*25).toFixed(1), trend: 0.8, benchmark: 14.2 }, greenInfraShare: { value: +(15+m*35).toFixed(1), trend: 1.2, benchmark: 28.4 }, populationDensity: { value: Math.round(1500+(1-m)*5000), trend: 1.8, benchmark: 3200 }, publicTransportShare: { value: +(25+m*50).toFixed(1), trend: 2.3, benchmark: 44.2 }, trafficCongestionIndex: { value: +(50-m*38).toFixed(1), trend: -1.4, benchmark: 32.5 } },
    12: { recyclingRate: { value: +(25+m*50).toFixed(1), trend: 3.1, benchmark: 47.8 }, wastePerCapita: { value: Math.round(700-m*280), trend: -8.2, benchmark: 531 }, compostingRate: { value: +(5+m*25).toFixed(1), trend: 2.2, benchmark: 14.3 }, wasteReductionTrend: { value: +(-15+m*10).toFixed(1), trend: -1.1, benchmark: -4.2 } },
    13: { ghgPerCapita: { value: +(14-m*11).toFixed(1), trend: -4.1, benchmark: 7.2 }, carbonIntensityEconomy: { value: Math.round(550-m*400), trend: -5.2, benchmark: 246 }, totalGhgEmissions: { value: +(18-m*14).toFixed(1), trend: -3.8, benchmark: 12.4 }, emissionsReductionTrend: { value: +(m*6).toFixed(1), trend: 0.4, benchmark: 2.8 } },
    17: { datasetCoverage: { value: +(60+m*40).toFixed(1), trend: 2.1, benchmark: 78.4 }, dataFreshnessIndex: { value: +(3-m*2.2).toFixed(1), trend: -0.3, benchmark: 1.8 }, openDataCompliance: { value: +(70+m*30).toFixed(1), trend: 0.0, benchmark: 88.4 }, crossSdgCoverage: { value: Math.round(6+m*7), trend: 0.0, benchmark: 9.2 } },
    3:  { healthRiskScore: { value: +(80-m*65).toFixed(1), trend: -3.2, benchmark: 42.1 }, airPollutionExposure: { value: +(35-m*28).toFixed(1), trend: -2.1, benchmark: 18.3 }, greenSpaceDeficit: { value: +Math.max(0,9-(4+m*25)).toFixed(1), trend: -0.2, benchmark: 3.8 } },
    9:  { infrastructureModernity: { value: +(30+m*65).toFixed(1), trend: 2.8, benchmark: 58.3 }, energyProductivity: { value: +(3+m*8).toFixed(1), trend: 0.6, benchmark: 6.2 }, transportInfraScore: { value: +(25+m*65).toFixed(1), trend: 3.1, benchmark: 52.4 } },
    10: { genderEmploymentGap: { value: +(22-m*18).toFixed(1), trend: -0.4, benchmark: 10.1 }, gdpDisparityIndex: { value: +Math.abs(50-m*80).toFixed(1), trend: -1.2, benchmark: 18.2 }, interCountryInequalityScore: { value: +(35-m*28).toFixed(1), trend: -0.8, benchmark: 14.2 } },
    15: { urbanGreenCoverage: { value: +(15+m*35).toFixed(1), trend: 1.2, benchmark: 28.4 }, greenSpacePerCapita: { value: +(4+m*25).toFixed(1), trend: 0.8, benchmark: 14.2 }, greenInfraGap: { value: +Math.max(0,40-(15+m*35)).toFixed(1), trend: -0.6, benchmark: 11.6 }, urbanBiodiversityProxy: { value: +(25+m*65).toFixed(1), trend: 2.1, benchmark: 52.3 } },
  };
  return maps[sdgId] ?? {};
}

// ─── Chart Tooltip ────────────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-sm min-w-[160px]">
      <p className="font-bold text-slate-800 mb-2">{label}</p>
      {payload.filter((p: any) => p.value != null).map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-4 text-xs mb-0.5">
          <span style={{ color: p.color || p.stroke }} className="font-medium">{p.name}</span>
          <span className="font-bold text-slate-700">{typeof p.value === "number" ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Metric Card ──────────────────────────────────────────────────────────────
function MetricBlock({ metric, vals, color }: any) {
  const [open, setOpen] = useState(false);
  if (!vals) return null;
  const isCategory = metric.type === "category";
  const numVal = parseFloat(String(vals.value));
  const target = metric.euTarget ?? metric.whoThreshold;
  let status: "good"|"warn"|"bad"|null = null;
  if (target !== undefined && !isNaN(numVal) && !isCategory) {
    const d = metric.higherIsBetter ? numVal - target : target - numVal;
    status = d >= 0 ? "good" : d >= -target * 0.2 ? "warn" : "bad";
  }
  const catColors: Record<string,string> = { "No Stress":"#15803d","Low":"#2563eb","Stress":"#d97706","Severe":"#dc2626","High":"#15803d","Med":"#2563eb" };
  return (
    <div onClick={() => setOpen(!open)} className="bg-white border border-slate-200 rounded-xl p-4 cursor-pointer hover:shadow-md transition-all relative overflow-hidden group">
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ background: color }} />
      <div className="flex items-start justify-between gap-2 mb-2 pl-2">
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${metric.isLive ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500"}`} />
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide leading-tight">{metric.label}</p>
        </div>
        <Info className="w-3.5 h-3.5 text-slate-300 shrink-0" />
      </div>
      {isCategory ? (
        <div className="pl-2">
          <span className="inline-block px-3 py-1 rounded-full text-sm font-bold" style={{ background:`${catColors[vals.category]||"#64748b"}20`, color: catColors[vals.category]||"#64748b" }}>{vals.category}</span>
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
            {vals.trend !== undefined && (
              vals.trend > 0
                ? <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-green-600"><TrendingUp className="w-3 h-3"/>+{vals.trend.toFixed(1)}% YoY</span>
                : vals.trend < 0
                ? <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-red-500"><TrendingDown className="w-3 h-3"/>{vals.trend.toFixed(1)}% YoY</span>
                : <span className="inline-flex items-center gap-0.5 text-[11px] text-slate-400"><Minus className="w-3 h-3"/>Stable</span>
            )}
            {status && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${status==="good"?"bg-green-100 text-green-700":status==="warn"?"bg-amber-100 text-amber-700":"bg-red-100 text-red-600"}`}>{status==="good"?"✓ On Target":status==="warn"?"⚠ Near":"✕ Off Track"}</span>}
          </div>
        </div>
      )}
      {open && (
        <div className="mt-3 pt-3 border-t border-slate-100 pl-2 space-y-1.5 animate-fade-up">
          <p className="text-[11px] text-slate-500 leading-relaxed">{metric.description}</p>
          {vals.benchmark != null && <div className="flex justify-between text-[11px]"><span className="text-slate-400">EU27 avg</span><span className="font-semibold text-slate-700">{vals.benchmark} {metric.unit}</span></div>}
          {target != null && <div className="flex justify-between text-[11px]"><span className="text-slate-400">{metric.euTarget?"EU Target":"WHO Threshold"}</span><span className="font-semibold text-slate-700">{target} {metric.unit}</span></div>}
        </div>
      )}
    </div>
  );
}

const TABS = ["Overview", "Forecast", "Benchmarks", "Anomalies", "Country Rankings", "Metric Guide"] as const;
type Tab = typeof TABS[number];
const TAB_ICONS = { Overview: BarChart2, Forecast: Zap, Benchmarks: Target, Anomalies: AlertTriangle, "Country Rankings": Table2, "Metric Guide": BookOpen };

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SDGDetail() {
  const { sdgSlug } = useParams<{ sdgSlug: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("Overview");
  const [country, setCountry] = useState("Sweden");

  const sdg = SDG_DEFINITIONS.find(s => s.slug === sdgSlug);
  if (!sdg) return <div className="flex items-center justify-center py-24 text-slate-500"><div className="text-center"><p className="font-bold text-xl mb-2">SDG not found</p><Link to="/" className="text-blue-600">← Dashboard</Link></div></div>;

  const { data: liveData, isLoading: liveLoading, isError: liveError } = useSDGScores(country);

  const allSdgs = SDG_DEFINITIONS;
  const idx = allSdgs.findIndex(s => s.slug === sdgSlug);
  const prevSdg = allSdgs[idx-1], nextSdg = allSdgs[idx+1];

  const countryRow  = COUNTRY_SDG_SCORES.find(c => c.country === country);
  
  // Merge live metrics with mock metrics
  const metricVals = useMemo(() => {
    const base = getMockMetricValues(sdg.id, country);
    if (!liveData?.sdgScores) return base;

    // Find the score for the current SDG
    const liveSdg = Object.values(liveData.sdgScores).find(s => s.id === sdg.id);
    if (!liveSdg?.metrics) return base;

    const merged = { ...base };
    for (const [key, val] of Object.entries(liveSdg.metrics)) {
      if (merged[key]) {
        merged[key] = { ...merged[key], value: val };
      }
    }
    return merged;
  }, [liveData, country, sdg.id]);

  const liveSdgScore = useMemo(() => {
    if (!liveData?.sdgScores) return null;
    const s = Object.values(liveData.sdgScores).find(s => s.id === sdg.id);
    return s?.score ?? null;
  }, [liveData, sdg.id]);

  const displayScore = liveSdgScore ?? countryRow?.sdgScores[sdg.id] ?? 0;

  const trendData  = generateSdgTrendData(sdg.id, country);
  const forecastData = generateForecastData(sdg.id, country);
  const anomalies    = detectAnomalies(sdg.id, country);
  const benchmarks   = getBenchmarks(sdg.id, country);
  const topCountries    = getTopCountriesForSdg(sdg.id, 12);
  const forecastLabel = SDG_FORECAST_LABELS[sdg.id];

  // ─── Live Forecast Hook ──────────────────────────────────────────────────
  const indicatorMap: Record<number, string> = {
    3: "PM2.5_exposure",
    5: "gender_gap",
    6: "WEI_plus",
    7: "RES_total_pct",
    8: "GDP_per_capita",
    9: "energy_productivity",
    10: "GDP_disparity",
    11: "PM2.5_AQI",
    12: "waste_per_capita",
    13: "GHG_per_capita",
    15: "green_coverage",
    17: "dataset_coverage"
  };
  const indicator = indicatorMap[sdg.id];

  const { data: liveForecast, isLoading: forecastLoading } = useQuery({
    queryKey: ["indicator-forecast", indicator, country],
    queryFn: () => fetchIndicatorData(indicator!, country, 2015, 2030),
    enabled: !!indicator && tab === "Forecast",
    staleTime: 1000 * 60 * 15,
  });

  const mergedForecastData = useMemo(() => {
    if (!liveForecast?.data || !indicator) return forecastData;
    
    // Transform backend data [{date: "2024-01-01", value: 70, is_forecast: false}] 
    // to chart format [{year: 2024, actual: 70}]
    const points: Record<number, any> = {};
    liveForecast.data.forEach((d: any) => {
      const year = new Date(d.date).getFullYear();
      if (!points[year]) points[year] = { year };
      
      if (d.is_forecast) {
        points[year].projected = d.value;
        points[year].isProjected = true;
        points[year].upper = d.conf_high ?? (d.value * 1.05);
        points[year].lower = d.conf_low ?? (d.value * 0.95);
      } else {
        points[year].actual = d.value;
      }
      points[year].target = forecastData[0]?.target;
      points[year].eu27 = forecastData.find(f => f.year === year)?.eu27;
    });

    return Object.values(points).sort((a, b) => a.year - b.year);
  }, [liveForecast, forecastData, indicator]);

  // ─── Live Historical Trend (for Overview chart) ──────────────────────────
  const { data: liveTrendSeries } = useQuery({
    queryKey: ["indicator-trend", indicator, country],
    queryFn: () => fetchIndicatorData(indicator!, country, 2015, 2024),
    enabled: !!indicator,
    staleTime: 1000 * 60 * 15,
  });

  /** Merges real DB time-series values into the generated trend skeleton */
  const mergedTrendData = useMemo(() => {
    if (!liveTrendSeries?.data?.length) return trendData;
    const liveMap: Record<number, number> = {};
    liveTrendSeries.data
      .filter((d: any) => !d.is_forecast)
      .forEach((d: any) => { liveMap[new Date(d.date).getFullYear()] = d.value; });
    return trendData.map(t => ({
      ...t,
      value: liveMap[t.year] ?? t.value,
    }));
  }, [liveTrendSeries, trendData]);

  // ─── Live Top Countries for this SDG ─────────────────────────────────────
  const { data: liveTopCountriesList } = useQuery({
    queryKey: ["sdg-top-countries", sdg.id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/sdg-scores/sdg/${sdg.id}/year/2024`);
      if (!res.ok) return null;
      const dbData = await res.json() as any[];
      const countryList = await fetchCountriesList();
      const countryMap = Object.fromEntries(countryList.map((c: any) => [c.country_id, c]));
      return dbData
        .sort((a: any, b: any) => b.normalised_score - a.normalised_score)
        .slice(0, 12)
        .map((s: any) => ({
          name: countryMap[s.country_id]?.name ?? `Country ${s.country_id}`,
          country: countryMap[s.country_id]?.name ?? `Country ${s.country_id}`,
          score: +(s.normalised_score ?? 0).toFixed(1),
          csi: 0,
        }));
    },
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });

  const displayTopCountries = (liveTopCountriesList ?? topCountries).slice(0, 6);
  const hasLiveTrend = !!liveTrendSeries?.data?.length;
  const hasLiveTopCountries = !!liveTopCountriesList?.length;

  return (
    <div className="px-6 py-6 max-w-screen-xl mx-auto space-y-5">

      {/* Breadcrumb + nav */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Link to="/" className="text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors"><ArrowLeft className="w-3.5 h-3.5"/>Dashboard</Link>
          <span className="text-slate-300">/</span>
          <span className="font-semibold text-slate-700">{sdg.shortTitle}</span>
        </div>
        <div className="flex gap-2">
          {prevSdg && <button onClick={() => navigate(`/sdg/${prevSdg.slug}`)} className="flex items-center gap-1 text-xs border border-slate-200 rounded-lg px-3 py-1.5 text-slate-500 hover:bg-slate-50 transition-colors"><ChevronLeft className="w-3.5 h-3.5"/>{prevSdg.shortTitle}</button>}
          {nextSdg && <button onClick={() => navigate(`/sdg/${nextSdg.slug}`)} className="flex items-center gap-1 text-xs border border-slate-200 rounded-lg px-3 py-1.5 text-slate-500 hover:bg-slate-50 transition-colors">{nextSdg.shortTitle}<ChevronRight className="w-3.5 h-3.5"/></button>}
        </div>
      </div>

      {/* Hero Banner */}
      <div className="rounded-2xl p-6 border" style={{ background:`linear-gradient(135deg,${sdg.bgColor} 0%,white 100%)`, borderColor:`${sdg.color}25` }}>
        <div className="flex flex-wrap gap-5 items-start">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black font-display shadow-md text-white" style={{ background: sdg.color }}>{sdg.id}</div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold font-display text-slate-800">{sdg.title}</h1>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${sdg.type==="direct"?"bg-blue-100 text-blue-700":"bg-amber-100 text-amber-700"}`}>{sdg.type==="direct"?"Direct":"Indirect"}</span>
              {anomalies.length > 0 && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/>{anomalies.length} anomalies detected</span>}
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">{sdg.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Datasets:</span>
              {sdg.datasets.map(d => <code key={d} className="text-[10px] bg-white/70 border border-slate-200 px-1.5 py-0.5 rounded font-mono text-slate-600">{d}</code>)}
            </div>
          </div>
          {/* Country selector */}
          <div className="bg-white/80 rounded-xl p-4 border border-slate-200/60 min-w-[190px]">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Viewing Country</label>
            <select className="w-full text-sm font-bold text-slate-800 bg-transparent border-none outline-none cursor-pointer" value={country} onChange={e => setCountry(e.target.value)}>
              {COUNTRY_SDG_SCORES.map(c => <option key={c.country}>{c.country}</option>)}
            </select>
            <div className="mt-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[11px] text-slate-400">SDG Score</span>
                  {liveSdgScore !== null ? (
                    <span className="text-[9px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded-full inline-block mt-0.5">● Live</span>
                  ) : (
                    <span className="text-[9px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded-full inline-block mt-0.5">Static Cache</span>
                  )}
                </div>
                <span className="text-2xl font-black font-display" style={{ color: sdg.color }}>{displayScore}</span>
              </div>
              {countryRow && <>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width:`${displayScore}%`, background: sdg.color }} />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">{countryRow.cluster} · P{countryRow.percentile}</p>
              </>}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0.5 border-b border-slate-200 bg-white rounded-t-xl px-2 overflow-x-auto scrollbar-thin">
        {TABS.map(t => {
          const Icon = TAB_ICONS[t];
          const isAnomaly = t === "Anomalies" && anomalies.length > 0;
          return (
            <button key={t} onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${tab===t?"border-blue-600 text-blue-700":"border-transparent text-slate-400 hover:text-slate-700"}`}
            >
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  (t === "Rankings") || 
                  ((t === "Overview" || t === "Forecast") && [3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 17].includes(sdg.id))
                    ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                    : "bg-red-500"
                }`} />
                <Icon className="w-3.5 h-3.5"/>
                {t}
              </div>
              {isAnomaly && <span className="ml-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">{anomalies.length}</span>}
            </button>
          );
        })}
      </div>

      {/* ── OVERVIEW ───────────────────────────────────────────────── */}
      {tab === "Overview" && (
        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-bold text-slate-800">Key Metrics — {country}</h2>
              <p className="text-xs text-slate-400">Click a card to expand details</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sdg.metrics.map(m => {
                const isLive = [3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 17].includes(sdg.id);
                return <MetricBlock key={m.key} metric={{...m, isLive}} vals={metricVals[m.key]} color={sdg.color}/>;
              })}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-display font-semibold text-slate-800 mb-1">Score Trend 2015–2024</h3>
              <p className="text-xs text-slate-400 mb-4">
                {country} vs EU27 average
                {hasLiveTrend
                  ? <span className="ml-2 text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">● Live DB</span>
                  : <span className="ml-2 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">Estimated trend</span>
                }
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={mergedTrendData}>
                  <defs>
                    <linearGradient id={`ov${sdg.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={sdg.color} stopOpacity={0.2}/>
                      <stop offset="100%" stopColor={sdg.color} stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9"/>
                  <XAxis dataKey="year" tick={{ fontSize:10, fill:"#94A3B8" }} tickLine={false} axisLine={false}/>
                  <YAxis domain={[0,100]} tick={{ fontSize:10, fill:"#94A3B8" }} tickLine={false} axisLine={false}/>
                  <Tooltip content={<ChartTip/>}/>
                  <Area dataKey="eu27" name="EU27" stroke="#CBD5E1" fill="none" strokeWidth={1.5} dot={false}/>
                  <Area dataKey="value" name={country} stroke={sdg.color} fill={`url(#ov${sdg.id})`} strokeWidth={2.5} dot={{ r:3, fill:sdg.color, stroke:"white", strokeWidth:1.5 }}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-display font-semibold text-slate-800 mb-1">Top 6 Countries</h3>
              <p className="text-xs text-slate-400 mb-4">
                Ranked by {sdg.shortTitle} score
                {hasLiveTopCountries
                  ? <span className="ml-2 text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">● Live DB</span>
                  : <span className="ml-2 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">Cached scores</span>
                }
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={displayTopCountries} layout="vertical" margin={{ left:0, right:40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false}/>
                  <XAxis type="number" domain={[0,100]} tick={{ fontSize:10, fill:"#94A3B8" }} tickLine={false} axisLine={false}/>
                  <YAxis dataKey="name" type="category" tick={{ fontSize:11, fill:"#475569", fontWeight:600 }} tickLine={false} axisLine={false} width={85}/>
                  <Tooltip content={<ChartTip/>} cursor={{ fill:"#F8FAFC" }}/>
                  <Bar dataKey="score" name="Score" radius={[0,6,6,0]} barSize={16}>
                    {topCountries.slice(0,6).map((_,i) => <Cell key={i} fill={sdg.color} fillOpacity={1-i*0.13}/>)}
                    <LabelList dataKey="score" position="right" style={{ fontSize:11, fill:"#64748B", fontWeight:700 }}/>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── FORECAST ───────────────────────────────────────────────── */}
      {tab === "Forecast" && (
        <div className="space-y-5">
          {/* Domain title */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5">
            <div className="flex flex-wrap items-center gap-3">
              <Zap className="w-5 h-5 text-blue-600"/>
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  <h2 className="font-display font-bold text-slate-800">{forecastLabel?.title ?? "Predictive Forecast"}</h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Historical 2015–2024 + Predictive projection 2025–2030 · 80% confidence interval</p>
              </div>
              <div className="ml-auto flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-6 h-0.5 bg-blue-600 inline-block rounded"/>Actual</span>
                <span className="flex items-center gap-1.5"><span className="w-6 h-0.5 border-t-2 border-dashed border-blue-400 inline-block"/>Projected</span>
                <span className="flex items-center gap-1.5"><span className="w-6 h-3 bg-blue-100 inline-block rounded"/>CI Band</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 min-h-[400px] flex flex-col">
            {forecastLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
                  <p className="text-sm text-slate-500">Generating ML Forecast...</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={340}>
                <ComposedChart data={mergedForecastData} margin={{ top:10, right:20, left:0, bottom:0 }}>
                <defs>
                  <linearGradient id="ci-band" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.15}/>
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9"/>
                <XAxis dataKey="year" tick={{ fontSize:11, fill:"#94A3B8" }} tickLine={false} axisLine={false}/>
                <YAxis domain={[0,100]} tick={{ fontSize:11, fill:"#94A3B8" }} tickLine={false} axisLine={false}/>
                <Tooltip content={<ChartTip/>}/>
                <Legend wrapperStyle={{ fontSize:12, paddingTop:12 }}/>
                {/* 2024 divider */}
                <ReferenceLine x={2024} stroke="#E2E8F0" strokeDasharray="4 4" label={{ value:"2024 →", position:"insideTopLeft", fontSize:10, fill:"#94A3B8" }}/>
                {/* Target */}
                {forecastData[0]?.target && <ReferenceLine y={forecastData[0].target} stroke="#F59E0B" strokeDasharray="6 3" strokeWidth={1.5} label={{ value:"EU 2030 Target", position:"right", fontSize:10, fill:"#B45309" }}/>}
                {/* CI Band */}
                <Area dataKey="upper" name="Upper bound" stroke="none" fill="url(#ci-band)" legendType="none"/>
                <Area dataKey="lower" name="Lower bound" stroke="none" fill="white" legendType="none"/>
                {/* EU27 */}
                <Line dataKey="eu27" name="EU27 Avg" stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="4 3" dot={false} connectNulls/>
                {/* Actual */}
                <Line dataKey="actual" name={`${country} (actual)`} stroke={sdg.color} strokeWidth={2.5} dot={{ r:3, fill:sdg.color, stroke:"white", strokeWidth:1.5 }} connectNulls/>
                {/* Projected */}
                <Line dataKey="projected" name={`${country} (forecast)`} stroke={sdg.color} strokeWidth={2} strokeDasharray="7 4" dot={{ r:2.5, fill:sdg.color, stroke:"white", strokeWidth:1 }} connectNulls/>
              </ComposedChart>
            </ResponsiveContainer>
            )}
          </div>

          {/* 2030 target progress */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[{ label:"Current Score (2024)", val: mergedForecastData.find(d=>d.year===2024)?.actual?.toFixed(1), color: sdg.color },
              { label:"Projected Score (2030)", val: mergedForecastData.find(d=>d.year===2030)?.projected?.toFixed(1), color: "#2563eb" },
              { label:"EU 2030 Target", val: mergedForecastData[0]?.target?.toFixed(1) ?? "N/A", color: "#d97706" }
            ].map(item => (
              <div key={item.label} className="bg-white border border-slate-200 rounded-xl p-4 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{item.label}</p>
                <p className="text-3xl font-black font-display" style={{ color: item.color }}>{item.val ?? "—"}</p>
              </div>
            ))}
          </div>

          {/* Scenarios table */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-display font-semibold text-slate-800 mb-3">Scenario Projections to 2030</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {["Year","Projected","Optimistic (upper)","Pessimistic (lower)","EU27 Avg"].map(h=>(
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mergedForecastData.filter(d=>d.isProjected).map((d,i)=>(
                    <tr key={d.year} className={i%2===0?"bg-white":"bg-slate-50/50"}>
                      <td className="px-4 py-2.5 font-bold text-slate-700">{d.year}</td>
                      <td className="px-4 py-2.5"><span className="font-bold" style={{ color:sdg.color }}>{d.projected?.toFixed(1)}</span></td>
                      <td className="px-4 py-2.5 text-green-600 font-semibold">{d.upper?.toFixed(1)}</td>
                      <td className="px-4 py-2.5 text-red-500 font-semibold">{d.lower?.toFixed(1)}</td>
                      <td className="px-4 py-2.5 text-slate-500">{d.eu27?.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── BENCHMARKS ─────────────────────────────────────────────── */}
      {tab === "Benchmarks" && (
        <div className="space-y-5">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-green-600"/>
              <div>
                <h2 className="font-display font-bold text-slate-800">Metric Benchmarking — {country}</h2>
                <p className="text-xs text-slate-500 mt-0.5">Each metric compared vs EU27 average, top EU country, bottom EU country, and official targets</p>
              </div>
              <span className="ml-auto text-[10px] font-semibold text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-2.5 py-1">⚠ Illustrative statistical model</span>
            </div>
          </div>

          {benchmarks.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
              <p className="font-semibold">Benchmark data uses categorical metrics only — see Metric Guide tab</p>
            </div>
          ) : (
            <div className="space-y-4">
              {benchmarks.map(b => {
                const isGood = b.performanceGap >= 0;
                const targetMet = b.targetGap != null && b.targetGap >= 0;
                const maxVal = Math.max(b.countryValue, b.eu27Avg, b.topValue, b.euTarget??0, b.whoThreshold??0) * 1.15;
                const barW = (v: number) => `${Math.min(100, (v/maxVal)*100).toFixed(1)}%`;
                return (
                  <div key={b.metricKey} className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      <h3 className="font-semibold text-slate-800">{b.metricLabel}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isGood?"bg-green-100 text-green-700":"bg-red-100 text-red-600"}`}>
                          {isGood?"↑":"↓"} {Math.abs(b.performanceGap).toFixed(1)} {b.unit} vs EU27
                        </span>
                        {b.targetGap != null && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${targetMet?"bg-blue-100 text-blue-700":"bg-amber-100 text-amber-700"}`}>
                            {targetMet?"✓ Target met":`${Math.abs(b.targetGap).toFixed(1)} ${b.unit} to target`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Comparison bars */}
                    <div className="space-y-2.5">
                      {[
                        { label: country,          val: b.countryValue,     color: sdg.color,   bold: true },
                        { label: "EU27 Average", val: b.eu27Avg,       color: "#64748B",   bold: false },
                        { label: `Best: ${b.topCountry}`,    val: b.topValue,      color: "#15803d",   bold: false },
                        { label: `Worst: ${b.bottomCountry}`,val: b.bottomValue,   color: "#dc2626",   bold: false },
                        ...(b.euTarget!=null?[{ label:"EU 2030 Target", val: b.euTarget, color:"#F59E0B", bold:false }]:[]),
                        ...(b.whoThreshold!=null?[{ label:"WHO Threshold", val: b.whoThreshold, color:"#8B5CF6", bold:false }]:[]),
                      ].map(row => (
                        <div key={row.label} className="flex items-center gap-3">
                          <span className={`text-xs w-36 shrink-0 truncate ${row.bold?"font-bold text-slate-800":"text-slate-500"}`}>{row.label}</span>
                          <div className="flex-1 h-5 bg-slate-100 rounded-lg overflow-hidden">
                            <div className="h-full rounded-lg transition-all duration-500" style={{ width: barW(row.val), background: row.color, opacity: row.bold ? 1 : 0.75 }}/>
                          </div>
                          <span className={`text-xs font-bold w-16 text-right shrink-0`} style={{ color: row.color }}>{row.val} {b.unit}</span>
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

      {/* ── ANOMALIES ──────────────────────────────────────────────── */}
      {tab === "Anomalies" && (
        <div className="space-y-5">
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500"/>
              <div>
                <h2 className="font-display font-bold text-slate-800">Anomaly Detection — {country}</h2>
                <p className="text-xs text-slate-500 mt-0.5">Statistical outliers (Z-score &gt;1.4σ) and known event-driven irregularities in historical data</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-2.5 py-1">⚠ Illustrative model</span>
                <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full">{anomalies.length} detected</span>
              </div>
            </div>
          </div>

          {/* Annotated trend chart */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-display font-semibold text-slate-800 mb-1">Score Timeline with Anomaly Markers</h3>
            <p className="text-xs text-slate-400 mb-4">Red markers = flagged anomalies · hover for details</p>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9"/>
                <XAxis dataKey="year" tick={{ fontSize:10, fill:"#94A3B8" }} tickLine={false} axisLine={false}/>
                <YAxis domain={[0,100]} tick={{ fontSize:10, fill:"#94A3B8" }} tickLine={false} axisLine={false}/>
                <Tooltip content={<ChartTip/>}/>
                {anomalies.map(a => (
                  <ReferenceLine key={a.year} x={a.year} stroke={a.severity==="positive"?"#15803d":a.severity==="critical"?"#dc2626":"#d97706"} strokeDasharray="4 3" strokeWidth={1.5}
                    label={{ value:"⚠", position:"top", fontSize:12 }}/>
                ))}
                <Area dataKey="eu27" name="EU27" stroke="#CBD5E1" fill="none" strokeWidth={1.5} dot={false}/>
                <Area dataKey="value" name={country} stroke={sdg.color} fill={`url(#ov${sdg.id})`} strokeWidth={2.5}
                  dot={(props: any) => {
                    const isAnom = anomalies.some(a => a.year === props.payload?.year);
                    return isAnom
                      ? <circle key={props.key} cx={props.cx} cy={props.cy} r={6} fill="#dc2626" stroke="white" strokeWidth={2}/>
                      : <circle key={props.key} cx={props.cx} cy={props.cy} r={3} fill={sdg.color} stroke="white" strokeWidth={1.5}/>;
                  }}/>
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Anomaly cards */}
          {anomalies.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
              <p className="font-semibold">No statistically significant anomalies detected for {country}</p>
              <p className="text-sm mt-1">Data appears consistent with expected historical trends</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {anomalies.map(a => {
                const sev = a.severity;
                const colors = { critical: { bg:"bg-red-50", border:"border-red-200", text:"text-red-700", badge:"bg-red-100 text-red-600" }, warning:{ bg:"bg-amber-50", border:"border-amber-200", text:"text-amber-700", badge:"bg-amber-100 text-amber-700" }, positive:{ bg:"bg-green-50", border:"border-green-200", text:"text-green-700", badge:"bg-green-100 text-green-700" } };
                const c = colors[sev];
                return (
                  <div key={a.year} className={`${c.bg} border ${c.border} rounded-xl p-4`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${c.text}`}>{a.year}</span>
                        <h4 className="font-bold text-slate-800 mt-0.5">{a.label}</h4>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${c.badge}`}>
                        {sev === "positive" ? "✓ Positive" : sev === "critical" ? "✕ Critical" : "⚠ Warning"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed mb-3">{a.description}</p>
                    <div className="flex gap-4 text-xs">
                      <div><span className="text-slate-400">Observed</span><p className="font-bold text-slate-800">{a.value.toFixed(1)}</p></div>
                      <div><span className="text-slate-400">Expected</span><p className="font-bold text-slate-800">{a.expected}</p></div>
                      <div><span className="text-slate-400">Deviation</span><p className={`font-bold ${c.text}`}>{a.deviation > 0 ? "+" : ""}{a.deviation}σ</p></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── COUNTRY RANKINGS ──────────────────────────────────────────── */}
      {tab === "Country Rankings" && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div><h2 className="font-display font-bold text-slate-800">All Country Rankings — {sdg.shortTitle}</h2><p className="text-xs text-slate-400 mt-0.5">{COUNTRY_SDG_SCORES.length} countries · click a row to switch country</p></div>
            <span className="text-xs text-slate-400 border border-slate-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1"><Database className="w-3 h-3"/>{sdg.datasets[0]}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 border-b border-slate-100">
                {["#","Country","Code","SDG Score","CSI","Cluster"].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>)}
              </tr></thead>
              <tbody>
                {[...COUNTRY_SDG_SCORES].sort((a,b)=>(b.sdgScores[sdg.id]??0)-(a.sdgScores[sdg.id]??0)).map((c,i)=>{
                  const s = c.sdgScores[sdg.id]??0;
                  const col = scoreColor(s);
                  return (
                    <tr key={c.country} onClick={()=>setCountry(c.country)} className={`border-b border-slate-50 cursor-pointer transition-colors ${c.country===country?"bg-blue-50":"hover:bg-slate-50"}`}>
                      <td className="px-4 py-3 text-xs text-slate-400 font-mono">{i+1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{c.country}</td>
                      <td className="px-4 py-3"><span className="text-xs font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{c.countryCode}</span></td>
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width:`${s}%`, background:col }}/></div><span className="text-sm font-bold" style={{ color:col }}>{s}</span></div></td>
                      <td className="px-4 py-3"><span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background:`${scoreColor(c.csi)}15`, color:scoreColor(c.csi) }}>{c.csi.toFixed(1)}</span></td>
                      <td className="px-4 py-3 text-xs text-slate-400">{c.cluster}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── METRIC GUIDE ───────────────────────────────────────────── */}
      {tab === "Metric Guide" && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex flex-wrap gap-6 items-center">
            <div><h3 className="font-display font-bold text-blue-800 mb-1">CSI Calculation Formula</h3><p className="text-xs text-blue-600">Each SDG contributes equally (¹⁄₁₂) to the Composite Sustainability Index</p></div>
            <div className="bg-white rounded-xl px-5 py-3 border border-blue-200 text-center">
              <p className="font-mono text-blue-700 font-bold text-base">CSI = ¹⁄₁₂ × Σ(SDG scores)</p>
              <p className="text-xs text-blue-400 mt-1">12 SDGs · scale 0–100 · SDG Achievement Rate: % meeting EU benchmarks</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100"><h2 className="font-display font-bold text-slate-800">Metric Definitions</h2><p className="text-xs text-slate-400 mt-0.5">Source: {sdg.datasets.join(", ")}</p></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50 border-b border-slate-100">
                  {["Metric","Unit","Direction","EU Target","WHO Threshold","Description"].map(h=><th key={h} className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>)}
                </tr></thead>
                <tbody>
                  {sdg.metrics.map((m,i)=>(
                    <tr key={m.key} className={i%2===0?"bg-white":"bg-slate-50/50"}>
                      <td className="px-5 py-3 font-semibold text-slate-800">{m.label}</td>
                      <td className="px-5 py-3"><code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{m.unit||"—"}</code></td>
                      <td className="px-5 py-3"><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${m.higherIsBetter?"bg-green-100 text-green-700":"bg-red-100 text-red-600"}`}>{m.higherIsBetter?"↑ Higher":"↓ Lower"}</span></td>
                      <td className="px-5 py-3 text-xs text-slate-600">{m.euTarget!=null?`${m.euTarget} ${m.unit}`:"—"}</td>
                      <td className="px-5 py-3 text-xs text-slate-600">{m.whoThreshold!=null?`${m.whoThreshold} ${m.unit}`:"—"}</td>
                      <td className="px-5 py-3 text-xs text-slate-500 max-w-xs leading-relaxed">{m.description}</td>
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

