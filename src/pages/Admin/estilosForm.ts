// Clases de los inputs de los formularios del admin (borde rojo si hay error)
export const claseInput = (error?: string) =>
  `w-full rounded-lg border bg-surface px-3 py-2 text-ink outline-none transition focus:ring-2 focus:ring-primary-light disabled:cursor-not-allowed disabled:bg-surface-alt disabled:text-muted ${
    error ? "border-red-500" : "border-line focus:border-primary"
  }`;

// Oculta las flechitas de los input type="number" (para poner la unidad a la derecha)
export const sinFlechas =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";
