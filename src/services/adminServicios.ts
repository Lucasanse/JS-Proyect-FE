import { urlAdminServicios } from "./api";
import { pedir } from "./adminProductos";

// Tipos que devuelve /api/admin/servicios (ver adminServicios.controller.ts en el BE).
// Servicios del local: los de Armá tu PC (armado, instalación de Windows...), que van al carrito,
// y los de servicio técnico (tipos, extras y programas), que se abonan en el local.
// No se crean desde acá: solo se cambia el precio y si se ofrecen.

export type GrupoServicio = "ARMADOR" | "TIPO" | "EXTRA" | "SOFTWARE";

export interface ServicioAdmin {
  id: number;
  codigo: string;
  grupo: GrupoServicio;
  nombre: string;
  descripcion: string;
  precio: number | null; // en pesos, tal como se cargó; null = a presupuestar (Reparación, Otro): no se puede cambiar
  ivaIncluido: boolean; // si el precio cargado ya incluye el IVA
  alicuotaIva: number; // 21, 10.5 o 0 (exento)
  precioFinal: number | null; // con IVA: lo que paga el cliente 
  activo: boolean; // inactivo = no se ofrece e
}

export const listarServiciosAdmin = (signal?: AbortSignal) => pedir<ServicioAdmin[]>("", { signal }, urlAdminServicios);

// Agrega un programa para instalar en servicio técnico (lo único que se puede crear)
export const crearPrograma = (nombre: string, precio: number) =>
  pedir<ServicioAdmin>("/programas", { method: "POST", body: JSON.stringify({ nombre, precio }) }, urlAdminServicios);

export type CambiosServicio = { precio?: number; activo?: boolean; ivaIncluido?: boolean; alicuotaIva?: number };

export const actualizarServicio = (id: number, cambios: CambiosServicio) =>
  pedir<ServicioAdmin>(`/${id}`, { method: "PATCH", body: JSON.stringify(cambios) }, urlAdminServicios);
