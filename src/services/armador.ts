// Es la misma instancia que inicializa src/i18n.js
import i18n from "i18next";
import { urlArmador } from "./api";
import type { CarritoDetalle } from "./carrito";
import type { ProductoResumen } from "./productos";

// Tipos que devuelve /api/armador (ver armador.types.ts y armador.compatibilidad.ts en el BE).

// Pasos del asistente, en orden. Son los tipos de componente del BE.
export const TIPOS_ARMADOR = ["Motherboard", "CPU", "RAM", "Gabinete", "GPU", "Almacenamiento", "Fuente"] as const;
export type TipoArmador = (typeof TIPOS_ARMADOR)[number];

// Paso opcional del final: monitor, mouse, teclado... Se puede elegir más de uno y
// no tienen reglas de compatibilidad ni consumo.
export const PASO_PERIFERICOS = "Perifericos";
export type PasoArmador = TipoArmador | typeof PASO_PERIFERICOS;
export const PASOS_ARMADOR: readonly PasoArmador[] = [...TIPOS_ARMADOR, PASO_PERIFERICOS];

// En estos pasos se puede elegir más de una unidad (ej. 2 módulos de memoria)
export const TIPOS_CON_CANTIDAD: readonly PasoArmador[] = ["RAM", "Almacenamiento", PASO_PERIFERICOS];
export const CANTIDAD_MAXIMA = 4;

// En estos pasos se pueden elegir varios productos distintos (ej. un NVMe y un disco rígido),
// mientras entren en las conexiones del motherboard
export const TIPOS_MULTIPLES: readonly PasoArmador[] = ["Almacenamiento"];
export const permiteVarios = (paso: PasoArmador) => TIPOS_MULTIPLES.includes(paso);

export interface ProductoArmador extends ProductoResumen {
  paso: PasoArmador; // tipo de componente, o "Perifericos"
  watts: number;
  especificaciones: { nombre: string; valor: string; unidad: string | null }[];
}

export interface Incompatibilidad {
  codigo: string; // SOCKET_CPU_MOTHER, LARGO_GPU_GABINETE... (se traduce con armarPc.incompatibilidad.*)
  motivo: string; // en español, se usa si no hay traducción
  productos: number[];
  datos: Record<string, string | number>;
}

export interface Faltante {
  tipo: TipoArmador;
  codigo: "OBLIGATORIO" | "SIN_GRAFICOS_INTEGRADOS";
}

export interface PotenciaCalculada {
  consumo: number;
  margenPorcentaje: number;
  recomendada: number;
}

export interface CompatiblesRespuesta {
  tipo: PasoArmador;
  productos: ProductoArmador[];
  incompatibles: { producto: ProductoArmador; motivos: Incompatibilidad[] }[];
}

export interface ValidacionArmado {
  valida: boolean;
  completa: boolean;
  incompatibilidades: Incompatibilidad[];
  faltantes: Faltante[];
  potencia: PotenciaCalculada;
  total: number;
}

export interface FuenteSugeridaRespuesta {
  potencia: PotenciaCalculada;
  fuentes: ProductoArmador[]; // de la más barata a la más cara
}

export interface ComponenteElegido {
  producto: ProductoArmador;
  cantidad: number;
}

// Lo que se compra con el armado: un componente, un periférico o un servicio (armado, instalación de Windows...)
export interface ItemArmado {
  producto: ProductoResumen;
  cantidad: number;
}

export interface PresetArmado {
  id: number;
  nombre: string;
  potenciaWatts: number;
  componentes: ComponenteElegido[];
}

// Error del BE. En un 409 (armado incompatible o incompleto) trae el detalle.
export class ArmadorError extends Error {
  status: number;
  incompatibilidades: Incompatibilidad[];

  constructor(status: number, message: string, incompatibilidades: Incompatibilidad[] = []) {
    super(message);
    this.status = status;
    this.incompatibilidades = incompatibilidades;
  }
}

// Lo que se manda al BE: solo ids y cantidades
const aSeleccion = (componentes: ItemArmado[]) =>
  componentes.map((c) => ({ idProducto: c.producto.id, cantidad: c.cantidad }));

// credentials: "include" manda la cookie de sesión de Better Auth al BE.
async function pedir<T>(path: string, init: RequestInit = {}): Promise<T> {
  const params = new URLSearchParams({ lang: i18n.resolvedLanguage || "es" });
  const res = await fetch(`${urlArmador}${path}?${params}`, {
    ...init,
    credentials: "include",
    headers: init.body ? { "Content-Type": "application/json" } : undefined,
  });
  if (res.status === 204) return undefined as T;
  // Si se cancela mientras llega el cuerpo, el error se propaga: no hay que devolver {} como si fueran datos
  const data = await res.json().catch((e) => {
    if (init.signal?.aborted) throw e;
    return {};
  });
  if (!res.ok) throw new ArmadorError(res.status, data.error || `Error ${res.status}`, data.incompatibilidades);
  return data;
}

const post = <T>(path: string, body: unknown, signal?: AbortSignal) =>
  pedir<T>(path, { method: "POST", body: JSON.stringify(body), signal });

export const obtenerCompatibles = (tipo: PasoArmador, componentes: ComponenteElegido[], signal?: AbortSignal) =>
  post<CompatiblesRespuesta>("/compatibles", { tipo, seleccion: aSeleccion(componentes) }, signal);

export const validarArmado = (componentes: ComponenteElegido[], signal?: AbortSignal) =>
  post<ValidacionArmado>("/validar", { seleccion: aSeleccion(componentes) }, signal);

export const obtenerFuenteSugerida = (componentes: ComponenteElegido[], signal?: AbortSignal) =>
  post<FuenteSugeridaRespuesta>("/fuente-sugerida", { seleccion: aSeleccion(componentes) }, signal);

export const obtenerServicios = (signal?: AbortSignal) => pedir<ProductoResumen[]>("/servicios", { signal });

export const agregarArmadoAlCarrito = (componentes: ItemArmado[]) =>
  post<CarritoDetalle>("/carrito", { seleccion: aSeleccion(componentes) });

export const listarPresets = (signal?: AbortSignal) => pedir<PresetArmado[]>("/presets", { signal });

export const guardarPreset = (nombre: string, componentes: ComponenteElegido[]) =>
  post<PresetArmado>("/presets", { nombre, seleccion: aSeleccion(componentes) });

export const eliminarPreset = (id: number) => pedir<void>(`/presets/${id}`, { method: "DELETE" });
