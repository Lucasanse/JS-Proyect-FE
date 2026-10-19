import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { SolicitudDetalle } from "../../services/servicioTecnico";
import EstadoBadge from "./EstadoBadge";
import ListaServicios from "./ListaServicios";
import { formatoFecha } from "./formatoFecha";

// Qué pidió el cliente y en qué estado está (detalle del admin).
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

        {/* Igual que lo ve el cliente: lista numerada, sin íconos ni etiquetas */}
        <Dato etiqueta={t("servicioTecnico.detalle.servicios", { count: s.servicios.length })} ancho>
          <ListaServicios solicitud={s} />
        </Dato>

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
