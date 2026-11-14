import { BASE_URL } from "./api";

// Presupuestos y facturas en PDF (ver documentos.controller.ts en el BE).
// Los PDF los arma el BE con el logo y el formato del comercio.
const urlPresupuestos = `${BASE_URL}/api/quotes`;
const urlPedidos = `${BASE_URL}/api/orders`;

export interface DocumentoResumen {
  id: number;
  tipo: "PRESUPUESTO" | "FACTURA";
  numero: string; // 0001-00000012
  fecha: string; // ISO
  origen: "CARRITO" | "PRESET" | "ARMADO" | "VENTA";
  idVenta: number | null;
  total: number;
  cantidadItems: number;
}

// De dónde salen los productos del presupuesto
export type OrigenPresupuesto =
  | { origen: "carrito" }
  | { origen: "preset"; idPreset: number }
  | { origen: "armado"; seleccion: { idProducto: number; cantidad: number }[]; servicios: number[] };

async function errorDe(res: Response, porDefecto: string) {
  const data = await res.json().catch(() => null);
  return new Error(data?.error || porDefecto);
}

export async function generarPresupuesto(body: OrigenPresupuesto): Promise<DocumentoResumen> {
  const res = await fetch(urlPresupuestos, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await errorDe(res, `Error ${res.status} al generar el presupuesto`);
  return res.json();
}

export async function listarPresupuestos(signal?: AbortSignal): Promise<DocumentoResumen[]> {
  const res = await fetch(urlPresupuestos, { credentials: "include", signal });
  if (!res.ok) throw await errorDe(res, `Error ${res.status} al cargar los presupuestos`);
  return res.json();
}

// Pide el PDF al BE (con la cookie de sesión)
async function pedirPdf(url: string, porDefecto: string) {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw await errorDe(res, porDefecto);
  return res.blob();
}

// Descarga un PDF ya obtenido con el nombre indicado
export function guardarPdf(blob: Blob, nombre: string) {
  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(blob);
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  // Se libera después del clic para que el navegador alcance a leer el archivo
  setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
}

const urlFactura = (idVenta: number | string) => `${urlPedidos}/${idVenta}/invoice`;
export const nombreFactura = (idVenta: number | string) => `factura-pedido-${idVenta}.pdf`;

export async function descargarPresupuesto(doc: Pick<DocumentoResumen, "id" | "numero">) {
  const blob = await pedirPdf(`${urlPresupuestos}/${doc.id}/download`, "No se pudo descargar el presupuesto");
  guardarPdf(blob, `presupuesto-${doc.numero}.pdf`);
}

export const obtenerFactura = (idVenta: number | string) => pedirPdf(urlFactura(idVenta), "No se pudo obtener la factura");

export async function descargarFactura(idVenta: number | string) {
  guardarPdf(await obtenerFactura(idVenta), nombreFactura(idVenta));
}
