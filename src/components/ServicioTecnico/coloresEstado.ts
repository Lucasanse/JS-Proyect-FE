import type { EstadoSolicitud } from "../../services/servicioTecnico";

// Color de cada estado: badge (fondo + texto + borde), punto del badge y texto suelto
// (el estado escrito en el detalle del cliente, sin badge)
export const COLORES_ESTADO: Record<EstadoSolicitud, { badge: string; punto: string; texto: string }> = {
  PENDIENTE: { badge: "bg-amber-100 text-amber-800 ring-amber-200", punto: "bg-amber-500", texto: "text-amber-700" },
  ESPERANDO_EQUIPO: { badge: "bg-teal-100 text-teal-800 ring-teal-200", punto: "bg-teal-500", texto: "text-teal-700" },
  EN_REVISION: { badge: "bg-sky-100 text-sky-800 ring-sky-200", punto: "bg-sky-500", texto: "text-sky-700" },
  EN_REPARACION: {
    badge: "bg-violet-100 text-violet-800 ring-violet-200",
    punto: "bg-violet-500",
    texto: "text-violet-700",
  },
  RESUELTA: { badge: "bg-green-100 text-green-800 ring-green-200", punto: "bg-green-600", texto: "text-green-700" },
  RECHAZADA: { badge: "bg-red-100 text-red-800 ring-red-200", punto: "bg-red-500", texto: "text-red-700" },
  CERRADA: { badge: "bg-zinc-100 text-zinc-700 ring-zinc-200", punto: "bg-zinc-400", texto: "text-zinc-600" },
};
