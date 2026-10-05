import { createContext, useContext } from "react";
import type { CarritoDetalle } from "../../services/carrito";

export interface CarritoContextValue {
  carrito: CarritoDetalle | null; // null = sin sesión o todavía cargando
  cargando: boolean;
  agregar: (idProducto: number, cantidad: number) => Promise<void>;
  cambiarCantidad: (idProducto: number, cantidad: number) => Promise<void>;
  quitar: (idProducto: number) => Promise<void>;
  vaciar: () => Promise<void>;
  // Cuántas unidades de un producto ya hay en el carrito
  cantidadEnCarrito: (idProducto: number) => number;
}

export const CarritoContext = createContext<CarritoContextValue | null>(null);

export function useCarrito() {
  const ctx = useContext(CarritoContext);
  if (!ctx) throw new Error("useCarrito debe usarse dentro de <CarritoProvider>");
  return ctx;
}
