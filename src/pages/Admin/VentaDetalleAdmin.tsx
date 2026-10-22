import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Precio from "../../components/Precio/Precio";
import {
  obtenerVentaAdminPorId,
  actualizarEstadoVentaAdmin,
} from "../../services/adminPedidos";

export const VentaDetalleAdmin = () => {
  const { id } = useParams<{ id: string }>();
  const [venta, setVenta] = useState<VentaDetalleAdmin | null>(null);
  const [cargando, setCargando] = useState(true);

  // Estados para el cambio de estado de la compra
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [actualizando, setActualizando] = useState(false);

  useEffect(() => {
    if (!id) return;
    setCargando(true);
    obtenerVentaAdminPorId(id)
      .then((data) => {
        setVenta(data);
        setNuevoEstado(data.estado); // Inicializamos el select con el estado actual
      })
      .catch(console.error)
      .finally(() => setCargando(false));
  }, [id]);

  const handleGuardarEstado = async () => {
    if (!id || !nuevoEstado || nuevoEstado === venta?.estado) return;

    setActualizando(true);
    try {
      await actualizarEstadoVentaAdmin(id, nuevoEstado);
      // Actualizamos el estado local para que la UI reaccione
      setVenta((prev) => (prev ? { ...prev, estado: nuevoEstado } : null));
      alert("¡Estado actualizado correctamente!");
    } catch (error) {
      console.error(error);
      alert("Hubo un error al actualizar el estado.");
    } finally {
      setActualizando(false);
    }
  };

  if (cargando) {
    return <div className="p-6 text-ink">Cargando detalle del pedido...</div>;
  }

  if (!venta) {
    return <div className="p-6 text-red-500">No se encontró la venta.</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Botón Volver y Título */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin/ventas"
          className="text-muted hover:text-accent transition-colors"
        >
          &larr; Volver
        </Link>
        <h1 className="text-2xl font-bold text-ink">Pedido #{venta.idVenta}</h1>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            venta.estado === "Pagado"
              ? "bg-accent/10 text-accent"
              : venta.estado === "Entregado"
                ? "bg-green-500/10 text-green-600"
                : "bg-red-500/10 text-red-600"
          }`}
        >
          {venta.estado}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Columna Izquierda: Datos del Cliente y Panel de Estado */}
        <div className="md:col-span-1 space-y-6">
          {/* Card: Cliente */}
          <div className="bg-surface border border-line rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-ink border-b border-line pb-2 mb-3">
              Datos del Cliente
            </h2>
            <p className="text-sm text-ink font-medium">
              {venta.usuario.nombre} {venta.usuario.apellido}
            </p>
            <p className="text-sm text-muted">{venta.usuario.email}</p>
            <p className="text-xs text-muted mt-2">
              ID Usuario: {venta.usuario.id}
            </p>
          </div>

          {/* Card: Gestión de Estado */}
          <div className="bg-surface border border-line rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-ink border-b border-line pb-2 mb-3">
              Gestionar Pedido
            </h2>
            <div className="flex flex-col gap-3">
              <label className="text-xs font-semibold text-muted">
                Cambiar Estado
              </label>
              <select
                value={nuevoEstado}
                onChange={(e) => setNuevoEstado(e.target.value)}
                className="p-2 border border-line rounded bg-surface text-ink text-sm"
              >
                <option value="Pagado">Pagado</option>
                <option value="En preparacion">En preparacion</option>
                <option value="Listo para entregar">Listo para entregar</option>
                <option value="Retirado">Retirado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
              <button
                onClick={handleGuardarEstado}
                disabled={actualizando || nuevoEstado === venta.estado}
                className="mt-2 w-full bg-primary text-white py-2 rounded text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actualizando ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Detalle de Productos */}
        <div className="md:col-span-2">
          <div className="bg-surface border border-line rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 bg-surface-alt border-b border-line flex justify-between items-center">
              <h2 className="text-sm font-bold text-ink">
                Artículos del Pedido
              </h2>
              <span className="text-sm text-muted">
                {new Date(venta.fecha).toLocaleString()}
              </span>
            </div>

            <div className="divide-y divide-line">
              {venta.detalles.map((detalle) => (
                <div
                  key={detalle.idDetalleVenta}
                  className="flex justify-between items-center p-4 hover:bg-surface-alt/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Placeholder para la imagen si la agregás luego */}
                    <div className="w-12 h-12 bg-surface-alt border border-line rounded flex items-center justify-center text-xs text-muted">
                      IMG
                    </div>
                    <div>
                      <p className="text-sm font-bold text-ink">
                        {detalle.producto.nombre}
                      </p>
                      <p className="text-xs text-muted">
                        ID Prod: {detalle.producto.idProducto}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-ink">
                      {detalle.cantidad} x ${detalle.precioUnitario}
                    </p>
                    <p className="text-sm font-bold text-ink mt-1">
                      ${(detalle.cantidad * detalle.precioUnitario).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Resumen Total */}
            <div className="p-4 bg-surface-alt border-t border-line flex justify-between items-center">
              <span className="text-sm font-bold text-ink">
                Total pagado por el cliente
              </span>
              {venta.cotizacionUsd && venta.cotizacionFecha ? (
                <Precio
                  precio={Number(venta.total)}
                  cotizacion={{ valor: Number(venta.cotizacionUsd), fecha: venta.cotizacionFecha }}
                  className="text-right text-xl font-black text-accent"
                />
              ) : (
                <span className="text-xl font-black text-accent">${venta.total}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
