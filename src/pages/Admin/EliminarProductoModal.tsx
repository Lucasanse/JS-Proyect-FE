import { useState } from "react";
import { useTranslation } from "react-i18next";
import Modal from "../../components/Modal/Modal";
import {
  ApiError,
  cambiarEstadoProducto,
  eliminarProducto,
  type ProductoAdmin,
} from "../../services/adminProductos";

interface Props {
  producto: ProductoAdmin;
  onCerrar: () => void;
  onEliminado: () => void;
  onDesactivado: (producto: ProductoAdmin) => void;
}

// Paso 1: confirmar la eliminación.
// Si el BE responde 409 (el producto tiene ventas), se explica el motivo y se ofrece desactivarlo.
export default function EliminarProductoModal({ producto, onCerrar, onEliminado, onDesactivado }: Props) {
  const { t } = useTranslation();
  const [mensajeConVentas, setMensajeConVentas] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");

  const ejecutar = async (accion: () => Promise<void>) => {
    setError("");
    setProcesando(true);
    try {
      await accion();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) setMensajeConVentas(e.message);
      else setError(e instanceof Error ? e.message : t("admin.errorGenerico"));
    } finally {
      setProcesando(false);
    }
  };

  const eliminar = () =>
    ejecutar(async () => {
      await eliminarProducto(producto.id);
      onEliminado();
    });

  const desactivar = () =>
    ejecutar(async () => {
      onDesactivado(await cambiarEstadoProducto(producto.id, false));
    });

  const botonSecundario =
    "cursor-pointer rounded-lg border border-line bg-surface px-4 py-2 font-semibold text-ink transition-colors hover:bg-line disabled:cursor-not-allowed disabled:opacity-50";
  const botonPrincipal =
    "cursor-pointer rounded-lg px-4 py-2 font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <Modal
      titulo={mensajeConVentas ? t("admin.eliminar.noSePuedeTitulo") : t("admin.eliminar.titulo")}
      onCerrar={onCerrar}
      bloqueado={procesando}
    >
      <div className="space-y-3 px-5 py-4 text-sm">
        {mensajeConVentas ? (
          <>
            <div className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900">
              <span aria-hidden className="text-lg leading-none">
                ⚠️
              </span>
              <p>{mensajeConVentas}</p>
            </div>
            <p className="text-muted">
              {producto.activo ? t("admin.eliminar.explicacionDesactivar") : t("admin.eliminar.yaInactivo")}
            </p>
          </>
        ) : (
          <>
            <p className="text-ink">
              {t("admin.eliminar.pregunta")} <strong>{producto.nombre}</strong>?
            </p>
            <p className="text-muted">{t("admin.eliminar.irreversible")}</p>
          </>
        )}
        {error && (
          <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-red-700">
            {error}
          </p>
        )}
      </div>

      <footer className="flex flex-col-reverse gap-2 border-t border-line bg-surface-alt px-5 py-3 sm:flex-row sm:justify-end">
        {mensajeConVentas && !producto.activo ? (
          <button type="button" onClick={onCerrar} className={`${botonPrincipal} bg-primary hover:bg-primary-dark`}>
            {t("admin.entendido")}
          </button>
        ) : (
          <>
            <button type="button" onClick={onCerrar} disabled={procesando} className={botonSecundario}>
              {t("admin.cancelar")}
            </button>
            {mensajeConVentas ? (
              <button
                type="button"
                onClick={desactivar}
                disabled={procesando}
                autoFocus
                className={`${botonPrincipal} bg-primary hover:bg-primary-dark`}
              >
                {procesando ? t("admin.eliminar.desactivando") : t("admin.eliminar.desactivar")}
              </button>
            ) : (
              <button
                type="button"
                onClick={eliminar}
                disabled={procesando}
                className={`${botonPrincipal} bg-red-600 hover:bg-red-700`}
              >
                {procesando ? t("admin.eliminar.eliminando") : t("admin.eliminar.eliminar")}
              </button>
            )}
          </>
        )}
      </footer>
    </Modal>
  );
}
