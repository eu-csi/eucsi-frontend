# CSI Dashboard — DB Schema ↔ Frontend Alignment Analysis

**Status:** ✅ **YES, the DB schema will work perfectly for the frontend** — with proper API layer design.

---

## Executive Summary

| Aspect | Assessment | Notes |
|--------|------------|-------|
| **Data Structure** | ✅ Perfect fit | DB schema covers all frontend data needs (SDG scores, CSI, rankings, metrics, anomalies, forecasts) |
| **Normalization** | ✅ Excellent | 0–100 normalized scores align exactly with frontend score color coding |
| **Time Coverage** | ✅ Complete | 2015–2024 historical + 2025–2029 forecasts match frontend date range |
| **Country Count** | ✅ Matches | 44 countries (EU27 + EFTA + UK) align with `COUNTRY_SDG_SCORES` array |
| **SDG Count** | ✅ All 12 covered | Schema supports all 12 SDGs (3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 17) |
| **Real-time data** | ⚠️ Needs API bridge | Frontend currently expects `/sdg-scores/{country}` endpoint; needs REST API adapters |
| **Data freshness** | ⚠️ Depends on pipeline | Backend pipeline determines update frequency; ensure scheduled tasks run |

---

## Frontend Current State

### Data Needs (from code analysis)

#### 1. **Overview Dashboard (SDGScoreGrid.tsx)**
- **Needs:** Top 8 countries + Bottom 2 countries by CSI, all 12 SDG scores per country
- **DB tables:** `csi_scores`, `sdg_scores`, `countries`, `sdgs`
- **Query pattern:** Rank countries by `csi_score DESC` → fetch top/bottom, then SDG breakdown
- **Frequency:** Load on page open; refresh every 5 minutes (from React Query `staleTime`)

#### 2. **Country Rankings Page**
- **Needs:** Full rankings with CSI, EU rank, percentile, cluster, SDG breakdown per country
- **DB tables:** `csi_scores`, `sdg_scores`, `countries`, `sdgs`
- **Query pattern:** ORDER BY `csi_score DESC`, JOIN SDG breakdown
- **Data shape:** Currently mock; needs JSON aggregation

#### 3. **SDG Detail Page (single country + single SDG)**
- **Needs:** Metric cards, trend line 2015–2029, EU27 average overlay, anomaly badges
- **DB tables:** `metric_values`, `metrics`, `sdg_scores`, `anomalies`
- **Query patterns:**
  - Annual metrics: `metric_values WHERE year = :year, month IS NULL`
  - Monthly metrics: `metric_values WHERE year, month IS NOT NULL`
  - Anomalies: `anomalies WHERE country_id, sdg_id, year`
  - Trend: `sdg_scores WHERE country_id, sdg_id ORDER BY year`

#### 4. **Forecast/Prediction Module**
- **Needs:** Historical + predicted CSI/SDG scores with confidence intervals
- **DB tables:** `csi_scores`, `sdg_scores` (with `data_type = 'predicted'`)
- **Query pattern:** UNION historical + predicted, filter by `model_runs.is_latest`

#### 5. **KPI Cards (DashboardKPIs.tsx)**
- **Needs:** CSI, emissions, renewable energy, air quality, GDP, water efficiency (current year + YoY)
- **DB tables:** `metric_values`, `metrics`, `csi_scores`
- **Query pattern:** Fetch current year metrics, calculate YoY change

#### 6. **Country Map (CountryMap.tsx)**
- **Needs:** CSI score per country for geospatial visualization
- **DB tables:** `csi_scores`, `countries`
- **Query pattern:** Simple SELECT country, csi_score, cluster for current year

---

## Schema → Frontend Mapping

### ✅ Perfect Alignment

#### SDG Scores Grid
```
Frontend: SDG score cell (0–100, color-coded)
Database: sdg_scores.score (already 0–100 after normalization)
Status:   ✅ Direct 1:1 mapping
```

#### CSI Scores & Ranking
```
Frontend: CSI chip with rank + cluster
Database: csi_scores { csi_score, eu_rank, eu_percentile, cluster }
Status:   ✅ Direct 1:1 mapping
```

#### Color Coding Logic
```
Frontend code:
  if (score >= 80) → green
  if (score >= 70) → blue
  if (score >= 55) → yellow
  if (score >= 40) → orange
  if (score < 40) → red

Database: sdg_scores.score = (value - min) / (max - min) * 100
Status:   ✅ Pre-normalized in DB → no frontend computation needed
```

#### Country Clustering
```
Frontend: Cluster assignment for grouping (CLUSTER_DATA mock array)
Database: csi_scores.cluster = 'Nordic Leaders' | 'Western Innovators' | ...
Status:   ✅ Direct 1:1 mapping
```

#### Anomalies
```
Frontend: "Anomaly badge" in SDG detail header
Database: anomalies { anomaly_type, severity, description, year, month }
Status:   ✅ Perfect fit; DB schema designed specifically for this
```

#### Forecasts
```
Frontend: Dual line chart (historical + predicted) with confidence ribbon
Database: 
  - csi_scores / sdg_scores with data_type = 'historical' | 'predicted'
  - Confidence intervals in conf_low, conf_high columns
Status:   ✅ Direct 1:1 mapping
```

---

## Current Frontend Data Sources

| Component | Current Source | New Source (After DB) |
|-----------|-----------------|------------------------|
| **SDGScoreGrid** | Mock + `/sdg-scores/{country}` API | DB via `/api/v1/scores/grid?year=...` |
| **KPICards** | Mock `KPI_DATA` | DB: `metric_values` for current year |
| **CountryRankings** | Mock `COUNTRY_SDG_SCORES` | DB: `csi_scores` JOIN `sdg_scores` |
| **SDG Detail Charts** | Mock `TREND_DATA` | DB: `sdg_scores` time series |
| **Anomalies** | None (not yet implemented) | DB: `anomalies` table |
| **Forecast Ribbon** | Mock `FORECAST_DATA` | DB: `csi_scores WHERE data_type='predicted'` |
| **Country Map** | Mock cluster data | DB: `csi_scores` geospatial query |

---

## API Layer Required (Bridge between Frontend → DB)

### Current Frontend Endpoints (from code)
```
GET /sdg-scores/{country}                    → SDGScoresResponse
GET /data/{indicator}?country=...&year=...   → IndicatorData[]
```

### Recommended New Endpoints (DB-backed)

#### 1. Dashboard Overview
```http
GET /api/v1/dashboard/scores?year=2024&data_type=historical
```
Response:
```json
{
  "year": 2024,
  "overview": {
    "topCountries": [/* 8 countries with csi + sdg breakdown */],
    "bottomCountries": [/* 2 countries */],
    "metrics": {
      "strong_performers": 8,
      "top_score": 85.2,
      "bottom_score": 42.1
    }
  },
  "clusters": [
    { "cluster": "Nordic Leaders", "count": 5, "avg_score": 82.3 }
  ]
}
```

#### 2. SDG Detail Page
```http
GET /api/v1/sdg/{sdgId}/country/{countryCode}?year=2024
```
Response:
```json
{
  "sdg": { "id": 7, "title": "Affordable & Clean Energy" },
  "country": { "code": "DE", "name": "Germany" },
  "metrics": [
    {
      "metric_id": 45,
      "name": "Renewable Energy Share",
      "unit": "%",
      "value": 46.2,
      "score": 85,
      "benchmark": 42.5
    }
  ],
  "trend": [
    { "year": 2015, "score": 62, "data_type": "historical" },
    { "year": 2028, "score": 78, "data_type": "predicted", "conf_low": 75, "conf_high": 81 }
  ],
  "eu27_avg": [
    { "year": 2015, "avg_score": 58 }
  ],
  "anomalies": [
    {
      "metric_name": "Distribution Losses",
      "severity": "warning",
      "description": "Spike: 15% YoY increase"
    }
  ]
}
```

#### 3. Country Rankings
```http
GET /api/v1/rankings?year=2024&data_type=historical
```
Response:
```json
[
  {
    "rank": 1,
    "country": { "code": "SE", "name": "Sweden" },
    "csi_score": 85.2,
    "percentile": 100,
    "cluster": "Nordic Leaders",
    "sdg_breakdown": [
      { "sdg_id": 5, "score": 88 },
      { "sdg_id": 6, "score": 92 }
      // ... all 12 SDGs
    ]
  }
]
```

#### 4. KPI Metrics
```http
GET /api/v1/metrics/kpi?country=Germany&year=2024
```
Response:
```json
[
  {
    "metric_id": 1,
    "name": "Composite Sustainability Index",
    "current_value": 72.4,
    "yoy_change": 3.2,
    "percentile": 68,
    "target": 80
  }
]
```

#### 5. Forecast Data
```http
GET /api/v1/forecast/csi?country=Germany&model_version=latest
```
Response:
```json
{
  "model_version": "v2.1_arima",
  "country": "Germany",
  "forecast": [
    { "year": 2024, "score": 75.2, "data_type": "historical" },
    { "year": 2025, "score": 76.8, "conf_low": 74.1, "conf_high": 79.5, "data_type": "predicted" },
    { "year": 2026, "score": 78.1, "conf_low": 74.2, "conf_high": 82.0, "data_type": "predicted" }
  ]
}
```

---

## Frontend Data Type Alignment

### Current Frontend Types (from countryTypes.ts)

```typescript
// Current
interface SDGScores {
  [K in SDGId]?: number;  // 0–100 normalized score
}

interface KPIData {
  label: string;
  value: string;
  unit: string;
  yoy: number;
  percentile: number;
  targetGap: number;
}
```

### What DB Provides
| Frontend Type | DB Column | Transformation |
|---------------|-----------|-----------------|
| `SDGScore` (0–100) | `sdg_scores.score` | ✅ None (pre-normalized) |
| `CSIScore` (0–100) | `csi_scores.csi_score` | ✅ None (pre-normalized) |
| `RawValue` | `metric_values.raw_value` | ✅ Available if needed |
| `Achievement Rate` | `sdg_scores.achievement_rate` | ✅ Available for benchmarking |
| `EU Percentile` | `sdg_scores.eu_percentile` | ✅ Direct mapping to `percentile` |
| `Confidence Intervals` | `conf_low`, `conf_high` | ✅ For forecast ribbons |

---

## Implementation Checklist

### Phase 1: Database Setup ✅ (Your Schema)
- [ ] Create `countries` table (44 countries)
- [ ] Create `sdgs` table (12 SDGs)
- [ ] Create `metrics` table (50+ metrics)
- [ ] Create `metric_values` (raw + normalized)
- [ ] Create `sdg_scores` (computed scores + ranks)
- [ ] Create `csi_scores` (composite + clustering)
- [ ] Create `anomalies` (detection results)
- [ ] Create `model_runs` (forecast versions)

### Phase 2: ETL Pipeline ✅ (Your Data Pipeline)
- [ ] Extract from Eurostat (SDGs 5, 6, 7 live + 8, 11, 12, 13, 17 bulk)
- [ ] Validate country ISO2, years, numeric values
- [ ] Clean & standardize units
- [ ] Normalize to 0–100 scale
- [ ] Run anomaly detection
- [ ] Compute SDG scores (per SDG per country)
- [ ] Compute CSI scores & clustering
- [ ] Run forecasts (ARIMA, exponential smoothing, etc.)

### Phase 3: REST API Layer ⚠️ (Not in your docs)
- [ ] `/api/v1/dashboard/scores` → SDGScoreGrid component
- [ ] `/api/v1/rankings` → Country Rankings page
- [ ] `/api/v1/sdg/{sdgId}/country/{countryCode}` → SDG Detail page
- [ ] `/api/v1/metrics/kpi` → KPI Cards
- [ ] `/api/v1/forecast/csi` → Forecast visualization
- [ ] `/api/v1/anomalies` → Anomaly badges

### Phase 4: Frontend Integration
- [ ] Replace `SDGScoresApi.ts` with new endpoints
- [ ] Update React Query hooks to use new data shapes
- [ ] Remove mock data dependencies (keep as fallback)
- [ ] Update type definitions to match API responses
- [ ] Add error handling & retry logic

---

## Data Pipeline → Frontend Flow Example

### Example: SDG 7 Detail Page for Germany

#### DB Pipeline Produces:
```sql
-- From STEP 4 (Normalization):
INSERT INTO metric_values
VALUES (
  metric_id: 12,           -- "Renewable Energy Share"
  country_id: 10,          -- Germany
  year: 2024,
  month: NULL,
  raw_value: 46.2,         -- % from Eurostat
  normalised_score: 85,    -- (46.2 - 18) / (65 - 18) * 100
  data_type: 'historical'
);

-- From STEP 7 (SDG Scores):
INSERT INTO sdg_scores
VALUES (
  country_id: 10,
  sdg_id: 7,
  year: 2024,
  score: 82,               -- AVG of all renewable + energy metrics
  achievement_rate: 75,    -- 3 of 4 metrics meet benchmark
  eu_percentile: 68,
  data_type: 'historical'
);
```

#### Frontend Receives (via API):
```json
{
  "metrics": [
    {
      "metric_id": 12,
      "name": "Renewable Energy Share",
      "unit": "%",
      "value": 46.2,
      "score": 85,
      "benchmark": 42.5,
      "direction": "higher_better"
    }
  ],
  "sdg_score": 82,
  "achievement_rate": 75,
  "eu_percentile": 68
}
```

#### Frontend Renders:
```
┌─ SDG 7: Affordable & Clean Energy ──────┐
│ Score: 82/100 [████████░] (68th percentile) │
│                                           │
│ Metric 1: Renewable Energy Share         │
│ ├─ Value: 46.2%                         │
│ ├─ Target: 42.5%  ✓ Met                 │
│ └─ Score: 85/100 [████████░]            │
│                                           │
│ Metric 2: Energy Intensity               │
│ ├─ Value: 12.1 MJ/€                     │
│ ├─ Target: 11.0                         │
│ └─ Score: 76/100 [███████░░]            │
│ ...                                      │
└──────────────────────────────────────────┘
```

---

## Potential Issues & Mitigations

| Issue | Risk | Mitigation |
|-------|------|-----------|
| **Large dataset size** (44 × 12 × 15 years × metrics) | Slow queries on frontend | Implement DB indexing on (country, sdg, year, data_type); cache computed results |
| **Real-time Eurostat updates** | Frontend shows stale data | Schedule pipeline to run nightly; add data refresh timestamp to API response |
| **Missing metric data** | Frontend gets NULL scores | DB already handles in STEP 2 validation; return nullable fields in API |
| **Forecast model versioning** | Wrong prediction served | DB tracks `model_runs.is_latest`; API always fetches latest by default |
| **Anomaly false positives** | Noise in dashboard | Severity filtering; threshold tuning in STEP 5; anomalies optional badge |
| **Monthly vs annual metrics** | Frontend confusion | API response clearly marks `month IS NULL` (annual) vs monthly; component logic handles both |

---

## Quick Decision Matrix

**Your Question:** "Will DB schema work for frontend?"

| Component | Works? | Why |
|-----------|--------|-----|
| Overview dashboard | ✅ YES | CSI + SDG scores already computed, ranked, clustered |
| Heatmap (8+2 countries) | ✅ YES | `eu_rank` column enables filtering top/bottom |
| SDG detail page | ✅ YES | Metrics, trends, anomalies, EU average all available |
| Country rankings | ✅ YES | Full SDG breakdown via JOIN; JSON aggregation in API |
| KPI cards | ✅ YES | Current metrics + YoY from `metric_values` table |
| Forecast ribbon | ✅ YES | Confidence intervals stored; `data_type` filter separates historical/predicted |
| Anomaly badges | ✅ YES | `anomalies` table has all needed fields |
| Real-time updates | ⚠️ PARTIAL | DB ready; needs API layer + scheduled ETL pipeline |
| Data freshness | ⚠️ DEPENDS | Pipeline frequency determines; recommend nightly runs |

---

## Recommendation

### ✅ **YES, Proceed with DB Schema as-is**

Your database schema and data pipeline are **production-ready for the frontend** because:

1. **All data shapes align** — normalized scores, computed ranks, clustering, anomalies all pre-computed
2. **Frontend logic is simple** — no complex transformations needed; mostly rendering + filtering
3. **Query patterns are efficient** — proper indexing on (country, year, data_type, sdg_id) will be fast
4. **Forecast support is built-in** — confidence intervals, model versioning, historical+predicted separation
5. **Scalable to 12 SDGs** — schema is designed for full UN SDG set, not just 3 live ones

### ⚠️ **Action Items**

1. **Build REST API adapters** — Create the 6 endpoints listed above to bridge DB → Frontend
2. **Implement scheduled ETL** — Run data pipeline nightly after Eurostat data is published
3. **Add caching layer** — Cache API responses for 24 hours (data only updates daily)
4. **Monitor data freshness** — Track `timestamp` in API response; alert if > 48 hours old
5. **Update frontend type definitions** — Ensure TypeScript matches API response shapes
6. **Graceful fallback** — Keep mock data for development; use in offline mode

---

## Next Steps

1. **Confirm API endpoint contract** with your backend team
2. **Design DB indexes** for query performance (`countries.id`, `sdg_scores.country_id, year, data_type`, etc.)
3. **Build 3–4 example API endpoints** (start with Dashboard, Rankings, SDG Detail)
4. **Test with 1 year of real Eurostat data** (2024)
5. **Measure query performance** (target: <100ms for heatmap, <200ms for detail page)
6. **Deploy to staging** and test with frontend team

---

**Document Version:** 1.0  
**Last Updated:** 2026-06-05  
**Author:** Technical Architecture Review
