import { useTranslation } from "react-i18next";

// Badge del estado de una compra, igual en Mis compras y en el admin.
// Los estados se guardan como texto en la venta (ver los <option> del admin de ventas).
const ESTADOS: Record<string, { clave: string; clases: string }> = {
  pagado: { clave: "pagado", clases: "bg-primary-light text-primary ring-primary/25" },
  "en preparacion": { clave: "enPreparacion", clases: "bg-amber-100 text-amber-800 ring-amber-300" },
  "listo para entregar": { clave: "listoParaEntregar", clases: "bg-green-100 text-green-800 ring-green-300" },
  retirado: { clave: "retirado", clases: "bg-zinc-100 text-zinc-700 ring-zinc-300" },
  // Cancelado: gris más oscuro y en negrita, para diferenciarlo de "Retirado"
  cancelado: { clave: "cancelado", clases: "bg-zinc-200 text-zinc-900 ring-zinc-400 font-extrabold" },
};

export default function EstadoCompra({ estado, className = "" }: { estado: string; className?: string }) {
  const { t } = useTranslation();
  const config = ESTADOS[estado.trim().toLowerCase()];

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset whitespace-nowrap ${
        config?.clases ?? "bg-surface-alt text-muted ring-line"
      } ${className}`}
    >
      {config ? t(`historial.estados.${config.clave}`) : estado}
    </span>
  );
}
