import { useState, useEffect, useCallback } from "react";

// Must match backend/src/services/riskConfigService.ts DEFAULT_RISK_THRESHOLDS
// and ai_services/app/services/prediction_service.py DEFAULT_LOW_MAX/DEFAULT_MODERATE_MAX.
export const RISK_THRESHOLDS = { lowMax: 35, moderateMax: 70 };

// Generate color based on risk score (0-100). Boundaries must match RISK_THRESHOLDS
// so a district's map color always agrees with its risk_level label.
export function getColorFromScore(score) {
  const clampedScore = Math.max(0, Math.min(100, score || 0));
  const { lowMax, moderateMax } = RISK_THRESHOLDS;

  if (clampedScore >= moderateMax) {
    // High risk: Red gradient
    const intensity = (clampedScore - moderateMax) / (100 - moderateMax);
    const r = Math.round(220 + intensity * 35); // 220-255
    const g = Math.round(38 - intensity * 18); // 38-20
    const b = Math.round(38 - intensity * 18); // 38-20
    return {
      fill: `rgb(${r}, ${g}, ${b})`,
      stroke: `rgb(${Math.round(r * 0.7)}, ${Math.round(g * 0.5)}, ${Math.round(b * 0.5)})`,
    };
  } else if (clampedScore >= lowMax) {
    // Moderate risk: Orange to Yellow gradient
    const intensity = (clampedScore - lowMax) / (moderateMax - lowMax);
    const r = Math.round(251 - intensity * 31); // 251-220
    const g = Math.round(146 + intensity * 40); // 146-186
    const b = Math.round(60 - intensity * 22); // 60-38
    return {
      fill: `rgb(${r}, ${g}, ${b})`,
      stroke: `rgb(${Math.round(r * 0.7)}, ${Math.round(g * 0.6)}, ${Math.round(b * 0.5)})`,
    };
  } else {
    // Low risk: Green gradient
    const intensity = clampedScore / lowMax;
    const r = Math.round(34 + intensity * 217); // 34-251
    const g = Math.round(197 - intensity * 51); // 197-146
    const b = Math.round(94 - intensity * 34); // 94-60
    return {
      fill: `rgb(${r}, ${g}, ${b})`,
      stroke: `rgb(${Math.round(r * 0.6)}, ${Math.round(g * 0.7)}, ${Math.round(b * 0.6)})`,
    };
  }
}

export function calculateCentroid(geometry) {
  if (geometry.type === "Polygon") {
    const coords = geometry.coordinates[0];
    const n = coords.length;
    let sumLat = 0, sumLng = 0;
    coords.forEach(([lng, lat]) => {
      sumLat += lat;
      sumLng += lng;
    });
    return [sumLat / n, sumLng / n];
  } else if (geometry.type === "MultiPolygon") {
    const coords = geometry.coordinates[0][0];
    const n = coords.length;
    let sumLat = 0, sumLng = 0;
    coords.forEach(([lng, lat]) => {
      sumLat += lat;
      sumLng += lng;
    });
    return [sumLat / n, sumLng / n];
  }
  return [26.2, 92.5];
}

// Shared district GeoJSON + live risk-score data source for the Risk Map and
// the admin Risk Zones map, so both render identical district boundaries/colors.
export function useRiskMapData() {
  const [geoData, setGeoData] = useState(null);
  const [liveRiskScores, setLiveRiskScores] = useState({});
  const [fetchingDistricts, setFetchingDistricts] = useState(new Set());

  const fetchDistrictRiskScore = useCallback(async (districtName, geometry) => {
    if (liveRiskScores[districtName] || fetchingDistricts.has(districtName)) {
      return;
    }

    setFetchingDistricts(prev => new Set(prev).add(districtName));

    try {
      const [lat, lng] = calculateCentroid(geometry);
      const response = await fetch("http://localhost:8000/api/risk/district", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          district_name: districtName,
          latitude: lat,
          longitude: lng,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLiveRiskScores(prev => ({
          ...prev,
          [districtName]: {
            riskScore: data.risk_score,
            riskLevel: data.risk_level.toLowerCase(),
            probability: data.probability,
            features: data.features,
            timestamp: Date.now(),
          },
        }));
      }
    } catch (error) {
      console.error(`Failed to fetch risk for ${districtName}:`, error);
    } finally {
      setFetchingDistricts(prev => {
        const newSet = new Set(prev);
        newSet.delete(districtName);
        return newSet;
      });
    }
  }, [liveRiskScores, fetchingDistricts]);

  // Background worker: fetch risk scores gradually, one district every 2 seconds
  useEffect(() => {
    if (!geoData) return;

    const features = geoData.features || [];
    let currentIndex = 0;
    let intervalId;

    const fetchNext = () => {
      if (currentIndex >= features.length) {
        clearInterval(intervalId);
        return;
      }

      const feature = features[currentIndex];
      const districtName = feature.properties?.dtname;

      if (districtName) {
        fetchDistrictRiskScore(districtName, feature.geometry);
      }

      currentIndex++;
    };

    const timeoutId = setTimeout(() => {
      intervalId = setInterval(fetchNext, 2000);
    }, 2000);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [geoData, fetchDistrictRiskScore]);

  // Periodic refresh: re-fetch all risk scores every 4 hours
  useEffect(() => {
    if (!geoData) return;

    const FOUR_HOURS = 4 * 60 * 60 * 1000;

    const refreshAllScores = () => {
      setLiveRiskScores({});
      setFetchingDistricts(new Set());
    };

    const refreshInterval = setInterval(refreshAllScores, FOUR_HOURS);
    return () => clearInterval(refreshInterval);
  }, [geoData]);

  const loadCachedRiskScores = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:8000/api/risk/cache/all");
      if (response.ok) {
        const cached = await response.json();

        const transformed = {};
        for (const [districtName, data] of Object.entries(cached)) {
          transformed[districtName] = {
            riskScore: data.risk_score,
            riskLevel: data.risk_level.toLowerCase(),
            probability: data.probability,
            features: data.features,
            timestamp: Date.now(),
          };
        }

        setLiveRiskScores(transformed);
      }
    } catch (error) {
      console.error("[useRiskMapData] Failed to load cached risk scores:", error);
    }
  }, []);

  useEffect(() => {
    fetch("/ner_districts_simplified.geojson")
      .then(r => {
        if (!r.ok) throw new Error(`GeoJSON error: ${r.status}`);
        return r.json();
      })
      .then(data => {
        setGeoData(data);
        loadCachedRiskScores();
      })
      .catch(e => console.error("GeoJSON:", e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const features = geoData?.features || [];

  const getFeatureStyle = useCallback((feature, activeName) => {
    const p = feature.properties || {};
    const districtName = p.dtname;
    const riskScore = liveRiskScores[districtName]?.riskScore ?? Number(p.riskScore) ?? 0;
    const color = getColorFromScore(riskScore);
    const active = activeName && activeName === districtName;

    return {
      fillColor: color.fill,
      color: active ? "#0F172A" : color.stroke,
      weight: active ? 3 : 1.5,
      opacity: active ? 1 : 0.8,
      fillOpacity: active ? 0.72 : 0.42,
      dashArray: active ? "" : "3",
    };
  }, [liveRiskScores]);

  return {
    geoData,
    features,
    liveRiskScores,
    setLiveRiskScores,
    fetchDistrictRiskScore,
    getFeatureStyle,
  };
}
