import type { ReactNode } from "react";

// Íconos del panel de administración. Miden 1em: el tamaño lo da el font-size del contenedor.

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

export function IconoCaja() {
  return (
    <Icono>
      <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" />
      <path d="M3 8l9 5 9-5M12 13v8" />
    </Icono>
  );
}

export function IconoRecibo() {
  return (
    <Icono>
      <path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2z" />
      <path d="M9 7h6M9 11h6M9 15h4" />
    </Icono>
  );
}

export function IconoHerramienta() {
  return (
    <Icono>
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4 2.5-2.5z" />
    </Icono>
  );
}

export function IconoUsuarios() {
  return (
    <Icono>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <path d="M16 4.5a3.5 3.5 0 0 1 0 7M18.5 14.5c1.8.8 3 2.7 3 5.5" />
    </Icono>
  );
}

export function IconoInicio() {
  return (
    <Icono>
      <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9z" />
    </Icono>
  );
}
