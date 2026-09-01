import { useEffect, useState } from "react";
import {
    MapContainer,
    TileLayer,
    GeoJSON,
    useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const WHITE_STYLE = {
    fillColor: "#ffffff",
    fillOpacity: 1,
    color: "#333333",
    weight: 1,
};

const MASK_STYLE = {
    fillColor: "#ffffff",
    fillOpacity: 1,
    color: "#ffffff",
    weight: 0,
    stroke: false,
};

function FitNERBounds({ districts }) {
    const map = useMap();

    useEffect(() => {
        if (!districts) return;

        const geoJsonLayer = L.geoJSON(districts);
        const bounds = geoJsonLayer.getBounds();

        if (bounds.isValid()) {
            const center = bounds.getCenter();

            map.setView(center, 6.5);
        }
    }, [districts, map]);

    return null;
}

export default function DistrictRiskMap() {
    const [nerDistricts, setNerDistricts] = useState(null);
    const [nerMask, setNerMask] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadMapData() {
            try {
                const [districtResponse, maskResponse] = await Promise.all([
                    fetch("/geo/ner-districts.geojson"),
                    fetch("/geo/ner-mask-exact.geojson"),
                ]);

                if (!districtResponse.ok) {
                    throw new Error(
                        "Failed to load NER district boundaries"
                    );
                }

                if (!maskResponse.ok) {
                    throw new Error("Failed to load NER map mask");
                }

                const districts = await districtResponse.json();
                const mask = await maskResponse.json();

                setNerDistricts(districts);
                setNerMask(mask);
            } catch (err) {
                console.error("District map error:", err);
                setError(err.message);
            }
        }

        loadMapData();
    }, []);

    if (error) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-slate-50 p-6">
                <div className="rounded-xl border border-red-200 bg-white px-6 py-5 text-center shadow-sm">
                    <p className="text-sm font-semibold text-red-600">
                        Unable to load district map
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                        {error}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <MapContainer
            center={[25.5, 93.5]}
            zoom={5}
            style={{
                width: "100%",
                height: "100%",
            }}
            zoomControl={true}
        >
            <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {nerMask && (
                <GeoJSON
                    data={nerMask}
                    style={MASK_STYLE}
                />
            )}

            {nerDistricts && (
                <>
                    <FitNERBounds districts={nerDistricts} />

                    <GeoJSON
                        data={nerDistricts}
                        style={WHITE_STYLE}
                    />
                </>
            )}
        </MapContainer>
    );
}