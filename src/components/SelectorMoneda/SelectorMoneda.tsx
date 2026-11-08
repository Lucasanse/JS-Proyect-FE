import { useState } from "react";
import { useTranslation } from "react-i18next";
import MenuDesplegable from "../MenuDesplegable/MenuDesplegable";
import { useCotizacion } from "../../services/cotizacion";
import { cambiarMoneda, formatearUsd, useMoneda, type Moneda } from "../../services/moneda";

const MONEDAS: Moneda[] = ["USD", "ARS"];

// Botón USD / ARS del navbar, con la cotización en tiempo real en la "i". Sin cotización no se muestra.
export default function SelectorMoneda() {
  const { t, i18n } = useTranslation();
  const moneda = useMoneda();
  const cotizacion = useCotizacion();
  const [info, setInfo] = useState(false);

  if (!cotizacion) return null;

  const fecha = new Date(cotizacion.fechaActualizacion).toLocaleString(i18n.resolvedLanguage || "es", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="relative flex items-center gap-1.5">
      <MenuDesplegable
        trigger={moneda}
        ariaLabel={t("precio.moneda")}
        opciones={MONEDAS.map((m) => ({ clave: m, etiqueta: m, activa: moneda === m, onClick: () => cambiarMoneda(m) }))}
      />
      <button
        type="button"
        aria-label={t("precio.infoCotizacion")}
        aria-expanded={info}
        onClick={() => setInfo((v) => !v)}
        onBlur={() => setInfo(false)}
        onMouseEnter={() => setInfo(true)}
        onMouseLeave={() => setInfo(false)}
        className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-muted text-[11px] font-bold italic text-muted hover:text-ink"
      >
        i
      </button>
      {info && (
        <div role="tooltip" className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-line bg-surface p-3 text-xs text-ink shadow-lg">
          <p className="font-semibold">{t("precio.cotizacionTiempoReal", { valor: formatearUsd(cotizacion.valor).replace("US$", "USD") })}</p>
          <p className="mt-1 text-muted">
            {cotizacion.desactualizada ? t("precio.desactualizada", { fecha }) : t("precio.actualizadaEl", { fecha })}
          </p>
          <p className="mt-1 text-muted">{t("precio.seCobraEnPesos")}</p>
        </div>
      )}
    </div>
  );
}

// Versión para el menú de celular: botones ARS / USD y la cotización a la vista (no hay hover en el celular)
export function SelectorMonedaMovil() {
  const { t, i18n } = useTranslation();
  const moneda = useMoneda();
  const cotizacion = useCotizacion();
  if (!cotizacion) return null;

  const fecha = new Date(cotizacion.fechaActualizacion).toLocaleString(i18n.resolvedLanguage || "es", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col gap-1.5">
      <BotonesSegmentados
        etiqueta={t("nav.moneda")}
        opciones={MONEDAS.map((m) => ({ valor: m, texto: m }))}
        activo={moneda}
        onElegir={(m) => cambiarMoneda(m as Moneda)}
      />
      <p className="px-3 text-xs text-muted">
        {t("precio.cotizacionTiempoReal", { valor: formatearUsd(cotizacion.valor).replace("US$", "USD") })} ·{" "}
        {cotizacion.desactualizada ? t("precio.desactualizada", { fecha }) : t("precio.actualizadaEl", { fecha })}
      </p>
    </div>
  );
}

// Fila "Etiqueta  [A][B]" con la opción elegida resaltada. Se usa para moneda e idioma en el menú de celular.
export function BotonesSegmentados({
  etiqueta,
  opciones,
  activo,
  onElegir,
}: {
  etiqueta: string;
  opciones: { valor: string; texto: string }[];
  activo: string;
  onElegir: (valor: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3">
      <span className="text-[15px] font-medium text-ink">{etiqueta}</span>
      <div role="radiogroup" aria-label={etiqueta} className="flex overflow-hidden rounded-lg border border-line">
        {opciones.map((o) => (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={activo === o.valor}
            onClick={() => onElegir(o.valor)}
            className={`cursor-pointer px-3 py-1.5 text-sm font-semibold transition-colors ${
              activo === o.valor ? "bg-primary text-white" : "bg-surface text-ink hover:bg-surface-alt"
            }`}
          >
            {o.texto}
          </button>
        ))}
      </div>
    </div>
  );
}
