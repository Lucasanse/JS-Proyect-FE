import { useTranslation } from "react-i18next";
import { useCotizacion } from "../../services/cotizacion";
import { aUsd, formatearArs, formatearUsd, useMoneda } from "../../services/moneda";

interface Props {
  precio: number; // siempre en pesos
  // Cotización guardada en una compra emitida: se usa en lugar de la actual
  cotizacion?: { valor: number; fecha: string } | null;
  // Si el producto se cargó en dólares, ese valor exacto (evita el redondeo de convertir de ida y vuelta)
  precioUsd?: number | null;
  className?: string;
}

// Precio en la moneda elegida (USD o ARS). Sin cotización disponible se ve en pesos.
export default function Precio({ precio, cotizacion, precioUsd, className = "" }: Props) {
  const { t, i18n } = useTranslation();
  const moneda = useMoneda();
  const actual = useCotizacion();

  if (moneda === "USD" && precioUsd != null) return <span className={className}>{formatearUsd(precioUsd)}</span>;

  const valor = cotizacion?.valor ?? actual?.valor;
  if (moneda !== "USD" || !valor) return <span className={className}>{formatearArs(precio)}</span>;

  const fecha = cotizacion
    ? new Date(cotizacion.fecha).toLocaleDateString(i18n.resolvedLanguage || "es", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "";
  return (
    <span className={className}>
      {formatearUsd(aUsd(precio, valor))}
      {cotizacion && <span className="ml-1 block text-[11px] font-normal text-muted">{t("precio.cotizacionDelDia", { fecha })}</span>}
    </span>
  );
}
