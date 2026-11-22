import i18n from "../locales";
import { urlNotificaciones } from "./api";

// Lo que devuelve el BE (GET /api/notifications)
export interface Notificacion {
  id: number;
  tipo: string; // VENTA_CONFIRMADA, SOLICITUD_ESTADO, PRESUPUESTO_DISPONIBLE, FACTURA_DISPONIBLE, NOVEDAD...
  titulo: string;
  mensaje: string;
  leida: boolean;
  fecha: string;
  // A dónde lleva al hacer click (compra, solicitud o documento). Null en novedades generales.
  referencia: {
    tipo: "VENTA" | "SOLICITUD" | "DOCUMENTO" | "PRESET";
    id: number;
    enlace: string;
  } | null;
  // Presupuesto o factura disponible: se puede descargar desde la notificación
  documento: {
    id: number;
    tipo: "PRESUPUESTO" | "FACTURA";
    numero: string;
    idVenta: number | null;
  } | null;
}

export interface PaginaNotificaciones {
  items: Notificacion[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  noLeidas: number;
}

const idioma = () => (i18n.resolvedLanguage === "en" ? "en" : "es");

async function pedir<T>(ruta: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${urlNotificaciones}${ruta}`, { credentials: "include", ...init });
  if (!res.ok) throw new Error(`Error ${res.status} en notificaciones`);
  return res.json();
}

export function obtenerNotificaciones(
  opciones: { page?: number; limit?: number; soloNoLeidas?: boolean } = {},
): Promise<PaginaNotificaciones> {
  const params = new URLSearchParams({
    page: String(opciones.page ?? 1),
    limit: String(opciones.limit ?? 10),
    soloNoLeidas: String(opciones.soloNoLeidas ?? false),
    lang: idioma(),
  });
  return pedir(`?${params}`);
}

export const obtenerCantidadNoLeidas = () => pedir<{ noLeidas: number }>("/unread-count");

export const marcarNotificacionLeida = (id: number) =>
  pedir<{ noLeidas: number }>(`/${id}/read`, { method: "PATCH" });

export const marcarTodasLeidas = () =>
  pedir<{ actualizadas: number; noLeidas: number }>("/read-all", { method: "PATCH" });

// Conexión en tiempo real (SSE). Eventos: "contador" { noLeidas } y "notificacion" Notificacion.
// EventSource reintenta solo si se corta la conexión.
export function conectarNotificaciones(handlers: {
  onContador: (noLeidas: number) => void;
  onNotificacion: (notificacion: Notificacion) => void;
}) {
  const fuente = new EventSource(`${urlNotificaciones}/stream?lang=${idioma()}`, { withCredentials: true });
  fuente.addEventListener("contador", (e) => {
    handlers.onContador(JSON.parse((e as MessageEvent).data).noLeidas);
  });
  fuente.addEventListener("notificacion", (e) => {
    handlers.onNotificacion(JSON.parse((e as MessageEvent).data));
  });
  return () => fuente.close();
}
