import { formatDistanceToNow, format } from "date-fns";
import { enUS, es } from "date-fns/locale";

export function formatearFechaNotificacion(fechaIso: string, idioma: string = "es"): string {
  const fecha = new Date(fechaIso);
  const ahora = new Date();
  const diffDias = (ahora.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24);
  const locale = idioma === "en" ? enUS : es;

  // Si pasaron más de 7 días, fecha fija
  if (diffDias > 7) {
    return format(fecha, idioma === "en" ? "MM/dd/yyyy HH:mm" : "dd/MM/yyyy HH:mm", { locale });
  }

  // Si es reciente: "hace 5 minutos", "hace alrededor de 2 horas", etc.
  return formatDistanceToNow(fecha, { addSuffix: true, locale });
}
