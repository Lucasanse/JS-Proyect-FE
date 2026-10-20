import type { TFunction } from "i18next";
import type { SolicitudResumen } from "../../services/servicioTecnico";

// Nombre corto de una solicitud para listados y encabezados, con todos los servicios pedidos:
// "Reparación de componentes (Notebook)", "Limpieza, Formateo e Instalación de software"...
export function tituloSolicitud(s: Pick<SolicitudResumen, "servicios" | "tipoEquipo">, t: TFunction) {
  const nombres = s.servicios.map((servicio) => {
    const nombre = t(`servicioTecnico.tipos.${servicio}`, { defaultValue: servicio });
    return servicio === "REPARACION" && s.tipoEquipo
      ? `${nombre} (${t(`servicioTecnico.equipos.${s.tipoEquipo}`)})`
      : nombre;
  });
  if (nombres.length <= 1) return nombres.join("");
  const ultimo = nombres[nombres.length - 1];
  // En español "y" pasa a "e" antes de una palabra que suena "i": "Formateo e Instalación"
  const y = t("servicioTecnico.y");
  const conjuncion = y === "y" && /^h?i(?![aeou])/i.test(ultimo) ? "e" : y;
  return `${nombres.slice(0, -1).join(", ")} ${conjuncion} ${ultimo}`;
}

// Una línea con lo que pidió: los programas a instalar o el comienzo de la descripción
export function resumenSolicitud(s: Pick<SolicitudResumen, "software" | "descripcion">, t: TFunction) {
  if (s.software.length > 0) return s.software.map((p) => t(`servicioTecnico.software.${p}`)).join(", ");
  return s.descripcion ?? "";
}
