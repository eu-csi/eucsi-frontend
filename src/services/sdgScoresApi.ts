import { useQuery } from "@tanstack/react-query";

const API_BASE = "http://187.127.164.121:8000"; // No trailing slash

export interface SDGScore {
  id: number;
  slug: string;
  title: string;
  score: number | null;
  metrics?: Record<string, number>;
  status?: string;
  note?: string;
  euComparison?: string;
  waterStress?: string;
}

export interface SDGScoresResponse {
  country: string;
  countryCode: string;
  compositeCsi: number | null;
  sdgScores: Record<string, SDGScore>;
  timestamp: string;
  dataSource: string;
}

/**
 * Fetch composite SDG scores for a given country
 */
export async function fetchSDGScores(country: string): Promise<SDGScoresResponse> {
  const response = await fetch(`${API_BASE}/api/cities/${encodeURIComponent(country)}/overview`);
  if (!response.ok) {
    throw new Error(`Failed to fetch SDG scores: ${response.statusText}`);
  }
  return response.json();
}

/**
 * React Query hook for SDG scores
 */
export function useSDGScores(country: string | null) {
  return useQuery({
    queryKey: ["sdgScores", country],
    queryFn: () => fetchSDGScores(country!),
    enabled: !!country,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
}

/**
 * Format score as percentage with color
 */
export function getScoreColor(score: number | null): string {
  if (score === null) return "text-slate-400";
  if (score >= 80) return "text-green-600";
  if (score >= 70) return "text-blue-600";
  if (score >= 60) return "text-yellow-600";
  if (score >= 50) return "text-orange-600";
  return "text-red-600";
}

/**
 * Get background color for score badge
 */
export function getScoreBgColor(score: number | null): string {
  if (score === null) return "bg-slate-100";
  if (score >= 80) return "bg-green-50";
  if (score >= 70) return "bg-blue-50";
  if (score >= 60) return "bg-yellow-50";
  if (score >= 50) return "bg-orange-50";
  return "bg-red-50";
}
