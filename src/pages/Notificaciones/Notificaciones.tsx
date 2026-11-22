import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSession } from "../../services/auth-client";
import {
  type Notificacion,
  type PaginaNotificaciones,
  conectarNotificaciones,
  marcarNotificacionLeida,
  marcarTodasLeidas,
  obtenerNotificaciones,
} from "../../services/notificaciones";
import { descargarFactura, descargarPresupuesto } from "../../services/documentos";
import { formatearFechaNotificacion } from "../../components/Notificaciones/formateadorFechas";

type Filtro = "todas" | "noLeidas";

const POR_PAGINA = 20;

// Historial completo de notificaciones del usuario (se llega con "Ver todas" desde la campana).
// Las nuevas aparecen arriba sin recargar mientras se está en la primera página.
export default function Notificaciones() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const idioma = i18n.resolvedLanguage ?? "es";
  const { data: session, isPending } = useSession();
  const idUsuario = session?.user.id;

  const [pagina, setPagina] = useState(1);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [recarga, setRecarga] = useState(0);
  // Cada respuesta guarda para qué pedido era: si no coincide con el actual, se está cargando
  const clave = `${pagina}|${filtro}|${idioma}|${recarga}`;
  const [datos, setDatos] = useState<{ clave: string; pagina: PaginaNotificaciones } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [descargando, setDescargando] = useState<number | null>(null);

  useEffect(() => {
    if (!idUsuario) return;
    let vigente = true;
    obtenerNotificaciones({ page: pagina, limit: POR_PAGINA, soloNoLeidas: filtro === "noLeidas" })
      .then((res) => {
        if (!vigente) return;
        setDatos({ clave, pagina: res });
        setError(null);
      })
      .catch((err) => {
        console.error("No se pudieron cargar las notificaciones", err);
        if (vigente) setError(clave);
      });
    return () => {
      vigente = false;
    };
    // clave ya resume pagina, filtro, idioma y recarga
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idUsuario, clave]);

  // Tiempo real: el contador siempre; las nuevas, solo si se está viendo la primera página
  useEffect(() => {
    if (!idUsuario) return;
    return conectarNotificaciones({
      onContador: (noLeidas) =>
        setDatos((prev) => (prev ? { ...prev, pagina: { ...prev.pagina, noLeidas } } : prev)),
      onNotificacion: (nueva) =>
        setDatos((prev) => {
          if (!prev || prev.pagina.page !== 1 || prev.pagina.items.some((n) => n.id === nueva.id)) return prev;
          const total = prev.pagina.total + 1;
          return {
            ...prev,
            pagina: {
              ...prev.pagina,
              items: [nueva, ...prev.pagina.items].slice(0, POR_PAGINA),
              total,
              totalPages: Math.ceil(total / POR_PAGINA),
            },
          };
        }),
    });
  }, [idUsuario, idioma]);

  const actualizarItems = (cambio: (items: Notificacion[]) => Notificacion[], noLeidas: number) =>
    setDatos((prev) =>
      prev ? { ...prev, pagina: { ...prev.pagina, items: cambio(prev.pagina.items), noLeidas } } : prev,
    );

  const marcarLeida = async (notif: Notificacion) => {
    if (notif.leida || !datos) return;
    setErrorAccion(null);
    const noLeidasAntes = datos.pagina.noLeidas;
    actualizarItems(
      (items) => items.map((n) => (n.id === notif.id ? { ...n, leida: true } : n)),
      Math.max(0, noLeidasAntes - 1),
    );
    try {
      await marcarNotificacionLeida(notif.id);
    } catch (err) {
      console.error("Falló al marcar como leída", err);
      actualizarItems((items) => items.map((n) => (n.id === notif.id ? { ...n, leida: false } : n)), noLeidasAntes);
      setErrorAccion(t("notificaciones.errorAccion"));
    }
  };

  const marcarTodas = async () => {
    if (!datos) return;
    setErrorAccion(null);
    const anterior = datos;
    actualizarItems((items) => items.map((n) => ({ ...n, leida: true })), 0);
    try {
      await marcarTodasLeidas();
    } catch (err) {
      console.error("Falló al marcar todas como leídas", err);
      setDatos(anterior);
      setErrorAccion(t("notificaciones.errorAccion"));
    }
  };

  const abrir = (notif: Notificacion) => {
    marcarLeida(notif);
    if (notif.referencia) navigate(notif.referencia.enlace);
  };

  const descargarDocumento = async (notif: Notificacion) => {
    const doc = notif.documento;
    if (!doc) return;
    setDescargando(notif.id);
    setErrorAccion(null);
    try {
      if (doc.tipo === "FACTURA" && doc.idVenta) await descargarFactura(doc.idVenta);
      else await descargarPresupuesto(doc);
      marcarLeida(notif);
    } catch (err) {
      console.error("No se pudo descargar el documento", err);
      setErrorAccion(err instanceof Error ? err.message : t("documentos.errorDescargar"));
    } finally {
      setDescargando(null);
    }
  };

  const cambiarFiltro = (valor: Filtro) => {
    setFiltro(valor);
    setPagina(1);
  };

  const irAPagina = (nueva: number) => {
    setPagina(nueva);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const actual = datos?.pagina;
  const hayError = error === clave;
  const cargando = !hayError && datos?.clave !== clave;

  const botonFiltro = (valor: Filtro) =>
    `px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
      filtro === valor ? "bg-primary text-white" : "text-muted hover:bg-surface-alt"
    }`;

  if (isPending) return null;

  if (!session) {
    return (
      <section className="mx-auto w-full max-w-4xl p-4">
        <h1 className="mb-6 text-2xl font-bold text-ink">{t("notificaciones.titulo")}</h1>
        <p className="rounded-xl border border-line bg-surface p-6 text-muted shadow-sm">
          <Link to="/login" className="font-semibold text-primary hover:underline">
            {t("nav.iniciarSesion")}
          </Link>
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-4xl p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">{t("notificaciones.titulo")}</h1>
          {actual && (
            <p className="text-sm text-muted">
              {actual.noLeidas > 0
                ? t("notificaciones.contador", { count: actual.noLeidas })
                : t("notificaciones.todoLeido")}
            </p>
          )}
        </div>
        {actual && actual.noLeidas > 0 && (
          <button
            type="button"
            onClick={marcarTodas}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-primary hover:bg-surface-alt"
          >
            {t("notificaciones.marcarTodas")}
          </button>
        )}
      </div>

      <div className="mb-4 flex gap-1" role="group">
        <button type="button" className={botonFiltro("todas")} onClick={() => cambiarFiltro("todas")}>
          {t("notificaciones.todas")}
        </button>
        <button type="button" className={botonFiltro("noLeidas")} onClick={() => cambiarFiltro("noLeidas")}>
          {t("notificaciones.noLeidas")}
          {actual && actual.noLeidas > 0 && ` (${actual.noLeidas})`}
        </button>
      </div>

      {errorAccion && (
        <p role="alert" className="mb-4 rounded-xl border border-primary/20 bg-primary-light p-3 text-sm text-primary">
          {errorAccion}
        </p>
      )}

      {hayError ? (
        <div className="rounded-xl border border-primary/20 bg-primary-light p-4 text-primary">
          <p>{t("notificaciones.error")}</p>
          <button
            type="button"
            onClick={() => setRecarga((r) => r + 1)}
            className="mt-2 font-semibold hover:underline"
          >
            {t("notificaciones.reintentar")}
          </button>
        </div>
      ) : !actual ? (
        <div className="flex justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-alt border-t-primary"></div>
        </div>
      ) : actual.items.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface p-6 text-center text-muted shadow-sm">
          {filtro === "noLeidas" ? t("notificaciones.vacioNoLeidas") : t("notificaciones.vacio")}
        </p>
      ) : (
        <ul
          className={`divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface shadow-sm transition-opacity ${
            cargando ? "opacity-60" : ""
          }`}
          aria-busy={cargando}
        >
          {actual.items.map((notif) => (
            <li key={notif.id} className={`flex gap-3 p-4 ${notif.leida ? "" : "bg-primary/5"}`}>
              <span
                className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${notif.leida ? "bg-transparent" : "bg-primary"}`}
                aria-hidden="true"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className={`${notif.leida ? "font-medium text-muted" : "font-bold text-ink"}`}>
                    <span className="sr-only">{notif.leida ? "" : `${t("notificaciones.sinLeer")}: `}</span>
                    {notif.titulo}
                  </span>
                  <time
                    dateTime={notif.fecha}
                    title={new Date(notif.fecha).toLocaleString(idioma)}
                    className="text-xs text-muted"
                  >
                    {formatearFechaNotificacion(notif.fecha, idioma)}
                  </time>
                </div>
                <p className={`text-sm ${notif.leida ? "text-muted" : "text-ink"}`}>{notif.mensaje}</p>

                <div className="mt-1 flex flex-wrap gap-4 text-sm">
                  {notif.referencia && (
                    <button
                      type="button"
                      onClick={() => abrir(notif)}
                      className="font-medium text-primary hover:underline"
                    >
                      {t(`notificaciones.ver.${notif.referencia.tipo}`)}
                    </button>
                  )}
                  {notif.documento && (
                    <button
                      type="button"
                      onClick={() => descargarDocumento(notif)}
                      disabled={descargando === notif.id}
                      className="font-medium text-accent hover:underline disabled:opacity-50"
                    >
                      {descargando === notif.id ? t("documentos.descargando") : t("documentos.descargarDocumento")}
                    </button>
                  )}
                  {!notif.leida && (
                    <button
                      type="button"
                      onClick={() => marcarLeida(notif)}
                      className="font-medium text-muted hover:text-primary hover:underline"
                    >
                      {t("notificaciones.marcarLeida")}
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {actual && actual.totalPages > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-3" aria-label={t("notificaciones.paginacion")}>
          <button
            type="button"
            onClick={() => irAPagina(pagina - 1)}
            disabled={pagina <= 1 || cargando}
            className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-alt disabled:opacity-40"
          >
            {t("notificaciones.anterior")}
          </button>
          <span className="text-sm text-muted">
            {t("notificaciones.paginaDe", { pagina, total: actual.totalPages })}
          </span>
          <button
            type="button"
            onClick={() => irAPagina(pagina + 1)}
            disabled={pagina >= actual.totalPages || cargando}
            className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-alt disabled:opacity-40"
          >
            {t("notificaciones.siguiente")}
          </button>
        </nav>
      )}
    </section>
  );
}
