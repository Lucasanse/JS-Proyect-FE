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

export const obtenerVentasAdmin = async (
  filtros: FiltrosVenta,
): Promise<RespuestaVentas> => {
  // Construimos la URL con los parámetros que realmente tengan un valor
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([key, value]) => {
    if (value) params.append(key, String(value));
  });

  const res = await fetch(
    `http://localhost:3000/api/admin/ventas?${params.toString()}`,
    {
      credentials: "include",
    },
  );

  if (!res.ok) throw new Error("Error al obtener las ventas del panel");
  return res.json();
};
