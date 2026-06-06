import { useState } from "react";
import {
  ChevronDown, ChevronRight, MapPin, Clock, BarChart3, Target, Filter,
  Sliders, TrendingUp, Calculator, Grid3X3, Award, Download,
} from "lucide-react";
import { EU_COUNTRIES } from "@/data/mockData";

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  number: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection = ({ icon, title, number, children, defaultOpen = false }: SectionProps) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="eu-sidebar-section">
      <button onClick={() => setOpen(!open)} className="flex items-center w-full gap-2 text-left group">
        {open ? <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />}
        <span className="text-eu-blue shrink-0">{icon}</span>
        <span className="text-[10px] text-muted-foreground font-medium shrink-0">{number}</span>
        <span className="text-xs font-medium text-foreground truncate group-hover:text-eu-blue transition-colors">{title}</span>
      </button>
      {open && <div className="mt-2 ml-5 space-y-2">{children}</div>}
    </div>
  );
};

const MiniSelect = ({ label, options, defaultValue }: { label: string; options: string[]; defaultValue?: string }) => (
  <div>
    <label className="text-[10px] text-muted-foreground block mb-0.5">{label}</label>
    <select className="w-full text-[11px] border border-border rounded px-2 py-1 bg-card text-foreground" defaultValue={defaultValue}>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const MiniSlider = ({ label, min, max, value, unit }: { label: string; min: number; max: number; value: number; unit: string }) => (
  <div>
    <div className="flex justify-between">
      <label className="text-[10px] text-muted-foreground">{label}</label>
      <span className="text-[10px] font-medium text-foreground">{value}{unit}</span>
    </div>
    <input type="range" min={min} max={max} defaultValue={value} className="w-full h-1 accent-eu-blue" />
  </div>
);

const LeftSidebar = () => {
  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col shrink-0 overflow-y-auto scrollbar-thin">
      <div className="px-3 py-2.5 border-b border-border">
        <span className="eu-section-title text-eu-blue">Core Levers</span>
        <span className="text-[10px] text-muted-foreground block">Descriptive Analytics</span>
      </div>

      <CollapsibleSection icon={<MapPin className="w-3.5 h-3.5" />} title="Geographic Selection" number="1" defaultOpen>
        <MiniSelect label="Primary Country" options={EU_COUNTRIES} defaultValue="Sweden" />
        <MiniSelect label="Comparison Countries" options={["Germany", "France", "Italy", "Spain", "Netherlands"]} defaultValue="Germany" />
        <div className="flex gap-2">
          <MiniSelect label="Region" options={["All", "Northern", "Western", "Southern", "Central", "Eastern"]} />
          <MiniSelect label="Pop. Band" options={["All", "<5M", "5M-20M", ">20M"]} />
        </div>
        <div className="h-20 bg-eu-blue-pale rounded border border-border flex items-center justify-center">
          <span className="text-[9px] text-muted-foreground">🗺️ EU Map Selection</span>
        </div>
      </CollapsibleSection>

      <CollapsibleSection icon={<Clock className="w-3.5 h-3.5" />} title="Temporal Analysis" number="2">
        <MiniSlider label="Start Year" min={2015} max={2024} value={2015} unit="" />
        <MiniSlider label="End Year" min={2015} max={2024} value={2024} unit="" />
        <div className="flex items-center gap-2">
          <input type="checkbox" id="quarterly" className="accent-eu-blue w-3 h-3" />
          <label htmlFor="quarterly" className="text-[10px] text-muted-foreground">Quarterly view (GDP & Employment)</label>
        </div>
        <div className="flex gap-1 flex-wrap">
          {["YoY Growth", "CAGR", "Moving Avg"].map((m) => (
            <span key={m} className="text-[9px] bg-eu-blue-pale text-eu-blue px-1.5 py-0.5 rounded cursor-pointer hover:bg-eu-blue hover:text-primary-foreground transition-colors">{m}</span>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection icon={<BarChart3 className="w-3.5 h-3.5" />} title="Benchmark Comparison" number="3">
        {["Peer Countries", "Regional Average", "EU27 Average", "Top Performer"].map((o) => (
          <label key={o} className="flex items-center gap-2 text-[10px] text-foreground cursor-pointer">
            <input type="checkbox" defaultChecked className="accent-eu-blue w-3 h-3" />
            {o}
          </label>
        ))}
      </CollapsibleSection>

      <CollapsibleSection icon={<Target className="w-3.5 h-3.5" />} title="Target Tracking" number="4">
        <MiniSelect label="Target Framework" options={["EU 2030 Targets", "EU 2035 Targets", "WHO Guidelines"]} />
        <div className="text-[10px] space-y-1">
          <div className="flex items-center justify-between"><span className="text-muted-foreground">Feasibility</span><span className="eu-badge-warning">At Risk</span></div>
          <div className="flex items-center justify-between"><span className="text-muted-foreground">Required Annual Rate</span><span className="font-medium text-foreground">+2.3%/yr</span></div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection icon={<Filter className="w-3.5 h-3.5" />} title="Metric Focus Filter" number="5">
        <MiniSelect label="SDG Goal" options={["All", "SDG 7 – Energy", "SDG 11 – Communities", "SDG 12 – Consumption", "SDG 13 – Climate"]} />
        <MiniSelect label="Pillar" options={["All", "Environmental", "Social", "Economic"]} />
        <label className="flex items-center gap-2 text-[10px] text-foreground cursor-pointer">
          <input type="checkbox" className="accent-eu-blue w-3 h-3" />
          Show only metrics &lt;80% of target
        </label>
        <label className="flex items-center gap-2 text-[10px] text-foreground cursor-pointer">
          <input type="checkbox" defaultChecked className="accent-eu-blue w-3 h-3" />
          Include provisional data
        </label>
      </CollapsibleSection>

      <CollapsibleSection icon={<Sliders className="w-3.5 h-3.5" />} title="Composite Index (CSI)" number="6">
        <MiniSlider label="Environmental" min={0} max={100} value={40} unit="%" />
        <MiniSlider label="Social" min={0} max={100} value={30} unit="%" />
        <MiniSlider label="Economic" min={0} max={100} value={30} unit="%" />
        <div className="flex gap-1 flex-wrap">
          {["Equal", "Climate", "Economic"].map((p) => (
            <button key={p} className="text-[9px] bg-eu-blue-pale text-eu-blue px-2 py-0.5 rounded hover:bg-eu-blue hover:text-primary-foreground transition-colors">{p}</button>
          ))}
        </div>
        <div className="text-center">
          <div className="text-lg font-display font-bold text-eu-blue">72.4</div>
          <div className="text-[9px] text-muted-foreground">Composite Score</div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection icon={<TrendingUp className="w-3.5 h-3.5" />} title="Trend Projection" number="7">
        <MiniSelect label="Method" options={["Linear Regression", "Exponential Regression"]} />
        <MiniSlider label="Forecast Years" min={5} max={15} value={10} unit="yr" />
        <label className="flex items-center gap-2 text-[10px] text-foreground cursor-pointer">
          <input type="checkbox" defaultChecked className="accent-eu-blue w-3 h-3" />
          Show confidence intervals
        </label>
      </CollapsibleSection>

      <CollapsibleSection icon={<Calculator className="w-3.5 h-3.5" />} title="Gap Calculator" number="8">
        <div className="text-[10px] space-y-1">
          <div className="flex justify-between"><span className="text-muted-foreground">Distance to EU target</span><span className="font-medium text-eu-warning">-7.6%</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Distance to peer avg</span><span className="font-medium text-eu-success">+4.2%</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Required annual Δ</span><span className="font-medium text-foreground">+1.3%/yr</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Historical avg Δ</span><span className="font-medium text-foreground">+0.9%/yr</span></div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection icon={<Grid3X3 className="w-3.5 h-3.5" />} title="Correlation Explorer" number="9">
        <MiniSelect label="Method" options={["Pearson", "Spearman"]} />
        <div className="text-[9px] text-muted-foreground">
          Tip: View heatmap in main chart area → Correlations tab
        </div>
      </CollapsibleSection>

      <CollapsibleSection icon={<Award className="w-3.5 h-3.5" />} title="Percentile Ranking" number="10">
        <div className="text-center space-y-1">
          <div className="text-sm font-display font-bold text-eu-blue">Top 32%</div>
          <div className="text-[10px] text-muted-foreground">Rank #14 of {EU_COUNTRIES.length} countries</div>
          <div className="text-[10px]"><span className="eu-badge-success">Q2 – 2nd Quartile</span></div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection icon={<Download className="w-3.5 h-3.5" />} title="Data Export" number="11">
        <div className="space-y-1.5">
          {["PDF Report", "Excel (Multi-sheet)", "CSV Export", "JSON API"].map((f) => (
            <button key={f} className="w-full text-[10px] text-left px-2 py-1.5 border border-border rounded hover:bg-eu-blue-pale hover:text-eu-blue transition-colors text-foreground">{f}</button>
          ))}
        </div>
      </CollapsibleSection>
    </aside>
  );
};

export default LeftSidebar;
