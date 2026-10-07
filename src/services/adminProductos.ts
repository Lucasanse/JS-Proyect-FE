import { urlAdmin, urlAdminProductos } from "./api";
import type { Paginado } from "./productos";

// Tipos que devuelve /api/admin/productos (ver ProductoAdmin en catalogo.types.ts del BE).

export interface ProductoAdmin {
  id: number;
  nombre: string;
  descripcion: string;
  marca: { id: number; nombre: string };
  precio: number;
  stock: number;
  imagenUrl: string | null;
  activo: boolean;
  categoria: { id: number; nombre: string };
  traduccionEn: { nombre: string; descripcion: string } | null;
  componente: ComponenteAdmin | null; // null = no es un componente de PC
}

export interface ComponenteAdmin {
  idTipoComponente: number;
  tipo: string;
  wattsRequeridos: number;
  atributos: { idAtributo: number; valor: string }[];
}

// GET /api/admin/marcas. categorias = ids de las categorías donde la marca tiene productos
export interface MarcaAdmin {
  id: number;
  nombre: string;
  categorias: number[];
}

// GET /api/admin/tipos-componente
export interface TipoComponente {
  id: number;
  nombre: string;
  categorias: number[]; // categorías donde ya hay componentes de este tipo
  atributos: AtributoTecnico[];
}

export interface AtributoTecnico {
  id: number;
  nombre: string;
  unidad: string | null;
  numerico: boolean;
  opciones: string[]; // valores sugeridos (se puede escribir otro)
}

// Lo que se manda al crear o editar un producto
export interface ProductoInput {
  nombre: string;
  descripcion: string;
  idMarca: number;
  idCategoria: number;
  precio: number;
  stock: number;
  imagenUrl: string | null;
  traduccionEn: { nombre: string; descripcion: string } | null;
  componente: Omit<ComponenteAdmin, "tipo"> | null;
}

export type FiltroEstado = "todos" | "activos" | "inactivos";

export interface FiltrosAdmin {
  q?: string;
  categoria?: string;
  estado?: FiltroEstado;
  page?: number;
}

export const PRODUCTOS_POR_PAGINA_ADMIN = 15;
export const MAX_MB_IMAGEN = 5;

// Error del BE con su código HTTP, para poder distinguir el 409 (producto con ventas)
// y los errores de validación por campo (400 con "detalles").
export class ApiError extends Error {
  status: number;
  detalles: { path: (string | number)[]; message: string }[];

  constructor(status: number, message: string, detalles: ApiError["detalles"] = []) {
    super(message);
    this.status = status;
    this.detalles = detalles;
  }
}

// credentials: "include" manda la cookie de sesión de Better Auth al BE.
async function pedir<T>(path: string, init: RequestInit = {}, base = urlAdminProductos): Promise<T> {
  const esJson = init.body !== undefined && !(init.body instanceof FormData);
  const res = await fetch(`${base}${path}`, {
    ...init,
    credentials: "include",
    headers: esJson ? { "Content-Type": "application/json" } : undefined,
  });
  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error || `Error ${res.status}`, data.detalles);
  return data;
}

export function listarProductosAdmin(filtros: FiltrosAdmin, signal?: AbortSignal) {
  const params = new URLSearchParams({
    page: String(filtros.page ?? 1),
    limit: String(PRODUCTOS_POR_PAGINA_ADMIN),
    estado: filtros.estado ?? "todos",
  });
  if (filtros.q) params.set("q", filtros.q);
  if (filtros.categoria) params.set("categoria", filtros.categoria);
  return pedir<Paginado<ProductoAdmin>>(`?${params}`, { signal });
}

export const crearProducto = (datos: ProductoInput) =>
  pedir<ProductoAdmin>("", { method: "POST", body: JSON.stringify(datos) });

export const actualizarProducto = (id: number, datos: ProductoInput) =>
  pedir<ProductoAdmin>(`/${id}`, { method: "PUT", body: JSON.stringify(datos) });

export const cambiarEstadoProducto = (id: number, activo: boolean) =>
  pedir<ProductoAdmin>(`/${id}/estado`, { method: "PATCH", body: JSON.stringify({ activo }) });

// Si el producto tiene ventas, el BE responde 409 (ApiError con status 409)
export const eliminarProducto = (id: number) => pedir<void>(`/${id}`, { method: "DELETE" });

// Sube el archivo al BE y devuelve la URL pública de la imagen
export async function subirImagen(archivo: File): Promise<string> {
  const form = new FormData();
  form.append("imagen", archivo);
  const { url } = await pedir<{ url: string }>("/imagen", { method: "POST", body: form });
  return url;
}

export const listarMarcas = (signal?: AbortSignal) => pedir<MarcaAdmin[]>("/marcas", { signal }, urlAdmin);

// Si ya existe una marca con ese nombre (sin importar mayúsculas), el BE devuelve esa
export const crearMarca = (nombre: string) =>
  pedir<MarcaAdmin>("/marcas", { method: "POST", body: JSON.stringify({ nombre }) }, urlAdmin);

export const listarTiposComponente = (signal?: AbortSignal) =>
  pedir<TipoComponente[]>("/tipos-componente", { signal }, urlAdmin);
