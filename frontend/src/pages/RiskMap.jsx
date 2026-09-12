import { useState, useEffect, useMemo, useCallback } from "react";
import {
  MapContainer, TileLayer, GeoJSON, CircleMarker, Popup,
  Tooltip, LayersControl, useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Search, RotateCcw, X, MapPin } from "lucide-react";
import SectionHeader from "../common/SectionHeader";
import LocationDetailPanel from "../components/riskmap/LocationDetailPanel";
import { MAP_LOCATIONS } from "../data/mapData";
import { LEVEL_STYLES } from "../data/analysisData";
import { useTranslation } from "react-i18next";
import { supabase } from "../supabase";

const CENTER = [26.2, 92.5], ZOOM = 7;

const COLORS = {
  high: { fill: "#EF4444", stroke: "#B91C1C" },
  moderate: { fill: "#F59E0B", stroke: "#B45309" },
  low: { fill: "#22C55E", stroke: "#15803D" },
};

// Generate color based on risk score (0-100)
const getColorFromScore = (score) => {
  const clampedScore = Math.max(0, Math.min(100, score || 0));

  if (clampedScore >= 70) {
    // High risk: Red gradient (70-100)
    const intensity = (clampedScore - 70) / 30;
    const r = Math.round(220 + intensity * 35); // 220-255
    const g = Math.round(38 - intensity * 18); // 38-20
    const b = Math.round(38 - intensity * 18); // 38-20
    return {
      fill: `rgb(${r}, ${g}, ${b})`,
      stroke: `rgb(${Math.round(r * 0.7)}, ${Math.round(g * 0.5)}, ${Math.round(b * 0.5)})`
    };
  } else if (clampedScore >= 40) {
    // Moderate risk: Orange to Yellow gradient (40-70)
    const intensity = (clampedScore - 40) / 30;
    const r = Math.round(251 - intensity * 31); // 251-220
    const g = Math.round(146 + intensity * 40); // 146-186
    const b = Math.round(60 - intensity * 22); // 60-38
    return {
      fill: `rgb(${r}, ${g}, ${b})`,
      stroke: `rgb(${Math.round(r * 0.7)}, ${Math.round(g * 0.6)}, ${Math.round(b * 0.5)})`
    };
  } else {
    // Low risk: Green gradient (0-40)
    const intensity = clampedScore / 40;
    const r = Math.round(34 + intensity * 217); // 34-251
    const g = Math.round(197 - intensity * 51); // 197-146
    const b = Math.round(94 - intensity * 34); // 94-60
    return {
      fill: `rgb(${r}, ${g}, ${b})`,
      stroke: `rgb(${Math.round(r * 0.6)}, ${Math.round(g * 0.7)}, ${Math.round(b * 0.6)})`
    };
  }
};

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
}

const stableCoords = (id) => {
  let hash = 0;
  String(id).split("").forEach(c => {
    hash = (Math.imul(31, hash) + c.charCodeAt(0)) | 0;
  });
  return [
    CENTER[0] + ((Math.abs(hash) & 0xffff) / 0xffff) * 4 - 2,
    CENTER[1] + (((Math.abs(hash) >>> 16) & 0xffff) / 0xffff) * 5 - 2.5,
  ];
};

export default function RiskMap() {
  const { t } = useTranslation();

  const [geoData, setGeoData] = useState(null);
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState(null);
  const [riskFilter, setRiskFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [mapCenter, setMapCenter] = useState(CENTER);
  const [mapZoom, setMapZoom] = useState(ZOOM);
  const [liveRiskScores, setLiveRiskScores] = useState({});
  const [fetchingDistricts, setFetchingDistricts] = useState(new Set());

  // Helper to calculate centroid of a polygon/multipolygon
  const calculateCentroid = useCallback((geometry) => {
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
    return CENTER;
  }, []);

  // Fetch live risk score for a single district (with caching)
  const fetchDistrictRiskScore = useCallback(async (districtName, geometry) => {
    // Skip if already fetched or currently fetching
    if (liveRiskScores[districtName] || fetchingDistricts.has(districtName)) {
      return;
    }

    // Mark as fetching
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
      // Remove from fetching set
      setFetchingDistricts(prev => {
        const newSet = new Set(prev);
        newSet.delete(districtName);
        return newSet;
      });
    }
  }, [calculateCentroid, liveRiskScores, fetchingDistricts]);

  // Background worker: Fetch risk scores gradually
  useEffect(() => {
    if (!geoData) return;

    const features = geoData.features || [];
    let currentIndex = 0;
    let intervalId;

    // Fetch one district every 2 seconds in the background
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

    // Start background fetching after 2 seconds
    const timeoutId = setTimeout(() => {
      intervalId = setInterval(fetchNext, 2000);
    }, 2000);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [geoData, fetchDistrictRiskScore]);

  // Periodic refresh: Re-fetch all risk scores every 4 hours
  useEffect(() => {
    if (!geoData) return;

    const FOUR_HOURS = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

    const refreshAllScores = () => {
      console.log("[RiskMap] Periodic refresh: clearing cache and refetching all scores");
      // Clear existing scores to force re-fetch
      setLiveRiskScores({});
      setFetchingDistricts(new Set());
    };

    // Set up periodic refresh
    const refreshInterval = setInterval(refreshAllScores, FOUR_HOURS);

    return () => clearInterval(refreshInterval);
  }, [geoData]);

  useEffect(() => {
    fetch("/ner_districts_simplified.geojson")
      .then(r => {
        if (!r.ok) throw new Error(`GeoJSON error: ${r.status}`);
        return r.json();
      })
      .then(data => {
        setGeoData(data);
        // Load all cached risk scores from backend
        loadCachedRiskScores();
      })
      .catch(e => console.error("GeoJSON:", e));
  }, []);

  // Load all cached risk scores from backend
  const loadCachedRiskScores = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/risk/cache/all");
      if (response.ok) {
        const cached = await response.json();
        console.log(`[RiskMap] Loaded ${Object.keys(cached).length} cached districts`);

        // Transform cached data to match our state format - include full features
        const transformed = {};
        for (const [districtName, data] of Object.entries(cached)) {
          transformed[districtName] = {
            riskScore: data.risk_score,
            riskLevel: data.risk_level.toLowerCase(),
            probability: data.probability,
            features: data.features, // Store the full features object
            timestamp: Date.now(), // Mark as fresh
          };
        }

        setLiveRiskScores(transformed);
      }
    } catch (error) {
      console.error("[RiskMap] Failed to load cached risk scores:", error);
    }
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .not("status", "eq", "RESOLVED")
        .order("created_at", { ascending: false });

      if (error) return console.error("Reports:", error.message);
      if (active) setReports(data || []);
    };

    load();

    const channel = supabase
      .channel("public:reports")
      .on("postgres_changes", {
        event: "*", schema: "public", table: "reports"
      }, payload => {
        if (payload.eventType === "INSERT")
          setReports(p => [payload.new, ...p]);

        if (payload.eventType === "UPDATE")
          setReports(p =>
            p.map(r => r.id === payload.new.id ? payload.new : r)
              .filter(r => r.status !== "RESOLVED")
          );

        if (payload.eventType === "DELETE")
          setReports(p => p.filter(r => r.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const mappedReports = useMemo(() =>
    reports.map(r => {
      const lat = Number(r.latitude), lng = Number(r.longitude);
      const valid = Number.isFinite(lat) && Number.isFinite(lng);
      const fallback = stableCoords(r.id);

      return {
        ...r,
        lat: valid ? lat : fallback[0],
        lng: valid ? lng : fallback[1],
      };
    }), [reports]
  );

  const features = geoData?.features || [];

  const filteredFeatures = useMemo(
    () => riskFilter === "all"
      ? features
      : features.filter(f => f.properties?.riskLevel === riskFilter),
    [geoData, riskFilter]
  );

  const districts = useMemo(() =>
    features
      .map(f => ({
        name: f.properties?.dtname,
        state: f.properties?.stname,
        riskLevel: f.properties?.riskLevel,
        riskScore: f.properties?.riskScore,
      }))
      .filter(d => d.name)
      .sort((a, b) => a.name.localeCompare(b.name)),
    [geoData]
  );

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return districts
      .filter(d =>
        !q ||
        d.name?.toLowerCase().includes(q) ||
        d.state?.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [districts, searchQuery]);

  const counts = useMemo(() => ({
    all: features.length,
    high: features.filter(f => f.properties?.riskLevel === "high").length,
    moderate: features.filter(f => f.properties?.riskLevel === "moderate").length,
    low: features.filter(f => f.properties?.riskLevel === "low").length,
  }), [geoData]);

  const getFeatureStyle = useCallback(feature => {
    const p = feature.properties || {};
    // Use live risk score if available, otherwise fall back to GeoJSON data
    const districtName = p.dtname;
    const riskScore = liveRiskScores[districtName]?.riskScore ?? Number(p.riskScore) ?? 0;
    const color = getColorFromScore(riskScore);
    const active =
      selected?.isDistrict && selected.name === p.dtname;

    return {
      fillColor: color.fill,
      color: active ? "#0F172A" : color.stroke,
      weight: active ? 3 : 1.5,
      opacity: active ? 1 : 0.8,
      fillOpacity: active ? 0.72 : 0.42,
      dashArray: active ? "" : "3",
    };
  }, [selected, liveRiskScores]);

  const selectDistrict = useCallback(async (name) => {
    setSearchQuery(name);
    setSearchFocused(false);

    const feature = features.find(
      f => f.properties?.dtname === name
    );
    if (!feature) return;

    const p = feature.properties || {};

    // Calculate centroid for the district
    const [lat, lng] = calculateCentroid(feature.geometry);

    // Check if we already have live data cached
    const cachedData = liveRiskScores[name];
    const isFresh = cachedData && (Date.now() - cachedData.timestamp < 300000); // 5 min cache

    if (isFresh && cachedData.features) {
      // Use cached data with full environmental factors
      setSelected({
        isDistrict: true,
        name: p.dtname,
        state: p.stname,
        riskScore: cachedData.riskScore,
        riskLevel: cachedData.riskLevel,
        trend: cachedData.riskScore > 60 ? "up" : cachedData.riskScore > 35 ? "flat" : "down",
        probability: cachedData.probability,
        features: cachedData.features,
        factors: [
          {
            key: "rainfall_24h",
            label: "Rainfall (24hrs)",
            labelKey: "factors.rainfall_24h",
            value: cachedData.features.rainfall_24h.toFixed(1),
            unit: "mm",
          },
          {
            key: "rainfall_48h",
            label: "Rainfall (48hrs)",
            labelKey: "factors.rainfall_48h",
            value: cachedData.features.rainfall_48h.toFixed(1),
            unit: "mm",
          },
          {
            key: "rainfall_7d",
            label: "Rainfall (7 days)",
            labelKey: "factors.rainfall_7d",
            value: cachedData.features.rainfall_7d.toFixed(1),
            unit: "mm",
          },
          {
            key: "humidity",
            label: "Avg Humidity (24hrs)",
            labelKey: "factors.humidity",
            value: cachedData.features.average_humidity_24h.toFixed(1),
            unit: "%",
          },
          {
            key: "soil_moisture",
            label: "Soil Moisture",
            labelKey: "factors.soil_moisture",
            value: cachedData.features.soil_moisture.toFixed(3),
            unit: "m³/m³",
          },
          {
            key: "elevation",
            label: "Elevation",
            labelKey: "factors.elevation",
            value: cachedData.features.elevation.toFixed(0),
            unit: "m",
          },
          {
            key: "slope",
            label: "Terrain Slope",
            labelKey: "factors.slope",
            value: cachedData.features.slope.toFixed(2),
            unit: "°",
          },
        ],
        incidents: p.incidents,
      });
      setMapCenter(CENTER);
      setMapZoom(8);
      return;
    }

    // Set loading state with basic info
    setSelected({
      isDistrict: true,
      name: p.dtname,
      state: p.stname,
      riskScore: "...",
      riskLevel: "low",
      loading: true,
    });

    setMapCenter(CENTER);
    setMapZoom(8);

    // Fetch real-time risk data from backend
    try {
      const response = await fetch("http://localhost:8000/api/risk/district", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          district_name: p.dtname,
          latitude: lat,
          longitude: lng,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch risk data");
      }

      const data = await response.json();

      // Cache the result
      setLiveRiskScores(prev => ({
        ...prev,
        [name]: {
          riskScore: data.risk_score,
          riskLevel: data.risk_level.toLowerCase(),
          timestamp: Date.now(),
        },
      }));

      // Update with real data from model
      setSelected({
        isDistrict: true,
        name: p.dtname,
        state: p.stname,
        riskScore: data.risk_score,
        riskLevel: data.risk_level.toLowerCase(),
        trend: data.risk_score > 60 ? "up" : data.risk_score > 35 ? "flat" : "down",
        probability: data.probability,
        features: data.features,
        factors: [
          {
            key: "rainfall_24h",
            label: "Rainfall (24hrs)",
            labelKey: "factors.rainfall_24h",
            value: data.features.rainfall_24h.toFixed(1),
            unit: "mm",
          },
          {
            key: "rainfall_48h",
            label: "Rainfall (48hrs)",
            labelKey: "factors.rainfall_48h",
            value: data.features.rainfall_48h.toFixed(1),
            unit: "mm",
          },
          {
            key: "rainfall_7d",
            label: "Rainfall (7 days)",
            labelKey: "factors.rainfall_7d",
            value: data.features.rainfall_7d.toFixed(1),
            unit: "mm",
          },
          {
            key: "humidity",
            label: "Avg Humidity (24hrs)",
            labelKey: "factors.humidity",
            value: data.features.average_humidity_24h.toFixed(1),
            unit: "%",
          },
          {
            key: "soil_moisture",
            label: "Soil Moisture",
            labelKey: "factors.soil_moisture",
            value: data.features.soil_moisture.toFixed(3),
            unit: "m³/m³",
          },
          {
            key: "elevation",
            label: "Elevation",
            labelKey: "factors.elevation",
            value: data.features.elevation.toFixed(0),
            unit: "m",
          },
          {
            key: "slope",
            label: "Terrain Slope",
            labelKey: "factors.slope",
            value: data.features.slope.toFixed(2),
            unit: "°",
          },
        ],
        incidents: p.incidents,
      });
    } catch (error) {
      console.error("Error fetching risk data:", error);

      // Fallback to static data if API fails
      const score = Number(p.riskScore) || 20;
      setSelected({
        isDistrict: true,
        name: p.dtname,
        state: p.stname,
        riskScore: score,
        riskLevel: p.riskLevel || "low",
        trend: score > 60 ? "up" : score > 35 ? "flat" : "down",
        error: "Could not fetch live data. Showing cached values.",
        factors: [
          {
            key: "rainfall",
            label: "Rainfall data",
            value: "N/A",
          },
        ],
        incidents: p.incidents,
      });
    }
  }, [features, calculateCentroid, liveRiskScores, setLiveRiskScores]);

  const handleFeature = useCallback((feature, layer) => {
    const p = feature.properties || {};
    const name = p.dtname || "Unknown District";
    const state = p.stname || "NER";

    // Function to update tooltip with latest data
    const updateTooltip = () => {
      const liveData = liveRiskScores[name];
      const score = liveData?.riskScore ?? Number(p.riskScore) ?? 20;
      const risk = liveData?.riskLevel ?? p.riskLevel ?? "low";

      layer.setTooltipContent(`
        <div class="p-1 text-xs">
          <div class="font-bold text-slate-900">${name}</div>
          <div class="text-slate-500">${state}</div>
          <div class="mt-1">Risk: <b>${typeof score === 'number' ? score.toFixed(1) : score}/100</b> · ${risk}</div>
        </div>
      `);
    };

    // Initial tooltip
    layer.bindTooltip("", { sticky: true });
    updateTooltip();

    // Store update function on layer for later use
    layer._updateTooltip = updateTooltip;

    layer.on({
      mouseover: e => {
        e.target.setStyle({
          weight: 3,
          color: "#1E293B",
          fillOpacity: 0.7,
        });
        e.target.bringToFront();
      },
      mouseout: e => e.target.setStyle(getFeatureStyle(feature)),
      click: () => selectDistrict(name),
    });
  }, [getFeatureStyle, selectDistrict, liveRiskScores]);

  const resetMap = () => {
    setMapCenter(CENTER);
    setMapZoom(ZOOM);
    setSelected(null);
    setSearchQuery("");
    setSearchFocused(false);
    setRiskFilter("all");
  };

  const filters = [
    ["all", "All"], ["high", "High"],
    ["moderate", "Moderate"], ["low", "Low"],
  ];

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      <div className="shrink-0">
        <SectionHeader
          title={t("riskMap.title", "LANDSLIDE RISK MAP")}
          subtitle={t(
            "riskMap.subtitle",
            "Interactive geospatial hazard visualization across North East Region"
          )}
        />
      </div>

      <div className="risk-map-toolbar shrink-0">
        <div className="risk-search-wrapper flex-1">
          <div className={`risk-search-input ${searchFocused ? "focused" : ""}`}>
            <Search size={17} />

            <input
              value={searchQuery}
              placeholder="Search district or state..."
              onFocus={() => setSearchFocused(true)}
              onChange={e => {
                setSearchQuery(e.target.value);
                setSearchFocused(true);
              }}
            />

            {searchQuery && (
              <button
                className="risk-search-clear"
                onClick={() => {
                  setSearchQuery("");
                  setSearchFocused(false);
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {searchFocused && (
            <>
              <div
                className="risk-search-backdrop"
                onClick={() => setSearchFocused(false)}
              />

              <div className="risk-search-results">
                <div className="risk-search-results-header">
                  {searchQuery ? "Matching Districts" : "Districts"}
                </div>

                {searchResults.length ? searchResults.map(d => (
                  <button
                    key={`${d.state}-${d.name}`}
                    className="risk-search-result"
                    onClick={() => selectDistrict(d.name)}
                  >
                    <div className="risk-search-icon">
                      <MapPin size={14} />
                    </div>

                    <div className="risk-search-info">
                      <div className="risk-search-name">{d.name}</div>
                      <div className="risk-search-state">{d.state}</div>
                    </div>

                    <div className={`risk-search-risk ${d.riskLevel || "low"}`}>
                      {d.riskLevel || "low"}
                    </div>

                    <div className="risk-search-score">
                      {d.riskScore ?? "--"}
                    </div>
                  </button>
                )) : (
                  <div className="risk-search-empty">
                    <Search size={20} />
                    <div>
                      <p>No districts found</p>
                      <span>Try another district or state</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {filters.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setRiskFilter(key)}
              className={`risk-filter-button ${riskFilter === key ? "active" : ""}`}
            >
              {label}<span>{counts[key]}</span>
            </button>
          ))}
        </div>

        <button onClick={resetMap} className="map-reset-button">
          <RotateCcw size={13} /> Reset
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
        <div className="lg:col-span-2 risk-map-fixed">
          <MapContainer
            center={CENTER}
            zoom={ZOOM}
            scrollWheelZoom
            className="w-full h-full"
          >
            <MapController center={mapCenter} zoom={mapZoom} />

            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="OpenStreetMap">
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap"
                  maxZoom={19}
                />
              </LayersControl.BaseLayer>

              <LayersControl.BaseLayer name="Satellite">
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution="Tiles &copy; Esri"
                  maxZoom={18}
                />
              </LayersControl.BaseLayer>

              <LayersControl.BaseLayer name="Terrain">
                <TileLayer
                  url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenTopoMap"
                  maxZoom={17}
                />
              </LayersControl.BaseLayer>

              <LayersControl.BaseLayer name="Dark">
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution="&copy; CARTO"
                  maxZoom={19}
                />
              </LayersControl.BaseLayer>

              {geoData && (
                <LayersControl.Overlay checked name="Risk Zones">
                  <GeoJSON
                    key={`${riskFilter}-${filteredFeatures.length}-${Object.keys(liveRiskScores).length}`}
                    data={{
                      type: "FeatureCollection",
                      features: filteredFeatures,
                    }}
                    style={getFeatureStyle}
                    onEachFeature={handleFeature}
                  />
                </LayersControl.Overlay>
              )}

              <LayersControl.Overlay checked name="Sensor Stations">
                <div>
                  {MAP_LOCATIONS.map(location => {
                    const level =
                      LEVEL_STYLES[location.riskLevel] || LEVEL_STYLES.low;

                    return (
                      <CircleMarker
                        key={location.id}
                        center={[location.lat, location.lng]}
                        radius={selected?.id === location.id ? 13 : 9}
                        pathOptions={{
                          color: "#FFFFFF",
                          fillColor: level.bar,
                          fillOpacity: 0.9,
                          weight: 2.5,
                        }}
                        eventHandlers={{
                          click: () => setSelected(location),
                        }}
                      >
                        <Popup>
                          <div className="text-xs">
                            <b>{location.name}</b>
                            <div className="text-slate-500">
                              {location.state}
                            </div>
                            <div className="mt-2">
                              Risk: <b>{location.riskScore}/100</b>
                            </div>
                          </div>
                        </Popup>
                      </CircleMarker>
                    );
                  })}
                </div>
              </LayersControl.Overlay>

              <LayersControl.Overlay checked name="Live Reports">
                <div>
                  {mappedReports.map(report => (
                    <CircleMarker
                      key={`report-${report.id}`}
                      center={[report.lat, report.lng]}
                      radius={7}
                      pathOptions={{
                        color: "#FFFFFF",
                        fillColor: "#DC2626",
                        fillOpacity: 1,
                        weight: 2.5,
                      }}
                      eventHandlers={{
                        click: () =>
                          setSelected({
                            type: "incident",
                            id: report.id,
                            category: report.category,
                            trigger: "Reported via App",
                            district: report.location,
                            state: "",
                            date: new Date(report.created_at).toLocaleString(),
                            lat: report.lat,
                            lng: report.lng,
                            title: report.title,
                            detail: report.detail,
                          }),
                      }}
                    >
                      <Tooltip>
                        <div className="text-[11px]">
                          <b className="text-red-700">LIVE REPORT</b>
                          <div className="font-semibold">{report.title}</div>
                          <div className="text-slate-500">{report.location}</div>
                        </div>
                      </Tooltip>

                      <Popup>
                        <div className="min-w-[180px] text-xs">
                          <b className="text-red-700">Live Report</b>
                          <div className="font-semibold">{report.title}</div>
                          <div className="text-slate-500">{report.location}</div>
                          <div className="mt-2 border-t pt-2 text-slate-400">
                            {report.lat.toFixed(4)}° N, {report.lng.toFixed(4)}° E
                          </div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                </div>
              </LayersControl.Overlay>
            </LayersControl>
          </MapContainer>

          <div className="pointer-events-none absolute bottom-3 left-3 z-[500]">
            <div className="flex items-center gap-2 rounded-lg bg-white/90 px-3 py-1.5 shadow-md">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-[10px] font-bold text-slate-600">
                LIVE MONITORING
              </span>
            </div>
          </div>
        </div>

        <div className="risk-detail-fixed">
          {selected ? (
            <LocationDetailPanel
              selected={selected}
              onClose={() => setSelected(null)}
              onRefresh={selectDistrict}
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center">
              <div>
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                  <MapPin size={21} className="text-slate-400" />
                </div>

                <h3 className="text-sm font-semibold text-slate-700">
                  Select a location
                </h3>

                <p className="mt-1 max-w-[220px] text-xs leading-5 text-slate-400">
                  Click a district, sensor station, or live report to view details.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-5 text-xs">
          <span className="font-bold uppercase tracking-wider text-slate-400">
            Risk Score
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block h-3 w-16 rounded" style={{ background: 'linear-gradient(to right, #22C55E, #F59E0B, #EF4444)' }} />
            <span className="text-slate-600">0 → 100</span>
          </span>
          <span><span className="inline-block h-3 w-3 rounded-full bg-red-600 mr-2" />Live Reports</span>
        </div>

        <div className="text-[11px] text-slate-400">
          Districts: <b className="text-slate-700">{counts.all}</b>
          <span className="mx-2">|</span>
          Active Reports: <b className="text-red-600">{reports.length}</b>
        </div>
      </div>
    </div>
  );
}