import i18n from "../locales";
import { urlCompras } from "./api";

// La interfaz para los productos que vienen dentro de la compra
export interface ProductoComprado {
  idProducto: number;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
}

// La interfaz principal de la compra que ahora incluye el array de productos
export interface Compra {
  id: string;
  total: number;
  status: string;
  fecha: string;
  items: number;
  metodoPago: string;
  idPagoMp: string | null;
  productos: ProductoComprado[]; // <--- Acá anidamos la otra interfaz
}

export async function obtenerPedidos(
  id: number,
  signal?: AbortSignal,
): Promise<Compra[]> {
  const res = await fetch(`${urlCompras}/${id}`, {
    credentials: "include",
    signal,
  });
  if (!res.ok) throw new Error(`Error ${res.status} al cargar el producto`);
  return res.json();
}
