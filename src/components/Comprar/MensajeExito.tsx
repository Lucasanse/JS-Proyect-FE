import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

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

      <Link
        to="/"
        className="w-full py-3 px-4 bg-ink hover:bg-dark text-surface font-medium rounded-lg transition-colors"
      >
        {t("checkout.exito.botonSeguir")}
      </Link>
    </div>
  );
};
