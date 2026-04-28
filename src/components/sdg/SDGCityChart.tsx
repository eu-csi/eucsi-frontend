import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, LabelList,
} from "recharts";
import { getTopCitiesForSdg } from "@/data/sdgData";

interface Props {
  sdgId: number;
  color: string;
  count?: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-border rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-foreground">{d.name}</p>
      <p className="text-muted-foreground text-xs">{d.country}</p>
      <p className="text-base font-bold mt-1" style={{ color: payload[0].fill }}>
        Score: {d.score.toFixed(1)}
      </p>
    </div>
  );
};

export default function SDGCityChart({ sdgId, color, count = 12 }: Props) {
  const cities = getTopCitiesForSdg(sdgId, count);

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart
        data={cities}
        layout="vertical"
        margin={{ top: 0, right: 60, left: 10, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
        <YAxis
          dataKey="name"
          type="category"
          tick={{ fontSize: 12, fill: "#334155", fontWeight: 500 }}
          tickLine={false}
          axisLine={false}
          width={90}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F1F5F9" }} />
        <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={18}>
          {cities.map((entry, idx) => {
            const opacity = 1 - (idx / cities.length) * 0.45;
            return <Cell key={entry.name} fill={color} fillOpacity={opacity} />;
          })}
          <LabelList
            dataKey="score"
            position="right"
            formatter={(v: number) => v.toFixed(0)}
            style={{ fontSize: 11, fill: "#64748B", fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
