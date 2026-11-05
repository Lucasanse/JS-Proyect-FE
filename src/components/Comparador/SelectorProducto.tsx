import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next"; // <-- 1. Importamos el hook
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
  const { t } = useTranslation(); // <-- 2. Inicializamos la traducción

  const [opciones, setOpciones] = useState<ProductoResumen[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<boolean>(false); // <-- 3. Cambiamos a booleano

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
          setError(true); // 4. Seteamos en true en lugar de hardcodear el texto
        }
      })
      .finally(() => setCargando(false));

    return () => controller.abort();
  }, [idCategoria]);

  return (
    <div className="w-full relative">
      <select
        value={valorSeleccionado}
        disabled={deshabilitado || cargando || error}
        onChange={(e) => {
          const val = Number(e.target.value);
          if (val) onSeleccionar(val);
        }}
        className="w-full text-xs p-2.5 pr-8 rounded-lg border border-line bg-surface text-ink appearance-none cursor-pointer focus:outline-none focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              {/* 5. Sintaxis de JSX corregida */}
              {op.marca ? `${op.marca} - ` : ""} {op.nombre}
              {estaEnOtroSlot
                ? t("selectorProducto.yaSeleccionado", " (Ya seleccionado)")
                : ""}
            </option>
          );
        })}
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
  );
};
