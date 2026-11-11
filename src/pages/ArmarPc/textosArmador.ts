import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { Incompatibilidad, PasoArmador, ProductoArmador } from "../../services/armador";

// Textos del armador traducidos: nombres de los pasos, motivos de incompatibilidad
// (por código, con el texto del BE como respaldo) y especificaciones de los productos.
export function useTextosArmador() {
  const { t } = useTranslation();
  return useMemo(() => ({
    tipo: (tipo: PasoArmador) => t(`armarPc.tipos.${tipo}`),
    categoria: (nombre: string) => t(`armarPc.categorias.${nombre}`, { defaultValue: nombre }),
    motivo: (i: Incompatibilidad) => t(`armarPc.incompatibilidad.${i.codigo}`, { ...i.datos, defaultValue: i.motivo }),
    especificacion: (e: ProductoArmador["especificaciones"][number]) => {
      const nombre = t(`armarPc.especificaciones.${e.nombre}`, { defaultValue: e.nombre });
      const valor = e.valor === "Si" || e.valor === "No" ? t(`armarPc.valores.${e.valor}`) : e.valor;
      return `${nombre}: ${valor}${e.unidad ? ` ${e.unidad}` : ""}`;
    },
  }), [t]);
}

// Valor de una especificación del producto (ej. "Potencia" de la fuente)
export const especificacionDe = (producto: ProductoArmador | undefined, nombre: string) =>
  producto?.especificaciones.find((e) => e.nombre === nombre)?.valor;

// Para qué marca de procesador es un motherboard, según su socket (AM4/AM5 o LGA...)
export function plataformaDe(producto: ProductoArmador): "AMD" | "Intel" | null {
  if (producto.paso !== "Motherboard") return null;
  const socket = especificacionDe(producto, "Socket")?.toUpperCase() ?? "";
  if (socket.startsWith("AM")) return "AMD";
  if (socket.startsWith("LGA")) return "Intel";
  return null;
}
