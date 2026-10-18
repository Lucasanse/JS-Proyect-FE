import { Link } from "react-router-dom";

export const MensajeRechazado = () => (
  <div
    style={{
      textAlign: "center",
      border: "1px solid #e74c3c",
      padding: "40px",
      borderRadius: "8px",
    }}
  >
    <h1 style={{ color: "#e74c3c" }}>✕ Pago Rechazado</h1>
    <p>Hubo un problema con tu tarjeta o saldo insuficiente.</p>
    <Link to="/carrito">Intentar con otro medio de pago</Link>
  </div>
);
