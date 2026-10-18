import React from "react";
import { useTranslation } from "react-i18next";

interface PropsBoton {
  onClick: () => void;
  cargando: boolean;
  texto?: string;
  disabled?: boolean;
}

export const BotonMercadoPago = ({
  onClick,
  cargando,
  texto,
  disabled,
}: PropsBoton) => {
  const { t } = useTranslation();

  const textoFinal = texto ?? t("checkout.boton.pagarMP");

  return (
    <button
      onClick={onClick}
      disabled={Boolean(disabled ?? cargando)}
      className="flex items-center justify-center w-full gap-2.5 px-6 py-3.5 bg-[#e31a00] hover:bg-[#fa3c3c] text-white font-semibold text-base rounded-md transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {cargando ? (
        <span>{t("checkout.boton.cargando")}</span>
      ) : (
        <span>{textoFinal}</span>
      )}
    </button>
  );
};
