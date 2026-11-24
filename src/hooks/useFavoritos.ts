import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  obtenerFavoritosUsuario,
  agregarFavorito,
  eliminarFavorito,
  type FavoritoItem,
} from "../services/favoritos";

export function useFavoritos(idUsuario?: string | number | null) {
  const { i18n } = useTranslation();
  const [favoritos, setFavoritos] = useState<FavoritoItem[]>([]);
  const [cargando, setCargando] = useState(false);

  const cargarFavoritos = async () => {
    if (!idUsuario) {
      setFavoritos([]);
      return;
    }

    setCargando(true);
    try {
      const data = await obtenerFavoritosUsuario(idUsuario);
      setFavoritos(data);
    } catch (error) {
      console.error("Error al cargar favoritos:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarFavoritos();
  }, [idUsuario, i18n.resolvedLanguage]);

  const esFavorito = (idProducto: number): boolean => {
    return favoritos.some((fav) => fav.idProducto === idProducto);
  };

  const toggleFavorito = async (idProducto: number) => {
    if (!idUsuario) return;

    try {
      if (esFavorito(idProducto)) {
        await eliminarFavorito(idUsuario, idProducto);
      } else {
        await agregarFavorito(idUsuario, idProducto);
      }
      await cargarFavoritos();
    } catch (error) {
      console.error("Error al actualizar favorito:", error);
    }
  };

  const idsFavoritos = new Set(favoritos.map((fav) => fav.idProducto));

  return {
    favoritos,
    idsFavoritos,
    cargando,
    esFavorito,
    toggleFavorito,
  };
}
