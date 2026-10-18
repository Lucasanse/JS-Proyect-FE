import { Link } from "react-router-dom";

export const MensajeExito = ({
  paymentId,
  refInterna,
}: {
  paymentId: string;
  refInterna: string;
}) => (
  <div
    style={{
      textAlign: "center",
      border: "1px solid #00c677",
      padding: "40px",
      borderRadius: "8px",
    }}
  >
    <h1 style={{ color: "#00c677" }}>✓ ¡Pago Aprobado!</h1>
    <p>
      Comprobante: <strong>#{paymentId}</strong>
    </p>
    <p>LUGAR PARA GENERAR LA FACTURA: {refInterna}</p>
    <Link to="/">Volver al inicio</Link>
  </div>
);
