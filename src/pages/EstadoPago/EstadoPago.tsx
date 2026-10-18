// PantallaEstadoPago.jsx
import React from "react";
import { useSearchParams, Link, useParams } from "react-router-dom";
import { MensajeExito } from "../../components/Comprar/MensajeExito";
import { MensajePendiente } from "../../components/Comprar/MensajePendiente";
import { MensajeRechazado } from "../../components/Comprar/MensajeRechazado";
import { useTranslation } from "react-i18next";

export const PantallaEstadoPago = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { estado } = useParams(); // Disponible si la ruta es checkout/:estado

  // MP puede mandar 'status' o 'collection_status'
  const status =
    searchParams.get("status") || searchParams.get("collection_status");
  const paymentId =
    searchParams.get("payment_id") ||
    searchParams.get("collection_id") ||
    "Sin ID";
  const externalReference = searchParams.get("external_reference") ?? "";

  // Agrupamos las condiciones para cada estado
  const esAprobado = status === "approved" || estado === "exito";
  const esPendiente =
    status === "in_process" || status === "pending" || estado === "pendiente";
  const esRechazado =
    status === "rejected" || estado === "error" || estado === "fallo";

  // Solo mostramos "sin información" si realmente no coincide con ninguno
  if (!esAprobado && !esPendiente && !esRechazado) {
    return (
      <div className="flex justify-center p-12">
        <div className="max-w-md w-full text-center p-10 bg-surface border border-primary rounded-lg shadow-sm">
          <h2 className="text-xl font-medium text-ink mb-4">
            {t("estadoPago.noInfo")}
          </h2>
          <Link
            to="/Home"
            className="inline-block py-2.5 px-5 bg-primary hover:bg-primary-dark text-surface font-medium rounded-md transition-colors"
          >
            {t("estadoPago.volver")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center p-12">
      {esAprobado && (
        <MensajeExito paymentId={paymentId} refInterna={externalReference} />
      )}
      {esPendiente && <MensajePendiente paymentId={paymentId} />}
      {esRechazado && <MensajeRechazado />}
    </div>
  );
};
