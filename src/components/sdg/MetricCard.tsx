import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";

interface Props {
  label: string;
  value: string | number;
  unit: string;
  description?: string;
  trend?: number;       // YoY change
  benchmark?: number;   // EU27 average
  target?: number;      // EU target value
  higherIsBetter?: boolean;
  color?: string;
  bgColor?: string;
}

function TrendChip({ value, higherIsBetter }: { value: number; higherIsBetter: boolean }) {
  const positive = higherIsBetter ? value > 0 : value < 0;
  const negative = higherIsBetter ? value < 0 : value > 0;

  if (positive) return (
    <span className="badge-success inline-flex items-center gap-1 text-[11px]">
      <TrendingUp className="w-3 h-3" />
      {value > 0 ? "+" : ""}{value.toFixed(1)}%
    </span>
  );
  if (negative) return (
    <span className="badge-danger inline-flex items-center gap-1 text-[11px]">
      <TrendingDown className="w-3 h-3" />
      {value.toFixed(1)}%
    </span>
  );
  return (
    <span className="badge-neutral inline-flex items-center gap-1 text-[11px]">
      <Minus className="w-3 h-3" /> 0%
    </span>
  );
}

export default function MetricCard({
  label, value, unit, description, trend, benchmark, target, higherIsBetter = true, color = "#2563eb", bgColor = "#EFF6FF",
}: Props) {
  const numericValue = parseFloat(String(value));
  
  // Determine if meeting target
  let vsTarget: "good" | "warn" | "bad" | null = null;
  if (target !== undefined && !isNaN(numericValue)) {
    const diff = higherIsBetter ? numericValue - target : target - numericValue;
    vsTarget = diff >= 0 ? "good" : diff >= -target * 0.15 ? "warn" : "bad";
  }

  const targetLabels = { good: "On Target", warn: "Near Target", bad: "Off Target" } as const;
  const targetClasses = { good: "badge-success", warn: "badge-warning", bad: "badge-danger" } as const;

  return (
    <div className="metric-card group">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide leading-tight">{label}</p>
        {description && (
          <div className="relative">
            <Info className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0 cursor-help" />
            <div className="absolute right-0 top-5 w-52 bg-foreground text-background text-[11px] leading-relaxed p-2.5 rounded-lg hidden group-hover:block z-10 shadow-xl">
              {description}
            </div>
          </div>
        )}
      </div>

      {/* Main Value */}
      <div className="flex items-baseline gap-1.5 mb-1">
        <span
          className="text-2xl font-bold font-display leading-none"
          style={{ color }}
        >
          {value}
        </span>
        <span className="text-sm text-muted-foreground font-medium">{unit}</span>
      </div>

      {/* Trend */}
      {trend !== undefined && (
        <div className="mt-2">
          <TrendChip value={trend} higherIsBetter={higherIsBetter} />
          <span className="text-[11px] text-muted-foreground ml-1.5">vs last year</span>
        </div>
      )}

      {/* Benchmark & Target */}
      {(benchmark !== undefined || vsTarget) && (
        <div className="mt-3 pt-3 border-t border-border space-y-1.5">
          {benchmark !== undefined && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">EU27 Avg</span>
              <span className="font-semibold text-foreground">{benchmark} {unit}</span>
            </div>
          )}
          {target !== undefined && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Target</span>
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-foreground">{target} {unit}</span>
                {vsTarget && (
                  <span className={`${targetClasses[vsTarget]} px-1.5 py-0.5 rounded text-[10px]`}>
                    {targetLabels[vsTarget]}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Color accent strip */}
      <div
        className="absolute inset-x-0 bottom-0 h-0.5 rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: color }}
      />
    </div>
  );
}
