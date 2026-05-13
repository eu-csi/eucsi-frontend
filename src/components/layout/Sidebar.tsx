import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { SDG_DEFINITIONS } from "@/data/sdgData";

const COUNTRY_AVG: Record<number, number> = {
  5: 68, 6: 71, 7: 65, 8: 74, 11: 62, 12: 61, 13: 67, 17: 79,
  3: 70, 9: 64, 10: 66, 15: 68,
};

export default function Sidebar() {
  const location = useLocation();
  const [directOpen, setDirectOpen] = useState(true);
  const [indirectOpen, setIndirectOpen] = useState(true);

  const isActive = (slug: string) => location.pathname === `/sdg/${slug}`;
  const isDashboard = location.pathname === "/";

  const direct = SDG_DEFINITIONS.filter(s => s.type === "direct");
  const indirect = SDG_DEFINITIONS.filter(s => s.type === "indirect");

  function SdgItem({ sdg }: { sdg: typeof SDG_DEFINITIONS[0] }) {
    const active = isActive(sdg.slug);
    const avg = COUNTRY_AVG[sdg.id] ?? 65;
    const barColor = avg >= 75 ? "#16a34a" : avg >= 60 ? "#2563eb" : "#f59e0b";
    return (
      <Link
        to={`/sdg/${sdg.slug}`}
        title={sdg.title}
        className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 ${
          active
            ? "bg-blue-50 border-l-[3px] border-blue-600"
            : "border-l-[3px] border-transparent hover:bg-slate-50"
        }`}
      >
        <span
          className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-black shrink-0 transition-transform group-hover:scale-110"
          style={{ background: sdg.bgColor, color: sdg.color }}
        >
          {sdg.id}
        </span>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium truncate ${active ? "text-blue-700" : "text-slate-700 group-hover:text-slate-900"}`}>
            {sdg.shortTitle}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${avg}%`, background: barColor }} />
            </div>
            <span className="text-[10px] text-slate-400 font-medium shrink-0">{avg}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <aside className="w-56 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto scrollbar-thin shadow-sm">
      {/* Dashboard Link */}
      <div className="px-3 pt-3 pb-2">
        <Link
          to="/"
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all ${
            isDashboard ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          <span className="text-sm font-semibold">Overview</span>
        </Link>
      </div>

      <div className="mx-3 border-t border-slate-100" />

      {/* Direct SDGs */}
      <div className="px-3 pt-3 pb-1">
        <button
          onClick={() => setDirectOpen(v => !v)}
          className="flex items-center justify-between w-full mb-1.5 group"
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Direct Measures</span>
          {directOpen
            ? <ChevronUp className="w-3 h-3 text-slate-400" />
            : <ChevronDown className="w-3 h-3 text-slate-400" />}
        </button>
        {directOpen && (
          <div className="space-y-0.5">
            {direct.map(sdg => <SdgItem key={sdg.id} sdg={sdg} />)}
          </div>
        )}
      </div>

      <div className="mx-3 border-t border-slate-100 mt-1" />

      {/* Indirect SDGs */}
      <div className="px-3 pt-2 pb-3">
        <button
          onClick={() => setIndirectOpen(v => !v)}
          className="flex items-center justify-between w-full mb-1.5 group"
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Indirect Measures</span>
          {indirectOpen
            ? <ChevronUp className="w-3 h-3 text-slate-400" />
            : <ChevronDown className="w-3 h-3 text-slate-400" />}
        </button>
        {indirectOpen && (
          <div className="space-y-0.5">
            {indirect.map(sdg => <SdgItem key={sdg.id} sdg={sdg} />)}
          </div>
        )}
      </div>

      {/* CSI Formula Footer */}
      <div className="mt-auto border-t border-slate-100 p-3">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">CSI Formula</p>
        <div className="bg-blue-50 rounded-lg p-2.5 text-center">
          <p className="text-[11px] font-mono text-blue-600 font-semibold leading-relaxed">
            CSI = ¹⁄₁₂ × Σ scores
          </p>
          <p className="text-[10px] text-slate-500 mt-1">12 SDGs · scale 0–100</p>
        </div>
        <p className="text-[10px] text-slate-400 mt-2 text-center">
          Eurostat Open Data · 2015–2024
        </p>
      </div>
    </aside>
  );
}
