import { urlAdminUsuarios } from "./api";
import { pedir } from "./adminProductos";
import type { Paginado } from "./productos";
import type { EstadoSolicitud, TipoEquipo, TipoServicio } from "./servicioTecnico";

// Tipos que devuelve /api/admin/usuarios (ver usuarios.types.ts en el BE).

export type RolUsuario = "ADMIN" | "CLIENTE";

export interface UsuarioAdmin {
  id: number;
  nombre: string;
  correo: string;
  rol: RolUsuario;
  habilitado: boolean;
  creadoEn: string; // fecha de alta
}

// GET /api/admin/usuarios/:id: todos los datos, con sus últimas compras y solicitudes
export interface UsuarioAdminDetalle extends UsuarioAdmin {
  correoVerificado: boolean;
  telefono: string | null;
  direccion: string | null;
  cargo: string | null; // solo admins
  idioma: string; // "es" | "en"
  actualizadoEn: string;
  cantidadCompras: number;
  cantidadSolicitudes: number;
  sesionesActivas: number;
  ultimasCompras: { id: number; fecha: string; total: number; estado: string; cantidadProductos: number }[];
  ultimasSolicitudes: {
    id: number;
    fecha: string;
    estado: EstadoSolicitud;
    servicios: TipoServicio[];
    tipoEquipo: TipoEquipo | null;
  }[];
}

export type FiltroHabilitado = "todos" | "habilitados" | "deshabilitados";

export interface FiltrosUsuarios {
  q?: string;
  estado?: FiltroHabilitado;
  page?: number;
}

export const USUARIOS_POR_PAGINA_ADMIN = 15;

// Código que manda el BE (login y endpoints) cuando la cuenta está deshabilitada
export const CODIGO_USUARIO_DESHABILITADO = "USUARIO_DESHABILITADO";

export function listarUsuariosAdmin(filtros: FiltrosUsuarios, signal?: AbortSignal) {
  const params = new URLSearchParams({
    page: String(filtros.page ?? 1),
    limit: String(USUARIOS_POR_PAGINA_ADMIN),
  });
  if (filtros.q) params.set("q", filtros.q);
  if (filtros.estado && filtros.estado !== "todos") {
    params.set("habilitado", String(filtros.estado === "habilitados"));
  }
  return pedir<Paginado<UsuarioAdmin>>(`?${params}`, { signal }, urlAdminUsuarios);
}

export const obtenerUsuarioAdmin = (id: number, signal?: AbortSignal) =>
  pedir<UsuarioAdminDetalle>(`/${id}`, { signal }, urlAdminUsuarios);

// Al deshabilitar, el BE le cierra las sesiones al usuario. Si es la cuenta propia u otro admin responde 409.
export const cambiarHabilitadoUsuario = (id: number, habilitado: boolean) =>
  pedir<UsuarioAdminDetalle>(
    `/${id}/habilitado`,
    { method: "PATCH", body: JSON.stringify({ habilitado }) },
    urlAdminUsuarios,
  );
