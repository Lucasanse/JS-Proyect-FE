import i18n from "../locales";
import { urlFavoritos } from "./api";

export interface FavoritoProducto {
  id: number;
  nombre: string;
  marca: string;
  precio: number;
  stock: number;
  imagenUrl: string | null;
  disponible: boolean;
  categoria: {
    id: number;
    nombre: string;
    nombreEN?: string | null;
  };
}

export interface FavoritoItem {
  idFavorito: number;
  idProducto: number;
  fechaAgregado: string;
  producto: FavoritoProducto;
}

export interface FavoritoAccionResponse {
  mensaje: string;
  idProducto: number;
  esFavorito: boolean;
}

export async function obtenerFavoritosUsuario(
  idUsuario: string | number,
  signal?: AbortSignal,
): Promise<FavoritoItem[]> {
  const lang = i18n.resolvedLanguage || "es";
  const res = await fetch(`${urlFavoritos}/${idUsuario}?lang=${lang}`, {
    signal,
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Error ${res.status} al cargar los favoritos`);
  }
  return res.json();
}

export async function agregarFavorito(
  idUsuario: string | number,
  idProducto: number,
): Promise<FavoritoAccionResponse> {
  const res = await fetch(`${urlFavoritos}/${idUsuario}/${idProducto}`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Error ${res.status} al agregar a favoritos`);
  }
  return res.json();
}

export async function eliminarFavorito(
  idUsuario: string | number,
  idProducto: number,
): Promise<FavoritoAccionResponse> {
  const res = await fetch(`${urlFavoritos}/${idUsuario}/${idProducto}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Error ${res.status} al eliminar de favoritos`);
  }
  return res.json();
}
