import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

export interface OpcionMenu {
  clave: string;
  etiqueta: ReactNode;
  activa?: boolean; // la opción elegida actualmente (se marca con un tilde)
  onClick?: () => void;
  to?: string; // si tiene destino, es un link
}

interface Props {
  trigger: ReactNode; // texto que se ve cuando está cerrado
  ariaLabel: string;
  opciones: OpcionMenu[];
  align?: "left" | "right";
}

const claseOpcion = (activa?: boolean) =>
  `flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-surface-alt ${activa ? "font-semibold text-primary" : "text-ink"}`;

// Texto que al tocarlo abre una lista de opciones (se cierra al elegir, al hacer clic afuera o con Escape)
export default function MenuDesplegable({ trigger, ariaLabel, opciones, align = "right" }: Props) {
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const afuera = (e: MouseEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAbierto(false);
    };
    const escape = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("mousedown", afuera);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", afuera);
      document.removeEventListener("keydown", escape);
    };
  }, [abierto]);

  return (
    <div ref={raiz} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={abierto}
        onClick={() => setAbierto((v) => !v)}
        className="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-alt hover:text-primary"
      >
        {trigger}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${abierto ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {abierto && (
        <ul
          role="menu"
          className={`absolute top-full z-50 mt-2 min-w-36 overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-lg ${align === "right" ? "right-0" : "left-0"}`}
        >
          {opciones.map((o) => (
            <li key={o.clave} role="none">
              {o.to ? (
                <Link role="menuitem" to={o.to} onClick={() => setAbierto(false)} className={claseOpcion(o.activa)}>
                  {o.etiqueta}
                </Link>
              ) : (
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={!!o.activa}
                  onClick={() => {
                    o.onClick?.();
                    setAbierto(false);
                  }}
                  className={claseOpcion(o.activa)}
                >
                  {o.etiqueta}
                  {o.activa && <span aria-hidden>✓</span>}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
