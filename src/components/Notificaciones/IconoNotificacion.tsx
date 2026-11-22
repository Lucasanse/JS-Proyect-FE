import type { Notificacion } from "../../services/notificaciones";

// Ícono según a qué apunta la notificación (compra, servicio técnico, documento, armado o novedad),
// con un punto rojo si no está leída.
type Clase = "compra" | "servicio" | "documento" | "armado" | "novedad";

function claseDe(notif: Notificacion): Clase {
  switch (notif.referencia?.tipo) {
    case "VENTA":
      return "compra";
    case "SOLICITUD":
      return "servicio";
    case "DOCUMENTO":
      return "documento";
    case "PRESET":
      return "armado";
    default:
      return "novedad";
  }
}

// Trazos de 24x24 (estilo lucide, como el resto de los íconos del sitio)
const TRAZOS: Record<Clase, string[]> = {
  compra: ["M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z", "M3 6h18", "M16 10a4 4 0 0 1-8 0"],
  servicio: [
    "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z",
  ],
  documento: [
    "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",
    "M14 2v4a2 2 0 0 0 2 2h4",
    "M10 13H8",
    "M16 17H8",
    "M16 13h-2",
  ],
  armado: [
    "M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
    "M9 9h6v6H9z",
    "M9 1v3",
    "M15 1v3",
    "M9 20v3",
    "M15 20v3",
    "M20 9h3",
    "M20 14h3",
    "M1 9h3",
    "M1 14h3",
  ],
  novedad: ["m3 11 18-5v12L3 14v-3z", "M11.6 16.8a3 3 0 1 1-5.8-1.6"],
};

export default function IconoNotificacion({ notif, tamano = "md" }: { notif: Notificacion; tamano?: "md" | "lg" }) {
  const caja = tamano === "lg" ? "h-10 w-10" : "h-8 w-8";
  const icono = tamano === "lg" ? "h-5 w-5" : "h-4 w-4";

  return (
    <span
      className={`relative flex ${caja} shrink-0 items-center justify-center rounded-full ${
        notif.leida ? "bg-surface-alt text-muted" : "bg-primary-light text-primary"
      }`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={icono}
      >
        {TRAZOS[claseDe(notif)].map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
      {!notif.leida && (
        <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-primary" />
      )}
    </span>
  );
}
