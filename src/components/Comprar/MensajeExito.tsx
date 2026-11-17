import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSession } from "../../services/auth-client";
import { obtenerPedidos } from "../../services/pedidos";
import { guardarPdf, nombreFactura, obtenerFactura } from "../../services/documentos";
import { DocumentoIcon, Spinner } from "../Documentos/BotonPresupuesto";

export const MensajeExito = ({
  paymentId,
  refInterna,
}: {
  paymentId: string | "";
  refInterna: string | "";
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-surface rounded-2xl shadow-lg border border-line max-w-md w-full text-center">
      <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4 text-3xl font-bold">
        ✓
      </div>
      <h2 className="text-2xl font-bold text-ink mb-2">
        {t("checkout.exito.titulo")}
      </h2>
      <p className="text-muted mb-6">{t("checkout.exito.descripcion")}</p>

      {paymentId && (
        <div className="bg-surface-alt border border-line rounded-lg py-3 px-4 mb-8 w-full text-left flex flex-col gap-1">
          <div className="flex justify-between">
            <span className="text-muted text-sm">
              {t("checkout.exito.comprobante")}:
            </span>
            <span className="text-ink font-mono font-medium">{paymentId}</span>
          </div>
          {refInterna && (
            <div className="flex justify-between">
              <span className="text-muted text-sm">
                {t("checkout.exito.orden")}:
              </span>
              <span className="text-ink font-mono text-sm">{refInterna}</span>
            </div>
          )}
        </div>
      )}

      {paymentId && <FacturaCompra paymentId={paymentId} />}

      <Link
        to="/"
        className="w-full py-3 px-4 bg-ink hover:bg-dark text-surface font-medium rounded-lg transition-colors"
      >
        {t("checkout.exito.botonSeguir")}
      </Link>
    </div>
  );
};

// La venta (y su factura) la crea el webhook de Mercado Pago, que puede llegar unos segundos
// después de volver a esta pantalla: se busca la compra por el id del pago varias veces.
const INTENTOS = 8;
const ESPERA_MS = 2500;

type EstadoFactura =
  | { tipo: "buscando" }
  | { tipo: "lista"; idVenta: string; url: string; blob: Blob }
  | { tipo: "mas-tarde" };

function FacturaCompra({ paymentId }: { paymentId: string }) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const userId = session?.user.id;
  const [estado, setEstado] = useState<EstadoFactura>({ tipo: "buscando" });

  useEffect(() => {
    if (!userId) return;
    let cancelado = false;
    let url = "";
    let timer: ReturnType<typeof setTimeout>;

    const buscar = async (intento: number) => {
      try {
        const compras = await obtenerPedidos(Number(userId));
        const compra = compras.find((c) => c.idPagoMp === paymentId && c.facturaDisponible);
        if (compra) {
          const blob = await obtenerFactura(compra.id);
          if (cancelado) return;
          url = URL.createObjectURL(blob);
          setEstado({ tipo: "lista", idVenta: compra.id, url, blob });
          return;
        }
      } catch {
        // se reintenta igual
      }
      if (cancelado) return;
      if (intento + 1 >= INTENTOS) setEstado({ tipo: "mas-tarde" });
      else timer = setTimeout(() => buscar(intento + 1), ESPERA_MS);
    };
    buscar(0);

    return () => {
      cancelado = true;
      clearTimeout(timer);
      if (url) URL.revokeObjectURL(url);
    };
  }, [userId, paymentId]);

  if (!userId) return null;

  if (estado.tipo === "buscando") {
    return (
      <p className="mb-4 flex w-full items-center justify-center gap-2 text-sm text-muted" aria-live="polite">
        <Spinner />
        {t("checkout.exito.preparandoFactura")}
      </p>
    );
  }

  if (estado.tipo === "mas-tarde") {
    return (
      <p className="mb-4 w-full text-sm text-muted">
        {t("checkout.exito.facturaMasTarde")}{" "}
        <Link to="/misCompras" className="font-semibold text-primary hover:underline">
          {t("checkout.exito.irMisCompras")}
        </Link>
      </p>
    );
  }

  // El PDF ya está descargado: "Ver" lo abre en otra pestaña sin que el navegador lo bloquee
  return (
    <div className="mb-4 flex w-full gap-2">
      <a
        href={estado.url}
        target="_blank"
        rel="noopener"
        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-primary py-3 font-medium text-primary transition-colors hover:bg-primary-light"
      >
        <DocumentoIcon />
        {t("checkout.exito.verFactura")}
      </a>
      <button
        type="button"
        onClick={() => guardarPdf(estado.blob, nombreFactura(estado.idVenta))}
        className="cursor-pointer rounded-lg border border-line px-4 py-3 font-medium text-ink transition-colors hover:border-primary hover:text-primary"
      >
        {t("checkout.exito.descargarFactura")}
      </button>
    </div>
  );
}
