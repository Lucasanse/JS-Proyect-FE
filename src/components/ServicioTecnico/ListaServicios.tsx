import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { SolicitudResumen } from "../../services/servicioTecnico";

type Props = {
  solicitud: Pick<
    SolicitudResumen,
    "servicios" | "tipoEquipo" | "software" | "conBackup" | "conPastaTermica" | "conSSD"
  >;
};

// Lo que pidió el cliente, como lista numerada sin íconos ni etiquetas. Debajo de cada servicio
// van sus detalles (equipo, pasta térmica, backup, SSD, programas). Lo usan el detalle del cliente y el del admin.
export default function ListaServicios({ solicitud: s }: Props) {
  const { t } = useTranslation();
  return (
    <ol className="list-decimal space-y-1 pl-5">
      {s.servicios.map((servicio) => (
        <li key={servicio}>
          {t(`servicioTecnico.lista.servicios.${servicio}`)}
          <Detalles>
            {servicio === "REPARACION" && s.tipoEquipo && (
              <li>
                {t("servicioTecnico.lista.equipo")} {t(`servicioTecnico.equipos.${s.tipoEquipo}`)}
              </li>
            )}
            {servicio === "LIMPIEZA" && s.conPastaTermica && <li>{t("servicioTecnico.lista.pastaTermica")}</li>}
            {servicio === "FORMATEO" && s.conBackup && <li>{t("servicioTecnico.lista.backup")}</li>}
            {servicio === "OPTIMIZACION" && s.conSSD && <li>{t("servicioTecnico.lista.ssd")}</li>}
            {servicio === "INSTALACION_SOFTWARE" &&
              s.software.map((p) => <li key={p}>{t(`servicioTecnico.software.${p}`)}</li>)}
          </Detalles>
        </li>
      ))}
    </ol>
  );
}

// Sublista de un servicio. Si no tiene nada no se muestra.
function Detalles({ children }: { children: ReactNode }) {
  const items = (Array.isArray(children) ? children.flat() : [children]).filter(Boolean);
  if (items.length === 0) return null;
  return <ul className="list-[circle] pl-5 text-muted">{children}</ul>;
}
