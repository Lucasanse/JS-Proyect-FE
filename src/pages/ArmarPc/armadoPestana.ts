import { CATEGORIA_MONITORES, PASO_MONITOR, TIPOS_ARMADOR, esPasoExtra, type ComponenteElegido, type TipoArmador } from "../../services/armador";
import type { ProductoResumen } from "../../services/productos";

// El armado en curso queda guardado en la pestaña (sessionStorage): si hay que iniciar sesión
// para comprar, no se pierde. También lo usa /presets para cargar un armado guardado en el asistente.

// Lo elegido en cada paso: un producto, o varios en almacenamiento (ver TIPOS_MULTIPLES)
export type Seleccion = Partial<Record<TipoArmador, ComponenteElegido[]>>;

const CLAVE_SELECCION = "armarPc.seleccion";
const CLAVE_PERIFERICOS = "armarPc.perifericos";
const CLAVE_SERVICIOS = "armarPc.servicios";

function leer<T>(clave: string, vacio: T): T {
  try {
    const guardado = JSON.parse(sessionStorage.getItem(clave) || "null");
    return guardado ?? vacio;
  } catch {
    return vacio;
  }
}

function guardar(clave: string, valor: unknown) {
  try {
    sessionStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // Sin storage disponible el armado solo se pierde al recargar
  }
}

export function leerSeleccion(): Seleccion {
  const guardada = leer<Record<string, unknown>>(CLAVE_SELECCION, {});
  // Antes se guardaba un producto por paso, sin lista
  return Object.fromEntries(TIPOS_ARMADOR.flatMap((t) => (guardada[t] ? [[t, [guardada[t]].flat()]] : [])));
}

export function leerPerifericos(): ComponenteElegido[] {
  const guardados = leer<unknown>(CLAVE_PERIFERICOS, []);
  if (!Array.isArray(guardados)) return [];
  // Antes los monitores iban en el paso de periféricos
  return (guardados as ComponenteElegido[]).map((p) =>
    p.producto.categoria?.nombre === CATEGORIA_MONITORES ? { ...p, producto: { ...p.producto, paso: PASO_MONITOR } } : p,
  );
}

export function leerServicios(): ProductoResumen[] {
  const guardados = leer<unknown>(CLAVE_SERVICIOS, []);
  return Array.isArray(guardados) ? guardados : [];
}

export function guardarEnPestana(seleccion: Seleccion, perifericos: ComponenteElegido[], servicios: ProductoResumen[]) {
  guardar(CLAVE_SELECCION, seleccion);
  guardar(CLAVE_PERIFERICOS, perifericos);
  guardar(CLAVE_SERVICIOS, servicios);
}

// Un armado guardado (lista de productos) separado en componentes por paso y periféricos
export function separarArmado(componentes: ComponenteElegido[]) {
  const seleccion: Seleccion = {};
  const perifericos: ComponenteElegido[] = [];
  for (const c of componentes) {
    if (esPasoExtra(c.producto.paso)) perifericos.push(c);
    else (seleccion[c.producto.paso] ??= []).push(c);
  }
  return { seleccion, perifericos };
}
