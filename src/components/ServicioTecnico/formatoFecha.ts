import i18n from "i18next";

// Fechas de las solicitudes en el idioma elegido: "17/10/26, 14:35" / "10/17/26, 2:35 PM"
export function formatoFecha(iso: string, conHora = true) {
  const ingles = i18n.language === "en";
  return new Intl.DateTimeFormat(ingles ? "en-US" : "es-AR", {
    dateStyle: "short",
    ...(conHora && { timeStyle: "short", hourCycle: ingles ? "h12" : "h23" }),
  }).format(new Date(iso));
}
