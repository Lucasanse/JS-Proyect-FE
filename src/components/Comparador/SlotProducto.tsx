import { useTranslation } from "react-i18next"; // <-- 1. Importamos el hook
import { SelectorProducto } from "./SelectorProducto";
import type { ProductoComparado } from "../../services/comparador.types";

interface SlotProductoProps {
  indice: number;
  idProducto: number | null;
  idCategoria?: string;
  producto?: ProductoComparado;
  puedeEliminarSlot?: boolean;
  onSeleccionar: (idProducto: number) => void;
  onLimpiar: () => void;
  onEliminarSlot?: () => void;
  idsSeleccionados: (number | null)[];
}

export const SlotProducto = ({
  indice,
  idProducto,
  idCategoria,
  producto,
  puedeEliminarSlot = false,
  onSeleccionar,
  onLimpiar,
  onEliminarSlot,
  idsSeleccionados,
}: SlotProductoProps) => {
  const { t } = useTranslation(); // <-- 2. Inicializamos la traducción

  console.log(producto);
  return (
    <div className="flex flex-col p-4 rounded-xl border border-line bg-surface min-h-80 transition-all shadow-sm">
      <div className="flex flex-col gap-3 mb-4 pb-4 border-b border-line/50">
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-bold uppercase text-muted">
            {t("slotProducto.slot", "Slot")} #{indice + 1}
          </span>
          <div className="flex gap-3">
            {idProducto && (
              <button
                onClick={onLimpiar}
                className="text-xs font-semibold text-muted hover:text-ink"
              >
                {t("slotProducto.vaciar", "Vaciar")}
              </button>
            )}
            {puedeEliminarSlot && onEliminarSlot && (
              <button
                onClick={onEliminarSlot}
                className="text-xs font-semibold text-muted hover:text-red-500"
              >
                {t("slotProducto.quitar", "✕ Quitar")}
              </button>
            )}
          </div>
        </div>

        <SelectorProducto
          idCategoria={idCategoria}
          valorSeleccionado={idProducto || ""}
          onSeleccionar={onSeleccionar}
          idsSeleccionados={idsSeleccionados}
        />
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {idProducto && !producto ? (
          <div className="flex flex-col items-center justify-center gap-3 animate-pulse">
            <div className="w-16 h-16 rounded bg-surface-alt" />
            <div className="w-3/4 h-3 rounded bg-surface-alt" />
          </div>
        ) : producto ? (
          // Producto cargado
          <div className="flex flex-col gap-3 text-center h-full justify-between">
            <div className="flex-1 flex items-center justify-center">
              {producto.imagenUrl && (
                <img
                  src={producto.imagenUrl}
                  alt={producto.nombre}
                  className="max-h-28 w-full object-contain p-2 rounded-lg bg-surface-alt/50"
                />
              )}
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-accent uppercase">
                {producto.marca}
              </span>
              <h3 className="text-xs font-bold text-ink line-clamp-2 leading-tight">
                {producto.nombre}
              </h3>
            </div>
            <span className="text-lg font-black text-ink mt-2">
              ${producto.precio.toLocaleString("es-AR")}
            </span>
          </div>
        ) : (
          // Slot Vacío
          <div className="flex flex-col items-center justify-center gap-2 h-full text-muted opacity-50">
            <span className="text-xs">
              {t("slotProducto.esperando", "Esperando selección")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
