import type { TFunction } from "i18next";
import type { PrecioSolicitud, SolicitudResumen } from "../../services/servicioTecnico";

// Nombre de un programa: traducido si es uno de los de siempre (WIN10, OFFICE...); si lo agregó
// el admin, el nombre con el que se pidió (queda guardado en los precios de la solicitud).
export function nombrePrograma(t: TFunction, programa: string, precios?: PrecioSolicitud[], nombre?: string) {
  const guardado = nombre ?? precios?.find((p) => p.codigo === `SOFTWARE_${programa}`)?.nombre;
  return t(`servicioTecnico.software.${programa}`, { defaultValue: guardado ?? programa });
}

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
export function resumenSolicitud(s: Pick<SolicitudResumen, "software" | "descripcion" | "precios">, t: TFunction) {
  if (s.software.length > 0) return s.software.map((p) => nombrePrograma(t, p, s.precios)).join(", ");
  return s.descripcion ?? "";
}
