import { urlAdmin } from "./api";
import { ApiError, pedir } from "./adminProductos";
import { reducirFoto } from "./reducirFoto";

// Análisis de fotos con IA para completar el formulario de productos, y captura de
// fotos desde el celular escaneando un QR (ver analisisIA.controller.ts en el BE).

// Borrador que devuelve el BE. Todos los ids existen en la base; precio, stock e imagen no vienen.
export interface SugerenciaProducto {
  nombre: string;
  descripcion: string;
  idCategoria: number | null;
  idMarca: number | null;
  marcaNueva: string | null; // marca que se ve en las fotos pero no está cargada (no se crea sola)
  traduccionEn: { nombre: string; descripcion: string } | null;
  componente: {
    idTipoComponente: number;
    wattsRequeridos: number | null;
    atributos: { idAtributo: number; valor: string }[];
  } | null;
}

export interface EstadoCaptura {
  fotos: number; // fotos recibidas desde el celular
  maxFotos: number; // las que se pueden mandar desde el celular (una por producto)
  expiraEn: string;
}

export interface CapturaCreada extends EstadoCaptura {
  token: string;
  ipLocal: string | null; // IP de la PC en la red, para armar la URL del QR
}

export const MAX_FOTOS_IA = 5; // fotos por pedido que acepta el BE
export const MAX_FOTOS_LOTE = 10; // carga por lote: una foto por producto (igual al máximo del celular)

async function formConFotos(archivos: File[]) {
  const form = new FormData();
  for (const foto of await Promise.all(archivos.map(reducirFoto))) form.append("fotos", foto);
  return form;
}

// ── Admin (computadora) ──

export const analizarFotos = async (archivos: File[], signal?: AbortSignal) =>
  pedir<SugerenciaProducto>("/analizar", { method: "POST", body: await formConFotos(archivos), signal });

export const crearCaptura = () => pedir<CapturaCreada>("/captura", { method: "POST" }, urlAdmin);

export const estadoCaptura = (token: string, signal?: AbortSignal) =>
  pedir<EstadoCaptura>(`/captura/${token}`, { signal }, urlAdmin);

// Descarga una foto que llegó del celular, para mostrarla y analizarla junto con las demás
export async function descargarFotoCaptura(token: string, indice: number, signal?: AbortSignal): Promise<File> {
  const res = await fetch(`${urlAdmin}/captura/${token}/fotos/${indice}`, { credentials: "include", signal });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(res.status, data.error || `Error ${res.status}`);
  }
  const blob = await res.blob();
  const extension = blob.type.split("/")[1] ?? "jpg";
  return new File([blob], `celular-${indice + 1}.${extension}`, { type: blob.type });
}

export const cancelarCaptura = (token: string) => pedir<void>(`/captura/${token}`, { method: "DELETE" }, urlAdmin);

// URL que abre el celular. Si en la PC se entra por localhost, se usa la IP de la red que
// detectó el BE (desde el celular "localhost" es el propio celular). null si no hay IP.
export function urlParaCelular(captura: CapturaCreada): string | null {
  const { protocol, hostname, port } = window.location;
  const esLocal = ["localhost", "127.0.0.1", "[::1]"].includes(hostname);
  const host = esLocal ? captura.ipLocal : hostname;
  if (!host) return null;
  return `${protocol}//${host}${port ? `:${port}` : ""}/captura/${captura.token}`;
}

// ── Celular ──
// URL relativa: el celular solo se conecta al servidor de Vite (puerto 5173), que
// reenvía /api al BE (proxy en vite.config.ts). Sin sesión: el token hace de permiso.

async function pedirCaptura<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api/captura/${path}`, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error || `Error ${res.status}`);
  return data;
}

export const infoCaptura = (token: string, signal?: AbortSignal) => pedirCaptura<EstadoCaptura>(token, { signal });

// El BE acepta hasta MAX_FOTOS_IA fotos por pedido: si se eligen más, se mandan en tandas
export async function enviarFotosCaptura(token: string, archivos: File[]): Promise<EstadoCaptura> {
  let estado: EstadoCaptura | null = null;
  for (let i = 0; i < archivos.length; i += MAX_FOTOS_IA) {
    const tanda = archivos.slice(i, i + MAX_FOTOS_IA);
    estado = await pedirCaptura<EstadoCaptura>(`${token}/fotos`, { method: "POST", body: await formConFotos(tanda) });
  }
  return estado!;
}
