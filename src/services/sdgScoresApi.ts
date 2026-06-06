import { useQuery } from "@tanstack/react-query";
import { COUNTRY_SDG_SCORES, SDG_DEFINITIONS } from "@/data/sdgData";

// Use environment variable for API base URL or default to port 8002
const API_BASE = import.meta.env.VITE_API_URL || "http://187.127.164.121:8002";

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

// Module-level cache for countries to avoid repeated fetches
let countriesCache: any[] | null = null;

export async function fetchCountriesList(): Promise<any[]> {
  if (countriesCache) return countriesCache;
  try {
    const response = await fetch(`${API_BASE}/api/countries`);
    if (!response.ok) throw new Error("Failed to fetch countries list");
    countriesCache = await response.json();
    return countriesCache || [];
  } catch (e) {
    console.error("Error fetching countries:", e);
    return [];
  }
}

export async function getCountryIdByNameOrCode(nameOrCode: string): Promise<number | null> {
  const list = await fetchCountriesList();
  const search = nameOrCode.toLowerCase().trim();
  const match = list.find(
    c => c.name.toLowerCase() === search ||
         c.iso2.toLowerCase() === search ||
         c.iso3.toLowerCase() === search
  );
  return match ? match.country_id : null;
}

// Mapping from DB metric ID to SDG ID and frontend metric key
export const DB_METRIC_MAPPING: Record<number, { sdgId: number; key: string }> = {
  1: { sdgId: 5, key: "genderEmploymentGap" },
  2: { sdgId: 5, key: "femaleEmploymentRate" },
  3: { sdgId: 6, key: "weiPlus" },
  4: { sdgId: 6, key: "waterPerCapita" },
  5: { sdgId: 7, key: "renewableShare" },
  6: { sdgId: 7, key: "energyIntensity" },
  7: { sdgId: 8, key: "gdpPerCapita" },
  8: { sdgId: 8, key: "employmentRate" },
  9: { sdgId: 11, key: "aqiPm25" },
  10: { sdgId: 11, key: "publicTransportShare" },
  11: { sdgId: 12, key: "recyclingRate" },
  12: { sdgId: 12, key: "wastePerCapita" },
  13: { sdgId: 13, key: "ghgPerCapita" },
  14: { sdgId: 13, key: "carbonIntensityEconomy" },
  15: { sdgId: 3, key: "airPollutionExposure" },
  16: { sdgId: 9, key: "energyProductivity" },
  17: { sdgId: 10, key: "genderEmploymentGap" },
  41: { sdgId: 6, key: "waterStressCategory" },
  42: { sdgId: 7, key: "distributionLosses" },
  44: { sdgId: 11, key: "greenSpacePerCapita" },
  45: { sdgId: 11, key: "populationDensity" },
  46: { sdgId: 12, key: "compostingRate" },
  47: { sdgId: 13, key: "totalGhgEmissions" },
  48: { sdgId: 17, key: "datasetCoverage" },
  49: { sdgId: 17, key: "dataFreshnessIndex" },
  50: { sdgId: 3, key: "healthRiskScore" },
  51: { sdgId: 9, key: "infrastructureModernity" },
  52: { sdgId: 10, key: "gdpDisparityIndex" },
  53: { sdgId: 15, key: "urbanGreenCoverage" },
  54: { sdgId: 15, key: "urbanBiodiversityProxy" },
};

/**
 * Fetch composite SDG scores for a given country
 */
export async function fetchSDGScores(country: string): Promise<SDGScoresResponse> {
  const mockCountry = COUNTRY_SDG_SCORES.find(c => c.country.toLowerCase() === country.toLowerCase());
  const fallbackResponse: SDGScoresResponse = {
    country,
    countryCode: mockCountry?.countryCode || "",
    compositeCsi: mockCountry?.csi || null,
    sdgScores: Object.entries(mockCountry?.sdgScores || {}).reduce((acc: Record<string, SDGScore>, [idStr, val]) => {
      const id = parseInt(idStr);
      const def = SDG_DEFINITIONS.find(d => d.id === id);
      acc[`sdg${id}`] = {
        id,
        slug: def?.slug || `sdg-${id}`,
        title: def?.title || `SDG ${id}`,
        score: val,
        metrics: {}
      };
      return acc;
    }, {}),
    timestamp: new Date().toISOString(),
    dataSource: "Mock Fallback (API Offline)"
  };

  try {
    const countryId = await getCountryIdByNameOrCode(country);
    if (!countryId) {
      console.warn(`Country ID not found for ${country}, using mock fallback`);
      return fallbackResponse;
    }

    // Fetch CSI History, SDG Scores, and Metric Values individually to handle partial failures
    let csiData: any[] = [];
    let sdgData: any[] = [];
    let metricsData: any[] = [];

    try {
      const csiRes = await fetch(`${API_BASE}/api/csi-scores/country/${countryId}`);
      if (csiRes.ok) {
        csiData = await csiRes.json();
      }
    } catch (e) {
      console.error("Failed to fetch CSI scores:", e);
    }

    try {
      const sdgRes = await fetch(`${API_BASE}/api/sdg-scores/country/${countryId}/year/2024`);
      if (sdgRes.ok) {
        sdgData = await sdgRes.json();
      }
    } catch (e) {
      console.error("Failed to fetch SDG scores:", e);
    }

    try {
      const metricsRes = await fetch(`${API_BASE}/api/metric-values/country/${countryId}/year/2024`);
      if (metricsRes.ok) {
        metricsData = await metricsRes.json();
      }
    } catch (e) {
      console.error("Failed to fetch metric values:", e);
    }

    // 1. Group and average metric values (to handle monthly entries)
    const metricGroups: Record<number, { sumRaw: number; sumNorm: number; count: number }> = {};
    metricsData.forEach((m: any) => {
      if (!metricGroups[m.metric_id]) {
        metricGroups[m.metric_id] = { sumRaw: 0, sumNorm: 0, count: 0 };
      }
      metricGroups[m.metric_id].sumRaw += m.raw_value;
      metricGroups[m.metric_id].sumNorm += m.normalised_score ?? m.raw_value;
      metricGroups[m.metric_id].count += 1;
    });

    const metricAverages: Record<number, { raw: number; norm: number }> = {};
    Object.entries(metricGroups).forEach(([idStr, g]) => {
      const id = parseInt(idStr);
      metricAverages[id] = {
        raw: g.sumRaw / g.count,
        norm: g.sumNorm / g.count
      };
    });

    // 2. Build metrics lookup map per SDG ID
    const sdgMetricsMap: Record<number, Record<string, number>> = {};
    Object.entries(metricAverages).forEach(([idStr, avg]) => {
      const metricId = parseInt(idStr);
      const mapping = DB_METRIC_MAPPING[metricId];
      if (mapping) {
        if (!sdgMetricsMap[mapping.sdgId]) {
          sdgMetricsMap[mapping.sdgId] = {};
        }
        sdgMetricsMap[mapping.sdgId][mapping.key] = avg.raw;
        // Duplicate key mapping for shared indicators (like SDG 8/13 Carbon Intensity)
        if (metricId === 14) {
          if (!sdgMetricsMap[8]) sdgMetricsMap[8] = {};
          sdgMetricsMap[8]["carbonIntensity"] = avg.raw;
        }
        if (metricId === 44) {
          if (!sdgMetricsMap[15]) sdgMetricsMap[15] = {};
          sdgMetricsMap[15]["greenSpacePerCapita"] = avg.raw;
        }
      }
    });

    // 3. Extract direct SDG scores from DB response
    const dbSdgScores: Record<number, number> = {};
    sdgData.forEach((s: any) => {
      dbSdgScores[s.sdg_id] = s.normalised_score;
    });

    // 4. Calculate missing SDG scores using available metrics
    const finalSdgScores: Record<number, number | null> = {};
    SDG_DEFINITIONS.forEach(def => {
      if (dbSdgScores[def.id] !== undefined) {
        finalSdgScores[def.id] = dbSdgScores[def.id];
      } else {
        // If not in DB, calculate as average of its metric normalized scores
        const metricsForSdg = def.metrics;
        let sum = 0;
        let count = 0;
        metricsForSdg.forEach(m => {
          // Find db metric id for this key
          const dbMetricId = Object.entries(DB_METRIC_MAPPING).find(
            ([_, val]) => val.sdgId === def.id && val.key === m.key
          )?.[0];
          if (dbMetricId) {
            const avg = metricAverages[parseInt(dbMetricId)];
            if (avg) {
              sum += avg.norm;
              count++;
            }
          }
        });
        if (count > 0) {
          finalSdgScores[def.id] = parseFloat((sum / count).toFixed(2));
        } else {
          // fallback to null (NA)
          finalSdgScores[def.id] = null;
        }
      }
    });

    // Calculate derived/calculated values for individual metrics if missing
    SDG_DEFINITIONS.forEach(def => {
      if (!sdgMetricsMap[def.id]) sdgMetricsMap[def.id] = {};
      const m = sdgMetricsMap[def.id];

      // SDG 5 Trend (YoY)
      if (def.id === 5 && m.genderEmploymentGap !== undefined && m.genderGapTrend === undefined) {
        m.genderGapTrend = -0.4; // default trend
      }
      // SDG 6 Water Stress Category
      if (def.id === 6 && m.weiPlus !== undefined && m.waterStressCategory === undefined) {
        const wei = m.weiPlus;
        m.waterStressCategory = wei >= 40 ? 3 : wei >= 20 ? 2 : wei >= 10 ? 1 : 0; // category numeric mapping
      }
      // SDG 6 Abstraction Trend
      if (def.id === 6 && m.waterPerCapita !== undefined && m.waterAbstractionTrend === undefined) {
        m.waterAbstractionTrend = -1.1;
      }
      // SDG 7 Category Label
      if (def.id === 7 && m.renewableShare !== undefined && m.energyCategoryLabel === undefined) {
        m.energyCategoryLabel = m.renewableShare >= 50 ? 2 : m.renewableShare >= 30 ? 1 : 0;
      }
      // SDG 7 aimForecast & distributionLosses
      const sdg7Score = finalSdgScores[7] ?? 60;
      if (def.id === 7 && m.aimForecast === undefined) m.aimForecast = Math.round(1500 + sdg7Score * 20);
      if (def.id === 7 && m.distributionLosses === undefined) m.distributionLosses = Math.round(200 - sdg7Score * 1.5);
      // SDG 8 Growth Trend
      if (def.id === 8 && m.gdpGrowthTrend === undefined) m.gdpGrowthTrend = 1.8;
      // SDG 11 PM2.5 threshold comparisons & green space deficit
      if (def.id === 11 && m.greenSpacePerCapita !== undefined && m.greenSpaceDeficit === undefined) {
        m.greenSpaceDeficit = Math.max(0, 9 - m.greenSpacePerCapita);
      }
      // SDG 15 life on land gap
      if (def.id === 15 && m.urbanGreenCoverage !== undefined && m.greenInfraGap === undefined) {
        m.greenInfraGap = Math.max(0, 40 - m.urbanGreenCoverage);
      }
    });

    // 5. Get/Calculate composite CSI score
    const latestCsiEntry = csiData.find((c: any) => c.year === 2024 && c.data_type === "historical");
    let compositeCsi = latestCsiEntry ? latestCsiEntry.csi_score : null;
    if (compositeCsi === null) {
      // Calculate average of available non-null SDG scores
      const values = Object.values(finalSdgScores).filter(v => v !== null) as number[];
      if (values.length > 0) {
        compositeCsi = values.reduce((a, b) => a + b, 0) / values.length;
      } else {
        compositeCsi = null;
      }
    }

    // Assemble final response
    const finalSdgScoresResponse: Record<string, SDGScore> = {};
    SDG_DEFINITIONS.forEach(def => {
      finalSdgScoresResponse[`sdg${def.id}`] = {
        id: def.id,
        slug: def.slug,
        title: def.title,
        score: finalSdgScores[def.id],
        metrics: sdgMetricsMap[def.id] || {}
      };
    });

    return {
      country,
      countryCode: mockCountry?.countryCode || csiData[0]?.country_iso2 || "",
      compositeCsi,
      sdgScores: finalSdgScoresResponse,
      timestamp: new Date().toISOString(),
      dataSource: "Live Database (FastAPI port 8002)"
    };
  } catch (error) {
    console.error(`Error loading database data for ${country}, using mock fallback:`, error);
    return fallbackResponse;
  }
}

/**
 * Fetch historical/forecast data for a specific indicator
 */
export async function fetchIndicatorData(
  indicator: string,
  country: string,
  startYear: number = 2015,
  endYear: number = 2030
) {
  // Map frontend indicator string to database metric_id
  const indicatorToMetricId: Record<string, number> = {
    "PM2.5_exposure": 15,
    "gender_gap": 1,
    "WEI_plus": 3,
    "RES_total_pct": 5,
    "GDP_per_capita": 7,
    "energy_productivity": 16,
    "GDP_disparity": 52,
    "PM2.5_AQI": 9,
    "waste_per_capita": 12,
    "GHG_per_capita": 13,
    "green_coverage": 53,
    "dataset_coverage": 48
  };

  const metricId = indicatorToMetricId[indicator];
  if (!metricId) {
    throw new Error(`Unknown indicator: ${indicator}`);
  }

  try {
    const countryId = await getCountryIdByNameOrCode(country);
    if (!countryId) {
      throw new Error(`Country ${country} not found in database`);
    }

    const response = await fetch(`${API_BASE}/api/metric-values/metric/${metricId}?country_id=${countryId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch metric values for metric ${metricId}`);
    }

    const rawData = await response.json();

    // Transform database format to expected chart format
    // Filter by year range and sort
    const filteredData = rawData
      .filter((d: any) => d.year >= startYear && d.year <= endYear)
      .map((d: any) => ({
        date: `${d.year}-01-01`,
        value: d.normalised_score ?? d.raw_value,
        is_forecast: d.data_type === "predicted",
        conf_low: d.conf_low,
        conf_high: d.conf_high
      }))
      .sort((a: any, b: any) => a.date.localeCompare(b.date));

    return {
      indicator,
      country,
      data: filteredData
    };
  } catch (error) {
    console.error(`Error fetching indicator data for ${indicator} (${country}):`, error);
    throw error;
  }
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
