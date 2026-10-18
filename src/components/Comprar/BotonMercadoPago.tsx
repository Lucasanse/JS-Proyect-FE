// BotonMercadoPago.jsx (o .tsx si usás TypeScript en el front)
import React from "react";

interface PropsBoton {
  onClick: Function;
  cargando: boolean;
  texto: string;
  disabled: boolean | undefined;
}
export const BotonMercadoPago = ({
  onClick,
  cargando,
  texto = "Pagar con Mercado Pago",
  disabled,
}: PropsBoton) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled ?? cargando}
      style={{
        backgroundColor: "#009EE3",
        color: "#FFFFFF",
        padding: "14px 24px",
        border: "none",
        borderRadius: "6px",
        fontSize: "16px",
        fontWeight: "600",
        cursor: cargando ? "not-allowed" : "pointer",
        opacity: cargando ? 0.7 : 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        width: "100%",
        transition: "background-color 0.2s ease",
      }}
    >
      {cargando ? <span>Cargando link seguro...</span> : <span>{texto}</span>}
    </button>
  );
};
