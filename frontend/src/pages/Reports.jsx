import { useEffect, useMemo, useState } from "react";

import SectionHeader from "../common/SectionHeader";
import SubmitReportForm from "../components/reports/SubmitReportForm";
import ReportsList from "../components/reports/ReportsList";
import { supabase } from "../supabase";

function toDisplayReport(row) {
  return {
    id: row.id,
    title: row.title,
    location: row.location,
    detail: row.detail,
    category: row.category,
    reporter: row.reporter,
    time: new Date(row.created_at).toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    }),
    status: row.status,
    imageUrl: row.image_url,
  };
}

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  // Load existing reports from Supabase on mount instead of seeding from
  // static mock data — previously this state was never persisted, so a
  // page refresh silently discarded every report a user had submitted.
  useEffect(() => {
    let active = true;

    async function loadReports() {
      setLoading(true);
      setLoadError("");

      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (!active) return;

      if (error) {
        console.error("Failed to load reports:", error.message);
        setLoadError(
          "Couldn't load reports right now. Try refreshing the page.",
        );
      } else {
        setReports((data ?? []).map(toDisplayReport));
      }

      setLoading(false);
    }

    loadReports();

    return () => {
      active = false;
    };
  }, []);

  async function handleNewReport(form) {
    let imageUrl = null;

    if (form.image) {
      const fileExt = form.image.name.split(".").pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("report-photos")
        .upload(filePath, form.image);

      if (uploadError) {
        console.error("Image upload failed:", uploadError.message);
        // Non-fatal: the report can still be saved without a photo.
      } else {
        const { data } = supabase.storage
          .from("report-photos")
          .getPublicUrl(filePath);
        imageUrl = data.publicUrl;
      }
    }

    const { data, error } = await supabase
      .from("reports")
      .insert({
        title: form.title,
        location: form.location,
        detail: form.detail,
        category: form.category,
        reporter: "You",
        status: "PENDING",
        image_url: imageUrl,
      })
      .select()
      .single();

    if (error) {
      // Thrown so SubmitReportForm can surface it and avoid clearing the
      // form / showing a false "submitted successfully" message.
      throw new Error("Couldn't save the report. Please try again.");
    }

    setReports((prev) => [toDisplayReport(data), ...prev]);
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

      {loadError && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
          {loadError}
        </div>
      )}

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
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
