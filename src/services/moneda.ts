import { useSyncExternalStore } from "react";

// Moneda en la que se ven los precios. Es solo de visualización: el cobro es siempre en pesos.
export type Moneda = "ARS" | "USD";

const CLAVE = "moneda";

const formatoArs = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 });
const formatoUsd = new Intl.NumberFormat("es-AR", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

export const formatearArs = (n: number) => formatoArs.format(n);
export const formatearUsd = (n: number) => formatoUsd.format(n);
export const aUsd = (ars: number, cotizacion: number) => Math.round((ars / cotizacion) * 100) / 100;

function leer(): Moneda {
  try {
    return localStorage.getItem(CLAVE) === "USD" ? "USD" : "ARS";
  } catch {
    return "ARS";
  }
}

let actual: Moneda = leer();
const oyentes = new Set<() => void>();

export function cambiarMoneda(m: Moneda) {
  actual = m;
  try {
    localStorage.setItem(CLAVE, m);
  } catch {
    /* sin almacenamiento: se mantiene mientras la pestaña esté abierta */
  }
  oyentes.forEach((o) => o());
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}

export function useMoneda(): Moneda {
  return useSyncExternalStore(suscribir, () => actual);
}
