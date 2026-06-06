import { Download, Database } from "lucide-react";
import { Link } from "react-router-dom";

export default function TopBar() {
  return (
    <header className="h-12 bg-white border-b border-slate-200 flex items-center px-4 gap-4 shrink-0 z-40 shadow-sm">
      <Link to="/" className="flex items-center gap-2 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center shadow-sm">
          <span className="text-white text-[10px] font-black font-display">EU</span>
        </div>
        <span className="font-display font-bold text-sm text-slate-800 hidden sm:block">CountryPulse</span>
      </Link>
      <div className="w-px h-5 bg-slate-200 hidden sm:block" />
      <span className="text-xs text-slate-500 hidden md:block font-medium">SDG Intelligence Dashboard</span>
      <div className="ml-auto flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 hidden sm:flex">
          <Database className="w-3 h-3" />
          12 Eurostat datasets · 27 EU countries · 2015–2024
        </div>
        <button className="flex items-center gap-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg px-2.5 py-1.5 hover:bg-slate-50 transition-colors">
          <Download className="w-3.5 h-3.5" /> Export
        </button>
      </div>
    </header>
  );
}
