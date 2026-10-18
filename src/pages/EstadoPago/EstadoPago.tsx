// PantallaEstadoPago.jsx
import React from "react";
import { useSearchParams, Link } from "react-router-dom";
import { MensajeExito } from "../../components/Comprar/MensajeExito";
import { MensajePendiente } from "../../components/Comprar/MensajePendiente";
import { MensajeRechazado } from "../../components/Comprar/MensajeRechazado";

export const PantallaEstadoPago = () => {
  const [searchParams] = useSearchParams();

  // Extraemos los datos que manda MP en la URL
  const status = searchParams.get("status");
  const paymentId = searchParams.get("payment_id");
  const externalReference = searchParams.get("external_reference");

  // Si por algún motivo entran sin parámetros, los mandamos al inicio
  if (!status) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h2>No hay información de pago</h2>
        <Link to="/">Volver a la tienda</Link>
      </div>
    );
  }

  // Renderizado condicional mágico
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "50px" }}>
      {status === "approved" && (
        <MensajeExito paymentId={paymentId} refInterna={externalReference} />
      )}

      {status === "in_process" || status === "pending" ? (
        <MensajePendiente paymentId={paymentId} />
      ) : null}

      {status === "rejected" || status === "null" ? <MensajeRechazado /> : null}
    </div>
  );
};
