import { useTranslation } from "react-i18next";
import type { EventoHistorial } from "../../services/servicioTecnico";
import { COLORES_ESTADO } from "./coloresEstado";
import { formatoFecha } from "./formatoFecha";

type CambioEstado = Extract<EventoHistorial, { tipo: "estado" }>;

// Línea de tiempo de los cambios de estado de una solicitud, con fecha y hora.
// El más reciente arriba (es el estado actual). Sin tarjeta: cada pantalla lo envuelve a su manera.
// mostrarAutor: el admin ve quién hizo cada cambio; el cliente no.
export default function HistorialEstados({
  historial,
  mostrarAutor = false,
}: {
  historial: EventoHistorial[];
  mostrarAutor?: boolean;
}) {
  const { t } = useTranslation();
  const cambios = historial.filter((e): e is CambioEstado => e.tipo === "estado").reverse();

  if (cambios.length === 0) return <p className="text-sm text-muted">{t("servicioTecnico.historialEstados.vacio")}</p>;

  const nombreEstado = (estado: CambioEstado["estadoNuevo"]) =>
    t(`servicioTecnico.estados.${estado}`, { defaultValue: estado });

  return (
    <ol className="relative space-y-4 border-l border-line pl-5">
      {cambios.map((c, i) => (
        <li key={c.id} className="relative">
          <span
            aria-hidden
            className={`absolute top-1.5 -left-[1.6rem] h-2.5 w-2.5 rounded-full ring-4 ring-surface ${
              COLORES_ESTADO[c.estadoNuevo]?.punto ?? "bg-zinc-400"
            }`}
          />
          <p className="text-sm text-ink">
            {c.estadoAnterior === null ? (
              <>
                {t("servicioTecnico.historialEstados.creada")}{" "}
                <strong className={COLORES_ESTADO[c.estadoNuevo]?.texto}>{nombreEstado(c.estadoNuevo)}</strong>
              </>
            ) : (
              <>
                <span className="text-muted">{nombreEstado(c.estadoAnterior)}</span>
                <span aria-hidden className="mx-1.5 text-muted">
                  →
                </span>
                <span className="sr-only">{t("servicioTecnico.historialEstados.a")}</span>
                <strong className={COLORES_ESTADO[c.estadoNuevo]?.texto}>{nombreEstado(c.estadoNuevo)}</strong>
              </>
            )}
            {i === 0 && (
              <span className="ml-2 rounded-full bg-surface-alt px-2 py-0.5 text-[11px] font-semibold text-muted">
                {t("servicioTecnico.historialEstados.actual")}
              </span>
            )}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            <time dateTime={c.fecha}>{formatoFecha(c.fecha)}</time>
            {mostrarAutor && (
              <>
                {" · "}
                {c.autor.esAdmin
                  ? t("servicioTecnico.historialEstados.por", { nombre: c.autor.nombre })
                  : t("servicioTecnico.historialEstados.porCliente", { nombre: c.autor.nombre })}
              </>
            )}
          </p>
        </li>
      ))}
    </ol>
  );
}
