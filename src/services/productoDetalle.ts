import i18n from "../i18n";
import { urlProductoDetalle } from "./api";

export async function obtenerProductoPorId(
  id: number,
  signal?: AbortSignal,
): Promise<ProductoDetalle> {
  const lang = i18n.resolvedLanguage || "es";

  const res = await fetch(`${urlProductoDetalle}/${id}?lang=${lang}`, {
    signal,
  });
  if (!res.ok) throw new Error(`Error ${res.status} al cargar el producto`);
  return res.json();
}
export interface AtributoComponente {
  nombre: string;
  valor: string;
  unidad: string | null;
}
export interface CategoriaResumen {
  id: number;
  nombre: string;
}
interface ProductoComun {
  id: number;
  nombre: string;
  descripcion: string;
  marca: string;
  precio: number;
  stock: number;
  imagenUrl: string | null;
  disponible: boolean;
  categoria: CategoriaResumen;
}
export type ProductoDetalle = ProductoComun &
  (
    | {
        esComponentePC: true;
        tipoComponente: string;
        wattsRequeridos: number;
        atributos: AtributoComponente[];
      }
    | {
        esComponentePC: false;
        tipoComponente: null;
        wattsRequeridos: null;
        atributos: [];
      }
  );
