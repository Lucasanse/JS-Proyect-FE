import { urlCarrito } from "./api";
import type { ProductoResumen } from "./productos";

// Tipos que devuelve /api/carrito (ver catalogo.types.ts en el BE).

export interface ItemCarrito {
  producto: ProductoResumen;
  cantidad: number;
  subtotal: number;
}

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

export const vaciarCarrito = () => pedir("", "DELETE");
