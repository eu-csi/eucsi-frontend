import { useQuery } from "@tanstack/react-query";
import type { CountrySdgScore } from "@/data/sdgData";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://187.127.164.121:8000";

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
  const response = await fetch(
    `${API_BASE}/sdg-scores/${encodeURIComponent(country)}`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch SDG scores for ${country}`);
  }
  const data = await response.json();

  // Transform backend response to country-specific format
  return {
    country,
    countryCode: data.countryCode,
    compositeCsi: data.compositeCsi,
    sdgScores: Object.entries(data.sdgScores).reduce((acc: Record<number, any>, [key, score]: [string, any]) => {
      const sdgId = parseInt(key.replace('sdg', ''));
      acc[sdgId] = {
        score: score.score,
        label: score.title,
        metrics: score.metrics,
        status: score.status,
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
