import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { SolicitudDetalle } from "../../services/servicioTecnico";
import EstadoBadge from "./EstadoBadge";
import { IconoEquipo, IconoServicio } from "./IconosServicio";
import { formatoFecha } from "./formatoFecha";

// Qué pidió el cliente y en qué estado está. Lo usan el detalle del cliente y el del admin.
export default function DetalleServicio({
  solicitud: s,
  mostrarFecha = true,
}: {
  solicitud: SolicitudDetalle;
  mostrarFecha?: boolean;
}) {
  const { t } = useTranslation();
  const pide = (servicio: SolicitudDetalle["servicios"][number]) => s.servicios.includes(servicio);

  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
      <h2 className="m-0 mb-4 text-base font-bold text-ink">{t("servicioTecnico.detalle.titulo")}</h2>
      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        <Dato etiqueta={t("servicioTecnico.detalle.estado")}>
          <EstadoBadge estado={s.estado} />
        </Dato>
        {mostrarFecha && <Dato etiqueta={t("servicioTecnico.detalle.fecha")}>{formatoFecha(s.fecha)}</Dato>}

        <Dato etiqueta={t("servicioTecnico.detalle.servicios", { count: s.servicios.length })} ancho>
          <ul className="flex flex-wrap gap-2">
            {s.servicios.map((servicio) => (
              <li
                key={servicio}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-alt px-3 py-1 font-semibold"
              >
                <span className="text-base text-primary">
                  <IconoServicio tipo={servicio} />
                </span>
                {t(`servicioTecnico.tipos.${servicio}`)}
              </li>
            ))}
          </ul>
        </Dato>

        {s.tipoEquipo && (
          <Dato etiqueta={t("servicioTecnico.detalle.equipo")}>
            <span className="inline-flex items-center gap-2 font-semibold">
              <span className="text-lg text-primary">
                <IconoEquipo tipo={s.tipoEquipo} />
              </span>
              {t(`servicioTecnico.equipos.${s.tipoEquipo}`)}
            </span>
          </Dato>
        )}

        {pide("LIMPIEZA") && (
          <Dato etiqueta={t("servicioTecnico.detalle.pastaTermica")}>
            {s.conPastaTermica ? t("servicioTecnico.detalle.si") : t("servicioTecnico.detalle.no")}
          </Dato>
        )}

        {pide("FORMATEO") && (
          <Dato etiqueta={t("servicioTecnico.detalle.backup")}>
            {s.conBackup ? t("servicioTecnico.detalle.si") : t("servicioTecnico.detalle.no")}
          </Dato>
        )}

        {s.software.length > 0 && (
          <Dato etiqueta={t("servicioTecnico.detalle.software")} ancho>
            <ul className="flex flex-wrap gap-2">
              {s.software.map((p) => (
                <li
                  key={p}
                  className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-dark"
                >
                  {t(`servicioTecnico.software.${p}`)}
                </li>
              ))}
            </ul>
          </Dato>
        )}

        <Dato
          etiqueta={t(
            `servicioTecnico.form.etiquetaTexto.${pide("REPARACION") ? "REPARACION" : pide("OTRO") ? "OTRO" : "COMENTARIOS"}`,
          )}
          ancho
        >
          {s.descripcion ? (
            <p className="whitespace-pre-wrap break-words">{s.descripcion}</p>
          ) : (
            <p className="text-muted">{t("servicioTecnico.detalle.sinComentarios")}</p>
          )}
        </Dato>
      </dl>
    </div>
  );
}

function Dato({ etiqueta, ancho = false, children }: { etiqueta: string; ancho?: boolean; children: ReactNode }) {
  return (
    <div className={ancho ? "sm:col-span-2" : undefined}>
      <dt className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">{etiqueta}</dt>
      <dd className="m-0 text-ink">{children}</dd>
    </div>
  );
}
