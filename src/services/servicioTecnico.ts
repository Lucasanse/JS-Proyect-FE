import { urlAdminServicioTecnico, urlServicioTecnico } from "./api";
import { pedir } from "./adminProductos";
import type { Paginado } from "./productos";

// Tipos que devuelven /api/servicio-tecnico y /api/admin/servicio-tecnico
// (ver servicioTecnico.types.ts en el BE).

// En el orden en que avanza el proceso. Las transiciones válidas las decide el BE.
// ESPERANDO_EQUIPO: el técnico ya vio la solicitud y espera que el cliente traiga el equipo
// RECHAZADA: el comercio no hace el trabajo; el admin le deja el motivo al cliente como respuesta
export const ESTADOS_SOLICITUD = [
  "PENDIENTE",
  "ESPERANDO_EQUIPO",
  "EN_REVISION",
  "EN_REPARACION",
  "RESUELTA",
  "RECHAZADA",
  "CERRADA",
] as const;
export type EstadoSolicitud = (typeof ESTADOS_SOLICITUD)[number];

// Qué puede pedir el cliente; puede elegir varios (ver servicioTecnico.catalogo.ts en el BE).
// El backup no es un servicio aparte: se pide como opción del formateo.
// LIMPIEZA es la limpieza externa; OPTIMIZACION es que la computadora ande más rápido (con SSD opcional).
export const TIPOS_SERVICIO = [
  "REPARACION",
  "LIMPIEZA",
  "FORMATEO",
  "OPTIMIZACION",
  "INSTALACION_SOFTWARE",
  "OTRO",
] as const;
export type TipoServicio = (typeof TIPOS_SERVICIO)[number];

export const TIPOS_EQUIPO = ["PC_FIJA", "NOTEBOOK", "IMPRESORA"] as const; // solo REPARACION
export type TipoEquipo = (typeof TIPOS_EQUIPO)[number];

// Programas para instalar (solo INSTALACION_SOFTWARE): los carga el admin en /admin/servicios,
// así que no son una lista fija. Se usa el código sin el prefijo SOFTWARE_ (WIN10, OFFICE...).
export type Software = string;

// Se instala un solo sistema operativo por equipo
export const SISTEMAS_OPERATIVOS: readonly Software[] = ["WIN10", "WIN11"];

// Precio de cada cosa que se puede pedir, por código: el tipo (LIMPIEZA), el extra (EXTRA_BACKUP)
// o el programa (SOFTWARE_WIN10). Lo deshabilitado por el admin no viene.
export interface PrecioServicioTecnico {
  codigo: string;
  nombre: string;
  grupo: "TIPO" | "EXTRA" | "SOFTWARE";
  precio: number | null; // null = a presupuestar (Reparación, Otro)
}

export interface PrecioSolicitud {
  codigo: string;
  nombre?: string; // como se llamaba al pedirlo (las solicitudes viejas no lo tienen)
  precio: number | null;
}

// Instalación de software no tiene precio propio: se cobra cada programa
export const TIPO_SOFTWARE = "INSTALACION_SOFTWARE";

export const CODIGOS_EXTRA = {
  conPastaTermica: "EXTRA_PASTA_TERMICA",
  conBackup: "EXTRA_BACKUP",
  conSSD: "EXTRA_SSD",
} as const;
export const codigoSoftware = (s: Software) => `SOFTWARE_${s}`;

// Si se elige alguno de estos hay que contar qué pasa / qué se necesita; si no, es opcional
export const DESCRIPCION_OBLIGATORIA: readonly TipoServicio[] = ["REPARACION", "OTRO"];

export interface SolicitudResumen {
  id: number;
  servicios: TipoServicio[]; // uno o varios
  tipoEquipo: TipoEquipo | null; // solo con REPARACION
  software: Software[]; // solo con INSTALACION_SOFTWARE
  conBackup: boolean; // solo con FORMATEO
  conPastaTermica: boolean; // solo con LIMPIEZA
  conSSD: boolean; // solo con OPTIMIZACION
  descripcion: string | null;
  // Precios al pedir el servicio (precio null = a presupuestar) y la suma de los fijos.
  // No se paga online: se abona en el local cuando se trae el equipo y se confirma el servicio.
  precios: PrecioSolicitud[];
  precioEstimado: number;
  aPresupuestar: boolean;
  estado: EstadoSolicitud;
  fecha: string;
  actualizadoEn: string;
  cantidadRespuestas: number;
  cliente: { id: number; nombre: string; correo: string; telefono: string | null };
}

export interface AutorEvento {
  nombre: string;
  esAdmin: boolean;
}

// Ordenado del más viejo al más nuevo
export type EventoHistorial =
  | {
      tipo: "estado";
      id: number;
      fecha: string;
      estadoAnterior: EstadoSolicitud | null; // null = el cliente creó la solicitud
      estadoNuevo: EstadoSolicitud;
      autor: AutorEvento;
    }
  | { tipo: "respuesta"; id: number; fecha: string; mensaje: string; autor: AutorEvento };

export interface SolicitudDetalle extends SolicitudResumen {
  historial: EventoHistorial[];
  aceptaRespuestas: boolean;
  transicionesPosibles?: EstadoSolicitud[]; // solo en el detalle del admin
}

export interface ListadoSolicitudesAdmin extends Paginado<SolicitudResumen> {
  conteoPorEstado: Record<EstadoSolicitud, number>;
}

export interface SolicitudInput {
  servicios: TipoServicio[];
  tipoEquipo?: TipoEquipo;
  software?: Software[];
  conBackup?: boolean;
  conPastaTermica?: boolean;
  conSSD?: boolean;
  descripcion?: string;
}

export const LIMITES = {
  descripcion: { min: 10, max: 2000 },
  mensaje: { max: 2000 },
  motivoRechazo: { min: 10 },
} as const;

export const SOLICITUDES_POR_PAGINA_ADMIN = 15;

// ── Cliente ──

export const obtenerPreciosServicioTecnico = (signal?: AbortSignal) =>
  pedir<PrecioServicioTecnico[]>("/precios", { signal }, urlServicioTecnico);

export const crearSolicitud = (datos: SolicitudInput) =>
  pedir<SolicitudDetalle>("", { method: "POST", body: JSON.stringify(datos) }, urlServicioTecnico);

export const listarMisSolicitudes = (signal?: AbortSignal) =>
  pedir<SolicitudResumen[]>("", { signal }, urlServicioTecnico);

export const obtenerMiSolicitud = (id: number, signal?: AbortSignal) =>
  pedir<SolicitudDetalle>(`/${id}`, { signal }, urlServicioTecnico);

// ── Admin ──

export interface FiltrosSolicitudes {
  estado?: EstadoSolicitud | "";
  q?: string;
  page?: number;
}

export function listarSolicitudesAdmin(filtros: FiltrosSolicitudes, signal?: AbortSignal) {
  const params = new URLSearchParams({
    page: String(filtros.page ?? 1),
    limit: String(SOLICITUDES_POR_PAGINA_ADMIN),
  });
  if (filtros.estado) params.set("estado", filtros.estado);
  if (filtros.q) params.set("q", filtros.q);
  return pedir<ListadoSolicitudesAdmin>(`?${params}`, { signal }, urlAdminServicioTecnico);
}

export const obtenerSolicitudAdmin = (id: number, signal?: AbortSignal) =>
  pedir<SolicitudDetalle>(`/${id}`, { signal }, urlAdminServicioTecnico);

export const responderSolicitud = (id: number, mensaje: string) =>
  pedir<SolicitudDetalle>(
    `/${id}/respuestas`,
    { method: "POST", body: JSON.stringify({ mensaje }) },
    urlAdminServicioTecnico,
  );

// Si la transición no está permitida (o alguien la cambió antes) el BE responde 409.
// Para RECHAZADA hay que mandar el mensaje con el motivo (le llega al cliente como respuesta).
export const cambiarEstadoSolicitud = (id: number, estado: EstadoSolicitud, mensaje?: string) =>
  pedir<SolicitudDetalle>(
    `/${id}/estado`,
    { method: "PATCH", body: JSON.stringify({ estado, mensaje }) },
    urlAdminServicioTecnico,
  );
