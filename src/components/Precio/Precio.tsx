import { useTranslation } from "react-i18next";
import { useCotizacion } from "../../services/cotizacion";
import { aUsd, formatearArs, formatearUsd, useConImpuestos, useMoneda } from "../../services/moneda";

interface Props {
  precio: number; // siempre en pesos. Si se pasa alicuota o precioFinal, es el precio sin IVA
  // Precio de un producto: con esto se muestra con o sin IVA según lo elegido en el navbar.
  // Sin ninguno de los dos, el importe se muestra tal cual (totales, montos ya cobrados...)
  alicuota?: number; // 21 o 10.5
  precioFinal?: number; // con IVA (si no viene, se calcula con la alícuota)
  // Leyenda debajo: "+ IVA 21%" o "Impuestos incluidos"
  etiquetaIva?: boolean;
  // Cotización guardada en una compra emitida: se usa en lugar de la actual
  cotizacion?: { valor: number; fecha: string } | null;
  // Si el producto se cargó en dólares, ese valor exacto (evita el redondeo de convertir de ida y vuelta)
  precioUsd?: number | null;
  className?: string;
}

const formatoAlicuota = (a: number) => String(a).replace(".", ",");

// Precio en la moneda elegida (USD o ARS) y, si es de un producto, con o sin IVA.
// Sin cotización disponible se ve en pesos.
export default function Precio({ precio, alicuota, precioFinal, etiquetaIva, cotizacion, precioUsd, className = "" }: Props) {
  const { t, i18n } = useTranslation();
  const moneda = useMoneda();
  const conImpuestos = useConImpuestos();
  const actual = useCotizacion();

  const aplicaIva = alicuota !== undefined || precioFinal !== undefined;
  const tasa = alicuota ?? (precio > 0 && precioFinal ? Math.round((precioFinal / precio - 1) * 1000) / 10 : 21);
  const conIva = aplicaIva && conImpuestos;
  const pesos = conIva ? (precioFinal ?? Math.round(precio * (1 + tasa / 100) * 100) / 100) : precio;

  const leyenda =
    etiquetaIva && aplicaIva ? (
      <span className="block text-[11px] font-normal text-muted">
        {conIva ? t("precio.impuestosIncluidos") : t("precio.masIva", { alicuota: formatoAlicuota(tasa) })}
      </span>
    ) : null;

  // El valor exacto en dólares solo sirve para el precio cargado (sin cambiarle el IVA)
  if (moneda === "USD" && precioUsd != null && !conIva) {
    return (
      <span className={className}>
        {formatearUsd(precioUsd)}
        {leyenda}
      </span>
    );
  }

  const valor = cotizacion?.valor ?? actual?.valor;
  if (moneda !== "USD" || !valor) {
    return (
      <span className={className}>
        {formatearArs(pesos)}
        {leyenda}
      </span>
    );
  }

  const fecha = cotizacion
    ? new Date(cotizacion.fecha).toLocaleDateString(i18n.resolvedLanguage || "es", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "";
  return (
    <span className={className}>
      {formatearUsd(aUsd(pesos, valor))}
      {leyenda}
      {cotizacion && <span className="ml-1 block text-[11px] font-normal text-muted">{t("precio.cotizacionDelDia", { fecha })}</span>}
    </span>
  );
}
