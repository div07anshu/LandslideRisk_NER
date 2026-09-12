import { LayersControl, TileLayer } from "react-leaflet";

// Shared basemap choices for the Risk Map and the admin Risk Zones map, so both
// present the same tile options.
export default function RiskMapBaseLayers() {
  return (
    <>
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
    </>
  );
}
