import { SDG_DEFINITIONS, CITY_SDG_SCORES } from "@/data/sdgData";
import { Link } from "react-router-dom";

interface Props {
  highlightCsi?: number;
}

function scoreColor(score: number) {
  if (score >= 78) return { bg: "#DCFCE7", text: "#15803D" };
  if (score >= 65) return { bg: "#DBEAFE", text: "#1D4ED8" };
  if (score >= 50) return { bg: "#FEF9C3", text: "#B45309" };
  return { bg: "#FEE2E2", text: "#B91C1C" };
}

export default function SDGScoreGrid({ highlightCsi }: Props) {
  // Take top 8 cities by CSI for the grid
  const topCities = [...CITY_SDG_SCORES].sort((a, b) => b.csi - a.csi).slice(0, 8);
  const sdgs = SDG_DEFINITIONS;

  return (
    <div className="card-base overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-display font-semibold text-foreground">SDG Score Heatmap</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Top 8 cities × 12 SDGs — score colour: <span className="text-green-600 font-medium">green ≥ 78</span> · <span className="text-blue-600 font-medium">blue ≥ 65</span> · <span className="text-amber-600 font-medium">amber ≥ 50</span> · <span className="text-red-600 font-medium">red &lt; 50</span></p>
      </div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground bg-muted/30 sticky left-0 border-b border-r border-border min-w-[110px]">
                City
              </th>
              {sdgs.map(sdg => (
                <th key={sdg.id} className="px-2 py-2.5 text-center bg-muted/30 border-b border-border min-w-[58px]">
                  <Link
                    to={`/sdg/${sdg.slug}`}
                    className="flex flex-col items-center gap-0.5 hover:opacity-80 transition-opacity"
                  >
                    <span
                      className="w-6 h-6 rounded-md flex items-center justify-center font-bold text-[11px]"
                      style={{ background: sdg.bgColor, color: sdg.color }}
                    >
                      {sdg.id}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-normal leading-tight text-center max-w-[52px]">
                      {sdg.shortTitle.split(" ").slice(-1)[0]}
                    </span>
                  </Link>
                </th>
              ))}
              <th className="px-3 py-2.5 text-center bg-muted/30 border-b border-l border-border">
                <span className="text-xs font-semibold text-muted-foreground">CSI</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {topCities.map((city, idx) => (
              <tr key={city.city} className={idx % 2 === 0 ? "bg-white" : "bg-muted/20"}>
                <td className="px-4 py-2 font-semibold text-foreground sticky left-0 bg-inherit border-r border-border whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground font-mono">{idx + 1}</span>
                    {city.city}
                  </div>
                </td>
                {sdgs.map(sdg => {
                  const score = city.sdgScores[sdg.id] ?? 0;
                  const { bg, text } = scoreColor(score);
                  return (
                    <td key={sdg.id} className="px-1.5 py-2 text-center">
                      <span
                        className="inline-flex items-center justify-center w-10 h-6 rounded font-bold text-[11px] transition-transform hover:scale-110 cursor-default"
                        style={{ background: bg, color: text }}
                        title={`${city.city} · SDG ${sdg.id}: ${score}`}
                      >
                        {score}
                      </span>
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-center border-l border-border">
                  <span className={`csi-pill text-sm ${city.csi >= 78 ? "csi-pill-high" : city.csi >= 65 ? "csi-pill-mid" : "csi-pill-low"}`}>
                    {city.csi.toFixed(0)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
