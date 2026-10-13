import { useSyncExternalStore } from "react";

// "Versión" del catálogo: cada vez que cambia, las páginas que muestran productos
// (inicio, catálogo, detalle, carrito) vuelven a pedir los datos al BE.
// Cambia cuando:
//  - el admin modifica un producto (en esta pestaña o en otra, vía BroadcastChannel)
//  - el usuario vuelve a la pestaña después de un rato (por si otro admin cambió algo)

const ESPERA_MINIMA_MS = 10_000;

let version = 0;
let ultimoCambio = Date.now();
const oyentes = new Set<() => void>();
const canal = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("catalogo") : null;

function incrementar() {
  version++;
  ultimoCambio = Date.now();
  oyentes.forEach((oyente) => oyente());
}

canal?.addEventListener("message", incrementar);

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && Date.now() - ultimoCambio > ESPERA_MINIMA_MS) {
    incrementar();
  }
});

// Llamar después de crear, editar, eliminar o activar/desactivar un producto
export function notificarCambioCatalogo() {
  incrementar();
  canal?.postMessage("cambio");
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}

// Usar el valor como dependencia de un useEffect para recargar los datos
export function useVersionCatalogo() {
  return useSyncExternalStore(suscribir, () => version);
}
