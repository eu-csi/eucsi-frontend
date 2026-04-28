import { TrendingUp, TrendingDown, Gauge, Cloud, Zap, Wind, Euro, Droplets } from "lucide-react";
import { KPI_DATA } from "@/data/mockData";

const ICON_MAP: Record<string, React.ReactNode> = {
  gauge: <Gauge className="w-4 h-4" />,
  cloud: <Cloud className="w-4 h-4" />,
  zap: <Zap className="w-4 h-4" />,
  wind: <Wind className="w-4 h-4" />,
  euro: <Euro className="w-4 h-4" />,
  droplets: <Droplets className="w-4 h-4" />,
};

const KPICards = () => {
  return (
    <div className="grid grid-cols-6 gap-3">
      {KPI_DATA.map((kpi) => (
        <div key={kpi.label} className="eu-kpi-card">
          <div className="flex items-center justify-between mb-2">
            <div className="w-7 h-7 rounded bg-eu-blue-pale flex items-center justify-center text-eu-blue">
              {ICON_MAP[kpi.icon]}
            </div>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
              kpi.yoy > 0 
                ? (kpi.icon === "cloud" || kpi.icon === "wind" ? "eu-badge-success" : "eu-badge-success")
                : kpi.yoy < 0
                ? (kpi.icon === "cloud" || kpi.icon === "wind" ? "eu-badge-success" : "eu-badge-danger")
                : ""
            }`}>
              {kpi.yoy > 0 ? "+" : ""}{kpi.yoy}%
            </span>
          </div>
          <div className="text-lg font-display font-bold text-foreground leading-tight">
            {kpi.value}<span className="text-xs font-normal text-muted-foreground ml-0.5">{kpi.unit}</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-1 truncate">{kpi.label}</div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
            <span className="text-[10px] text-muted-foreground">
              P{kpi.percentile} EU
            </span>
            <span className={`text-[10px] font-medium ${kpi.targetGap === 0 ? "text-eu-success" : "text-eu-warning"}`}>
              {kpi.targetGap === 0 ? "On target" : `${kpi.targetGap}% gap`}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KPICards;
