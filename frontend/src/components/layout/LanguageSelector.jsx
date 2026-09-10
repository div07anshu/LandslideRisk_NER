import { useTranslation } from "react-i18next";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const LANGUAGES = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिंदी" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া" },
  { code: "ne", name: "Nepali", nativeName: "नेपाली" },
];

export default function LanguageSelector() {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const activeLangCode = (i18n.language || "en").split("-")[0];
  const currentLang = LANGUAGES.find((l) => l.code === activeLangCode) || LANGUAGES[0];

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem("i18nextLng", code);
    localStorage.setItem("i18n_language", code);
    localStorage.setItem("preferredLanguage", code);
    setIsOpen(false);
  };

  if (!mounted) {
    return (
      <button
        ref={buttonRef}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 pr-6 transition-all duration-200 ease-out hover:bg-slate-100 hover:shadow-md active:scale-95 motion-reduce:transition-none"
        aria-label={t("language.select")}
        disabled
      >
        <Globe size={16} strokeWidth={2} className="text-slate-500" />
        <span className="text-sm font-medium text-slate-700">{currentLang.nativeName}</span>
        <ChevronDown size={14} className="text-slate-500" />
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 pr-6 transition-all duration-200 ease-out hover:bg-slate-100 hover:shadow-md active:scale-95 motion-reduce:transition-none"
        aria-label={t("language.select")}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Globe size={16} strokeWidth={2} className="text-slate-500" />
        <span className="text-sm font-medium text-slate-700">{currentLang.nativeName}</span>
        <ChevronDown
          size={14}
          className={`text-slate-500 transition-transform duration-200 ease-out ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`absolute right-0 mt-1.5 w-40 origin-top-right overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg transition-all duration-200 ease-out ${
          isOpen
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-95 opacity-0"
        }`}
        role="listbox"
        aria-label={t("language.select")}
      >
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors ${
              activeLangCode === lang.code
                ? "bg-brand-50 text-brand-900"
                : "text-slate-700 hover:bg-slate-100"
            }`}
            role="option"
            aria-selected={activeLangCode === lang.code}
          >
            <span className="flex-1 text-left">{lang.nativeName}</span>
            {activeLangCode === lang.code && (
              <Check size={16} strokeWidth={3} className="text-brand-600 shrink-0" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}