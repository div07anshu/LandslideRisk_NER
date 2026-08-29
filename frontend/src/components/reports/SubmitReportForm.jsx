import { useEffect, useRef, useState } from "react";
import { Send, CheckCircle2, ImagePlus, X } from "lucide-react";
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

export default function SubmitReportForm({ onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [image, setImage] = useState(null); // File
  const [imagePreview, setImagePreview] = useState(null); // object URL
  const [imageError, setImageError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef(null);

  const isValid =
    form.title.trim() && form.location.trim() && form.detail.trim();

  // Clean up the object URL when it changes or the component unmounts
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageError("Please choose an image file.");
      return;
    }

    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setImageError(`Image must be under ${MAX_IMAGE_MB}MB.`);
      return;
    }

    setImageError("");
    setImage(file);
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }

  function removeImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImage(null);
    setImagePreview(null);
    setImageError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!isValid || submitting) return;

    setSubmitting(true);
    await onSubmit({ ...form, image, imagePreview });
    setSubmitting(false);

    setForm(EMPTY_FORM);
    removeImage();
    setSubmitted(true);

    setTimeout(() => setSubmitted(false), 2500);
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
            className="mt-1 w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3F72AF]"
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
            className="mt-1 w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3F72AF]"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600">
            Category
          </label>
          <select
            value={form.category}
            onChange={update("category")}
            className="mt-1 w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3F72AF]"
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
            className="mt-1 w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-slate-700 shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#3F72AF]"
          />
        </div>

        {/* Photo upload */}
        <div>
          <label className="text-xs font-semibold text-slate-600">
            Photo (optional)
          </label>

          {!imagePreview ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-1 w-full flex flex-col items-center justify-center gap-1.5 border border-dashed border-gray-300 rounded-xl py-5 text-slate-400 hover:border-[#3F72AF] hover:text-[#3F72AF] transition-colors"
            >
              <ImagePlus size={20} strokeWidth={2.5} />
              <span className="text-xs font-medium">
                Click to upload a photo
              </span>
            </button>
          ) : (
            <div className="mt-1 relative w-fit image-preview-enter">
              <img
                src={imagePreview}
                alt="Report preview"
                className="w-28 h-28 object-cover rounded-xl border border-gray-300"
              />
              <button
                type="button"
                onClick={removeImage}
                aria-label="Remove photo"
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X size={12} strokeWidth={3} />
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />

          {imageError && (
            <p className="text-xs text-red-500 mt-1.5">{imageError}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={!isValid || submitting}
          className="mt-1 flex items-center justify-center gap-2 bg-[#0B1B3B] text-white text-sm font-semibold rounded-lg py-2.5 hover:bg-[#132a5c] transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          <Send size={14} strokeWidth={3} />
          {submitting ? "Submitting..." : "Submit Report"}
        </button>

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
