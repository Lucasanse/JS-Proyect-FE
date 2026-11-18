import { useSyncExternalStore } from "react";

// Moneda en la que se ven los precios y si se ven con impuestos (IVA) o sin ellos.
// Es solo de visualización: el cobro es siempre en pesos y con IVA.
export type Moneda = "ARS" | "USD";

const CLAVE = "moneda";
const CLAVE_IMPUESTOS = "precioConImpuestos";

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

// Por defecto se ven con impuestos: es el precio final que paga un consumidor final.
// Solo queda sin impuestos si la persona lo eligió.
function leerImpuestos(): boolean {
  try {
    return localStorage.getItem(CLAVE_IMPUESTOS) !== "0";
  } catch {
    return true;
  }
}

let actual: Moneda = leer();
let conImpuestos = leerImpuestos();
const oyentes = new Set<() => void>();

function guardar(clave: string, valor: string) {
  try {
    localStorage.setItem(clave, valor);
  } catch {
    /* sin almacenamiento: se mantiene mientras la pestaña esté abierta */
  }
}

export function cambiarMoneda(m: Moneda, impuestos: boolean = conImpuestos) {
  actual = m;
  conImpuestos = impuestos;
  guardar(CLAVE, m);
  guardar(CLAVE_IMPUESTOS, impuestos ? "1" : "0");
  oyentes.forEach((o) => o());
}

export const cambiarImpuestos = (impuestos: boolean) => cambiarMoneda(actual, impuestos);

function suscribir(oyente: () => void) {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}

export function useMoneda(): Moneda {
  return useSyncExternalStore(suscribir, () => actual);
}

// true: los precios de los productos se ven con IVA ("Impuestos incluidos")
export function useConImpuestos(): boolean {
  return useSyncExternalStore(suscribir, () => conImpuestos);
}
