import { useTranslation } from "react-i18next";
import { estaCerrado, type EstadoItemLote, type ItemLote } from "./lote";

interface Props {
  items: ItemLote[];
  actual: number;
  bloqueado: boolean; // mientras se guarda no se puede cambiar de producto
  onElegir: (id: number) => void;
  onReintentar: (id: number) => void;
  onDescartar: () => void;
}

const colorEstado: Record<EstadoItemLote, string> = {
  esperando: "bg-surface-alt text-muted",
  analizando: "bg-primary-light text-primary",
  pausado: "bg-amber-50 text-amber-800",
  listo: "bg-surface-alt text-ink",
  error: "bg-red-50 text-red-700",
  guardado: "bg-green-700 text-white",
  descartado: "bg-line text-muted",
};

// Tira con los productos de la carga por lote: muestra cómo va cada uno (en espera,
// analizando, listo, error, guardado o descartado) y permite pasar de uno a otro.
// El formulario de abajo es siempre el del producto elegido.
export default function PanelLote({ items, actual, bloqueado, onElegir, onReintentar, onDescartar }: Props) {
  const { t } = useTranslation();
  const item = items[actual];
  const guardados = items.filter((x) => x.estado === "guardado").length;
  const pendientes = items.filter((x) => !estaCerrado(x));
  const analizados = items.filter((x) => !["esperando", "analizando", "pausado"].includes(x.estado)).length;
  const posicion = pendientes.findIndex((x) => x.id === actual);
  const anterior = pendientes[posicion - 1];
  const siguiente = pendientes[posicion + 1];

  const ayuda: Record<EstadoItemLote, string> = {
    esperando: t("admin.lote.ayudaEsperando"),
    analizando: t("admin.lote.ayudaAnalizando"),
    pausado: t("admin.lote.ayudaPausado"),
    listo: t("admin.lote.ayudaListo"),
    error: item.error || t("admin.ia.errorAnalisis"),
    guardado: "",
    descartado: "",
  };

  const botonChico =
    "cursor-pointer rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <section className="space-y-3 rounded-xl border border-primary/40 bg-primary-light/40 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="m-0 text-sm font-bold text-ink">{t("admin.lote.titulo")}</h3>
        <p className="m-0 text-xs text-muted" aria-live="polite">
          {t("admin.lote.resumen", { guardados, total: items.length })}
          {analizados < items.length && ` · ${t("admin.lote.analizados", { analizados, total: items.length })}`}
        </p>
      </div>

      <ol className="m-0 flex list-none gap-2 overflow-x-auto p-0 pb-1">
        {items.map((x) => {
          const esActual = x.id === actual;
          return (
            <li key={x.id} className="shrink-0">
              <button
                type="button"
                onClick={() => onElegir(x.id)}
                disabled={bloqueado || estaCerrado(x) || esActual}
                aria-current={esActual ? "step" : undefined}
                aria-label={`${t("admin.lote.producto", { numero: x.id + 1 })}: ${t(`admin.lote.estado.${x.estado}`)}`}
                className={`block w-18 cursor-pointer overflow-hidden rounded-lg border-2 bg-surface text-left disabled:cursor-default ${
                  esActual ? "border-primary" : "border-line hover:border-primary"
                } ${estaCerrado(x) ? "opacity-60" : ""}`}
              >
                <span className="relative block">
                  <img src={x.vista} alt="" className="aspect-square w-full object-cover" />
                  <span className="absolute top-1 left-1 rounded bg-black/60 px-1.5 text-[11px] font-bold text-white">
                    {x.id + 1}
                  </span>
                </span>
                <span className={`block truncate px-1 py-0.5 text-center text-[10px] font-semibold ${colorEstado[x.estado]}`}>
                  {t(`admin.lote.estado.${x.estado}`)}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="space-y-2 rounded-lg border border-line bg-surface p-3">
        <p className="m-0 text-sm font-semibold text-ink">
          {t("admin.lote.completando", { numero: actual + 1, total: items.length })}
        </p>
        <p
          role={item.estado === "error" ? "alert" : undefined}
          className={`m-0 text-xs ${item.estado === "error" ? "text-red-700" : "text-muted"}`}
        >
          {ayuda[item.estado]}
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => anterior && onElegir(anterior.id)} disabled={bloqueado || !anterior} className={botonChico}>
            {t("admin.anterior")}
          </button>
          <button type="button" onClick={() => siguiente && onElegir(siguiente.id)} disabled={bloqueado || !siguiente} className={botonChico}>
            {t("admin.siguiente")}
          </button>
          {item.estado === "error" && (
            <button type="button" onClick={() => onReintentar(item.id)} disabled={bloqueado} className={botonChico}>
              {t("admin.lote.reintentar")}
            </button>
          )}
          <button
            type="button"
            onClick={onDescartar}
            disabled={bloqueado}
            className={`${botonChico} hover:border-red-500 hover:text-red-700 sm:ml-auto`}
          >
            {t("admin.lote.descartar")}
          </button>
        </div>
      </div>
    </section>
  );
}
