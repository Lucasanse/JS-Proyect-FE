import { useEffect, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSession } from "../../services/auth-client";
import { listarMisSolicitudes, type SolicitudDetalle, type SolicitudResumen } from "../../services/servicioTecnico";
import EstadoBadge from "../../components/ServicioTecnico/EstadoBadge";
import ErrorCarga from "../../components/ServicioTecnico/ErrorCarga";
import { formatoFecha } from "../../components/ServicioTecnico/formatoFecha";
import { resumenSolicitud, tituloSolicitud } from "../../components/ServicioTecnico/textosSolicitud";
import NuevaSolicitudForm from "./NuevaSolicitudForm";

// /servicio-tecnico: el cliente logueado envía una solicitud (pestaña "Nueva solicitud")
// o ve el estado de las suyas (pestaña "Mis solicitudes", /servicio-tecnico?tab=mis).
export default function ServicioTecnico() {
  const { t } = useTranslation();
  const { data: session, isPending } = useSession();

  return (
    <section className="w-full flex-1 bg-surface-alt">
      {/* Columna centrada: título, pestañas y contenido */}
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <header className="text-center">
          <h1 className="m-0 text-3xl font-bold text-ink">{t("servicioTecnico.titulo")}</h1>
          <p className="mx-auto mt-2 max-w-2xl text-muted">{t("servicioTecnico.intro")}</p>
        </header>

        <div className="mt-8">
          {isPending ? <p className="text-muted">{t("nav.cargando")}</p> : !session ? <AvisoLogin /> : <PanelCliente />}
        </div>
      </div>
    </section>
  );
}

function AvisoLogin() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-xl rounded-xl border border-line bg-surface p-6 text-center shadow-sm">
      <p className="text-ink">
        {t("servicioTecnico.sesionAntes")}{" "}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          {t("servicioTecnico.sesionLink")}
        </Link>{" "}
        {t("servicioTecnico.sesionDespues")}
      </p>
      <p className="mt-2 text-sm text-muted">
        {t("servicioTecnico.sinCuenta")}{" "}
        <Link to="/register" className="font-semibold text-primary hover:underline">
          {t("servicioTecnico.registrate")}
        </Link>
      </p>
    </div>
  );
}

type Pestania = "nueva" | "mis";

function PanelCliente() {
  const { t } = useTranslation();
  // La pestaña vive en la URL, así "Volver" desde el detalle abre "Mis solicitudes"
  const [searchParams, setSearchParams] = useSearchParams();
  const pestania: Pestania = searchParams.get("tab") === "mis" ? "mis" : "nueva";
  const [solicitudes, setSolicitudes] = useState<SolicitudResumen[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recarga, setRecarga] = useState(0);
  // Para resaltar la que se acaba de crear
  const [idNueva, setIdNueva] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    listarMisSolicitudes(controller.signal)
      .then((lista) => {
        setSolicitudes(lista);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : t("servicioTecnico.errorCarga"));
      });
    return () => controller.abort();
  }, [recarga, t]);

  const cambiarPestania = (nueva: Pestania) => {
    if (nueva === pestania) return;
    setSearchParams(nueva === "mis" ? { tab: "mis" } : {}, { replace: true });
    // Al volver a "Mis solicitudes" se recargan, por si el técnico respondió algo
    if (nueva === "mis") setRecarga((r) => r + 1);
  };

  // Al crear una solicitud se pasa a "Mis solicitudes" con la nueva resaltada
  const alCrear = (nueva: SolicitudDetalle) => {
    setIdNueva(nueva.id);
    setSolicitudes((prev) => [nueva, ...(prev ?? [])]);
    setSearchParams({ tab: "mis" }, { replace: true });
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label={t("servicioTecnico.titulo")}
        className="flex justify-center gap-1 border-b border-line"
      >
        <BotonPestania activa={pestania === "nueva"} onClick={() => cambiarPestania("nueva")} id="nueva">
          {t("servicioTecnico.tabs.nueva")}
        </BotonPestania>
        <BotonPestania activa={pestania === "mis"} onClick={() => cambiarPestania("mis")} id="mis">
          {t("servicioTecnico.tabs.mis")}
          {solicitudes && solicitudes.length > 0 && (
            <span
              className={`rounded-full px-1.5 text-xs font-semibold ${
                pestania === "mis" ? "bg-primary text-white" : "bg-surface-alt text-muted"
              }`}
            >
              {solicitudes.length}
            </span>
          )}
        </BotonPestania>
      </div>

      <div role="tabpanel" id={`panel-${pestania}`} aria-labelledby={`tab-${pestania}`} className="pt-6">
        {pestania === "nueva" ? (
          <NuevaSolicitudForm onCreada={alCrear} />
        ) : (
          <MisSolicitudes
            solicitudes={solicitudes}
            error={error}
            idNueva={idNueva}
            onRecargar={() => setRecarga((r) => r + 1)}
            onNueva={() => cambiarPestania("nueva")}
          />
        )}
      </div>
    </div>
  );
}

function BotonPestania({
  id,
  activa,
  onClick,
  children,
}: {
  id: Pestania;
  activa: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      id={`tab-${id}`}
      aria-selected={activa}
      aria-controls={`panel-${id}`}
      onClick={onClick}
      className={`-mb-px flex cursor-pointer items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors sm:text-base ${
        activa ? "border-primary text-primary" : "border-transparent text-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function MisSolicitudes({
  solicitudes,
  error,
  idNueva,
  onRecargar,
  onNueva,
}: {
  solicitudes: SolicitudResumen[] | null;
  error: string | null;
  idNueva: number | null;
  onRecargar: () => void;
  onNueva: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div>
      {error && <ErrorCarga mensaje={error} onReintentar={onRecargar} />}

      {!solicitudes && !error && <EsqueletoLista />}

      {solicitudes?.length === 0 && (
        <div className="mt-4 rounded-xl border border-dashed border-line bg-surface px-4 py-10 text-center text-muted">
          <p>{t("servicioTecnico.sinSolicitudes")}</p>
          <button
            type="button"
            onClick={onNueva}
            className="mt-4 cursor-pointer rounded-lg bg-primary px-4 py-2 font-semibold text-white hover:bg-primary-dark"
          >
            {t("servicioTecnico.tabs.nueva")}
          </button>
        </div>
      )}

      {solicitudes && solicitudes.length > 0 && (
        <ul className="mt-4 space-y-3">
          {solicitudes.map((s) => (
            <li key={s.id}>
              <TarjetaSolicitud solicitud={s} nueva={s.id === idNueva} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TarjetaSolicitud({ solicitud: s, nueva }: { solicitud: SolicitudResumen; nueva: boolean }) {
  const { t } = useTranslation();
  return (
    <Link
      to={`/servicio-tecnico/${s.id}`}
      className={`group block rounded-xl border bg-surface p-4 shadow-sm transition hover:border-primary hover:shadow-md ${
        nueva ? "border-primary ring-2 ring-primary-light" : "border-line"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted">
            #{s.id} · {formatoFecha(s.fecha, false)}
          </p>
          <p className="font-semibold text-ink">{tituloSolicitud(s, t)}</p>
        </div>
        <EstadoBadge estado={s.estado} />
      </div>
      {resumenSolicitud(s, t) && <p className="mt-2 line-clamp-2 text-sm text-muted">{resumenSolicitud(s, t)}</p>}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-xs text-muted">
        <span>
          {t("servicioTecnico.actualizada")} {formatoFecha(s.actualizadoEn)}
        </span>
        <span className="flex items-center gap-3">
          {s.cantidadRespuestas > 0 && (
            <span className="rounded-full bg-primary-light px-2 py-0.5 font-semibold text-primary">
              {t("servicioTecnico.respuestas", { count: s.cantidadRespuestas })}
            </span>
          )}
          <span className="font-semibold text-primary group-hover:underline">{t("servicioTecnico.verDetalle")}</span>
        </span>
      </div>
    </Link>
  );
}

function EsqueletoLista() {
  return (
    <div className="mt-4 space-y-3" aria-hidden>
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="animate-pulse space-y-2 rounded-xl border border-line bg-surface p-4">
          <div className="h-3 w-12 rounded bg-surface-alt" />
          <div className="h-4 w-1/2 rounded bg-surface-alt" />
          <div className="h-3 w-3/4 rounded bg-surface-alt" />
        </div>
      ))}
    </div>
  );
}
