import { useMemo, useState } from "react";
import SectionHeader from "../common/SectionHeader";
import AlertsSummary from "../components/alerts/AlertsSummary";
import AlertsList from "../components/alerts/AlertsList";
import { INITIAL_ALERTS } from "../data/alertsData";
import { useTranslation } from "react-i18next";

export default function Alerts() {
  const { t } = useTranslation();
  const [levelFilter, setLevelFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filteredAlerts = useMemo(() => {
    return INITIAL_ALERTS.filter((a) => {
      const matchesLevel = levelFilter === "All" || a.level === levelFilter;

      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q) ||
        a.detail.toLowerCase().includes(q);

      return matchesLevel && matchesSearch;
    });
  }, [levelFilter, search]);

  return (
    <div className="flex-1">
      <SectionHeader
        title={t("alerts.title")}
        subtitle={t("alerts.subtitle")}
      />

      <AlertsSummary alerts={INITIAL_ALERTS} />

      <AlertsList
        alerts={filteredAlerts}
        levelFilter={levelFilter}
        setLevelFilter={setLevelFilter}
        search={search}
        setSearch={setSearch}
      />
    </div>
  );
}
