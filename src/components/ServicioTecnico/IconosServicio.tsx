import type { ReactNode } from "react";
import type { TipoEquipo, TipoServicio } from "../../services/servicioTecnico";

// Íconos de los tipos de servicio y de equipo. Miden 1em: el tamaño lo da el font-size.

function Icono({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      {children}
    </svg>
  );
}

const ICONOS_SERVICIO: Record<TipoServicio, ReactNode> = {
  // Llave
  REPARACION: (
    <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4 2.6-2.6z" />
  ),
  // Destellos
  LIMPIEZA: (
    <>
      <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
    </>
  ),
  // Flechas en círculo
  FORMATEO: (
    <>
      <path d="M21 12a9 9 0 1 1-2.6-6.4" />
      <path d="M21 3v6h-6" />
    </>
  ),
  // Rayo
  OPTIMIZACION: <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />,
  // Descarga
  INSTALACION_SOFTWARE: (
    <>
      <path d="M12 3v12M7 10l5 5 5-5" />
      <path d="M4 17v3h16v-3" />
    </>
  ),
  // Signo de pregunta
  OTRO: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.01" />
    </>
  ),
};

const ICONOS_EQUIPO: Record<TipoEquipo, ReactNode> = {
  PC_FIJA: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M9 20h6M12 16v4" />
    </>
  ),
  NOTEBOOK: (
    <>
      <rect x="5" y="5" width="14" height="10" rx="1" />
      <path d="M2 19h20l-2-4H4z" />
    </>
  ),
  IMPRESORA: (
    <>
      <path d="M7 9V3h10v6" />
      <rect x="3" y="9" width="18" height="8" rx="1.5" />
      <path d="M7 14h10v7H7z" />
    </>
  ),
};

export const IconoServicio = ({ tipo }: { tipo: TipoServicio }) => <Icono>{ICONOS_SERVICIO[tipo]}</Icono>;

export const IconoEquipo = ({ tipo }: { tipo: TipoEquipo }) => <Icono>{ICONOS_EQUIPO[tipo]}</Icono>;
