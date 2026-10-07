import type { ReactNode } from "react";

interface Props {
  titulo: string;
  detalle?: ReactNode; // texto chico al lado del título, ej. "(opcional)" o el tipo elegido
  abierto: boolean;
  onCambiar: (abierto: boolean) => void;
  children: ReactNode;
}

// Sección plegable de un formulario (traducción, componente de PC...).
// Es controlada para poder abrirla desde afuera, por ejemplo cuando tiene un error.
export default function Desplegable({ titulo, detalle, abierto, onCambiar, children }: Props) {
  return (
    <details
      open={abierto}
      onToggle={(e) => onCambiar(e.currentTarget.open)}
      className="group rounded-lg border border-line"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-sm font-semibold text-ink select-none">
        <span>
          {titulo} {detalle && <span className="font-normal text-muted">{detalle}</span>}
        </span>
        <span aria-hidden className="text-muted transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="space-y-4 border-t border-line px-3 py-3">{children}</div>
    </details>
  );
}
