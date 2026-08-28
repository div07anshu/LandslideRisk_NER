import { useMemo, useState } from "react";

import SectionHeader from "../common/SectionHeader";
import SubmitReportForm from "../components/reports/SubmitReportForm";
import ReportsList from "../components/reports/ReportsList";

import { INITIAL_REPORTS } from "../data/reportsData";

let nextId = INITIAL_REPORTS.length + 1;

export default function Reports() {
  const [reports, setReports] = useState(INITIAL_REPORTS);
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  function handleNewReport(form) {
    const newReport = {
      id: `r${nextId++}`,
      title: form.title,
      location: form.location,
      detail: form.detail,
      category: form.category,
      reporter: "You",
      time: "Just now",
      status: "PENDING",
    };

    setReports((prev) => [newReport, ...prev]);
  }

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchesStatus = statusFilter === "All" || r.status === statusFilter;

      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.detail.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [reports, statusFilter, search]);

  return (
    <div className="p-6 flex-1">
      <SectionHeader
        title="REPORTS"
        subtitle="Submit new field reports and track existing ones across North East Region"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        <div className="lg:col-span-1">
          <SubmitReportForm onSubmit={handleNewReport} />
        </div>

        <div className="lg:col-span-2">
          <ReportsList
            reports={filteredReports}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            search={search}
            setSearch={setSearch}
          />
        </div>
      </div>
    </div>
  );
}
