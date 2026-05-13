import { useState } from "react";
import {
  ChevronDown, ChevronRight, Brain, AlertTriangle, Network, TrendingUp,
  Target, Settings, FileQuestion, MessageSquareText, Sparkles,
} from "lucide-react";

interface MLSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const MLSection = ({ icon, title, children, defaultOpen = false }: MLSectionProps) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border py-3 px-3">
      <button onClick={() => setOpen(!open)} className="flex items-center w-full gap-2 text-left group">
        {open ? <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />}
        <span className="shrink-0" style={{ color: "hsl(270, 50%, 50%)" }}>{icon}</span>
        <span className="text-xs font-medium text-foreground truncate group-hover:text-eu-blue transition-colors">{title}</span>
      </button>
      {open && <div className="mt-2 ml-5 space-y-2">{children}</div>}
    </div>
  );
};

const RightSidebar = () => {
  return (
    <aside className="w-72 border-l border-border bg-card flex flex-col shrink-0 overflow-y-auto scrollbar-thin">
      <div className="px-3 py-2.5 border-b border-border" style={{ background: "linear-gradient(135deg, hsl(270, 60%, 97%), hsl(224, 80%, 97%))" }}>
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" style={{ color: "hsl(270, 50%, 50%)" }} />
          <span className="eu-section-title" style={{ color: "hsl(270, 50%, 40%)" }}>Advanced Levers</span>
        </div>
        <span className="text-[10px] text-muted-foreground block">Machine Learning Enhanced</span>
      </div>

      <MLSection icon={<Brain className="w-3.5 h-3.5" />} title="Predictive Forecasting" defaultOpen>
        <div className="flex gap-1">
          {["Prophet", "Neural Net"].map((m) => (
            <button key={m} className="text-[9px] px-2 py-1 rounded eu-ml-badge cursor-pointer hover:opacity-80">{m}</button>
          ))}
        </div>
        <div className="h-16 rounded border border-border flex items-center justify-center" style={{ background: "hsl(270, 60%, 98%)" }}>
          <span className="text-[9px] text-muted-foreground">📈 Probabilistic Forecast</span>
        </div>
        <div className="text-[10px] text-muted-foreground">5–10 year projection with uncertainty bands</div>
      </MLSection>

      <MLSection icon={<AlertTriangle className="w-3.5 h-3.5" />} title="Anomaly Detection">
        <div className="space-y-1.5">
          {[
            { year: 2020, metric: "GDP", type: "Structural", severity: "warning" },
            { year: 2022, metric: "Emissions", type: "Data Error", severity: "danger" },
            { year: 2023, metric: "Renewable", type: "Positive", severity: "success" },
          ].map((a) => (
            <div key={`${a.year}-${a.metric}`} className="flex items-center justify-between text-[10px]">
              <span className="text-foreground">{a.year} – {a.metric}</span>
              <span className={`eu-badge-${a.severity}`}>{a.type}</span>
            </div>
          ))}
        </div>
      </MLSection>

      <MLSection icon={<Network className="w-3.5 h-3.5" />} title="Peer Group Clustering">
        <div className="space-y-1.5">
          {[
            { name: "Nordic Leaders", countries: 5, csi: 85 },
            { name: "Western Innovators", countries: 12, csi: 78 },
            { name: "Mediterranean Trans.", countries: 9, csi: 65 },
            { name: "Central EU Rising", countries: 11, csi: 58 },
            { name: "Eastern Emerging", countries: 7, csi: 48 },
          ].map((c) => (
            <div key={c.name} className="flex items-center justify-between text-[10px] border border-border rounded p-1.5">
              <div>
                <div className="font-medium text-foreground">{c.name}</div>
                <div className="text-[9px] text-muted-foreground">{c.countries} countries</div>
              </div>
              <span className="font-display font-bold text-eu-blue text-xs">{c.csi}</span>
            </div>
          ))}
        </div>
        <div className="eu-ml-badge text-[9px] w-fit">Sweden → Nordic Leaders</div>
      </MLSection>

      <MLSection icon={<TrendingUp className="w-3.5 h-3.5" />} title="Impact Estimator">
        <div className="text-[10px] text-muted-foreground mb-1">Simulate policy changes:</div>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-[10px]">
              <span className="text-foreground">Renewable Energy</span>
              <span className="font-medium text-eu-blue">+1.0%</span>
            </div>
            <input type="range" min={-5} max={5} defaultValue={1} step={0.5} className="w-full h-1 accent-eu-blue" style={{ accentColor: "hsl(270, 50%, 50%)" }} />
          </div>
          <div className="border border-border rounded p-2 text-[10px]" style={{ background: "hsl(270, 60%, 98%)" }}>
            <div className="text-muted-foreground">Estimated Impact:</div>
            <div className="font-medium text-foreground">Emissions: <span className="text-eu-success">-0.8%</span></div>
            <div className="text-[9px] text-muted-foreground mt-0.5">Confidence: 72%</div>
          </div>
        </div>
      </MLSection>

      <MLSection icon={<Target className="w-3.5 h-3.5" />} title="Trajectory Classification">
        <div className="space-y-1.5">
          {[
            { target: "Emissions 2030", prob: 34, risk: "danger" },
            { target: "Renewable 2030", prob: 68, risk: "warning" },
            { target: "Air Quality 2030", prob: 82, risk: "success" },
          ].map((t) => (
            <div key={t.target} className="flex items-center justify-between text-[10px]">
              <span className="text-foreground">{t.target}</span>
              <div className="flex items-center gap-1.5">
                <span className={`eu-badge-${t.risk}`}>{t.prob}%</span>
              </div>
            </div>
          ))}
        </div>
      </MLSection>

      <MLSection icon={<Settings className="w-3.5 h-3.5" />} title="Scenario Optimization">
        <button className="w-full text-[10px] py-1.5 rounded font-medium transition-colors" style={{ background: "linear-gradient(135deg, hsl(270, 60%, 92%), hsl(224, 80%, 92%))", color: "hsl(270, 50%, 40%)" }}>
          ⚡ Maximize CSI Score
        </button>
        <div className="text-[10px] text-muted-foreground">Optimal allocation: Env 45% / Social 25% / Econ 30%</div>
      </MLSection>

      <MLSection icon={<FileQuestion className="w-3.5 h-3.5" />} title="Missing Data Imputation">
        <div className="text-[10px] space-y-1">
          <div className="flex justify-between"><span className="text-muted-foreground">Imputed values</span><span className="font-medium text-foreground">14 of 44 countries</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Avg confidence</span><span className="font-medium text-eu-success">87%</span></div>
          <div className="text-[9px] text-muted-foreground">Based on: Norway, Denmark, Finland (cluster peers)</div>
        </div>
      </MLSection>

      <MLSection icon={<MessageSquareText className="w-3.5 h-3.5" />} title="NL Insights Generator" defaultOpen>
        <div className="text-[10px] leading-relaxed border border-border rounded p-2.5 bg-card text-foreground">
          <p className="mb-2">
            <strong>Sweden</strong> ranks in the <span className="font-medium text-eu-blue">top 2%</span> for overall sustainability. 
            Renewable energy share (54.2%) exceeds regional average but remains <span className="font-medium text-eu-warning">5% below</span> EU 2030 targets.
          </p>
          <p className="mb-2">
            At the current improvement rate of +2.1%/yr, emission reduction targets are <span className="eu-badge-success">likely to be met</span> with sustained policy acceleration.
          </p>
          <div className="border-t border-border pt-2 mt-2 space-y-1 text-[9px]">
            <div><strong className="text-eu-success">Strength:</strong> Water efficiency (P94), Green energy adoption</div>
            <div><strong className="text-eu-danger">Risk:</strong> High energy intensity in heavy industry</div>
            <div><strong className="text-eu-blue">Focus:</strong> Accelerate renewable deployment, Improve circularity by 12%</div>
          </div>
        </div>
      </MLSection>
    </aside>
  );
};

export default RightSidebar;
