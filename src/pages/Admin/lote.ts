// Carga por lote: cada foto es un producto distinto. La IA analiza las fotos de a una
// y el admin completa y guarda cada producto en el formulario (ver PanelLote).

export type EstadoItemLote = "esperando" | "analizando" | "listo" | "error" | "guardado" | "descartado";

export interface ItemLote {
  id: number; // posición en el lote
  foto: File;
  vista: string; // object URL para la miniatura
  estado: EstadoItemLote;
  error: string; // mensaje si falló el análisis
}

// Guardado o descartado: ya no se puede volver a ese producto
export const estaCerrado = (item: ItemLote) => item.estado === "guardado" || item.estado === "descartado";
