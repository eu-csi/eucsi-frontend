import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Legend,
} from "recharts";
import { generateSdgTrendData } from "@/data/sdgData";

interface Props {
  sdgId: number;
  city?: string;
  color: string;
  metricLabel?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-xl shadow-lg p-3 text-sm min-w-[140px]">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-3 text-xs">
          <span style={{ color: p.color }} className="font-medium">{p.name}</span>
          <span className="font-bold text-foreground">{p.value?.toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
};

export default function SDGTrendChart({ sdgId, city = "Stockholm", color, metricLabel = "Score" }: Props) {
  const data = generateSdgTrendData(sdgId, city);
  const target = data[0]?.target;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${sdgId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.18} />
            <stop offset="95%" stopColor={color} stopOpacity={0.01} />
          </linearGradient>
          <linearGradient id="grad-eu27" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#94A3B8" stopOpacity={0.12} />
            <stop offset="95%" stopColor="#94A3B8" stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          formatter={(value) => <span style={{ color: "#475569" }}>{value}</span>}
        />
        {target && (
          <ReferenceLine
            y={target}
            stroke="#F59E0B"
            strokeDasharray="6 3"
            strokeWidth={1.5}
            label={{ value: "Target", position: "right", fontSize: 10, fill: "#92400E" }}
          />
        )}
        <Area
          type="monotone" dataKey="eu27" name="EU27 Avg"
          stroke="#94A3B8" fill="url(#grad-eu27)"
          strokeWidth={1.5} dot={false}
        />
        <Area
          type="monotone" dataKey="value" name={city}
          stroke={color} fill={`url(#grad-${sdgId})`}
          strokeWidth={2.5}
          dot={{ r: 3, fill: color, strokeWidth: 1.5, stroke: "white" }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
