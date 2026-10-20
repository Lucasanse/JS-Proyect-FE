import { useTranslation } from "react-i18next";

// Mensaje de error al cargar datos, con botón para reintentar
export default function ErrorCarga({ mensaje, onReintentar }: { mensaje: string; onReintentar: () => void }) {
  const { t } = useTranslation();
  return (
    <div
      role="alert"
      className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-700"
    >
      <span className="flex-1">{mensaje}</span>
      <button
        type="button"
        onClick={onReintentar}
        className="cursor-pointer rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-red-100"
      >
        {t("admin.reintentar")}
      </button>
    </div>
  );
}
