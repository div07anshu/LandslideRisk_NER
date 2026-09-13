import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { MapContainer, LayersControl, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Search, Plus, Pencil, Trash2, MapPin } from "lucide-react";

import SectionHeader from "../../common/SectionHeader";
import Card from "../../common/Card";
import Modal from "../../common/Modal";
import RiskMapBaseLayers from "../../components/riskmap/RiskMapBaseLayers";
import DistrictBoundariesLayer from "../../components/riskmap/DistrictBoundariesLayer";
import { useRiskMapData } from "../../hooks/useRiskMapData";
import { LEVEL_STYLES } from "../../data/analysisData";
import { MAP_LOCATIONS } from "../../data/mapData";
import { supabase } from "../../supabase";
import { adminFetch } from "../../api/adminApi";

const RISK_LEVELS = ["LOW", "MODERATE", "HIGH"];
const RISK_LEVEL_FILTERS = ["All", ...RISK_LEVELS];
const NER_CENTER = [26.2, 92.5];

function RiskLevelBadge({ level }) {
  const { t } = useTranslation();
  const style = LEVEL_STYLES[String(level).toLowerCase()] ?? LEVEL_STYLES.low;
  return (
    <span className={`text-[11px] font-bold rounded-full px-2.5 py-1 inline-block ${style.bg} ${style.text}`}>
      {t(`riskLevels.${String(level).toLowerCase()}`, level)}
    </span>
  );
}

function ZoneFormModal({ initial, onClose, onSaved }) {
  const { t } = useTranslation();
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState(() => ({
    name: initial?.name ?? "",
    state: initial?.state ?? "",
    riskLevel: initial?.risk_level ?? "MODERATE",
    latitude: initial?.latitude ?? "",
    longitude: initial?.longitude ?? "",
    monitoringEnabled: initial?.monitoring_enabled ?? true,
    notes: initial?.notes ?? "",
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update(field) {
    return (e) => {
      const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
      setForm((f) => ({ ...f, [field]: value }));
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const hasLat = form.latitude !== "";
    const hasLng = form.longitude !== "";

    if (hasLat !== hasLng) {
      setError(t("admin.riskZones.form.coordsTogetherError"));
      setSaving(false);
      return;
    }

    const payload = {
      name: form.name.trim(),
      state: form.state.trim() || undefined,
      riskLevel: form.riskLevel,
      latitude: hasLat ? Number(form.latitude) : undefined,
      longitude: hasLng ? Number(form.longitude) : undefined,
      monitoringEnabled: form.monitoringEnabled,
      notes: form.notes.trim() || undefined,
    };

    try {
      const saved = isEdit
        ? await adminFetch(`/api/admin/risk-zones/${initial.id}`, { method: "PATCH", body: payload })
        : await adminFetch("/api/admin/risk-zones", { method: "POST", body: payload });
      onSaved(saved);
    } catch (err) {
      setError(err?.message || t("admin.riskZones.form.saveError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={isEdit ? t("admin.riskZones.form.editTitle") : t("admin.riskZones.form.createTitle")}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-600">{t("admin.riskZones.form.name")}</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={update("name")}
            className="mt-1 w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-600">{t("admin.riskZones.form.state")}</label>
            <input
              type="text"
              value={form.state}
              onChange={update("state")}
              className="mt-1 w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">{t("admin.riskZones.form.riskLevel")}</label>
            <select
              value={form.riskLevel}
              onChange={update("riskLevel")}
              className="mt-1 w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
            >
              {RISK_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {t(`riskLevels.${lvl.toLowerCase()}`, lvl)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-600">{t("admin.riskZones.form.latitude")}</label>
            <input
              type="number"
              step="any"
              value={form.latitude}
              onChange={update("latitude")}
              placeholder={t("admin.riskZones.form.optional")}
              className="mt-1 w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">{t("admin.riskZones.form.longitude")}</label>
            <input
              type="number"
              step="any"
              value={form.longitude}
              onChange={update("longitude")}
              placeholder={t("admin.riskZones.form.optional")}
              className="mt-1 w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
          </div>
        </div>
        <p className="text-[11px] text-slate-400 -mt-2">{t("admin.riskZones.form.coordsHint")}</p>

        <div>
          <label className="text-xs font-semibold text-slate-600">{t("admin.riskZones.form.notes")}</label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={update("notes")}
            className="mt-1 w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-slate-700 shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-600"
          />
        </div>

        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <input
            type="checkbox"
            checked={form.monitoringEnabled}
            onChange={update("monitoringEnabled")}
            className="rounded border-gray-300"
          />
          {t("admin.riskZones.form.monitoringEnabled")}
        </label>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 mt-1">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-slate-500 hover:text-slate-800 px-3.5 py-2"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-brand-950 text-white text-sm font-semibold rounded-lg px-4 py-2 hover:bg-brand-800 transition-colors disabled:opacity-40"
          >
            {saving ? t("common.loading") : t("common.save")}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminRiskZones() {
  const { t } = useTranslation();

  const { geoData, features, liveRiskScores, getFeatureStyle } = useRiskMapData();

  const [reports, setReports] = useState([]);
  const [zones, setZones] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [riskLevelFilter, setRiskLevelFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formTarget, setFormTarget] = useState(null); // null | {} (create) | zone (edit)
  const [zoneToDelete, setZoneToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      const { data, error: err } = await supabase
        .from("reports")
        .select("*")
        .not("status", "eq", "RESOLVED")
        .order("created_at", { ascending: false });

      if (err) return console.error("Reports:", err.message);
      if (active) setReports(data || []);
    };

    load();

    const channel = supabase
      .channel("public:reports:admin-risk-zones")
      .on("postgres_changes", {
        event: "*", schema: "public", table: "reports",
      }, (payload) => {
        if (payload.eventType === "INSERT")
          setReports((p) => [payload.new, ...p]);

        if (payload.eventType === "UPDATE")
          setReports((p) =>
            p.map((r) => (r.id === payload.new.id ? payload.new : r))
              .filter((r) => r.status !== "RESOLVED")
          );

        if (payload.eventType === "DELETE")
          setReports((p) => p.filter((r) => r.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const reportsWithCoords = reports.filter(
    (r) => Number.isFinite(Number(r.latitude)) && Number.isFinite(Number(r.longitude))
  );

  async function loadZones(signal) {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (riskLevelFilter !== "All") params.set("riskLevel", riskLevelFilter);

      const data = await adminFetch(`/api/admin/risk-zones?${params.toString()}`, { signal });
      setZones(data?.zones ?? []);
      setTotal(data?.total ?? 0);
    } catch (err) {
      if (err?.name === "AbortError") return;
      setError(
        err?.status === 403 ? t("admin.riskZones.errors.forbidden") : t("admin.riskZones.errors.loadFailed"),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    const debounce = setTimeout(() => loadZones(controller.signal), 300);
    return () => {
      controller.abort();
      clearTimeout(debounce);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, riskLevelFilter]);

  async function handleDelete() {
    if (!zoneToDelete) return;
    setDeleting(true);
    setDeleteError("");

    try {
      await adminFetch(`/api/admin/risk-zones/${zoneToDelete.id}`, { method: "DELETE" });
      setZones((prev) => prev.filter((z) => z.id !== zoneToDelete.id));
      setTotal((t2) => Math.max(0, t2 - 1));
      setZoneToDelete(null);
    } catch (err) {
      setDeleteError(err?.message || t("admin.riskZones.deleteError"));
    } finally {
      setDeleting(false);
    }
  }

  const zonesWithCoords = zones.filter((z) => z.latitude != null && z.longitude != null);

  return (
    <div className="flex-1">
      <SectionHeader title={t("admin.riskZones.title")} subtitle={t("admin.riskZones.subtitle")} />

      <Card className="p-4 mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} strokeWidth={3} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("admin.riskZones.searchPlaceholder")}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
          </div>

          <div className="flex bg-slate-100 border border-gray-200 rounded-xl p-1 w-fit">
            {RISK_LEVEL_FILTERS.map((lvl) => (
              <button
                key={lvl}
                onClick={() => setRiskLevelFilter(lvl)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  riskLevelFilter === lvl ? "bg-brand-950 text-white" : "text-slate-500 hover:bg-slate-200"
                }`}
              >
                {lvl === "All" ? t("common.all") : t(`riskLevels.${lvl.toLowerCase()}`, lvl)}
              </button>
            ))}
          </div>

          <button
            onClick={() => setFormTarget({})}
            className="ml-auto flex items-center gap-1.5 bg-brand-950 text-white text-sm font-semibold rounded-lg px-3.5 py-2 hover:bg-brand-800 transition-colors"
          >
            <Plus size={16} strokeWidth={3} />
            {t("admin.riskZones.addZone")}
          </button>
        </div>
      </Card>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch mb-5">
        <div className="lg:col-span-2 rounded-3xl overflow-hidden border border-gray-300 shadow-sm h-[400px]">
          <MapContainer center={NER_CENTER} zoom={6} scrollWheelZoom className="w-full h-full">
            <LayersControl position="topright">
              <RiskMapBaseLayers />

              {geoData && (
                <DistrictBoundariesLayer
                  features={features}
                  liveRiskScores={liveRiskScores}
                  getFeatureStyle={getFeatureStyle}
                />
              )}

              <LayersControl.Overlay checked name="Admin Zones">
                <div>
                  {zonesWithCoords.map((z) => {
                    const style = LEVEL_STYLES[String(z.risk_level).toLowerCase()] ?? LEVEL_STYLES.low;
                    return (
                      <CircleMarker
                        key={z.id}
                        center={[z.latitude, z.longitude]}
                        radius={10}
                        pathOptions={{ color: style.bar, fillColor: style.bar, fillOpacity: 0.6, weight: 2 }}
                      >
                        <Popup>
                          <span className="font-semibold">{z.name}</span>
                          <br />
                          {t(`riskLevels.${String(z.risk_level).toLowerCase()}`)}
                        </Popup>
                      </CircleMarker>
                    );
                  })}
                </div>
              </LayersControl.Overlay>

              <LayersControl.Overlay checked name="Sensor Stations">
                <div>
                  {MAP_LOCATIONS.map((location) => {
                    const level = LEVEL_STYLES[location.riskLevel] || LEVEL_STYLES.low;

                    return (
                      <CircleMarker
                        key={location.id}
                        center={[location.lat, location.lng]}
                        radius={9}
                        pathOptions={{
                          color: "#FFFFFF",
                          fillColor: level.bar,
                          fillOpacity: 0.9,
                          weight: 2.5,
                        }}
                      >
                        <Popup>
                          <div className="text-xs">
                            <b>{location.name}</b>
                            <div className="text-slate-500">{location.state}</div>
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
                  {reportsWithCoords.map((report) => (
                    <CircleMarker
                      key={`report-${report.id}`}
                      center={[Number(report.latitude), Number(report.longitude)]}
                      radius={7}
                      pathOptions={{
                        color: "#FFFFFF",
                        fillColor: "#DC2626",
                        fillOpacity: 1,
                        weight: 2.5,
                      }}
                    >
                      <Popup>
                        <div className="min-w-[180px] text-xs">
                          <b className="text-red-700">Live Report</b>
                          <div className="font-semibold">{report.title}</div>
                          <div className="text-slate-500">{report.location}</div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                </div>
              </LayersControl.Overlay>
            </LayersControl>
          </MapContainer>
        </div>

        <Card className="p-4">
          <p className="text-xs font-semibold text-slate-600 mb-1">{t("admin.riskZones.mapNote.title")}</p>
          <p className="text-xs text-slate-500">
            {t("admin.riskZones.mapNote.body", { plotted: zonesWithCoords.length, total })}
          </p>
        </Card>
      </div>

      <Card className="flex flex-col">
        <div className="px-5 pt-4 pb-2">
          <p className="text-xs text-slate-500">
            {loading ? t("common.loading") : t("admin.riskZones.zonesFound", { count: total })}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-200">
                <th className="px-5 py-2">{t("admin.riskZones.columns.name")}</th>
                <th className="px-5 py-2">{t("admin.riskZones.columns.riskLevel")}</th>
                <th className="px-5 py-2">{t("admin.riskZones.columns.coordinates")}</th>
                <th className="px-5 py-2">{t("admin.riskZones.columns.monitoring")}</th>
                <th className="px-5 py-2">{t("admin.riskZones.columns.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={5} className="py-8">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-slate-200 border-t-brand-600 rounded-full animate-spin motion-reduce:animate-none" />
                    </div>
                  </td>
                </tr>
              )}

              {!loading && zones.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-slate-400">
                    {t("admin.riskZones.noZonesFound")}
                  </td>
                </tr>
              )}

              {!loading &&
                zones.map((z) => (
                  <tr key={z.id}>
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-800">{z.name}</div>
                      {z.state && <div className="text-[11px] text-slate-400">{z.state}</div>}
                    </td>
                    <td className="px-5 py-3">
                      <RiskLevelBadge level={z.risk_level} />
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">
                      {z.latitude != null && z.longitude != null ? (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} strokeWidth={2.5} />
                          {Number(z.latitude).toFixed(4)}, {Number(z.longitude).toFixed(4)}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">
                          {t("admin.riskZones.noCoordinates")}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs">
                      {z.monitoring_enabled ? (
                        <span className="text-green-600 font-medium">{t("admin.riskZones.monitoringOn")}</span>
                      ) : (
                        <span className="text-slate-400">{t("admin.riskZones.monitoringOff")}</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setFormTarget(z)}
                          className="text-slate-500 hover:text-blue-600 p-1.5 rounded-lg hover:bg-slate-100"
                          aria-label={t("common.viewDetails")}
                        >
                          <Pencil size={14} strokeWidth={2.5} />
                        </button>
                        <button
                          onClick={() => setZoneToDelete(z)}
                          className="text-slate-500 hover:text-red-600 p-1.5 rounded-lg hover:bg-slate-100"
                          aria-label={t("common.cancel")}
                        >
                          <Trash2 size={14} strokeWidth={2.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>

      {formTarget && (
        <ZoneFormModal
          initial={formTarget}
          onClose={() => setFormTarget(null)}
          onSaved={() => {
            setFormTarget(null);
            loadZones();
          }}
        />
      )}

      {zoneToDelete && (
        <Modal
          title={t("admin.riskZones.confirmDeleteTitle")}
          onClose={() => setZoneToDelete(null)}
          footer={
            <>
              <button
                onClick={() => setZoneToDelete(null)}
                className="text-sm font-medium text-slate-500 hover:text-slate-800 px-3.5 py-2"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 text-white text-sm font-semibold rounded-lg px-4 py-2 hover:bg-red-700 transition-colors disabled:opacity-40"
              >
                {deleting ? t("common.loading") : t("common.confirm")}
              </button>
            </>
          }
        >
          <p className="text-sm text-slate-600">
            {t("admin.riskZones.confirmDeleteBody", { name: zoneToDelete.name })}
          </p>
          {deleteError && <p className="text-xs text-red-500 mt-2">{deleteError}</p>}
        </Modal>
      )}
    </div>
  );
}
