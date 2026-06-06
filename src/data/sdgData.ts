export interface SDGMetricDef {
  key: string;
  label: string;
  unit: string;
  description: string;
  higherIsBetter: boolean;
  euTarget?: number;
  whoThreshold?: number;
  type?: "number" | "category" | "trend";
}

export interface SDGDef {
  id: number;
  slug: string;
  title: string;
  shortTitle: string;
  type: "direct" | "indirect";
  color: string;
  bgColor: string;
  textColor: string;
  icon: string;
  description: string;
  datasets: string[];
  metrics: SDGMetricDef[];
}

export const SDG_DEFINITIONS: SDGDef[] = [
  {
    id: 5, slug: "sdg-5", title: "SDG 5 — Gender Equality", shortTitle: "Gender Equality",
    type: "direct", color: "#FF3A21", bgColor: "#FFF0EE", textColor: "#C62B15", icon: "♀",
    description: "Achieve gender equality and empower all women and girls through closing employment gaps across European countries.",
    datasets: ["tesem060"],
    metrics: [
      { key: "genderEmploymentGap", label: "Gender Employment Gap", unit: "%", description: "Difference between male and female employment rates", higherIsBetter: false, euTarget: 3 },
      { key: "femaleEmploymentRate", label: "Female Employment Rate", unit: "%", description: "Share of employed women aged 20–64", higherIsBetter: true, euTarget: 78 },
      { key: "genderGapTrend", label: "Gender Gap Trend (YoY)", unit: "pp/yr", description: "Annual improvement or regression in gender parity — negative = closing gap", higherIsBetter: false },
    ],
  },
  {
    id: 6, slug: "sdg-6", title: "SDG 6 — Clean Water & Sanitation", shortTitle: "Clean Water",
    type: "direct", color: "#26BDE2", bgColor: "#EBF9FD", textColor: "#0A8FAB", icon: "💧",
    description: "Ensure availability and sustainable management of water and sanitation for all European countries.",
    datasets: ["sdg_06_60", "env_wat_abs"],
    metrics: [
      { key: "weiPlus", label: "WEI+ Water Exploitation Index", unit: "%", description: "% of renewable water resources abstracted — measures water stress intensity", higherIsBetter: false, euTarget: 20 },
      { key: "waterPerCapita", label: "Water Consumption Per Capita", unit: "L/day", description: "Litres consumed per person per day", higherIsBetter: false, euTarget: 120 },
      { key: "waterStressCategory", label: "Water Stress Category", unit: "", description: "No Stress / Low / Stress / Severe — based on WEI+ thresholds", higherIsBetter: false, type: "category" },
      { key: "waterAbstractionTrend", label: "Water Abstraction Trend (YoY)", unit: "%/yr", description: "Year-on-year change in total water abstraction volume", higherIsBetter: false },
    ],
  },
  {
    id: 7, slug: "sdg-7", title: "SDG 7 — Affordable & Clean Energy", shortTitle: "Clean Energy",
    type: "direct", color: "#FCC30B", bgColor: "#FFFBEA", textColor: "#A07800", icon: "⚡",
    description: "Ensure access to affordable, reliable, sustainable and modern energy for all.",
    datasets: ["sdg_07_40", "nrg_ind_ei"],
    metrics: [
      { key: "renewableShare", label: "Renewable Energy Share", unit: "%", description: "Share of renewables in gross final energy consumption", higherIsBetter: true, euTarget: 42.5 },
      { key: "energyIntensity", label: "Energy Intensity", unit: "MJ/€", description: "Primary energy consumption per unit of GDP — lower = more efficient", higherIsBetter: false },
      { key: "aimForecast", label: "AIM Forecast (12-month)", unit: "GWh", description: "Available to Internal Market — 12-month GWh forecast per country", higherIsBetter: true },
      { key: "distributionLosses", label: "Distribution Losses", unit: "GWh", description: "Electricity lost in grid transmission — indicator of grid efficiency", higherIsBetter: false },
      { key: "energyCategoryLabel", label: "Energy Category Label", unit: "", description: "High / Med / Low — classification per country-month", higherIsBetter: true, type: "category" },
    ],
  },
  {
    id: 8, slug: "sdg-8", title: "SDG 8 — Decent Work & Economic Growth", shortTitle: "Decent Work",
    type: "direct", color: "#A21942", bgColor: "#FFF0F4", textColor: "#7A1232", icon: "📈",
    description: "Promote sustained, inclusive and sustainable economic growth, full employment and decent work for all.",
    datasets: ["nama_10_gdp", "tesem060"],
    metrics: [
      { key: "gdpPerCapita", label: "GDP Per Capita", unit: "€", description: "PPP-adjusted GDP per capita — primary economic prosperity indicator", higherIsBetter: true, euTarget: 35000 },
      { key: "employmentRate", label: "Employment Rate", unit: "%", description: "Share of employed population aged 20–64", higherIsBetter: true, euTarget: 78 },
      { key: "carbonIntensity", label: "Carbon Intensity of Economy", unit: "tCO₂/M€", description: "GHG emissions per unit of GDP — measures green growth decoupling", higherIsBetter: false },
      { key: "gdpGrowthTrend", label: "GDP Growth Trend (YoY)", unit: "%/yr", description: "Year-on-year GDP growth rate", higherIsBetter: true, euTarget: 2.5 },
    ],
  },
  {
    id: 11, slug: "sdg-11", title: "SDG 11 — Sustainable Communities", shortTitle: "Sustainable Communities",
    type: "direct", color: "#FD9D24", bgColor: "#FFF8EE", textColor: "#C06A00", icon: "🏙️",
    description: "Make human settlements inclusive, safe, resilient and sustainable across European countries.",
    datasets: ["sdg_11_50", "urb_cenv", "urb_cpop1", "tran_hv_psmod"],
    metrics: [
      { key: "aqiPm25", label: "AQI PM2.5", unit: "µg/m³", description: "Air Quality Index — 6-band category from Good to Extremely Poor · WHO limit: 5µg/m³", higherIsBetter: false, whoThreshold: 5, euTarget: 10 },
      { key: "greenSpacePerCapita", label: "Green Space Per Capita", unit: "m²/person", description: "Accessible public green space per person · WHO minimum: 9m²", higherIsBetter: true, whoThreshold: 9 },
      { key: "greenInfraShare", label: "Green Infrastructure Share", unit: "%", description: "Green area as % of total urban area", higherIsBetter: true, euTarget: 40 },
      { key: "populationDensity", label: "Population Density", unit: "inh/km²", description: "Inhabitants per square kilometer", higherIsBetter: false },
      { key: "publicTransportShare", label: "Public Transport Modal Split", unit: "%", description: "Share of bus, train, tram/metro in total inland passenger travel", higherIsBetter: true, euTarget: 60 },
      { key: "trafficCongestionIndex", label: "Traffic Congestion Index", unit: "%", description: "% extra travel time due to traffic congestion vs free-flow conditions", higherIsBetter: false },
    ],
  },
  {
    id: 12, slug: "sdg-12", title: "SDG 12 — Responsible Consumption & Production", shortTitle: "Responsible Consumption",
    type: "direct", color: "#BF8B2E", bgColor: "#FDF8EE", textColor: "#8B6020", icon: "♻️",
    description: "Ensure sustainable consumption and production patterns across European countries.",
    datasets: ["env_wasmun", "urb_cpop1"],
    metrics: [
      { key: "recyclingRate", label: "Municipal Waste Recycling Rate", unit: "%", description: "Recycled + composted share of total municipal solid waste", higherIsBetter: true, euTarget: 65 },
      { key: "wastePerCapita", label: "Waste Generation Per Capita", unit: "kg/yr", description: "Municipal waste generated per person per year · EU average ~530 kg", higherIsBetter: false, euTarget: 530 },
      { key: "compostingRate", label: "Composting Rate", unit: "%", description: "Organic waste diversion share — measures bio-waste management", higherIsBetter: true, euTarget: 20 },
      { key: "wasteReductionTrend", label: "Waste Reduction Trend (YoY)", unit: "kg/yr", description: "Year-on-year change in waste generation per capita — negative = reducing", higherIsBetter: false },
    ],
  },
  {
    id: 13, slug: "sdg-13", title: "SDG 13 — Climate Action", shortTitle: "Climate Action",
    type: "direct", color: "#3F7E44", bgColor: "#F0F8F1", textColor: "#2A5C2F", icon: "🌍",
    description: "Take urgent action to combat climate change and its impacts through systematic GHG reduction.",
    datasets: ["env_air_gge", "nama_10_gdp"],
    metrics: [
      { key: "ghgPerCapita", label: "GHG Emissions Per Capita", unit: "tCO₂eq", description: "Total greenhouse gas emissions per person per year", higherIsBetter: false, euTarget: 4.5 },
      { key: "carbonIntensityEconomy", label: "Carbon Intensity of Economy", unit: "tCO₂/M€", description: "GHG emissions per unit of GDP — green growth decoupling indicator", higherIsBetter: false },
      { key: "totalGhgEmissions", label: "Total GHG Emissions", unit: "MtCO₂eq", description: "Country-level total greenhouse gas emissions", higherIsBetter: false },
      { key: "emissionsReductionTrend", label: "Emissions Reduction Trend (YoY)", unit: "%/yr", description: "Annual rate of emissions reduction — progress toward net-zero trajectory", higherIsBetter: true, euTarget: 5.5 },
    ],
  },
  {
    id: 17, slug: "sdg-17", title: "SDG 17 — Partnerships for the Goals", shortTitle: "Partnerships",
    type: "direct", color: "#19486A", bgColor: "#EEF3F8", textColor: "#0F2E44", icon: "🤝",
    description: "Strengthen the means of implementation and revitalize the Global Partnership for Sustainable Development via data openness.",
    datasets: ["sdg_07_40","env_air_gge","env_wasmun","sdg_06_60","env_wat_abs","urb_cpop1","urb_cenv","tran_hv_psmod","nrg_ind_ei","tesem060","sdg_11_50","nama_10_gdp"],
    metrics: [
      { key: "datasetCoverage", label: "Dataset Coverage Score", unit: "%", description: "% of 12 Eurostat datasets with complete country records — full = 100%", higherIsBetter: true, euTarget: 100 },
      { key: "dataFreshnessIndex", label: "Data Freshness Index", unit: "yrs lag", description: "Average lag between latest available data and current year — lower = fresher", higherIsBetter: false, euTarget: 1 },
      { key: "openDataCompliance", label: "Open Data Compliance Rate", unit: "%", description: "Share of metrics sourced exclusively from open Eurostat public infrastructure", higherIsBetter: true, euTarget: 100 },
      { key: "crossSdgCoverage", label: "Cross-SDG Coverage Rate", unit: "/17 SDGs", description: "Number of SDGs operationalised out of 17 total UN SDGs", higherIsBetter: true, euTarget: 17 },
    ],
  },
  {
    id: 3, slug: "sdg-3", title: "SDG 3 — Good Health & Well-being", shortTitle: "Good Health",
    type: "indirect", color: "#4C9F38", bgColor: "#F1FAF0", textColor: "#2E6B22", icon: "❤️",
    description: "Ensure healthy lives and promote well-being for all — proxied via air pollution exposure and urban green space deficit.",
    datasets: ["sdg_11_50", "urb_cenv"],
    metrics: [
      { key: "healthRiskScore", label: "Health Risk Proxy Score", unit: "/100", description: "Composite of PM2.5 concentration and green space deficit — higher score = higher risk", higherIsBetter: false },
      { key: "airPollutionExposure", label: "Air Pollution Exposure Index", unit: "µg/m³", description: "Population-weighted PM2.5 annual mean — WHO limit is 5µg/m³", higherIsBetter: false, whoThreshold: 5, euTarget: 10 },
      { key: "greenSpaceDeficit", label: "Green Space Deficit", unit: "m²/person", description: "Shortfall below WHO 9m²/person minimum threshold — 0 = meets standard", higherIsBetter: false },
    ],
  },
  {
    id: 9, slug: "sdg-9", title: "SDG 9 — Industry, Innovation & Infrastructure", shortTitle: "Innovation",
    type: "indirect", color: "#FD6925", bgColor: "#FFF4EE", textColor: "#C04A10", icon: "🏗️",
    description: "Build resilient infrastructure, promote inclusive industrialization and foster innovation across European countries.",
    datasets: ["tran_hv_psmod", "nrg_ind_ei"],
    metrics: [
      { key: "infrastructureModernity", label: "Infrastructure Modernity Index", unit: "/100", description: "Derived from public transport modal split and energy intensity combined score", higherIsBetter: true },
      { key: "energyProductivity", label: "Energy Productivity Score", unit: "€/kgoe", description: "GDP generated per unit of energy input — higher = more productive economy", higherIsBetter: true },
      { key: "transportInfraScore", label: "Transport Infrastructure Score", unit: "/100", description: "Public transport share benchmarked vs regional average — 100 = best in class", higherIsBetter: true },
    ],
  },
  {
    id: 10, slug: "sdg-10", title: "SDG 10 — Reduced Inequalities", shortTitle: "Reduced Inequalities",
    type: "indirect", color: "#DD1367", bgColor: "#FFF0F6", textColor: "#A50E4E", icon: "⚖️",
    description: "Reduce inequality within and among European countries — proxied by employment gaps and GDP per capita disparities.",
    datasets: ["tesem060", "nama_10_gdp"],
    metrics: [
      { key: "genderEmploymentGap", label: "Gender Employment Gap", unit: "%", description: "Inequality proxy — difference between male and female workforce participation rates", higherIsBetter: false, euTarget: 3 },
      { key: "gdpDisparityIndex", label: "GDP Per Capita Disparity Index", unit: "%", description: "Deviation of regional GDP per capita from EU27 average — 0% = exactly EU average", higherIsBetter: false },
      { key: "interCountryInequalityScore", label: "Inter-Country Inequality Score", unit: "pts", description: "Spread of CSI scores across countries — lower = more equal", higherIsBetter: false },
    ],
  },
  {
    id: 15, slug: "sdg-15", title: "SDG 15 — Life on Land", shortTitle: "Life on Land",
    type: "indirect", color: "#56C02B", bgColor: "#F3FDF0", textColor: "#357A18", icon: "🌿",
    description: "Protect, restore and promote sustainable use of terrestrial ecosystems and halt biodiversity loss.",
    datasets: ["urb_cenv", "urb_cpop1"],
    metrics: [
      { key: "urbanGreenCoverage", label: "Urban Green Coverage", unit: "%", description: "Green area as % of total land area", higherIsBetter: true, euTarget: 40 },
      { key: "greenSpacePerCapita", label: "Green Space Per Capita", unit: "m²/person", description: "Accessible public green space per person — WHO minimum 9m²", higherIsBetter: true, whoThreshold: 9 },
      { key: "greenInfraGap", label: "Green Infrastructure Gap", unit: "%", description: "% below the 40% recommended green standard — 0 = meets standard", higherIsBetter: false },
      { key: "urbanBiodiversityProxy", label: "Biodiversity Proxy Score", unit: "/100", description: "Composite of green coverage and population density ratio — proxy for biodiversity health", higherIsBetter: true },
    ],
  },
];

// Country CSI scores with per-SDG breakdown
export interface CountrySdgScore {
  country: string;
  countryCode: string;
  csi: number;
  percentile: number;
  sdgScores: Record<number, number>;
  lat: number;
  lon: number;
  population: number;
  cluster: string;
  sdgAchievementRate: number;
}

export const COUNTRY_SDG_SCORES: CountrySdgScore[] = [
  { country: "Sweden",      countryCode: "SE", csi: 88.4, percentile: 100, lat: 60.12, lon: 18.64, population: 10400000, cluster: "Nordic Leaders",              sdgAchievementRate: 92, sdgScores: {3:91,5:89,6:94,7:95,8:86,9:90,10:85,11:84,12:82,13:93,15:91,17:88} },
  { country: "Denmark",     countryCode: "DK", csi: 87.1, percentile: 96, lat: 56.26, lon: 9.50,  population: 5800000,  cluster: "Nordic Leaders",              sdgAchievementRate: 90, sdgScores: {3:90,5:88,6:92,7:93,8:85,9:89,10:86,11:85,12:84,13:91,15:88,17:86} },
  { country: "Finland",     countryCode: "FI", csi: 85.6, percentile: 92, lat: 61.92, lon: 25.74, population: 5500000,  cluster: "Nordic Leaders",              sdgAchievementRate: 89, sdgScores: {3:88,5:90,6:91,7:92,8:83,9:87,10:87,11:83,12:80,13:90,15:89,17:84} },
  { country: "Netherlands", countryCode: "NL", csi: 82.3, percentile: 88, lat: 52.13, lon: 5.29,  population: 17400000, cluster: "Western Innovators",          sdgAchievementRate: 85, sdgScores: {3:84,5:86,6:85,7:82,8:84,9:86,10:82,11:80,12:79,13:83,15:80,17:85} },
  { country: "Austria",     countryCode: "AT", csi: 81.7, percentile: 85, lat: 47.51, lon: 14.55, population: 8900000,  cluster: "Western Innovators",          sdgAchievementRate: 84, sdgScores: {3:83,5:80,6:87,7:80,8:85,9:84,10:79,11:78,12:81,13:82,15:84,17:83} },
  { country: "Germany",     countryCode: "DE", csi: 80.2, percentile: 81, lat: 51.16, lon: 10.45, population: 83100000, cluster: "Western Innovators",          sdgAchievementRate: 83, sdgScores: {3:82,5:78,6:84,7:79,8:88,9:85,10:77,11:76,12:78,13:80,15:81,17:82} },
  { country: "France",      countryCode: "FR", csi: 75.4, percentile: 77, lat: 46.22, lon: 2.21,  population: 67400000, cluster: "Western Innovators",          sdgAchievementRate: 78, sdgScores: {3:77,5:76,6:80,7:74,8:76,9:79,10:74,11:72,12:71,13:76,15:75,17:77} },
  { country: "Belgium",     countryCode: "BE", csi: 73.2, percentile: 73, lat: 50.50, lon: 4.46,  population: 11500000, cluster: "Western Innovators",          sdgAchievementRate: 75, sdgScores: {3:72,5:74,6:76,7:71,8:74,9:77,10:72,11:70,12:69,13:72,15:73,17:75} },
  { country: "Luxembourg",  countryCode: "LU", csi: 70.9, percentile: 69, lat: 49.81, lon: 6.12,  population: 630000,   cluster: "Western Innovators",          sdgAchievementRate: 72, sdgScores: {3:72,5:71,6:73,7:68,8:84,9:73,10:68,11:67,12:65,13:68,15:70,17:71} },
  { country: "Ireland",     countryCode: "IE", csi: 70.2, percentile: 65, lat: 53.41, lon: -8.24, population: 5000000,  cluster: "Western Innovators",          sdgAchievementRate: 71, sdgScores: {3:71,5:73,6:72,7:65,8:78,9:72,10:70,11:65,12:63,13:67,15:69,17:72} },
  { country: "Spain",       countryCode: "ES", csi: 65.7, percentile: 62, lat: 40.46, lon: -3.74, population: 47300000, cluster: "Mediterranean Transitioning", sdgAchievementRate: 66, sdgScores: {3:64,5:68,6:62,7:67,8:65,9:67,10:62,11:60,12:58,13:64,15:66,17:68} },
  { country: "Italy",       countryCode: "IT", csi: 64.9, percentile: 58, lat: 41.87, lon: 12.56, population: 59500000, cluster: "Mediterranean Transitioning", sdgAchievementRate: 65, sdgScores: {3:62,5:66,6:61,7:65,8:68,9:66,10:61,11:58,12:60,13:62,15:63,17:66} },
  { country: "Portugal",    countryCode: "PT", csi: 63.8, percentile: 54, lat: 39.39, lon: -8.22, population: 10300000, cluster: "Mediterranean Transitioning", sdgAchievementRate: 64, sdgScores: {3:63,5:64,6:60,7:64,8:61,9:64,10:62,11:62,12:58,13:63,15:66,17:65} },
  { country: "Czechia",     countryCode: "CZ", csi: 62.1, percentile: 50, lat: 49.81, lon: 15.47, population: 10700000, cluster: "Central European Rising",     sdgAchievementRate: 63, sdgScores: {3:63,5:62,6:64,7:60,8:64,9:63,10:59,11:60,12:58,13:60,15:63,17:64} },
  { country: "Malta",       countryCode: "MT", csi: 61.5, percentile: 46, lat: 35.93, lon: 14.37, population: 514000,   cluster: "Mediterranean Transitioning", sdgAchievementRate: 61, sdgScores: {3:60,5:62,6:55,7:65,8:62,9:61,10:60,11:58,12:54,13:60,15:55,17:62} },
  { country: "Slovenia",    countryCode: "SI", csi: 61.2, percentile: 42, lat: 46.15, lon: 14.99, population: 2100000,  cluster: "Central European Rising",     sdgAchievementRate: 62, sdgScores: {3:62,5:61,6:64,7:60,8:61,9:62,10:59,11:62,12:60,13:61,15:65,17:62} },
  { country: "Cyprus",      countryCode: "CY", csi: 60.8, percentile: 38, lat: 35.12, lon: 33.42, population: 1200000,  cluster: "Mediterranean Transitioning", sdgAchievementRate: 60, sdgScores: {3:58,5:60,6:54,7:62,8:61,9:60,10:58,11:56,12:52,13:58,15:56,17:60} },
  { country: "Poland",      countryCode: "PL", csi: 59.8, percentile: 35, lat: 51.91, lon: 19.14, population: 38000000, cluster: "Central European Rising",     sdgAchievementRate: 60, sdgScores: {3:59,5:58,6:62,7:57,8:62,9:60,10:56,11:57,12:55,13:57,15:59,17:61} },
  { country: "Hungary",     countryCode: "HU", csi: 57.2, percentile: 31, lat: 47.16, lon: 19.50, population: 9700000,  cluster: "Central European Rising",     sdgAchievementRate: 58, sdgScores: {3:57,5:56,6:60,7:55,8:59,9:57,10:54,11:55,12:53,13:55,15:57,17:59} },
  { country: "Estonia",     countryCode: "EE", csi: 56.8, percentile: 27, lat: 58.59, lon: 25.01, population: 1300000,  cluster: "Eastern Emerging",            sdgAchievementRate: 57, sdgScores: {3:57,5:59,6:60,7:61,8:55,9:57,10:58,11:55,12:52,13:58,15:61,17:57} },
  { country: "Slovakia",    countryCode: "SK", csi: 55.9, percentile: 23, lat: 48.66, lon: 19.69, population: 5400000,  cluster: "Central European Rising",     sdgAchievementRate: 56, sdgScores: {3:55,5:54,6:58,7:53,8:58,9:55,10:52,11:53,12:51,13:53,15:55,17:57} },
  { country: "Greece",      countryCode: "EL", csi: 55.4, percentile: 19, lat: 39.07, lon: 21.82, population: 10700000, cluster: "Mediterranean Transitioning", sdgAchievementRate: 55, sdgScores: {3:53,5:55,6:52,7:54,8:54,9:54,10:52,11:53,12:50,13:53,15:55,17:56} },
  { country: "Croatia",     countryCode: "HR", csi: 53.8, percentile: 15, lat: 45.10, lon: 15.20, population: 4000000,  cluster: "Central European Rising",     sdgAchievementRate: 54, sdgScores: {3:53,5:52,6:56,7:50,8:55,9:52,10:50,11:51,12:49,13:50,15:54,17:55} },
  { country: "Lithuania",   countryCode: "LT", csi: 53.1, percentile: 12, lat: 55.16, lon: 23.88, population: 2800000,  cluster: "Eastern Emerging",            sdgAchievementRate: 54, sdgScores: {3:53,5:55,6:56,7:57,8:52,9:53,10:54,11:51,12:49,13:54,15:57,17:54} },
  { country: "Latvia",      countryCode: "LV", csi: 52.4, percentile: 8,  lat: 56.87, lon: 24.60, population: 1900000,  cluster: "Eastern Emerging",            sdgAchievementRate: 53, sdgScores: {3:52,5:54,6:55,7:56,8:51,9:52,10:53,11:50,12:48,13:53,15:56,17:53} },
  { country: "Romania",     countryCode: "RO", csi: 48.7, percentile: 4,  lat: 45.94, lon: 24.96, population: 19300000, cluster: "Eastern Emerging",            sdgAchievementRate: 49, sdgScores: {3:47,5:46,6:51,7:44,8:50,9:46,10:44,11:45,12:43,13:44,15:48,17:50} },
  { country: "Bulgaria",    countryCode: "BG", csi: 46.2, percentile: 0,  lat: 42.73, lon: 25.48, population: 6900000,  cluster: "Eastern Emerging",            sdgAchievementRate: 46, sdgScores: {3:44,5:43,6:48,7:41,8:47,9:43,10:41,11:42,12:40,13:41,15:45,17:47} },
];

export const YEARS_RANGE = [2015,2016,2017,2018,2019,2020,2021,2022,2023,2024];

export function generateSdgTrendData(sdgId: number, country: string) {
  const countryData = COUNTRY_SDG_SCORES.find(c => c.country === country);
  const base = countryData?.sdgScores[sdgId] ?? 60;
  return YEARS_RANGE.map((year, i) => ({
    year,
    value: Math.max(20, Math.min(100, base - 15 + i * 1.8 + Math.sin(i) * 2.2)),
    eu27: Math.max(30, Math.min(90, 54 + i * 0.7 + Math.cos(i) * 1.4)),
  }));
}

export function getTopCountriesForSdg(sdgId: number, count = 12) {
  return [...COUNTRY_SDG_SCORES]
    .sort((a, b) => (b.sdgScores[sdgId] ?? 0) - (a.sdgScores[sdgId] ?? 0))
    .slice(0, count)
    .map(c => ({ name: c.country, country: c.country, score: c.sdgScores[sdgId] ?? 0, csi: c.csi }));
}

