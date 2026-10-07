import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ToastContext, type TipoToast } from "./toastContext";

interface Toast {
  id: number;
  mensaje: string;
  tipo: TipoToast;
}

const DURACION_MS = 4000;

const ESTILOS: Record<TipoToast, string> = {
  exito: "border-green-600 text-green-800",
  error: "border-red-600 text-red-800",
  info: "border-secondary-dark text-ink",
};

// Avisos cortos que aparecen abajo a la derecha y se cierran solos.
// Uso: const { mostrarToast } = useToast(); mostrarToast("Producto guardado", "exito");
export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const cerrar = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const value = useMemo(
    () => ({
      mostrarToast: (mensaje: string, tipo: TipoToast = "exito") =>
        // Máximo 3 a la vez: si hay más, se descarta el más viejo
        setToasts((prev) => [...prev.slice(-2), { id: Date.now() + Math.random(), mensaje, tipo }]),
    }),
    [],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onCerrar={cerrar} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onCerrar }: { toast: Toast; onCerrar: (id: number) => void }) {
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setTimeout(() => onCerrar(toast.id), DURACION_MS);
    return () => clearTimeout(timer);
  }, [toast.id, onCerrar]);

  return (
    <div
      role={toast.tipo === "error" ? "alert" : "status"}
      className={`pointer-events-auto flex w-full max-w-sm animate-aviso-entrada items-start gap-3 rounded-xl border-l-4 bg-surface px-4 py-3 text-sm font-medium shadow-lg ring-1 ring-line ${ESTILOS[toast.tipo]}`}
    >
      <span aria-hidden className="mt-px text-base leading-none">
        {toast.tipo === "exito" ? "✓" : toast.tipo === "error" ? "!" : "i"}
      </span>
      <p className="flex-1">{toast.mensaje}</p>
      <button
        type="button"
        onClick={() => onCerrar(toast.id)}
        aria-label={t("admin.cerrar")}
        className="-mr-1 cursor-pointer rounded px-1 text-muted hover:text-ink"
      >
        ✕
      </button>
    </div>
  );
}
