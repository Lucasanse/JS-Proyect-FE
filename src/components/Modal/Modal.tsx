import { useEffect, useRef, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  titulo: string;
  onCerrar: () => void;
  children: ReactNode;
  // Mientras se guarda algo no se puede cerrar (Escape, clic afuera ni la X)
  bloqueado?: boolean;
  ancho?: "sm" | "lg";
  // En formularios conviene false, así un clic de más no borra lo que se cargó
  cerrarAlClicFuera?: boolean;
}

// Modal basado en <dialog>: el navegador se encarga del foco, del Escape y del fondo.
// Se abre al montarse, así que se usa con render condicional: {abierto && <Modal ... />}
// Para enfocar un campo al abrir, ponerle data-autofocus (autoFocus de React no sirve
// porque showModal() mueve el foco después).
export default function Modal({
  titulo,
  onCerrar,
  children,
  bloqueado = false,
  ancho = "sm",
  cerrarAlClicFuera = true,
}: Props) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    dialog?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    // Evita que la página de fondo se scrollee con el modal abierto
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      dialog?.close();
    };
  }, []);

  const intentarCerrar = () => {
    if (!bloqueado) onCerrar();
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby="modal-titulo"
      onCancel={(e) => {
        e.preventDefault(); // el cierre lo maneja React
        intentarCerrar();
      }}
      // Clic en el fondo oscuro (fuera del contenido)
      onClick={(e) => cerrarAlClicFuera && e.target === ref.current && intentarCerrar()}
      className={`m-auto max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] overflow-visible rounded-2xl bg-transparent p-0 backdrop:bg-black/50 ${ancho === "lg" ? "max-w-2xl" : "max-w-md"}`}
    >
      <div className="flex max-h-[calc(100svh-2rem)] flex-col overflow-hidden rounded-2xl bg-surface text-ink shadow-xl">
        <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h2 id="modal-titulo" className="m-0 text-lg font-bold text-ink">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={intentarCerrar}
            disabled={bloqueado}
            aria-label={t("admin.cerrar")}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-surface-alt hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            ✕
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
