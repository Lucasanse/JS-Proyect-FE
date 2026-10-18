// ContenedorCompraUnidad.jsx
import React, { useState } from "react";
import { BotonMercadoPago } from "./BotonMercadoPago"; // Ajustá la ruta según tus carpetas
import { urlCompraCarrito, urlCompraUnidad } from "../../services/api";

interface PropsUnidad {
  idUsuario: string | undefined;
  idProducto: number;
  cantidad: number;
}

export const ContenedorCompraCarrito = ({
  idUsuario,
  disabled,
}: {
  idUsuario: string | undefined;
  disabled: boolean;
}) => {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const iniciarCompra = async () => {
    setCargando(true);
    setError(null);

    try {
      const respuesta = await fetch(urlCompraCarrito, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuario: { id: idUsuario },
        }),
      });

      if (!respuesta.ok) {
        throw new Error("Hubo un problema al conectar con el servidor.");
      }

      const data = await respuesta.json();

      const urlDeMercadoPago = data.urlPago;

      if (urlDeMercadoPago) {
        window.location.href = urlDeMercadoPago;
      } else {
        throw new Error("Mercado Pago no devolvió el link de pago.");
      }
    } catch (err) {
      console.error("Error en la compra:", err);
      setError("No pudimos iniciar el pago. Por favor, intentá de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ width: "100%" }}>
      <BotonMercadoPago
        onClick={iniciarCompra}
        cargando={cargando}
        texto="Confirmar pedido"
        disabled={disabled}
      />

      {/* Si el fetch falla, mostramos un mensajito de error sutil */}
      {error && (
        <p
          style={{
            color: "#d32f2f",
            fontSize: "14px",
            marginTop: "8px",
            textAlign: "center",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
};
// Recibe por props los datos que tu backend necesita
export const ContenedorCompraUnidad = ({
  idUsuario,
  idProducto,
  cantidad,
}: PropsUnidad) => {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const iniciarCompra = async () => {
    setCargando(true);
    setError(null);

    try {
      const respuesta = await fetch(urlCompraUnidad, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuario: { id: idUsuario },
          producto: { idProducto: idProducto },
          cantidad: cantidad,
        }),
      });

      if (!respuesta.ok) {
        throw new Error("Hubo un problema al conectar con el servidor.");
      }

      const data = await respuesta.json();

      const urlDeMercadoPago = data.urlPago;

      if (urlDeMercadoPago) {
        window.location.href = urlDeMercadoPago;
      } else {
        throw new Error("Mercado Pago no devolvió el link de pago.");
      }
    } catch (err) {
      console.error("Error en la compra:", err);
      setError("No pudimos iniciar el pago. Por favor, intentá de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ width: "100%" }}>
      <BotonMercadoPago
        onClick={iniciarCompra}
        cargando={cargando}
        texto="Comprar ahora"
      />

      {/* Si el fetch falla, mostramos un mensajito de error sutil */}
      {error && (
        <p
          style={{
            color: "#d32f2f",
            fontSize: "14px",
            marginTop: "8px",
            textAlign: "center",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
};
