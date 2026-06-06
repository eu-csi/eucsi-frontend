import { COUNTRY_SDG_SCORES } from "@/data/sdgData";
import { TrendingUp, Award, AlertTriangle, BarChart3 } from "lucide-react";

export default function DashboardKPIs() {
  const countries = COUNTRY_SDG_SCORES;
  const avgCsi = (countries.reduce((s, c) => s + c.csi, 0) / countries.length).toFixed(1);
  const topCountry = [...countries].sort((a, b) => b.csi - a.csi)[0];
  const bottomCountry = [...countries].sort((a, b) => a.csi - b.csi)[0];
  const aboveTarget = countries.filter(c => c.csi >= 70).length;

  const kpis = [
    {
      label: "Average CSI Score",
      value: avgCsi,
      unit: "/ 100",
      sub: `Across ${countries.length} EU countries`,
      icon: <BarChart3 className="w-5 h-5" />,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Top Performing Country",
      value: topCountry.country,
      unit: `CSI ${topCountry.csi}`,
      sub: topCountry.cluster,
      icon: <Award className="w-5 h-5" />,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Countries Above Threshold",
      value: `${aboveTarget}`,
      unit: `of ${countries.length}`,
      sub: "CSI ≥ 70 (strong performance)",
      icon: <TrendingUp className="w-5 h-5" />,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Needs Attention",
      value: bottomCountry.country,
      unit: `CSI ${bottomCountry.csi}`,
      sub: `${bottomCountry.countryCode} · ${bottomCountry.cluster}`,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map(kpi => (
        <div key={kpi.label} className="kpi-card animate-fade-up">
          <div className="flex items-start justify-between mb-3">
            <div className={`w-9 h-9 rounded-lg ${kpi.bg} ${kpi.color} flex items-center justify-center`}>
              {kpi.icon}
            </div>
          </div>
          <div className="text-2xl font-bold font-display text-foreground leading-none">
            {kpi.value}
          </div>
          <div className="text-sm font-medium text-muted-foreground mt-0.5">{kpi.unit}</div>
          <div className="text-xs text-muted-foreground mt-2 border-t border-border pt-2">{kpi.sub}</div>
          <p className="text-xs font-medium text-foreground mt-1">{kpi.label}</p>
        </div>
      ))}
    </div>
  );
}
