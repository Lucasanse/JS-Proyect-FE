import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import es from "./locales/es/translation.json";
import en from "./locales/en/translation.json";

const savedLanguage = localStorage.getItem("language") || "es";

i18next.use(initReactI18next).init({
  resources: {
    es: {
      translation: es,
    },
    en: {
      translation: en,
    },
  },
  lng: savedLanguage,
  fallbackLng: "es",
  interpolation: {
    escapeValue: false,
  },
});

export default i18next;
