import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next"; // <-- 1. Importamos el hook
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
  const { t } = useTranslation(); // <-- 2. Inicializamos la traducción

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false); // <-- 3. Cambiado a booleano

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
          setError(true); // Solo marcamos que hubo un error
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
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-xs font-semibold text-ink">
        {/* 4. Traducción del label */}
        {t("selectorCategoria.label", "Categoría a comparar")}
      </label>

      <div className="relative">
        <select
          value={valorSeleccionado}
          disabled={deshabilitado || cargando || error}
          onChange={(e) => onSeleccionar(e.target.value)}
          className="w-full text-xs p-2.5 rounded-lg border border-line bg-surface text-ink appearance-none cursor-pointer focus:outline-none focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-muted">
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
        <span className="text-[11px] text-red-500">
          {t("selectorCategoria.errorTexto", "Error al cargar categorías")}
        </span>
      )}
    </div>
  );
};
