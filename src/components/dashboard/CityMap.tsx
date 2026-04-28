


import { useState } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { CITY_SDG_SCORES, type CitySdgScore } from "@/data/sdgData";

interface Props {
  selectedCity?: string;
  onCityClick?: (c: string) => void;
}

function csiColor(s: number) {
  if (s >= 80) return "#15803d";
  if (s >= 70) return "#2563eb";
  if (s >= 58) return "#d97706";
  return "#dc2626";
}

function csiLabel(s: number) {
  if (s >= 80) return "High";
  if (s >= 70) return "Med-High";
  if (s >= 58) return "Med-Low";
  return "Low";
}

const LEGEND = [
  { label: "≥ 80 High",      color: "#15803d" },
  { label: "70–79 Med-High", color: "#2563eb" },
  { label: "58–69 Med-Low",  color: "#d97706" },
  { label: "< 58 Low",       color: "#dc2626" },
];

export default function CityMap({ selectedCity, onCityClick }: Props) {
  const [hoverInfo, setHoverInfo] = useState<CitySdgScore | null>(null);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm h-[500px]">
      
      {/* Floating Map Header */}
      <div className="absolute top-0 left-0 right-0 z-[10] flex items-center justify-between px-4 py-2.5 bg-white/90 backdrop-blur-sm border-b border-slate-100">
        <div>
          <p className="text-xs font-bold text-slate-700">EU Cities — CSI Vector Map</p>
          <p className="text-[10px] text-slate-500">{CITY_SDG_SCORES.length} cities · interactive MapLibre engine</p>
        </div>
        <div className="flex items-center gap-3">
          {LEGEND.map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: l.color }} />
              <span className="text-[10px] text-slate-600 hidden sm:block font-medium">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      <Map
        initialViewState={{
          longitude: 10.5,
          latitude: 51.5,
          zoom: 3.5,
          pitch: 0,
        }}
        // CARTO's free Positron vector tiles (No API key needed!)
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        style={{ width: "100%", height: "100%", backgroundColor: "#F8FAFC" }}
        interactiveLayerIds={["cities"]}
      >
        <NavigationControl position="bottom-right" />

        {CITY_SDG_SCORES.map(city => {
          const isSelected = city.city === selectedCity;
          const color = csiColor(city.csi);
          const size = city.csi >= 80 ? 18 : city.csi >= 70 ? 15 : 12;

          return (
            <Marker
              key={city.city}
              longitude={city.lon}
              latitude={city.lat}
              anchor="center"
              onClick={e => {
                e.originalEvent.stopPropagation();
                onCityClick?.(city.city);
              }}
            >
              {/* Custom interactive HTML markers */}
              <div
                onMouseEnter={() => setHoverInfo(city)}
                onMouseLeave={() => setHoverInfo(null)}
                className="transition-all duration-200 ease-out shadow-sm hover:shadow-md"
                style={{
                  width: isSelected ? size + 6 : size,
                  height: isSelected ? size + 6 : size,
                  backgroundColor: color,
                  border: `2px solid ${isSelected ? "#1E293B" : "white"}`,
                  borderRadius: "50%",
                  cursor: "pointer",
                  opacity: 0.9,
                }}
              />
            </Marker>
          );
        })}

        {/* Mapbox-style Popups for tooltips */}
        {hoverInfo && (
          <Popup
            longitude={hoverInfo.lon}
            latitude={hoverInfo.lat}
            offset={14}
            closeButton={false}
            closeOnClick={false}
            className="z-50"
            style={{ padding: 0 }}
          >
            <div className="min-w-[160px]">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-1.5 h-6 rounded-sm" style={{ backgroundColor: csiColor(hoverInfo.csi) }}></div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm m-0 leading-tight">{hoverInfo.city}</h4>
                  <p className="text-[10px] text-slate-500 m-0 leading-tight">{hoverInfo.country} · {hoverInfo.cluster}</p>
                </div>
              </div>
              <div className="border-t border-slate-100 my-1.5"></div>
              <p className="text-xs text-slate-600 m-0">
                CSI Score: <strong style={{ color: csiColor(hoverInfo.csi) }}>{hoverInfo.csi.toFixed(1)}</strong>
              </p>
              <p className="text-[10px] text-slate-500 m-0 mt-0.5">
                P{hoverInfo.percentile} Percentile · {csiLabel(hoverInfo.csi)}
              </p>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}


// import { useState, useRef, useCallback } from "react";
// import { CITY_SDG_SCORES, type CitySdgScore } from "@/data/sdgData";

// // Map viewport config
// const W = 820, H = 500;
// const LON_MIN = -12, LON_MAX = 32, LAT_MIN = 34, LAT_MAX = 65;

// function toXY(lat: number, lon: number) {
//   const x = ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * W;
//   const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * H;
//   return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
// }

// function csiColor(s: number) {
//   if (s >= 80) return "#15803d";
//   if (s >= 70) return "#2563eb";
//   if (s >= 58) return "#d97706";
//   return "#dc2626";
// }
// function csiLabel(s: number) {
//   if (s >= 80) return "High";
//   if (s >= 70) return "Med-High";
//   if (s >= 58) return "Med-Low";
//   return "Low";
// }

// // Rough EU land polygon (simplified but recognizable)
// const EU_PATH = `
// M 52,490 L 52,400 L 62,370 L 90,355 L 152,355 L 182,355
// C 165,320 138,295 137,276 L 192,276 L 256,232 L 292,230
// L 310,196 L 347,193 L 366,160 L 400,148 L 438,116
// C 455,110 472,102 490,98 L 480,90
// C 530,75 572,58 610,48 L 618,90
// L 608,122 L 574,130 L 556,173
// L 528,170 L 510,183 L 476,182 L 452,162 L 428,173
// L 400,165 L 395,185
// L 370,182 L 348,200 L 312,205 L 297,242 L 634,242
// L 618,218 L 590,216 L 576,240 L 545,260 L 539,295
// L 608,298 L 672,366 L 666,400 L 636,412
// L 598,487 L 575,415 L 558,422 L 534,402 L 510,420
// L 488,478 L 465,420 L 445,422 L 432,432
// L 420,408 L 404,460 L 400,490 L 386,460
// L 372,410 L 354,385 L 330,395 L 322,398
// L 294,365 L 275,360 L 220,410 L 122,468 L 52,490 Z
// `.trim();

// interface TooltipInfo { city: CitySdgScore; cx: number; cy: number }

// const LEGEND = [
//   { label: "≥ 80 High",      color: "#15803d" },
//   { label: "70–79 Med-High", color: "#2563eb" },
//   { label: "58–69 Med-Low",  color: "#d97706" },
//   { label: "< 58 Low",       color: "#dc2626" },
// ];

// interface Props {
//   selectedCity?: string;
//   onCityClick?: (c: string) => void;
// }

// export default function CityMap({ selectedCity, onCityClick }: Props) {
//   const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);
//   const svgRef = useRef<SVGSVGElement>(null);

//   const handleEnter = useCallback((e: React.MouseEvent<SVGCircleElement>, city: CitySdgScore) => {
//     const svg = svgRef.current!;
//     const pt = svg.createSVGPoint();
//     pt.x = e.clientX;
//     pt.y = e.clientY;
//     const { x, y } = toXY(city.lat, city.lon);
//     setTooltip({ city, cx: x, cy: y });
//   }, []);

//   return (
//     <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
//       {/* Map Header */}
//       <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2.5 bg-white/90 backdrop-blur-sm border-b border-slate-100">
//         <div>
//           <p className="text-xs font-bold text-slate-700">EU Cities — CSI Score Map</p>
//           <p className="text-[10px] text-slate-400">{CITY_SDG_SCORES.length} cities · click to explore</p>
//         </div>
//         <div className="flex items-center gap-3">
//           {LEGEND.map(l => (
//             <div key={l.label} className="flex items-center gap-1.5">
//               <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: l.color }} />
//               <span className="text-[10px] text-slate-500 hidden sm:block">{l.label}</span>
//             </div>
//           ))}
//         </div>
//       </div>

//       <svg
//         ref={svgRef}
//         viewBox={`0 0 ${W} ${H}`}
//         className="w-full"
//         style={{ display: "block", marginTop: 40 }}
//         onMouseLeave={() => setTooltip(null)}
//       >
//         <defs>
//           {/* Ocean gradient */}
//           <linearGradient id="ocean-grad" x1="0" y1="0" x2="1" y2="1">
//             <stop offset="0%" stopColor="#DBEAFE" />
//             <stop offset="60%" stopColor="#EFF6FF" />
//             <stop offset="100%" stopColor="#E0F2FE" />
//           </linearGradient>
//           {/* Land gradient */}
//           <linearGradient id="land-grad" x1="0" y1="0" x2="1" y2="1">
//             <stop offset="0%" stopColor="#F8FAFC" />
//             <stop offset="100%" stopColor="#F1F5F9" />
//           </linearGradient>
//           {/* Glow for top performers */}
//           <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
//             <feGaussianBlur stdDeviation="3" result="blur" />
//             <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
//           </filter>
//           <filter id="glow-blue" x="-50%" y="-50%" width="200%" height="200%">
//             <feGaussianBlur stdDeviation="2.5" result="blur" />
//             <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
//           </filter>
//           <filter id="dot-shadow">
//             <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodOpacity="0.2" />
//           </filter>
//           <style>{`
//             @keyframes pulse-ring {
//               0%   { r: 10px; opacity: 0.6; }
//               100% { r: 22px; opacity: 0; }
//             }
//             .pulse-ring { animation: pulse-ring 1.4s ease-out infinite; }
//           `}</style>
//         </defs>

//         {/* Ocean background */}
//         <rect width={W} height={H} fill="url(#ocean-grad)" />

//         {/* Lat/lon grid */}
//         {[45, 50, 55, 60].map(lat => {
//           const { y } = toXY(lat, 0);
//           return (
//             <g key={`lat${lat}`}>
//               <line x1={0} y1={y} x2={W} y2={y} stroke="#BFDBFE" strokeWidth="0.6" strokeDasharray="4 6" />
//               <text x={4} y={y - 3} fontSize="8" fill="#93C5FD" fontFamily="monospace">{lat}°N</text>
//             </g>
//           );
//         })}
//         {[-5, 0, 5, 10, 15, 20, 25].map(lon => {
//           const { x } = toXY(0, lon);
//           return (
//             <line key={`lon${lon}`} x1={x} y1={0} x2={x} y2={H} stroke="#BFDBFE" strokeWidth="0.6" strokeDasharray="4 6" />
//           );
//         })}

//         {/* EU landmass */}
//         <path d={EU_PATH} fill="url(#land-grad)" stroke="#CBD5E1" strokeWidth="1.2" strokeLinejoin="round" />

//         {/* Sea labels */}
//         <text x={30} y={310} fontSize="9" fill="#93C5FD" fontStyle="italic" fontFamily="sans-serif">Atlantic Ocean</text>
//         <text x={440} y={490} fontSize="9" fill="#93C5FD" fontStyle="italic" fontFamily="sans-serif">Mediterranean Sea</text>
//         <text x={660} y={440} fontSize="9" fill="#93C5FD" fontStyle="italic" fontFamily="sans-serif">Black Sea</text>
//         <text x={480} y={140} fontSize="9" fill="#93C5FD" fontStyle="italic" fontFamily="sans-serif">Baltic Sea</text>

//         {/* City dots */}
//         {CITY_SDG_SCORES.map(city => {
//           const { x, y } = toXY(city.lat, city.lon);
//           const color = csiColor(city.csi);
//           const r = city.csi >= 80 ? 7 : city.csi >= 70 ? 6 : 5;
//           const isSelected = city.city === selectedCity;
//           const isHovered = tooltip?.city.city === city.city;

//           return (
//             <g key={city.city}>
//               {/* Pulse ring for selected */}
//               {isSelected && (
//                 <circle cx={x} cy={y} r={10} fill={color} stroke={color} strokeWidth="0" opacity="0.3" className="pulse-ring" />
//               )}
//               {/* Selection outer ring */}
//               {isSelected && (
//                 <circle cx={x} cy={y} r={r + 5} fill="none" stroke={color} strokeWidth="2" opacity="0.5" />
//               )}
//               {/* Main dot */}
//               <circle
//                 cx={x} cy={y} r={isHovered || isSelected ? r + 1.5 : r}
//                 fill={color}
//                 stroke="white"
//                 strokeWidth={isSelected ? 2.5 : 1.8}
//                 filter={city.csi >= 80 ? "url(#glow-green)" : city.csi >= 70 ? "url(#glow-blue)" : "url(#dot-shadow)"}
//                 style={{ cursor: "pointer", transition: "r 0.15s ease" }}
//                 onMouseEnter={e => handleEnter(e, city)}
//                 onMouseLeave={() => setTooltip(null)}
//                 onClick={() => onCityClick?.(city.city)}
//               />
//               {/* City label for top performers */}
//               {city.csi >= 74 && (
//                 <text
//                   x={x + r + 3} y={y + 3.5}
//                   fontSize="8" fill="#475569" fontWeight="600"
//                   fontFamily="Inter, sans-serif"
//                   style={{ pointerEvents: "none", userSelect: "none" }}
//                 >
//                   {city.city}
//                 </text>
//               )}
//             </g>
//           );
//         })}

//         {/* Tooltip in SVG */}
//         {tooltip && (() => {
//           const { city, cx, cy } = tooltip;
//           const tW = 185, tH = 100;
//           const tx = Math.min(cx + 14, W - tW - 4);
//           const ty = Math.max(cy - 50, 4);
//           return (
//             <g transform={`translate(${tx},${ty})`} style={{ pointerEvents: "none" }}>
//               <rect rx={10} width={tW} height={tH} fill="white" stroke="#E2E8F0" strokeWidth="1" filter="url(#dot-shadow)" />
//               <rect rx={10} width={tW} height={6} fill={csiColor(city.csi)} opacity="0.8" />
//               <text x={10} y={26} fontSize="13" fontWeight="700" fill="#1E293B" fontFamily="'Space Grotesk', sans-serif">{city.city}</text>
//               <text x={10} y={40} fontSize="10" fill="#64748B" fontFamily="sans-serif">{city.country} · {city.cluster}</text>
//               <line x1={10} x2={tW-10} y1={48} y2={48} stroke="#E2E8F0" />
//               <text x={10} y={63} fontSize="11" fill="#475569">CSI Score: <tspan fontWeight="800" fill={csiColor(city.csi)}>{city.csi.toFixed(1)}</tspan></text>
//               <text x={10} y={78} fontSize="10" fill="#64748B">SDG Achievement: {city.sdgAchievementRate}%</text>
//               <text x={10} y={92} fontSize="10" fill="#94A3B8">P{city.percentile} EU percentile · {csiLabel(city.csi)} performer</text>
//             </g>
//           );
//         })()}
//       </svg>
//     </div>
//   );
// }












