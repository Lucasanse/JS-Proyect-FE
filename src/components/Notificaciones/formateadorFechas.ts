import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";

export function formatearFechaNotificacion(fechaIso: string): string {
  const fecha = new Date(fechaIso);
  const ahora = new Date();
  const diffDias = (ahora.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24);

  // Si pasaron más de 7 días, fecha fija argentina
  if (diffDias > 7) {
    return format(fecha, "dd/MM/yyyy HH:mm", { locale: es });
  }

  // Si es reciente: "hace 5 minutos", "hace alrededor de 2 horas", etc.
  return formatDistanceToNow(fecha, { addSuffix: true, locale: es });
}
