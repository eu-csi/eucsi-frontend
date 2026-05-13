import { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ComposedChart,
} from "recharts";
import { TREND_DATA, BENCHMARK_DATA, RADAR_DATA, TARGET_TRACKING, FORECAST_DATA } from "@/data/mockData";

const TABS = ["Trends", "Benchmarks", "Targets", "Forecast", "Correlations"] as const;

const ChartArea = () => {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>("Trends");

  return (
    <div className="eu-panel flex-1 flex flex-col min-h-0">
      <div className="flex items-center border-b border-border px-4">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-eu-blue text-eu-blue"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 p-4 min-h-0">
        {activeTab === "Trends" && <TrendsChart />}
        {activeTab === "Benchmarks" && <BenchmarkCharts />}
        {activeTab === "Targets" && <TargetsView />}
        {activeTab === "Forecast" && <ForecastChart />}
        {activeTab === "Correlations" && <CorrelationsView />}
      </div>
    </div>
  );
};

const TrendsChart = () => (
  <div className="h-full flex flex-col gap-4">
    <div className="flex-1">
      <h3 className="eu-section-title mb-2">CSI & Renewable Energy Trends (2015–2024)</h3>
      <ResponsiveContainer width="100%" height="90%">
        <ComposedChart data={TREND_DATA}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
          <XAxis dataKey="year" tick={{ fontSize: 11 }} />
          <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area yAxisId="left" type="monotone" dataKey="csi" stroke="hsl(224, 100%, 30%)" fill="hsl(224, 100%, 30%, 0.08)" name="CSI Score" />
          <Line yAxisId="right" type="monotone" dataKey="renewable" stroke="hsl(142, 71%, 35%)" strokeWidth={2} dot={{ r: 2 }} name="Renewable %" />
          <Line yAxisId="right" type="monotone" dataKey="emissions" stroke="hsl(0, 72%, 51%)" strokeWidth={2} dot={{ r: 2 }} name="Emissions tCO₂e" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const BenchmarkCharts = () => (
  <div className="h-full grid grid-cols-2 gap-4">
    <div>
      <h3 className="eu-section-title mb-2">Benchmark Comparison</h3>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={BENCHMARK_DATA} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
          <XAxis type="number" tick={{ fontSize: 10 }} />
          <YAxis dataKey="metric" type="category" tick={{ fontSize: 10 }} width={60} />
          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar dataKey="country" fill="hsl(224, 100%, 30%)" name="Sweden" radius={[0, 2, 2, 0]} barSize={8} />
          <Bar dataKey="peerAvg" fill="hsl(217, 71%, 53%)" name="Peer Avg" radius={[0, 2, 2, 0]} barSize={8} />
          <Bar dataKey="eu27" fill="hsl(214, 32%, 80%)" name="EU27" radius={[0, 2, 2, 0]} barSize={8} />
          <Bar dataKey="topPerformer" fill="hsl(142, 71%, 35%)" name="Top Performer" radius={[0, 2, 2, 0]} barSize={8} />
        </BarChart>
      </ResponsiveContainer>
    </div>
    <div>
      <h3 className="eu-section-title mb-2">Sustainability Radar</h3>
      <ResponsiveContainer width="100%" height="90%">
        <RadarChart data={RADAR_DATA}>
          <PolarGrid stroke="hsl(214 32% 91%)" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
          <Radar name="Sweden" dataKey="country" stroke="hsl(224, 100%, 30%)" fill="hsl(224, 100%, 30%)" fillOpacity={0.15} />
          <Radar name="Peer Avg" dataKey="peerAvg" stroke="hsl(217, 71%, 53%)" fill="hsl(217, 71%, 53%)" fillOpacity={0.08} />
          <Radar name="EU27" dataKey="eu27" stroke="hsl(214, 32%, 70%)" fill="hsl(214, 32%, 70%)" fillOpacity={0.05} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const TargetsView = () => (
  <div className="h-full overflow-auto">
    <h3 className="eu-section-title mb-3">EU 2030 & 2035 Target Progress</h3>
    <div className="space-y-4">
      {TARGET_TRACKING.map((t) => {
        const progress2030 = Math.min(100, (t.current / t.target2030) * 100);
        const progress2035 = Math.min(100, (t.current / t.target2035) * 100);
        const feasibility = progress2030 >= 80 ? "success" : progress2030 >= 60 ? "warning" : "danger";
        return (
          <div key={t.metric} className="border border-border rounded-md p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">{t.metric}</span>
              <span className={`eu-badge-${feasibility} text-[10px]`}>
                {feasibility === "success" ? "On Track" : feasibility === "warning" ? "At Risk" : "Off Track"}
              </span>
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>2030 Target: {t.target2030}{t.unit}</span>
                  <span>{t.current}{t.unit} ({progress2030.toFixed(0)}%)</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-eu-blue rounded-full transition-all" style={{ width: `${progress2030}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>2035 Target: {t.target2035}{t.unit}</span>
                  <span>{progress2035.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-eu-blue-light rounded-full transition-all" style={{ width: `${progress2035}%` }} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const ForecastChart = () => (
  <div className="h-full">
    <h3 className="eu-section-title mb-2">CSI Forecast with Confidence Intervals (2015–2029)</h3>
    <ResponsiveContainer width="100%" height="90%">
      <AreaChart data={FORECAST_DATA}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} domain={[40, 100]} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Area type="monotone" dataKey="upperBound" stroke="none" fill="hsl(224, 100%, 30%, 0.08)" name="Confidence Band" />
        <Area type="monotone" dataKey="lowerBound" stroke="none" fill="hsl(0, 0%, 100%)" name="" />
        <Line type="monotone" dataKey="actual" stroke="hsl(224, 100%, 30%)" strokeWidth={2} dot={{ r: 3 }} name="Actual" />
        <Line type="monotone" dataKey="projected" stroke="hsl(224, 100%, 30%)" strokeWidth={2} strokeDasharray="6 3" dot={{ r: 2 }} name="Projected" />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

const CorrelationsView = () => {
  const metrics = ["Renewable", "Emissions", "Air Quality", "GDP", "Transport", "Green Space"];
  return (
    <div className="h-full">
      <h3 className="eu-section-title mb-3">Cross-Metric Correlation Heatmap</h3>
      <div className="grid gap-1" style={{ gridTemplateColumns: `80px repeat(${metrics.length}, 1fr)` }}>
        <div />
        {metrics.map((m) => (
          <div key={m} className="text-[9px] text-muted-foreground text-center font-medium truncate px-1">{m}</div>
        ))}
        {metrics.map((row) => (
          <>
            <div key={`label-${row}`} className="text-[9px] text-muted-foreground font-medium flex items-center truncate">{row}</div>
            {metrics.map((col) => {
              if (row === col) return <div key={`${row}-${col}`} className="h-8 rounded-sm bg-eu-blue flex items-center justify-center text-[9px] text-primary-foreground font-medium">1.00</div>;
              const found = [
                { x: row, y: col },
                { x: col, y: row },
              ].reduce((acc, q) => {
                const match = [
                  { x: "Renewable", y: "Emissions", value: -0.78 },
                  { x: "Renewable", y: "Air Quality", value: 0.62 },
                  { x: "Renewable", y: "GDP", value: 0.45 },
                  { x: "Emissions", y: "Air Quality", value: -0.71 },
                  { x: "Emissions", y: "GDP", value: 0.32 },
                  { x: "Air Quality", y: "GDP", value: -0.28 },
                  { x: "Transport", y: "Emissions", value: -0.55 },
                  { x: "Transport", y: "Air Quality", value: 0.48 },
                  { x: "Green Space", y: "Air Quality", value: 0.67 },
                  { x: "Transport", y: "Renewable", value: 0.41 },
                  { x: "Green Space", y: "Renewable", value: 0.35 },
                  { x: "Green Space", y: "Emissions", value: -0.42 },
                ].find((c) => c.x === q.x && c.y === q.y);
                return match ? match.value : acc;
              }, 0);
              const intensity = Math.abs(found);
              const isNeg = found < 0;
              return (
                <div
                  key={`${row}-${col}`}
                  className="h-8 rounded-sm flex items-center justify-center text-[9px] font-medium"
                  style={{
                    backgroundColor: isNeg
                      ? `hsl(0, 72%, ${95 - intensity * 40}%)`
                      : `hsl(224, 100%, ${95 - intensity * 35}%)`,
                    color: intensity > 0.5 ? "white" : "hsl(220, 30%, 30%)",
                  }}
                >
                  {found.toFixed(2)}
                </div>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
};

export default ChartArea;
