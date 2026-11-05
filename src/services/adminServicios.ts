import { urlAdminServicios } from "./api";
import { pedir } from "./adminProductos";

// Tipos que devuelve /api/admin/servicios (ver adminServicios.controller.ts en el BE).
// Son los servicios que se ofrecen en Armá tu PC: armado, instalación de Windows, de Office...

export interface ServicioAdmin {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number; // en pesos
  activo: boolean; // inactivo = no se ofrece en el armador
}

export const listarServiciosAdmin = (signal?: AbortSignal) => pedir<ServicioAdmin[]>("", { signal }, urlAdminServicios);

export const actualizarServicio = (id: number, cambios: { precio?: number; activo?: boolean }) =>
  pedir<ServicioAdmin>(`/${id}`, { method: "PATCH", body: JSON.stringify(cambios) }, urlAdminServicios);
