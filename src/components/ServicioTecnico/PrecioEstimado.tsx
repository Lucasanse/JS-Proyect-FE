import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import Precio from "../Precio/Precio";
import { CODIGOS_EXTRA, TIPO_SOFTWARE, type PrecioSolicitud } from "../../services/servicioTecnico";
import { nombrePrograma } from "./textosSolicitud";

// Nombre de lo que se pidió a partir de su código: LIMPIEZA, EXTRA_BACKUP, SOFTWARE_WIN10...
function nombreDeCodigo(t: TFunction, codigo: string, nombre?: string) {
  const extra = (Object.keys(CODIGOS_EXTRA) as (keyof typeof CODIGOS_EXTRA)[]).find((k) => CODIGOS_EXTRA[k] === codigo);
  if (extra) return t(`servicioTecnico.form.${extra}`);
  if (codigo.startsWith("SOFTWARE_")) return nombrePrograma(t, codigo.slice("SOFTWARE_".length), undefined, nombre);
  return t(`servicioTecnico.tipos.${codigo}`);
}

interface Props {
  precios: PrecioSolicitud[];
  total: number;
  className?: string;
}

// Detalle del precio estimado de una solicitud: lo que se abona en el local al traer el equipo.
// Lo que no tiene precio fijo (Reparación, Otro) figura "a presupuestar".
export default function PrecioEstimado({ precios: todos, total, className = "" }: Props) {
  const { t } = useTranslation();
  // Las solicitudes viejas guardaban un "cargo base" de instalación de software: ya no se muestra
  const precios = todos.filter((p) => p.codigo !== TIPO_SOFTWARE);
  if (precios.length === 0) return null;
  const aPresupuestar = precios.some((p) => p.precio === null);

  return (
    <section className={`rounded-xl border border-line bg-surface-alt p-4 ${className}`} aria-labelledby="precio-estimado">
      <h3 id="precio-estimado" className="text-sm font-bold uppercase tracking-wide text-muted">
        {t("servicioTecnico.precio.titulo")}
      </h3>
      <ul className="mt-2 space-y-1 text-sm">
        {precios.map((p) => (
          <li key={p.codigo} className="flex justify-between gap-3">
            <span className="text-ink">{nombreDeCodigo(t, p.codigo, p.nombre)}</span>
            {p.precio === null ? (
              <span className="shrink-0 italic text-muted">{t("servicioTecnico.precio.aPresupuestar")}</span>
            ) : p.precio === 0 ? (
              <span className="shrink-0 text-muted">{t("servicioTecnico.precio.sinCargo")}</span>
            ) : (
              <Precio precio={p.precio} className="shrink-0 font-medium text-ink" />
            )}
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-line pt-2">
        <span className="font-bold text-ink">
          {aPresupuestar ? t("servicioTecnico.precio.totalDesde") : t("servicioTecnico.precio.total")}
        </span>
        <Precio precio={total} className="text-lg font-bold text-primary" />
      </div>
      <p className="mt-2 text-xs text-muted">
        {aPresupuestar ? t("servicioTecnico.precio.notaPresupuesto") : t("servicioTecnico.precio.nota")}
      </p>
    </section>
  );
}
