import { useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import SectionHeader from "../common/SectionHeader";
import LocationDetailPanel from "../components/riskmap/LocationDetailPanel";
import { MAP_LOCATIONS } from "../data/mapData";
import { LEVEL_STYLES } from "../data/analysisData";

const NER_CENTER = [26.2, 92.5];

export default function RiskMap() {
  const [selectedId, setSelectedId] = useState(null);

  const selected = MAP_LOCATIONS.find((l) => l.id === selectedId) ?? null;

  return (
    <div className="p-6 flex-1">
      <SectionHeader
        title="RISK MAP"
        subtitle="Interactive landslide risk map across North East Region"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        <div className="lg:col-span-2 rounded-3xl overflow-hidden border border-gray-300 shadow-sm h-[560px]">
          <MapContainer
            center={NER_CENTER}
            zoom={6}
            scrollWheelZoom
            className="w-full h-full"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {MAP_LOCATIONS.map((loc) => {
              const lv = LEVEL_STYLES[loc.riskLevel];
              const isSelected = selectedId === loc.id;

              return (
                <CircleMarker
                  key={loc.id}
                  center={[loc.lat, loc.lng]}
                  radius={isSelected ? 14 : 10}
                  pathOptions={{
                    color: lv.bar,
                    fillColor: lv.bar,
                    fillOpacity: isSelected ? 0.8 : 0.55,
                    weight: 2,
                  }}
                  eventHandlers={{
                    click: () => setSelectedId(loc.id),
                  }}
                >
                  <Popup>
                    <span className="font-semibold">{loc.name}</span>
                    <br />
                    Risk score: {loc.riskScore}/100
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>

        <LocationDetailPanel
          selected={selected}
          onClose={() => setSelectedId(null)}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-4">
        {Object.entries(LEVEL_STYLES).map(([level, style]) => (
          <div
            key={level}
            className="flex items-center gap-2 text-xs text-slate-500"
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: style.bar }}
            />
            {level.charAt(0).toUpperCase() + level.slice(1)} risk
          </div>
        ))}
      </div>
    </div>
  );
}
