import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { Categoria } from "../../services/productos";
import { obtenerCategorias } from "../../services/productos";

interface SelectorCategoriaProps {
  valorSeleccionado: string | number;
  onSeleccionar: (idCategoria: string) => void;
  deshabilitado?: boolean;
}

export const SelectorCategoria = ({
  valorSeleccionado,
  onSeleccionar,
  deshabilitado = false,
}: SelectorCategoriaProps) => {
  const { t } = useTranslation();

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let montado = true;

    const cargarCategorias = async () => {
      try {
        setCargando(true);
        setError(false);

        const data = await obtenerCategorias();
        const lista: Categoria[] = Array.isArray(data) ? data : [];

        if (montado) {
          setCategorias(lista);

          if (lista.length > 0 && !valorSeleccionado) {
            onSeleccionar(String(lista[0].id));
          }
        }
      } catch (err) {
        if (montado) {
          setError(true);
          console.error(err);
        }
      } finally {
        if (montado) {
          setCargando(false);
        }
      }
    };

    cargarCategorias();

    return () => {
      montado = false;
    };
  }, []);

  return (
    // 1. Agregamos min-w-0 acá para evitar que desborde el Grid en celulares
    <div className="flex flex-col gap-1.5 w-full min-w-0">
      {/* 2. Agregamos truncate al label por si el texto es muy largo en algún idioma */}
      <label className="text-xs font-semibold text-ink truncate">
        {t("selectorCategoria.label", "Categoría a comparar")}
      </label>

      <div className="relative w-full">
        <select
          value={valorSeleccionado}
          disabled={deshabilitado || cargando || error}
          onChange={(e) => onSeleccionar(e.target.value)}
          // 3. Agregamos pr-8 (espacio para la flecha) y truncate para evitar desbordes
          className="w-full min-w-0 text-xs p-2.5 pr-8 truncate rounded-lg border border-line bg-surface text-ink appearance-none cursor-pointer focus:outline-none focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {cargando && (
            <option value="" disabled>
              {t("selectorCategoria.cargando", "Cargando categorías...")}
            </option>
          )}
          {error && (
            <option value="" disabled>
              {t("selectorCategoria.errorSelect", "Error al cargar")}
            </option>
          )}

          {categorias.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.nombre}
            </option>
          ))}
        </select>

        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-muted bg-surface rounded-r-lg">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {error && (
        <span className="text-[11px] text-red-500 truncate">
          {t("selectorCategoria.errorTexto", "Error al cargar categorías")}
        </span>
      )}
    </div>
  );
};
