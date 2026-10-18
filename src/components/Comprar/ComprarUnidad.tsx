// ContenedorCompraUnidad.tsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { BotonMercadoPago } from "./BotonMercadoPago";
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
  const { t } = useTranslation();
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
        throw new Error("errorConexion");
      }

      const data = await respuesta.json();
      const urlDeMercadoPago = data.urlPago;

      if (urlDeMercadoPago) {
        window.location.href = urlDeMercadoPago;
      } else {
        throw new Error("errorLinkPago");
      }
    } catch (err) {
      console.error("Error en la compra:", err);
      setError(t("checkout.errores.falloIniciar"));
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="w-full">
      <BotonMercadoPago
        onClick={iniciarCompra}
        cargando={cargando}
        texto={t("checkout.boton.confirmarPedido")}
        disabled={disabled}
      />

      {error && (
        <p className="text-primary text-sm mt-2 text-center font-medium">
          {error}
        </p>
      )}
    </div>
  );
};

export const ContenedorCompraUnidad = ({
  idUsuario,
  idProducto,
  cantidad,
}: PropsUnidad) => {
  const { t } = useTranslation();
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
        throw new Error("errorConexion");
      }

      const data = await respuesta.json();
      const urlDeMercadoPago = data.urlPago;

      if (urlDeMercadoPago) {
        window.location.href = urlDeMercadoPago;
      } else {
        throw new Error("errorLinkPago");
      }
    } catch (err) {
      console.error("Error en la compra:", err);
      setError(t("checkout.errores.falloIniciar"));
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="w-full">
      <BotonMercadoPago
        onClick={iniciarCompra}
        cargando={cargando}
        texto={t("checkout.boton.comprarAhora")}
      />

      {error && (
        <p className="text-primary text-sm mt-2 text-center font-medium">
          {error}
        </p>
      )}
    </div>
  );
};
