import { useTranslation } from "react-i18next";

export const AvisoRetiroLocal = () => {
  const { t } = useTranslation();

  return (
    <div className="flex items-start gap-3.5 rounded-xl border border-line bg-surface-alt p-4 shadow-sm transition-colors">
      <div className="mt-0.5 rounded-lg bg-surface p-2 text-accent border border-line shrink-0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
          <path d="M2 7h20" />
        </svg>
      </div>

      {/* Contenido textual con tokens ink / muted */}
      <div className="flex flex-col gap-1">
        <h4 className="text-sm font-semibold text-ink leading-tight">
          {t("avisoRetiro.titulo", "Retiro exclusivamente en local")}
        </h4>
        <p className="text-xs text-muted leading-relaxed">
          {t(
            "avisoRetiro.descripcion",
            "Todas las compras se entregan en sucursal. Recordá presentar la factura o comprobante de compra al momento del retiro.",
          )}
        </p>
      </div>
    </div>
  );
};
