// Carga por lote: cada foto es un producto distinto. La IA analiza las fotos de a una
// y el admin completa y guarda cada producto en el formulario (ver PanelLote).

import type { OrigenFoto } from "../../services/analisisIA";

// "pausado": la IA alcanzó su límite de uso; el análisis se reintenta solo tras unos segundos
export type EstadoItemLote = "esperando" | "analizando" | "pausado" | "listo" | "error" | "guardado" | "descartado";

// Foto con la que se arma el lote. "origen" está si llegó del celular y el BE todavía la tiene.
export interface FotoLote {
  archivo: File;
  origen?: OrigenFoto;
}

export interface ItemLote {
  id: number; // posición en el lote
  foto: File;
  origen?: OrigenFoto;
  vista: string; // object URL para la miniatura
  estado: EstadoItemLote;
  error: string; // mensaje si falló el análisis
}

// Guardado o descartado: ya no se puede volver a ese producto
export const estaCerrado = (item: ItemLote) => item.estado === "guardado" || item.estado === "descartado";
