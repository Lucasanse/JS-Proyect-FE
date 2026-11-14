import { urlCarrito } from "./api";
import type { ProductoResumen } from "./productos";
import type { ServicioArmado } from "./armador";

// Tipos que devuelve /api/carrito (ver catalogo.types.ts en el BE).

// Un producto o un servicio del armador (armado de PC, instalación de Windows...).
// Los servicios van una sola vez y no tienen stock.
export type ItemCarrito =
  | { tipo: "PRODUCTO"; producto: ProductoResumen; servicio: null; cantidad: number; subtotal: number }
  | { tipo: "SERVICIO"; producto: null; servicio: ServicioArmado; cantidad: number; subtotal: number };

export interface CarritoDetalle {
  items: ItemCarrito[];
  cantidadTotal: number;
  total: number;
}

// credentials: "include" manda la cookie de sesión de Better Auth al BE.
async function pedir(path: string, method = "GET", body?: unknown): Promise<CarritoDetalle> {
  const res = await fetch(`${urlCarrito}${path}`, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Error ${res.status} en el carrito`);
  return data;
}

export const obtenerCarrito = () => pedir("");

export const agregarAlCarrito = (idProducto: number, cantidad: number) =>
  pedir("/items", "POST", { idProducto, cantidad });

export const modificarCantidad = (idProducto: number, cantidad: number) =>
  pedir(`/items/${idProducto}`, "PATCH", { cantidad });

export const quitarDelCarrito = (idProducto: number) => pedir(`/items/${idProducto}`, "DELETE");

export const quitarServicioDelCarrito = (idServicio: number) => pedir(`/servicios/${idServicio}`, "DELETE");

export const vaciarCarrito = () => pedir("", "DELETE");
