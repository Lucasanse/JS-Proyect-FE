import { url } from "./api";
import type { Paginado, ProductoResumen } from "../types/producto";

export const PRODUCTOS_POR_PAGINA = 15;

export async function obtenerPaginaProductos(page: number, signal?: AbortSignal): Promise<Paginado<ProductoResumen>> {
  const res = await fetch(`${url}?page=${page}&limit=${PRODUCTOS_POR_PAGINA}`, { signal });
  if (!res.ok) throw new Error(`Error ${res.status} al cargar los productos`);
  return res.json();
}
