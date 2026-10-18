import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export const MensajeRechazado = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-surface rounded-2xl shadow-lg border border-line max-w-md w-full text-center">
      {/* Círculo con fondo bordó suave y equis bordó oscura */}
      <div className="w-16 h-16 bg-primary-light text-primary rounded-full flex items-center justify-center mb-4 text-3xl font-bold">
        ✕
      </div>
      <h2 className="text-2xl font-bold text-primary mb-2">
        {t("checkout.rechazado.titulo")}
      </h2>
      <p className="text-muted mb-8">{t("checkout.rechazado.descripcion")}</p>

      <Link
        to="/checkout"
        className="w-full py-3 px-4 bg-primary hover:bg-primary-dark text-surface font-medium rounded-lg transition-colors"
      >
        {t("checkout.rechazado.botonReintentar")}
      </Link>
    </div>
  );
};
