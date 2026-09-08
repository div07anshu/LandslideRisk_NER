import { useEffect, useRef, useState } from "react";
import { Send, CheckCircle2, ImagePlus, Video, X } from "lucide-react";
import Card from "../../common/Card";
import CardHeader from "../../common/CardHeader";
import { CATEGORIES } from "../../data/reportsData";

const EMPTY_FORM = {
  title: "",
  location: "",
  category: CATEGORIES[0].value,
  detail: "",
};

const MAX_IMAGE_MB = 5;
const MAX_VIDEO_MB = 50;

export default function SubmitReportForm({ onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [media, setMedia] = useState(null); // File
  const [mediaPreview, setMediaPreview] = useState(null); // object URL
  const [mediaError, setMediaError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const fileInputRef = useRef(null);

  const isValid =
    form.title.trim() && form.location.trim() && form.detail.trim();

  // Clean up the object URL when it changes or the component unmounts
  useEffect(() => {
    return () => {
      if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    };
  }, [mediaPreview]);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function handleMediaChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      setMediaError("Please choose an image or video file.");
      return;
    }

    if (isImage && file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setMediaError(`Image must be under ${MAX_IMAGE_MB}MB.`);
      return;
    }

    if (isVideo && file.size > MAX_VIDEO_MB * 1024 * 1024) {
      setMediaError(`Video must be under ${MAX_VIDEO_MB}MB.`);
      return;
    }

    setMediaError("");
    setMedia(file);
    setMediaPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }

  function removeMedia() {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMedia(null);
    setMediaPreview(null);
    setMediaError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!isValid || submitting) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      await onSubmit({ ...form, media, mediaPreview });
      setForm(EMPTY_FORM);
      removeMedia();
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 2500);
    } catch (err) {
      setSubmitError(
        err?.message || "Couldn't submit the report. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <style>{`
        @keyframes successIn {
          from { opacity: 0; transform: translateY(4px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .success-message {
          animation: successIn 250ms ease-out;
        }
        @keyframes previewIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .image-preview-enter {
          animation: previewIn 200ms ease-out;
        }
        @media (prefers-reduced-motion: reduce) {
          .success-message, .image-preview-enter { animation: none; }
        }
      `}</style>

      <CardHeader title="SUBMIT A REPORT" />

      <form onSubmit={handleSubmit} className="px-5 pb-5 flex flex-col gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-600">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={update("title")}
            placeholder="e.g. Road crack near Mawsmai"
            className="mt-1 w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600">
            Location
          </label>
          <input
            type="text"
            value={form.location}
            onChange={update("location")}
            placeholder="e.g. Cherrapunji, Meghalaya"
            className="mt-1 w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600">
            Category
          </label>
          <select
            value={form.category}
            onChange={update("category")}
            className="mt-1 w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600">
            Description
          </label>
          <textarea
            value={form.detail}
            onChange={update("detail")}
            rows={4}
            placeholder="Describe what you observed..."
            className="mt-1 w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-slate-700 shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-600"
          />
        </div>

        {/* Media upload */}
        <div>
          <label className="text-xs font-semibold text-slate-600">
            Photo or Video (optional)
          </label>

          {!mediaPreview ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-1 w-full flex flex-col items-center justify-center gap-1.5 border border-dashed border-gray-300 rounded-xl py-5 text-slate-400 hover:border-brand-600 hover:text-brand-600 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ImagePlus size={20} strokeWidth={2.5} />
                <Video size={20} strokeWidth={2.5} />
              </div>
              <span className="text-xs font-medium mt-1">
                Click to upload a photo or video
              </span>
            </button>
          ) : (
            <div className="mt-1 relative w-fit image-preview-enter">
              {media?.type.startsWith("video/") ? (
                <video
                  src={mediaPreview}
                  controls
                  playsInline
                  autoPlay
                  muted
                  className="w-48 max-h-48 rounded-xl border border-gray-300 bg-black"
                />
              ) : (
                <img
                  src={mediaPreview}
                  alt="Report preview"
                  className="w-28 h-28 object-cover rounded-xl border border-gray-300"
                />
              )}
              <button
                type="button"
                onClick={removeMedia}
                aria-label="Remove media"
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X size={12} strokeWidth={3} />
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleMediaChange}
            className="hidden"
          />

          {mediaError && (
            <p className="text-xs text-red-500 mt-1.5">{mediaError}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={!isValid || submitting}
          className="mt-1 flex items-center justify-center gap-2 bg-brand-950 text-white text-sm font-semibold rounded-lg py-2.5 hover:bg-brand-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          <Send size={14} strokeWidth={3} />
          {submitting ? "Submitting..." : "Submit Report"}
        </button>

        {submitError && (
          <p className="text-xs text-red-500 -mt-2">{submitError}</p>
        )}

        {submitted && (
          <div className="success-message flex items-center gap-1.5 text-xs font-medium text-green-600">
            <CheckCircle2 size={14} strokeWidth={3} />
            Report submitted successfully
          </div>
        )}
      </form>
    </Card>
  );
}
