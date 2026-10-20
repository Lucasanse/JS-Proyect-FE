import { useTranslation } from "react-i18next";

// Aviso grande de que el precio del arreglo se informa cuando el cliente lleva el equipo al local.
// Va arriba del formulario de nueva solicitud y en el detalle mientras la solicitud está abierta.
export default function AvisoPrecio({ className = "" }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <div
      role="note"
      className={`flex items-start gap-4 rounded-xl border-2 border-amber-400 bg-amber-50 px-5 py-4 text-amber-900 ${className}`}
    >
      <span
        aria-hidden
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400 text-xl font-extrabold text-white"
      >
        $
      </span>
      <div>
        <p className="text-lg leading-snug font-bold sm:text-xl">{t("servicioTecnico.avisoPrecio.titulo")}</p>
        <p className="mt-1 text-sm text-amber-800">{t("servicioTecnico.avisoPrecio.detalle")}</p>
      </div>
    </div>
  );
}
