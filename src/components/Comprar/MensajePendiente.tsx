import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export const MensajePendiente = ({ paymentId }: { paymentId?: string }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-surface rounded-2xl shadow-lg border border-line max-w-md w-full text-center">
      <div className="w-16 h-16 bg-surface-alt text-accent border border-line rounded-full flex items-center justify-center mb-4 text-3xl">
        ⏳
      </div>
      <h2 className="text-2xl font-bold text-ink mb-2">
        {t("checkout.pendiente.titulo")}
      </h2>
      <p className="text-muted mb-6">{t("checkout.pendiente.descripcion")}</p>

      {paymentId && (
        <div className="bg-surface-alt border border-line rounded-lg py-2 px-4 mb-8 w-full">
          <span className="text-muted text-sm">
            {t("checkout.pendiente.comprobante")}:
          </span>
          <p className="text-ink font-mono font-medium">{paymentId}</p>
        </div>
      )}

      <Link
        to="/"
        className="w-full py-3 px-4 bg-surface hover:bg-surface-alt text-ink border border-line font-medium rounded-lg transition-colors"
      >
        {t("checkout.pendiente.botonVolver")}
      </Link>
    </div>
  );
};
