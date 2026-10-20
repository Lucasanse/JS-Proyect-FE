import { urlPedidosAdmin } from "./api";

// Usa el import type para evitar problemas con verbatimModuleSyntax
export type UsuarioVenta = {
  id: number;
  nombreCompleto: string;
  correo: string;
};

export type VentaAdmin = {
  idVenta: number;
  total: number;
  estado: string;
  fecha: string;
  usuario: UsuarioVenta;
};

export type MetaPaginacion = {
  total: number;
  paginaActual: number;
  limitePorPagina: number;
  totalPaginas: number;
};

export type RespuestaVentas = {
  data: VentaAdmin[];
  meta: MetaPaginacion;
};

export type FiltrosVenta = {
  page: number;
  limit: number;
  estado?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  idUsuario?: string;
};
export type ProductoVenta = {
  idProducto: number;
  nombre: string;
  precio: number;
  imagenUrl?: string;
};

export type DetalleVenta = {
  idDetalleVenta: number;
  cantidad: number;
  precioUnitario: number;
  producto: ProductoVenta;
};

// Extendemos VentaAdmin para incluir los detalles
export type VentaDetalleAdmin = VentaAdmin & {
  detalles: DetalleVenta[];
};

// Función para traer una venta específica
export const obtenerVentaAdminPorId = async (
  id: string | number,
): Promise<VentaDetalleAdmin> => {
  const res = await fetch(`${urlPedidosAdmin}/${id}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Error al obtener el detalle de la venta");
  return res.json();
};

// Función para actualizar el estado
export const actualizarEstadoVentaAdmin = async (
  id: string | number,
  estado: string,
): Promise<void> => {
  const res = await fetch(`${urlPedidosAdmin}/${id}/estado`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ estado }),
  });
  if (!res.ok) throw new Error("Error al actualizar el estado");
};

export const obtenerVentasAdmin = async (
  filtros: FiltrosVenta,
): Promise<RespuestaVentas> => {
  // Construimos la URL con los parámetros que realmente tengan un valor
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([key, value]) => {
    if (value) params.append(key, String(value));
  });

  const res = await fetch(`${urlPedidosAdmin}?${params.toString()}`, {
    credentials: "include",
  });

  if (!res.ok) throw new Error("Error al obtener las ventas del panel");
  return res.json();
};
