import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type {
  VentaAdmin,
  MetaPaginacion,
  FiltrosVenta,
} from "../../services/adminPedidos";
import { obtenerVentasAdmin } from "../../services/adminPedidos";

export const VentasAdmin = () => {
  const [ventas, setVentas] = useState<VentaAdmin[]>([]);
  const [meta, setMeta] = useState<MetaPaginacion | null>(null);
  const [cargando, setCargando] = useState(true);

  // Estado inicial de los filtros
  const [filtros, setFiltros] = useState<FiltrosVenta>({
    page: 1,
    limit: 10,
    estado: "",
    fechaDesde: "",
    fechaHasta: "",
  });

  useEffect(() => {
    setCargando(true);
    obtenerVentasAdmin(filtros)
      .then((res) => {
        setVentas(res.data);
        setMeta(res.meta);
      })
      .catch(console.error)
      .finally(() => setCargando(false));
  }, [filtros]);

  // Handlers para actualizar filtros y resetear la página a 1
  const handleChangeFiltro = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFiltros((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
      page: 1,
    }));
  };

  const handleCambiarPagina = (nuevaPagina: number) => {
    setFiltros((prev) => ({ ...prev, page: nuevaPagina }));
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-ink">Gestión de Pedidos</h1>

      {/* Barra de iltros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-surface-alt p-4 border border-line rounded-xl">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-ink">Estado</label>
          <select
            name="estado"
            value={filtros.estado}
            onChange={handleChangeFiltro}
            className="p-2 border border-line rounded bg-surface text-ink text-sm"
          >
            <option value="">Todos</option>
            <option value="Pagado">Pagado</option>
            <option value="En preparacion">En preparacion</option>
            <option value="Listo para entregar">Listo para entregar</option>
            <option value="Retirado">Retirado</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-ink">Desde</label>
          <input
            type="date"
            name="fechaDesde"
            value={filtros.fechaDesde}
            onChange={handleChangeFiltro}
            className="p-2 border border-line rounded bg-surface text-ink text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-ink">Hasta</label>
          <input
            type="date"
            name="fechaHasta"
            value={filtros.fechaHasta}
            onChange={handleChangeFiltro}
            className="p-2 border border-line rounded bg-surface text-ink text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-ink">Limpiar</label>
          <button
            onClick={() =>
              setFiltros({
                page: 1,
                limit: 10,
                estado: "",
                fechaDesde: "",
                fechaHasta: "",
              })
            }
            className="p-2 bg-surface border border-line rounded text-sm text-ink hover:bg-line transition-colors"
          >
            Resetear Filtros
          </button>
        </div>
      </div>

      {/* Tabla de Resultados */}
      <div className="overflow-x-auto border border-line rounded-xl bg-surface">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-alt border-b border-line">
              <th className="p-3 text-sm font-semibold text-ink">ID</th>
              <th className="p-3 text-sm font-semibold text-ink">Fecha</th>
              <th className="p-3 text-sm font-semibold text-ink">Cliente</th>
              <th className="p-3 text-sm font-semibold text-ink">Estado</th>
              <th className="p-3 text-sm font-semibold text-ink">Total</th>
              <th className="p-3 text-sm font-semibold text-ink">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted">
                  Cargando pedidos...
                </td>
              </tr>
            ) : ventas.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted">
                  No se encontraron pedidos.
                </td>
              </tr>
            ) : (
              ventas.map((venta) => (
                <tr
                  key={venta.idVenta}
                  className="border-b border-line hover:bg-surface-alt transition-colors"
                >
                  <td className="p-3 text-sm text-ink">#{venta.idVenta}</td>
                  <td className="p-3 text-sm text-muted">
                    {new Date(venta.fecha).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-sm text-ink">
                    {venta.usuario.nombreCompleto}
                    <span className="block text-xs text-muted">
                      {venta.usuario.correo}
                    </span>
                  </td>
                  <td className="p-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        venta.estado === "Pagado"
                          ? "bg-accent/10 text-accent"
                          : venta.estado === "Entregado"
                            ? "bg-green-500/10 text-green-600"
                            : "bg-red-500/10 text-red-600"
                      }`}
                    >
                      {venta.estado}
                    </span>
                  </td>
                  <td className="p-3 text-sm font-bold text-ink">
                    ${venta.total}
                  </td>
                  <td className="p-3 text-sm">
                    <Link
                      to={`/admin/ventas/${venta.idVenta}`}
                      className="text-accent hover:underline font-medium"
                    >
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {meta && meta.totalPaginas > 1 && (
        <div className="flex justify-between items-center bg-surface p-4 border border-line rounded-xl">
          <span className="text-sm text-muted">
            Mostrando {ventas.length} de {meta.total} pedidos
          </span>
          <div className="flex gap-2">
            <button
              disabled={meta.paginaActual === 1}
              onClick={() => handleCambiarPagina(meta.paginaActual - 1)}
              className="px-3 py-1 bg-surface-alt border border-line rounded text-sm text-ink disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="px-3 py-1 text-sm font-semibold text-ink">
              Página {meta.paginaActual} de {meta.totalPaginas}
            </span>
            <button
              disabled={meta.paginaActual === meta.totalPaginas}
              onClick={() => handleCambiarPagina(meta.paginaActual + 1)}
              className="px-3 py-1 bg-surface-alt border border-line rounded text-sm text-ink disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
