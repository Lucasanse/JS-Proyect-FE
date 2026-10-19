import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { obtenerPedidos, type Compra } from "../../services/pedidos";
import { useSession } from "../../services/auth-client";
export const MisCompras = () => {
  const { t } = useTranslation();
  const [compras, setCompras] = useState<Compra[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();
  const idUsuario = session?.user?.id;
  useEffect(() => {
    // Usamos AbortController para cancelar el fetch si el componente se desmonta
    const controller = new AbortController();

    const fetchCompras = async () => {
      if (!idUsuario) return;

      try {
        setCargando(true);
        setError(null);
        const data = await obtenerPedidos(Number(idUsuario), controller.signal);
        setCompras(data);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Error al cargar historial:", err);
          setError(
            t("historial.errorCarga", "Hubo un error al cargar tus compras."),
          );
        }
      } finally {
        setCargando(false);
      }
    };

    fetchCompras();

    return () => {
      controller.abort(); // Limpiamos la petición si el usuario cambia de página rápido
    };
  }, [idUsuario, t]);

  // Función para darle color al estado
  const formatearEstado = (estado: string) => {
    switch (estado.toLowerCase()) {
      case "approved":
      case "aprobado":
        return (
          <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200">
            {t("historial.estados.aprobado")}
          </span>
        );
      case "in_process":
      case "pending":
      case "pendiente":
        return (
          <span className="px-3 py-1 bg-surface-alt text-accent text-xs font-bold rounded-full border border-line">
            {t("historial.estados.pendiente")}
          </span>
        );
      case "rejected":
      case "rechazado":
        return (
          <span className="px-3 py-1 bg-primary-light text-primary text-xs font-bold rounded-full border border-primary/20">
            {t("historial.estados.rechazado")}
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-surface-alt text-muted text-xs font-bold rounded-full border border-line">
            {estado}
          </span>
        );
    }
  };

  if (!idUsuario) return null;

  if (cargando) {
    return (
      <div className="w-full flex justify-center p-12">
        <div className="w-8 h-8 border-4 border-surface-alt border-t-accent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-primary-light border border-primary/20 rounded-xl max-w-4xl mx-auto mt-8">
        <p className="text-primary font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold text-ink mb-6">
        {t("historial.titulo")}
      </h2>

      {compras.length === 0 ? (
        <div className="text-center p-12 bg-surface border border-line rounded-xl shadow-sm">
          <div className="text-4xl mb-4">🛍️</div>
          <p className="text-muted text-lg">{t("historial.vacio")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {compras.map((compra) => (
            <div
              key={compra.id}
              className="flex flex-col p-5 bg-surface border border-line rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Encabezado de la Tarjeta */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-line pb-4 mb-4 gap-3">
                <div className="flex flex-col">
                  <span className="text-ink font-bold">Orden #{compra.id}</span>
                  <span className="text-sm text-muted">{compra.fecha}</span>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <span className="text-lg font-bold text-ink">
                    ${compra.total}
                  </span>
                  {formatearEstado(compra.status)}
                </div>
              </div>

              {/* Lista de Productos Comprados */}
              <div className="flex flex-col gap-3">
                <h4 className="text-sm font-semibold text-ink uppercase tracking-wider">
                  {t("historial.productos")} ({compra.items})
                </h4>
                <ul className="flex flex-col gap-2">
                  {compra.productos.map((producto, index) => (
                    <li
                      key={`${producto.idProducto}-${index}`}
                      className="flex justify-between items-center bg-surface-alt py-2 px-3 rounded-lg border border-line"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-accent font-bold text-sm bg-surface px-2 py-0.5 rounded border border-line">
                          {producto.cantidad}x
                        </span>
                        <span className="text-ink font-medium text-sm">
                          {producto.nombre}
                        </span>
                      </div>
                      <span className="text-muted text-sm font-medium">
                        ${producto.precioUnitario}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
