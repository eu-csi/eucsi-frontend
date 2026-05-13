import { useSDGScores, getScoreColor, getScoreBgColor } from "@/services/sdgScoresApi";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, TrendingUp, Zap } from "lucide-react";

interface Props {
  country: string | null;
}

const SDG_ICONS: Record<number, JSX.Element> = {
  5: <span className="text-2xl">♀</span>,
  6: <span className="text-2xl">💧</span>,
  7: <span className="text-2xl">⚡</span>,
  8: <span className="text-2xl">📈</span>,
  11: <span className="text-2xl">🏙️</span>,
  12: <span className="text-2xl">♻️</span>,
};

export default function SDGScoresDisplay({ country }: Props) {
  const { data, isLoading, error } = useSDGScores(country);

  if (!country) {
    return (
      <Card className="p-6 bg-slate-50 border-slate-200">
        <p className="text-slate-500 text-sm">Select a country to view SDG scores</p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 border-red-200 bg-red-50">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Error loading SDG scores</p>
            <p className="text-sm text-red-700">{(error as Error).message}</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!data) return null;

  const { compositeCsi, sdgScores } = data;

  return (
    <div className="space-y-6">
      {/* Composite CSI Header */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-slate-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600 mb-1">
              Composite Sustainability Index
            </p>
            <h3 className="text-4xl font-bold text-slate-900">
              {compositeCsi !== null ? `${compositeCsi}/100` : "—"}
            </h3>
            <p className="text-xs text-slate-500 mt-2">
              {country} · Based on available SDG models (5, 6, 7)
            </p>
          </div>
          <TrendingUp className="w-12 h-12 text-blue-400 opacity-30" />
        </div>
      </Card>

      {/* SDG Scores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(sdgScores).map(([key, sdg]) => (
          <Card
            key={key}
            className={`p-4 border-2 transition-all hover:shadow-lg ${
              sdg.score !== null
                ? getScoreBgColor(sdg.score) + " border-slate-200"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {SDG_ICONS[sdg.id] || <span className="text-2xl">•</span>}
                <div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${[5,6,7].includes(sdg.id) ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500"}`} />
                    <p className="text-xs font-semibold text-slate-600">SDG {sdg.id}</p>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                    {sdg.title.split("—")[1]?.trim() || sdg.title}
                  </h4>
                </div>
              </div>
            </div>

            {/* Score or Status */}
            {sdg.score !== null ? (
              <>
                <div className="mb-4">
                  <div className={`text-3xl font-bold ${getScoreColor(sdg.score)}`}>
                    {sdg.score}
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        sdg.score >= 80
                          ? "bg-green-600"
                          : sdg.score >= 70
                          ? "bg-blue-600"
                          : sdg.score >= 60
                          ? "bg-yellow-600"
                          : sdg.score >= 50
                          ? "bg-orange-600"
                          : "bg-red-600"
                      }`}
                      style={{ width: `${sdg.score}%` }}
                    />
                  </div>
                </div>

                {/* Metrics */}
                {sdg.metrics && (
                  <div className="text-xs space-y-1 mb-3 p-2 bg-white/50 rounded border border-slate-200">
                    {Object.entries(sdg.metrics).map(([metricKey, value]) => (
                      <div
                        key={metricKey}
                        className="flex justify-between text-slate-700"
                      >
                        <span className="capitalize">
                          {metricKey
                            .replace(/([A-Z])/g, " $1")
                            .toLowerCase()
                            .trim()}
                        </span>
                        <span className="font-semibold">{value}%</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* EU Comparison */}
                {sdg.euComparison && (
                  <p className="text-xs text-slate-600 bg-white/50 px-2 py-1 rounded border border-slate-200">
                    <span className="font-semibold">{sdg.euComparison}</span> EU average
                  </p>
                )}

                {/* Water Stress (SDG 6 specific) */}
                {sdg.waterStress && (
                  <div className="mt-2 text-xs">
                    <span className="inline-block px-2 py-1 bg-slate-200 text-slate-700 rounded font-medium">
                      {sdg.waterStress} Stress
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="py-6 text-center">
                <p className="text-sm font-medium text-slate-600 mb-1">
                  {sdg.status}
                </p>
                <p className="text-xs text-slate-500">{sdg.note}</p>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Footer */}
      <p className="text-xs text-slate-400 text-center">
        Data source: {data.dataSource} · Last updated: {new Date(data.timestamp).toLocaleDateString()}
      </p>
    </div>
  );
}
