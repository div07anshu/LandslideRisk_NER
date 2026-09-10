import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import hi from "./locales/hi.json";
import bn from "./locales/bn.json";
import as from "./locales/as.json";
import ne from "./locales/ne.json";

// The translations
const resources = {
  en: {
    translation: en,
  },
  hi: {
    translation: hi,
  },
  bn: {
    translation: bn,
  },
  as: {
    translation: as,
  },
  ne: {
    translation: ne,
  },
};

i18n
  .use(LanguageDetector) // detect user language
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    fallbackLng: "en", // use en if detected lng is not available
    supportedLngs: ["en", "hi", "bn", "as", "ne"],
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
    debug: false,
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    returnNull: false,
    returnEmptyString: false,
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "i18nextLng",
      caches: ["localStorage"],
    },
  });

export default i18n;
