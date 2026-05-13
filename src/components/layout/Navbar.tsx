import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Globe, Download, BarChart3, Menu, X } from "lucide-react";
import { SDG_DEFINITIONS } from "@/data/sdgData";

const SDG_GROUPS = {
  "Direct Measures": SDG_DEFINITIONS.filter(s => s.type === "direct"),
  "Indirect Measures": SDG_DEFINITIONS.filter(s => s.type === "indirect"),
};

export default function Navbar() {
  const [sdgOpen, setSdgOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSdgOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = (path: string) => location.pathname === path;
  const isSdgActive = location.pathname.startsWith("/sdg/");

  return (
    <nav className="nav-bar">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg eu-gradient-header flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-xs font-display">EU</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-display font-bold text-sm text-foreground">CountryPulse</span>
              <span className="text-xs text-muted-foreground block leading-none">SDG Intelligence</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive("/")
                  ? "bg-blue-50 text-blue-700"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </Link>

            {/* SDG Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setSdgOpen(!sdgOpen)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isSdgActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <Globe className="w-4 h-4" />
                SDG Explorer
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sdgOpen ? "rotate-180" : ""}`} />
              </button>

              {sdgOpen && (
                <div className="absolute top-full left-0 mt-1 w-[520px] bg-white rounded-xl shadow-xl border border-border p-4 z-50 animate-fade-up">
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(SDG_GROUPS).map(([groupName, sdgs]) => (
                      <div key={groupName}>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                          {groupName}
                        </p>
                        <div className="space-y-0.5">
                          {sdgs.map(sdg => (
                            <Link
                              key={sdg.id}
                              to={`/sdg/${sdg.slug}`}
                              onClick={() => setSdgOpen(false)}
                              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors group ${
                                isActive(`/sdg/${sdg.slug}`)
                                  ? "bg-blue-50 text-blue-700"
                                  : "hover:bg-muted/60 text-foreground"
                              }`}
                            >
                              <span
                                className="w-6 h-6 rounded-md flex items-center justify-center text-xs shrink-0"
                                style={{ background: sdg.bgColor, color: sdg.color }}
                              >
                                {sdg.id}
                              </span>
                              <span className="font-medium">{sdg.shortTitle}</span>
                              <span
                                className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
                                  sdg.type === "direct" ? "badge-blue" : "badge-warning"
                                }`}
                                style={{ fontSize: "10px" }}
                              >
                                {sdg.type}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-[11px] text-muted-foreground text-center">
                      Powered by 12 Eurostat open datasets · 2015–2024
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Controls */}
          <div className="hidden md:flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
            <div className="w-px h-5 bg-border" />
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-xs font-bold text-blue-700">EU</span>
            </div>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted/60 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-white px-4 py-3 space-y-1">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
              isActive("/") ? "bg-blue-50 text-blue-700" : "text-foreground hover:bg-muted/60"
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Dashboard
          </Link>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 pt-2">SDG Explorer</p>
          {SDG_DEFINITIONS.map(sdg => (
            <Link
              key={sdg.id}
              to={`/sdg/${sdg.slug}`}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted/60"
            >
              <span className="w-5 h-5 rounded flex items-center justify-center text-[11px] font-bold shrink-0"
                style={{ background: sdg.bgColor, color: sdg.color }}>
                {sdg.id}
              </span>
              {sdg.shortTitle}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
