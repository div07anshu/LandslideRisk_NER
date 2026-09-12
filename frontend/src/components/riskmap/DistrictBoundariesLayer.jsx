import { useMemo, useCallback } from "react";
import { GeoJSON, LayersControl } from "react-leaflet";

// Renders the same district polygons/colors/boundaries used by the main Risk Map.
// Shared by the Risk Map page and the admin Risk Zones map so both stay visually identical.
export default function DistrictBoundariesLayer({
  features,
  liveRiskScores,
  getFeatureStyle,
  riskFilter = "all",
  activeDistrictName,
  onFeatureClick,
  layerName = "Risk Zones",
}) {
  const filteredFeatures = useMemo(() => {
    if (riskFilter === "all") return features;
    return features.filter(f => {
      const name = f.properties?.dtname;
      const level = liveRiskScores[name]?.riskLevel ?? f.properties?.riskLevel;
      return level === riskFilter;
    });
  }, [features, liveRiskScores, riskFilter]);

  const styleFn = useCallback(
    feature => getFeatureStyle(feature, activeDistrictName),
    [getFeatureStyle, activeDistrictName],
  );

  const handleFeature = useCallback((feature, layer) => {
    const p = feature.properties || {};
    const name = p.dtname || "Unknown District";
    const state = p.stname || "NER";

    const updateTooltip = () => {
      const liveData = liveRiskScores[name];
      const score = liveData?.riskScore ?? Number(p.riskScore) ?? 20;
      const risk = liveData?.riskLevel ?? p.riskLevel ?? "low";

      layer.setTooltipContent(`
        <div class="p-1 text-xs">
          <div class="font-bold text-slate-900">${name}</div>
          <div class="text-slate-500">${state}</div>
          <div class="mt-1">Risk: <b>${typeof score === "number" ? score.toFixed(1) : score}/100</b> · ${risk}</div>
        </div>
      `);
    };

    layer.bindTooltip("", { sticky: true });
    updateTooltip();
    layer._updateTooltip = updateTooltip;

    layer.on({
      mouseover: e => {
        e.target.setStyle({ weight: 3, color: "#1E293B", fillOpacity: 0.7 });
        e.target.bringToFront();
      },
      mouseout: e => e.target.setStyle(styleFn(feature)),
      click: () => onFeatureClick?.(name),
    });
  }, [liveRiskScores, styleFn, onFeatureClick]);

  return (
    <LayersControl.Overlay checked name={layerName}>
      <GeoJSON
        key={`${riskFilter}-${filteredFeatures.length}-${Object.keys(liveRiskScores).length}`}
        data={{ type: "FeatureCollection", features: filteredFeatures }}
        style={styleFn}
        onEachFeature={handleFeature}
      />
    </LayersControl.Overlay>
  );
}
