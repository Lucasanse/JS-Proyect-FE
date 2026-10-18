import { useTranslation } from "react-i18next";
import type { EstadoSolicitud } from "../../services/servicioTecnico";
import { COLORES_ESTADO } from "./coloresEstado";

export default function EstadoBadge({ estado, grande = false }: { estado: EstadoSolicitud; grande?: boolean }) {
  const { t } = useTranslation();
  const colores = COLORES_ESTADO[estado] ?? COLORES_ESTADO.CERRADA;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap ring-1 ring-inset ${colores.badge} ${
        grande ? "px-3 py-1 text-sm" : "px-2.5 py-0.5 text-xs"
      }`}
    >
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${colores.punto}`} />
      {t(`servicioTecnico.estados.${estado}`, { defaultValue: estado })}
    </span>
  );
}
