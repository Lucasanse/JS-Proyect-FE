import { createContext, useContext } from "react";
import type { CarritoDetalle } from "../../services/carrito";
import type { ItemArmado, ServicioArmado } from "../../services/armador";

export interface CarritoContextValue {
  carrito: CarritoDetalle | null; // null = sin sesión o todavía cargando
  cargando: boolean;
  agregar: (idProducto: number, cantidad: number) => Promise<void>;
  cambiarCantidad: (idProducto: number, cantidad: number) => Promise<void>;
  quitar: (idProducto: number) => Promise<void>;
  quitarServicio: (idServicio: number) => Promise<void>;
  vaciar: () => Promise<void>;
  // Agrega todos los componentes del armador de PC y los servicios elegidos
  // (el BE rechaza armados incompatibles o incompletos)
  agregarArmado: (componentes: ItemArmado[], servicios: ServicioArmado[]) => Promise<void>;
  // Cuántas unidades de un producto ya hay en el carrito
  cantidadEnCarrito: (idProducto: number) => number;
}

export const CarritoContext = createContext<CarritoContextValue | null>(null);

export function useCarrito() {
  const ctx = useContext(CarritoContext);
  if (!ctx) throw new Error("useCarrito debe usarse dentro de <CarritoProvider>");
  return ctx;
}
