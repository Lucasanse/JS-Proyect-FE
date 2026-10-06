import { useEffect } from "react";
import { Link } from "react-router-dom";
import type { ProductoResumen } from "../../services/productos";

interface Props {
  producto: ProductoResumen;
  cantidad: number;
  onCerrar: () => void;
}

const DURACION_MS = 3000;

// Aviso que sube desde abajo de la pantalla al agregar un producto al carrito.
// Se cierra solo después de DURACION_MS.
export default function AvisoCarrito({ producto, cantidad, onCerrar }: Props) {
  useEffect(() => {
    const timer = setTimeout(onCerrar, DURACION_MS);
    return () => clearTimeout(timer);
  }, [onCerrar]);

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4 pointer-events-none"
    >
      <div className="pointer-events-auto flex w-full max-w-md animate-aviso-entrada items-center gap-3 overflow-hidden rounded-xl border border-line bg-surface p-3 shadow-lg">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line">
          {producto.imagenUrl ? (
            <img src={producto.imagenUrl} alt="" className="h-full w-full object-contain p-0.5" />
          ) : (
            <CheckIcon />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-sm font-semibold text-primary">
            <CheckIcon /> Agregado al carrito
          </p>
          <p className="truncate text-sm text-ink">
            {cantidad > 1 && `${cantidad} × `}
            {producto.nombre}
          </p>
        </div>

        <Link
          to="/carrito"
          onClick={onCerrar}
          className="shrink-0 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark"
        >
          Ver carrito
        </Link>

        {/* Barra que se va vaciando mientras el aviso está visible */}
        <span
          className="absolute bottom-0 left-0 h-1 w-full origin-left animate-aviso-tiempo bg-primary"
          style={{ animationDuration: `${DURACION_MS}ms` }}
        />
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}
