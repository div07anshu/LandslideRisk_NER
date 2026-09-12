import { X } from "lucide-react";
import { useEffect } from "react";

function Modal({ title, onClose, children, footer }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl border border-gray-300 shadow-lg w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-200">
          <h3 className="text-[16px] font-bold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full p-1.5 transition-colors"
            aria-label="Close"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div className="px-5 py-3 border-t border-slate-200 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
