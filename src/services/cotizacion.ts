import { useSyncExternalStore } from "react";
import { BASE_URL } from "./api";

// Cotización del dólar (solo informativa: el cobro es siempre en pesos). La expone GET /api/cotizacion.
export interface Cotizacion {
  valor: number;
  tipo: string;
  fechaActualizacion: string;
  desactualizada: boolean;
}

const URL_COTIZACION = `${BASE_URL}/api/cotizacion`;
const CLAVE_CACHE = "cotizacionUsd";
const REFRESCO_MS = 30 * 60 * 1000;
const MAX_ANTIGUEDAD_MS = 2 * 60 * 60 * 1000;

// Una copia guardada hace mucho (ej. la API estuvo caída) se marca como desactualizada
function marcarSiEsVieja(c: Cotizacion): Cotizacion {
  const vieja = Date.now() - new Date(c.fechaActualizacion).getTime() > MAX_ANTIGUEDAD_MS;
  return vieja ? { ...c, desactualizada: true } : c;
}

// Último valor guardado en el navegador: si la API falla se sigue mostrando con su fecha
function leerCache(): Cotizacion | null {
  try {
    const c = JSON.parse(localStorage.getItem(CLAVE_CACHE) ?? "null") as Cotizacion | null;
    return c && c.valor > 0 && c.fechaActualizacion ? marcarSiEsVieja(c) : null;
  } catch {
    return null;
  }
}

let actual: Cotizacion | null = leerCache();
let iniciado = false;
const oyentes = new Set<() => void>();

function publicar(c: Cotizacion | null) {
  actual = c && marcarSiEsVieja(c);
  oyentes.forEach((o) => o());
}

export async function actualizarCotizacion(signal?: AbortSignal) {
  try {
    const res = await fetch(URL_COTIZACION, { signal });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    const d = (await res.json()) as Partial<Cotizacion> & { valor: number | null };
    if (!d.valor || d.valor <= 0 || !d.fechaActualizacion) return; // sin cotización: se conserva la anterior
    const c: Cotizacion = {
      valor: d.valor,
      tipo: d.tipo ?? "",
      fechaActualizacion: d.fechaActualizacion,
      desactualizada: !!d.desactualizada,
    };
    try {
      localStorage.setItem(CLAVE_CACHE, JSON.stringify(c));
    } catch {
      /* sin almacenamiento: no pasa nada */
    }
    publicar(c);
  } catch {
    /* la pantalla sigue con el último valor conocido (o sin USD) */
  }
}

function iniciar() {
  if (iniciado) return;
  iniciado = true;
  void actualizarCotizacion();
  setInterval(() => {
    void actualizarCotizacion();
    if (actual) publicar(actual); // si la API falla, re-evalúa si el último valor ya quedó viejo
  }, REFRESCO_MS);
}

function suscribir(oyente: () => void) {
  iniciar();
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}

// Cotización compartida por todas las pantallas (una sola consulta, refresco cada 30 min).
// Devuelve null mientras no haya ninguna disponible.
export function useCotizacion(): Cotizacion | null {
  return useSyncExternalStore(suscribir, () => actual);
}
