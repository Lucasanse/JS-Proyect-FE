import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { ProductoResumen } from "../../services/productos";
import type { FiltrosProductos } from "../../services/productos";
import { obtenerPaginaProductos } from "../../services/productos";

interface SelectorProductoProps {
  idCategoria?: string;
  onSeleccionar: (idProducto: number) => void;
  valorSeleccionado: number | string;
  deshabilitado?: boolean;
  idsSeleccionados?: (number | null)[];
}

export const SelectorProducto = ({
  idCategoria,
  onSeleccionar,
  valorSeleccionado,
  deshabilitado = false,
  idsSeleccionados = [],
}: SelectorProductoProps) => {
  const { t } = useTranslation();

  const [opciones, setOpciones] = useState<ProductoResumen[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const controller = new AbortController();
    setCargando(true);
    setError(false);

    const filtros: FiltrosProductos = idCategoria
      ? { categoria: idCategoria }
      : {};

    obtenerPaginaProductos(1, controller.signal, filtros)
      .then((res) => {
        const items = res.data || [];
        setOpciones(items);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Error al cargar productos para el selector:", err);
          setError(true);
        }
      })
      .finally(() => setCargando(false));

    return () => controller.abort();
  }, [idCategoria]);

  return (
    // 1. min-w-0 al contenedor principal
    <div className="w-full min-w-0 relative">
      <select
        value={valorSeleccionado}
        disabled={deshabilitado || cargando || error}
        onChange={(e) => {
          const val = Number(e.target.value);
          if (val) onSeleccionar(val);
        }}
        // 2. min-w-0 y truncate al select
        className="w-full min-w-0 text-xs p-2.5 pr-8 truncate rounded-lg border border-line bg-surface text-ink appearance-none cursor-pointer focus:outline-none focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <option value="" disabled>
          {cargando
            ? t("selectorProducto.buscando", "Buscando productos...")
            : error
              ? t("selectorProducto.errorSelect", "Error al cargar")
              : opciones.length === 0
                ? t("selectorProducto.sinProductos", "Sin productos")
                : t("selectorProducto.seleccionar", "+ Seleccionar producto")}
        </option>

        {opciones.map((op) => {
          const estaEnOtroSlot =
            idsSeleccionados.includes(op.id) &&
            op.id !== Number(valorSeleccionado);

          return (
            <option key={op.id} value={op.id} disabled={estaEnOtroSlot}>
              {/* 3. Sintaxis del nombre limpia y en una sola línea */}
              {op.marca ? `${op.marca} - ` : ""} {op.nombre}
              {estaEnOtroSlot
                ? t("selectorProducto.yaSeleccionado", " (Ya seleccionado)")
                : ""}
            </option>
          );
        })}
      </select>

      {/* 4. bg-surface y rounded-r-lg a la flechita para que el texto truncate no se le ponga por encima */}
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
  );
};
