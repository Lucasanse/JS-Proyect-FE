import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { obtenerPedidos, type Compra } from "../../services/pedidos";
import { useSession } from "../../services/auth-client";
import Precio from "../../components/Precio/Precio";
import AvisoCarrito from "../../components/AvisoCarrito/AvisoCarrito";
import { AvisoRetiroLocal } from "../../components/AvisoDomicilio/AvisoDomicilio";
import BotonDescarga from "../../components/Documentos/BotonDescarga";
import EstadoCompra from "../../components/EstadoCompra/EstadoCompra";
import { descargarFactura } from "../../services/documentos";
export const MisCompras = () => {
  const { t } = useTranslation();
  const [compras, setCompras] = useState<Compra[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();
  const idUsuario = session?.user?.id;
  // Desde una notificación se llega con #venta-<id>: se lleva la vista a esa compra
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash.startsWith("#venta-") || compras.length === 0) return;
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash, compras]);
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
          <AvisoRetiroLocal></AvisoRetiroLocal>
          {compras.map((compra) => (
            <div
              key={compra.id}
              id={`venta-${compra.id}`}
              className={`flex flex-col p-5 bg-surface border rounded-xl shadow-sm hover:shadow-md transition-shadow scroll-mt-24 ${
                hash === `#venta-${compra.id}` ? "border-accent ring-2 ring-accent/30" : "border-line"
              }`}
            >
              {/* Encabezado de la Tarjeta */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-line pb-4 mb-4 gap-3">
                <div className="flex flex-col">
                  <span className="text-ink font-bold">Orden #{compra.id}</span>
                  <span className="text-sm text-muted">{compra.fecha}</span>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  {/* Cotización guardada al emitir la compra, no la de hoy */}
                  {compra.cotizacionUsd && compra.cotizacionFecha ? (
                    <Precio
                      precio={compra.total}
                      cotizacion={{ valor: compra.cotizacionUsd, fecha: compra.cotizacionFecha }}
                      className="text-right text-lg font-bold text-ink"
                    />
                  ) : (
                    <span className="text-lg font-bold text-ink">${compra.total}</span>
                  )}
                  <EstadoCompra estado={compra.status} />
                </div>
              </div>

              {/* La factura solo existe una vez acreditado el pago */}
              {compra.facturaDisponible && (
                <div className="mb-4 flex justify-end">
                  <BotonDescarga
                    etiqueta={t("documentos.descargarFactura")}
                    descargar={() => descargarFactura(compra.id)}
                  />
                </div>
              )}

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
