import { useQuery } from "@tanstack/react-query";
import type { CountrySdgScore } from "@/data/sdgData";
import { fetchSDGScores } from "./sdgScoresApi";

export interface CountrySDGScoresResponse {
  country: string;
  countryCode: string;
  compositeCsi: number | null;
  sdgScores: Record<number, {
    score: number | null;
    label: string;
    metrics?: Record<string, number>;
    status?: string;
  }>;
  timestamp: string;
}

/**
 * Fetch live SDG scores for a country
 */
export async function fetchCountrySDGScores(
  country: string
): Promise<CountrySDGScoresResponse> {
  const data = await fetchSDGScores(country);
  return {
    country,
    countryCode: data.countryCode,
    compositeCsi: data.compositeCsi,
    sdgScores: Object.entries(data.sdgScores).reduce((acc: Record<number, any>, [_, val]: [string, any]) => {
      const sdgId = val.id;
      acc[sdgId] = {
        score: val.score,
        label: val.title,
        metrics: val.metrics,
        status: val.status || (val.score && val.score >= 70 ? "On Track" : "Needs Work"),
      };
      return acc;
    }, {}),
    timestamp: data.timestamp,
  };
}

/**
 * React Query hook for country SDG scores
 */
export function useCountrySDGScores(countryData: CountrySdgScore | null) {
  return useQuery({
    queryKey: ["countrySDGScores", countryData?.country],
    queryFn: () => fetchCountrySDGScores(countryData!.country),
    enabled: !!countryData,
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 2,
  });
}

/**
 * Map SDG ID to color code
 */
export function getSDGColor(sdgId: number): string {
  const colors: Record<number, string> = {
    5: "#FF3A21",  // Gender Equality - Red
    6: "#26BDE2",  // Clean Water - Blue
    7: "#FCC30B",  // Clean Energy - Yellow
    8: "#A21942",  // Decent Work - Purple
    11: "#FD9D24", // Sustainable Cities - Orange
    12: "#BF8B2E", // Responsible Consumption - Brown
    13: "#3F7E44", // Climate Action - Green
    17: "#DD3E3E", // Partnerships - Dark Red
  };
  return colors[sdgId] || "#CBD5E1";
}
