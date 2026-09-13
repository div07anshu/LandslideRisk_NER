import { useState, useEffect, useMemo, useCallback } from "react";
import {
  MapContainer, CircleMarker, Popup,
  Tooltip, LayersControl, useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Search, RotateCcw, X, MapPin } from "lucide-react";
import SectionHeader from "../common/SectionHeader";
import LocationDetailPanel from "../components/riskmap/LocationDetailPanel";
import RiskMapBaseLayers from "../components/riskmap/RiskMapBaseLayers";
import DistrictBoundariesLayer from "../components/riskmap/DistrictBoundariesLayer";
import { useRiskMapData, calculateCentroid } from "../hooks/useRiskMapData";
import { MAP_LOCATIONS } from "../data/mapData";
import { LEVEL_STYLES } from "../data/analysisData";
import { useTranslation } from "react-i18next";
import { supabase } from "../supabase";

const API_BASE =
  import.meta.env.VITE_API_URL ?? import.meta.env.VITE_BACKEND_URL ?? "http://localhost:4000";

const CENTER = [26.2, 92.5], ZOOM = 7;

// Looks up the district's reference record (population, highways, government
// schools/hospitals) from the Supabase `Details` table, via the backend so
// RLS doesn't block it. Returns null on any miss/failure — the location
// panel just omits the section when there's nothing to show.
async function fetchDistrictDetails(districtName, stateName, signal) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const token = session?.access_token;
    if (!token) return null;

    const params = new URLSearchParams({ district: districtName });
    if (stateName) params.set("state", stateName);

    const res = await fetch(`${API_BASE}/api/risk/district-details?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });

    if (!res.ok) return null;

    const body = await res.json();
    return body?.data ?? null;
  } catch (error) {
    if (error?.name !== "AbortError") {
      console.error(`Failed to fetch details for ${districtName}:`, error);
    }
    return null;
  }
}

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

  const { geoData, features, liveRiskScores, setLiveRiskScores, getFeatureStyle } = useRiskMapData();
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState(null);
  const [riskFilter, setRiskFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [mapCenter, setMapCenter] = useState(CENTER);
  const [mapZoom, setMapZoom] = useState(ZOOM);

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

  const counts = useMemo(() => {
    const levelOf = f => liveRiskScores[f.properties?.dtname]?.riskLevel ?? f.properties?.riskLevel;
    return {
      all: features.length,
      high: features.filter(f => levelOf(f) === "high").length,
      moderate: features.filter(f => levelOf(f) === "moderate").length,
      low: features.filter(f => levelOf(f) === "low").length,
    };
  }, [features, liveRiskScores]);

  const selectDistrict = useCallback(async (name) => {
    setSearchQuery(name);
    setSearchFocused(false);

    const feature = features.find(
      f => f.properties?.dtname === name
    );
    if (!feature) return;

    const p = feature.properties || {};

    // Fetch the Supabase-backed district reference details in parallel with
    // the risk score below, and patch them into `selected` once they land
    // (whichever branch below ends up setting it).
    fetchDistrictDetails(p.dtname, p.stname).then((details) => {
      if (!details) return;
      setSelected((prev) =>
        prev && prev.isDistrict && prev.name === p.dtname
          ? { ...prev, details }
          : prev
      );
    });

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
              <RiskMapBaseLayers />

              {geoData && (
                <DistrictBoundariesLayer
                  features={features}
                  liveRiskScores={liveRiskScores}
                  getFeatureStyle={getFeatureStyle}
                  riskFilter={riskFilter}
                  activeDistrictName={selected?.isDistrict ? selected.name : undefined}
                  onFeatureClick={selectDistrict}
                />
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