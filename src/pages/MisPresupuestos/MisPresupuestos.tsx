import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Precio from "../../components/Precio/Precio";
import BotonDescarga from "../../components/Documentos/BotonDescarga";
import { useSession } from "../../services/auth-client";
import { descargarPresupuesto, listarPresupuestos, type DocumentoResumen } from "../../services/documentos";

// Presupuestos generados desde el carrito o el armador: se pueden descargar cuando se quiera.
// Se llega desde el menú del usuario.
export default function MisPresupuestos() {
  const { t } = useTranslation();
  const { data: session, isPending } = useSession();
  const userId = session?.user.id;
  const [presupuestos, setPresupuestos] = useState<DocumentoResumen[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    listarPresupuestos(controller.signal)
      .then(setPresupuestos)
      .catch(() => {
        if (!controller.signal.aborted) setError(t("documentos.errorPresupuestos"));
      });
    return () => controller.abort();
  }, [userId, t]);

  return (
    <section className="mx-auto w-full max-w-4xl p-4">
      <h1 className="mb-6 text-2xl font-bold text-ink">{t("documentos.misPresupuestos")}</h1>
      {isPending ? null : !session ? (
        <p className="rounded-xl border border-line bg-surface p-6 text-muted shadow-sm">
          <Link to="/login" className="font-semibold text-primary hover:underline">
            {t("nav.iniciarSesion")}
          </Link>
        </p>
      ) : error ? (
        <p className="rounded-xl border border-primary/20 bg-primary-light p-4 text-primary">{error}</p>
      ) : !presupuestos ? (
        <div className="flex justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-alt border-t-accent"></div>
        </div>
      ) : presupuestos.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface p-6 text-muted shadow-sm">
          {t("documentos.sinPresupuestos")}
        </p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
          {presupuestos.map((p) => (
            <li key={p.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col">
                <span className="font-bold text-ink">{t("documentos.presupuestoNumero", { numero: p.numero })}</span>
                <span className="text-sm text-muted">
                  {new Date(p.fecha).toLocaleDateString()} · {t(`documentos.origen.${p.origen}`)} ·{" "}
                  {t("documentos.productos", { count: p.cantidadItems })}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <Precio precio={p.total} className="font-bold text-ink" />
                <BotonDescarga etiqueta={t("documentos.descargar")} descargar={() => descargarPresupuesto(p)} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
