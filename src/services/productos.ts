import { url, urlCategorias, urlMarcas } from "./api";

// Tipos que devuelve GET /api/productos (ver catalogo.types.ts en el BE).

export interface ProductoResumen {
  id: number;
  nombre: string;
  descripcion: string;
  marca: string;
  precio: number;
  stock: number;
  imagenUrl: string | null;
  disponible: boolean;
  categoria: { id: number; nombre: string };
  esComponentePC: boolean;
  tipoComponente: string | null;
}

export interface Paginado<T> {
  data: T[];
  paginacion: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const PRODUCTOS_POR_PAGINA = 15;

// Filtros del catálogo. Usan los mismos nombres que los query params del BE y de la URL del FE:
// /productos?q=ryzen&categoria=2&marca=AMD&precioMin=1000&precioMax=500000
export interface FiltrosProductos {
  q?: string;
  categoria?: string; // id de la categoría
  marca?: string;
  precioMin?: string;
  precioMax?: string;
  conStock?: "true"; // solo productos con stock
}

export interface Categoria {
  id: number;
  nombre: string;
}

export async function obtenerPaginaProductos(
  page: number,
  signal?: AbortSignal,
  filtros: FiltrosProductos = {},
): Promise<Paginado<ProductoResumen>> {
  const params = new URLSearchParams({ ...filtros, page: String(page), limit: String(PRODUCTOS_POR_PAGINA) });
  const res = await fetch(`${url}?${params}`, { signal });
  if (!res.ok) throw new Error(`Error ${res.status} al cargar los productos`);
  return res.json();
}

export async function obtenerCategorias(signal?: AbortSignal): Promise<Categoria[]> {
  const res = await fetch(urlCategorias, { signal });
  if (!res.ok) throw new Error(`Error ${res.status} al cargar las categorías`);
  return res.json();
}

// Con categoría, solo trae las marcas que tienen productos en esa categoría
export async function obtenerMarcas(categoria?: string, signal?: AbortSignal): Promise<string[]> {
  const query = categoria ? `?${new URLSearchParams({ categoria })}` : "";
  const res = await fetch(`${urlMarcas}${query}`, { signal });
  if (!res.ok) throw new Error(`Error ${res.status} al cargar las marcas`);
  return res.json();
}
