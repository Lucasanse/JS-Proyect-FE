import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import Precio from "../../components/Precio/Precio";
import { obtenerServicios, type ServicioArmado } from "../../services/armador";

interface Props {
  elegidos: ServicioArmado[];
  onCambiar: Dispatch<SetStateAction<ServicioArmado[]>>;
}

// Servicios que se suman al armado: armado de la PC, instalación de Windows, de Office...
// Son servicios del BE (no productos): no tienen stock y van al carrito una sola vez.
export default function ServiciosArmado({ elegidos, onCambiar }: Props) {
  const { t, i18n } = useTranslation();
  const [servicios, setServicios] = useState<ServicioArmado[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    obtenerServicios(controller.signal)
      .then((lista) => {
        setServicios(lista);
        setError(false);
        // Los elegidos guardados en la pestaña se actualizan (precio, idioma) y se descartan los que ya no están
        onCambiar((actuales) => lista.filter((s) => actuales.some((a) => a.id === s.id)));
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [i18n.resolvedLanguage, onCambiar]);

  if (servicios?.length === 0) return null;

  // Se mantiene el orden de la lista, así el carrito queda igual sin importar en qué orden se marcaron
  const cambiar = (servicio: ServicioArmado, elegido: boolean) =>
    onCambiar((actuales) =>
      (servicios ?? []).filter((s) => (s.id === servicio.id ? elegido : actuales.some((a) => a.id === s.id))),
    );

  return (
    <section className="mt-3 border-t border-line pt-3" aria-labelledby="servicios-armado">
      <h3 id="servicios-armado" className="text-xs font-semibold uppercase tracking-wide text-muted">
        {t("armarPc.servicios.titulo")}
      </h3>

      {error ? (
        <p className="mt-2 text-sm text-red-700">{t("armarPc.servicios.error")}</p>
      ) : !servicios ? (
        <div className="mt-2 h-16 animate-pulse rounded-lg bg-surface-alt" aria-label={t("armarPc.cargando")} />
      ) : (
        <ul className="mt-1 divide-y divide-line">
          {servicios.map((servicio) => {
            const elegido = elegidos.some((e) => e.id === servicio.id);
            return (
              <li key={servicio.id}>
                <label className="flex cursor-pointer items-center gap-2.5 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={elegido}
                    onChange={(e) => cambiar(servicio, e.target.checked)}
                    className="h-4 w-4 shrink-0 cursor-pointer accent-primary"
                  />
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-5 w-5 shrink-0 text-muted"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z" />
                  </svg>
                  <span className={`min-w-0 flex-1 ${elegido ? "text-ink" : "text-muted"}`}>{servicio.nombre}</span>
                  <Precio precio={servicio.precio} className="shrink-0 font-semibold text-ink" />
                </label>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-2 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
        <span aria-hidden="true" className="font-bold text-amber-500">
          i
        </span>
        {t("armarPc.servicios.aviso")}
      </p>
    </section>
  );
}
