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
