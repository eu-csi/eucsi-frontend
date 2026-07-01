// src/components/dashboard/CountryMap.tsx
import { useState, Dispatch, SetStateAction } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { LiveCountryRecord } from "@/types/countryTypes";
import { COUNTRY_SDG_SCORES, type CountrySdgScore } from "@/data/sdgData";

  interface Props {
  selectedCountry?: string;
  onCountryClick?: Dispatch<SetStateAction<string | undefined>>;
  liveCountries?: LiveCountryRecord[];
}

function csiColor(s: number) {
  if (s >= 68) return "#2563eb"; // Western Innovators (merged with Nordic Leaders)
  if (s >= 55) return "#d97706"; // Mediterranean Transitioning
  if (s >= 50) return "#7c3aed"; // Central European Rising
  return "#dc2626";              // Eastern Emerging
}

function csiLabel(s: number) {
  if (s >= 68) return "Western Innovators";
  if (s >= 55) return "Mediterranean Transitioning";
  if (s >= 50) return "Central European Rising";
  return "Eastern Emerging";
}

const LEGEND = [
  { label: "≥ 68  Western Innovators",          color: "#2563eb" },
  { label: "55–67 Mediterranean Transitioning",  color: "#d97706" },
  { label: "50–54 Central European Rising",      color: "#7c3aed" },
  { label: "< 50  Eastern Emerging",             color: "#dc2626" },
] as const;

export default function CountryMap({ selectedCountry, onCountryClick, liveCountries }: Props) {
  const [hoverInfo, setHoverInfo] = useState<CountrySdgScore | null>(null);
  
  // Use live countries if provided, otherwise fall back to mock data
  const displayCountries = liveCountries && liveCountries.length > 0 
    ? liveCountries
    : COUNTRY_SDG_SCORES;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm h-[500px]">

      {/* ── Floating header ── */}
      <div className="absolute top-0 left-0 right-0 z-[10] flex flex-wrap items-center justify-between
                      px-4 py-2.5 bg-white/90 backdrop-blur-sm border-b border-slate-100 gap-2">
        <div>
          <p className="text-xs font-bold text-slate-700">
            European Countries — CSI Cluster Map
          </p>
          <p className="text-[10px] text-slate-500">
            {displayCountries.length} countries · MapLibre GL · CARTO Positron
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {LEGEND.map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: l.color }}
              />
              <span className="text-[10px] text-slate-600 hidden lg:block font-medium">
                {l.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Map ── */}
      <Map
        initialViewState={{ longitude: 15, latitude: 54, zoom: 3.4, pitch: 0 }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        style={{ width: "100%", height: "100%", backgroundColor: "#F8FAFC" }}
      >
        <NavigationControl position="bottom-right" />

        {displayCountries.map(country => {
          const isSelected = country.country === selectedCountry;
          const color = csiColor(country.csi);

          // Marker size scales with CSI tier
          const size =
            country.csi >= 80 ? 20 :
            country.csi >= 68 ? 17 :
            country.csi >= 55 ? 14 : 12;

          return (
            <Marker
              key={country.country}
              longitude={country.lon}
              latitude={country.lat}
              anchor="center"
              onClick={e => {
                e.originalEvent.stopPropagation();
                onCountryClick?.(country.country);
              }}
            >
              <div
                onMouseEnter={() => setHoverInfo(country)}
                onMouseLeave={() => setHoverInfo(null)}
                className="transition-all duration-200 ease-out"
                style={{
                  width:           isSelected ? size + 8 : size,
                  height:          isSelected ? size + 8 : size,
                  backgroundColor: color,
                  border:          `2.5px solid ${isSelected ? "#0f172a" : "white"}`,
                  borderRadius:    "50%",
                  cursor:          "pointer",
                  opacity:         0.92,
                  boxShadow:       isSelected
                    ? `0 0 0 3px ${color}40`
                    : "0 1px 3px rgba(0,0,0,0.25)",
                }}
              />
            </Marker>
          );
        })}

        {/* ── Hover tooltip popup ── */}
        {hoverInfo && (
          <Popup
            longitude={hoverInfo.lon}
            latitude={hoverInfo.lat}
            offset={16}
            closeButton={false}
            closeOnClick={false}
            className="z-50"
            style={{ padding: 0 }}
          >
            <div className="min-w-[180px] p-3">
              {/* Country name + accent bar */}
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-1.5 h-7 rounded-sm shrink-0"
                  style={{ backgroundColor: csiColor(hoverInfo.csi) }}
                />
                <div>
                  <h4 className="font-bold text-slate-800 text-sm m-0 leading-tight">
                    {hoverInfo.country}
                  </h4>
                  <p className="text-[10px] text-slate-500 m-0 leading-tight">
                    {hoverInfo.countryCode}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100 mb-2" />

              {/* CSI row */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500">CSI Score</span>
                <strong
                  className="text-sm tabular-nums"
                  style={{ color: csiColor(hoverInfo.csi) }}
                >
                  {hoverInfo.csi.toFixed(1)}
                </strong>
              </div>

              {/* Cluster */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500">Cluster</span>
                <span className="text-[11px] font-semibold text-slate-700">
                  {hoverInfo.cluster}
                </span>
              </div>

              {/* Percentile */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500">EU Percentile</span>
                <span className="text-[11px] font-medium text-slate-600">
                  P{hoverInfo.percentile} · {csiLabel(hoverInfo.csi)}
                </span>
              </div>

              {/* SDG Achievement */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">SDG Achieved</span>
                <span className="text-[11px] font-semibold text-slate-700">
                  {hoverInfo.sdgAchievementRate}%
                </span>
              </div>

              {/* Mini CSI bar */}
              <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${hoverInfo.csi}%`,
                    background: csiColor(hoverInfo.csi),
                  }}
                />
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}





