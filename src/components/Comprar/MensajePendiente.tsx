import { Link } from "react-router-dom";

export const MensajePendiente = ({ paymentId }: { paymentId: string }) => (
  <div
    style={{
      textAlign: "center",
      border: "1px solid #f39c12",
      padding: "40px",
      borderRadius: "8px",
    }}
  >
    <h1 style={{ color: "#f39c12" }}>⏳ Pago en Revisión</h1>
    <p>Estamos esperando la confirmación de la tarjeta.</p>
    <p>
      ID de seguimiento: <strong>#{paymentId}</strong>
    </p>
    <Link to="/">Volver al inicio</Link>
  </div>
);
