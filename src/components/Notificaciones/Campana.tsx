import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  type Notificacion,
  conectarNotificaciones,
  marcarNotificacionLeida,
  marcarTodasLeidas,
  obtenerNotificaciones,
} from "../../services/notificaciones";
import { formatearFechaNotificacion } from "./formateadorFechas";
import { descargarFactura, descargarPresupuesto } from "../../services/documentos";

interface Props {
  idUsuario: string | undefined;
}

type Filtro = "todas" | "noLeidas";

const POR_PAGINA = 10;

// Campana del header con el contador de no leídas y el panel de notificaciones.
// El contador y las notificaciones nuevas llegan en tiempo real (SSE), sin recargar.
export const CampanaNotificaciones = ({ idUsuario }: Props) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const idioma = i18n.resolvedLanguage ?? "es";

  const [abierto, setAbierto] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [noLeidas, setNoLeidas] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState(false);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [descargando, setDescargando] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Para descartar respuestas viejas si se cambia de filtro antes de que lleguen
  const ultimoPedido = useRef(0);

  // Se llama desde los eventos (abrir el panel, cambiar el filtro, cargar más, reintentar)
  const cargar = async (page: number, filtroUsado: Filtro = filtro) => {
    const pedido = ++ultimoPedido.current;
    setCargando(true);
    setErrorCarga(false);
    try {
      const res = await obtenerNotificaciones({
        page,
        limit: POR_PAGINA,
        soloNoLeidas: filtroUsado === "noLeidas",
      });
      if (pedido !== ultimoPedido.current) return;
      // Las que llegaron por tiempo real pueden repetirse en la página siguiente
      setNotificaciones((prev) =>
        page === 1 ? res.items : [...prev, ...res.items.filter((n) => !prev.some((p) => p.id === n.id))],
      );
      setPagina(res.page);
      setTotalPaginas(res.totalPages);
      setNoLeidas(res.noLeidas);
    } catch (error) {
      if (pedido !== ultimoPedido.current) return;
      console.error("No se pudieron cargar las notificaciones", error);
      setErrorCarga(true);
    } finally {
      if (pedido === ultimoPedido.current) setCargando(false);
    }
  };

  const alternarPanel = () => {
    if (!abierto) cargar(1);
    setAbierto(!abierto);
  };

  const cambiarFiltro = (valor: Filtro) => {
    if (valor === filtro) return;
    setFiltro(valor);
    cargar(1, valor);
  };

  // Tiempo real: contador y notificaciones nuevas. Se reconecta al cambiar de usuario o idioma
  // (los mensajes vienen traducidos del BE; la lista se vuelve a pedir al abrir el panel).
  useEffect(() => {
    if (!idUsuario) return;
    return conectarNotificaciones({
      onContador: setNoLeidas,
      onNotificacion: (nueva) =>
        setNotificaciones((prev) => (prev.some((n) => n.id === nueva.id) ? prev : [nueva, ...prev])),
    });
  }, [idUsuario, idioma]);

  // Cerrar el panel con click afuera o Escape
  useEffect(() => {
    if (!abierto) return;
    const clickAfuera = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setAbierto(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAbierto(false);
    };
    document.addEventListener("mousedown", clickAfuera);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", clickAfuera);
      document.removeEventListener("keydown", escape);
    };
  }, [abierto]);

  const marcarLeida = async (notif: Notificacion) => {
    if (notif.leida) return;
    setErrorAccion(null);
    // Actualización optimista
    setNotificaciones((prev) => prev.map((n) => (n.id === notif.id ? { ...n, leida: true } : n)));
    setNoLeidas((c) => Math.max(0, c - 1));
    try {
      const res = await marcarNotificacionLeida(notif.id);
      setNoLeidas(res.noLeidas);
    } catch (error) {
      console.error("Falló al marcar como leída", error);
      setNotificaciones((prev) => prev.map((n) => (n.id === notif.id ? { ...n, leida: false } : n)));
      setNoLeidas((c) => c + 1);
      setErrorAccion(t("notificaciones.errorAccion"));
    }
  };

  const marcarTodas = async () => {
    setErrorAccion(null);
    const anteriores = notificaciones;
    const contadorAnterior = noLeidas;
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    setNoLeidas(0);
    try {
      await marcarTodasLeidas();
    } catch (error) {
      console.error("Falló al marcar todas como leídas", error);
      setNotificaciones(anteriores);
      setNoLeidas(contadorAnterior);
      setErrorAccion(t("notificaciones.errorAccion"));
    }
  };

  // Click en la notificación: la marca leída y lleva a la compra o solicitud relacionada
  const abrirNotificacion = (notif: Notificacion) => {
    marcarLeida(notif);
    if (notif.referencia) {
      setAbierto(false);
      navigate(notif.referencia.enlace);
    }
  };

  // Presupuesto o factura disponible: descarga el PDF y marca la notificación como leída
  const descargarDocumento = async (notif: Notificacion) => {
    const doc = notif.documento;
    if (!doc) return;
    setDescargando(notif.id);
    setErrorAccion(null);
    try {
      if (doc.tipo === "FACTURA" && doc.idVenta) await descargarFactura(doc.idVenta);
      else await descargarPresupuesto(doc);
      marcarLeida(notif);
    } catch (error) {
      console.error("No se pudo descargar el documento", error);
      setErrorAccion(error instanceof Error ? error.message : t("documentos.errorDescargar"));
    } finally {
      setDescargando(null);
    }
  };

  if (!idUsuario) return null;

  const botonFiltro = (valor: Filtro) =>
    `px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
      filtro === valor ? "bg-primary text-white" : "text-muted hover:bg-surface"
    }`;

  return (
    <div className="relative" ref={menuRef}>
      {/* Botón de la Campana */}
      <button
        onClick={alternarPanel}
        type="button"
        className="relative p-2 text-ink hover:text-primary transition-colors rounded-full hover:bg-surface-alt"
        aria-label={
          noLeidas > 0
            ? `${t("nav.notificaciones")}: ${t("notificaciones.contador", { count: noLeidas })}`
            : t("nav.notificaciones")
        }
        aria-expanded={abierto}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>

        {/* Badge de contador */}
        {noLeidas > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold text-white bg-primary rounded-full px-1">
            {noLeidas > 99 ? "99+" : noLeidas}
          </span>
        )}
      </button>

      {/* Panel */}
      {abierto && (
        <div className="fixed inset-x-2 top-16 sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 mt-2 sm:w-96 bg-surface border border-line rounded-xl shadow-lg overflow-hidden z-50">
          <div className="p-3 border-b border-line bg-surface-alt flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-ink text-sm">{t("notificaciones.titulo")}</h3>
              {noLeidas > 0 && (
                <button
                  type="button"
                  onClick={marcarTodas}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  {t("notificaciones.marcarTodas")}
                </button>
              )}
            </div>
            <div className="flex gap-1" role="group">
              <button type="button" className={botonFiltro("todas")} onClick={() => cambiarFiltro("todas")}>
                {t("notificaciones.todas")}
              </button>
              <button type="button" className={botonFiltro("noLeidas")} onClick={() => cambiarFiltro("noLeidas")}>
                {t("notificaciones.noLeidas")}
                {noLeidas > 0 && ` (${noLeidas})`}
              </button>
            </div>
          </div>

          {errorAccion && (
            <p role="alert" className="px-3 py-2 text-xs text-primary bg-primary-light border-b border-line">
              {errorAccion}
            </p>
          )}

          <div className="max-h-96 overflow-y-auto">
            {errorCarga && notificaciones.length === 0 ? (
              <div className="p-4 text-center text-sm">
                <p className="text-muted">{t("notificaciones.error")}</p>
                <button
                  type="button"
                  onClick={() => cargar(1)}
                  className="mt-2 text-primary hover:underline font-medium"
                >
                  {t("notificaciones.reintentar")}
                </button>
              </div>
            ) : notificaciones.length === 0 ? (
              <p className="p-4 text-center text-muted text-sm">
                {cargando
                  ? t("notificaciones.cargando")
                  : filtro === "noLeidas"
                    ? t("notificaciones.vacioNoLeidas")
                    : t("notificaciones.vacio")}
              </p>
            ) : (
              <ul className="flex flex-col">
                {notificaciones.map((notif) => (
                  <li
                    key={notif.id}
                    className={`flex gap-2 p-3 border-b border-line transition-colors ${
                      notif.leida ? "" : "bg-primary/5"
                    }`}
                  >
                    {/* Punto de no leída */}
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notif.leida ? "bg-transparent" : "bg-primary"}`}
                      aria-hidden="true"
                    />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <button
                        type="button"
                        onClick={() => abrirNotificacion(notif)}
                        className="text-left rounded hover:opacity-80"
                      >
                        <span className="sr-only">{notif.leida ? "" : `${t("notificaciones.sinLeer")}: `}</span>
                        {notif.titulo && (
                          <span
                            className={`block text-sm ${notif.leida ? "font-medium text-muted" : "font-bold text-ink"}`}
                          >
                            {notif.titulo}
                          </span>
                        )}
                        <span className={`block text-sm ${notif.leida ? "text-muted" : "text-ink"}`}>
                          {notif.mensaje}
                        </span>
                      </button>

                      <div className="flex justify-between items-center mt-2 gap-2">
                        <span className="text-[11px] text-muted">
                          {formatearFechaNotificacion(notif.fecha, idioma)}
                        </span>

                        <div className="flex gap-3">
                          {notif.documento && (
                            <button
                              type="button"
                              onClick={() => descargarDocumento(notif)}
                              disabled={descargando === notif.id}
                              className="text-[11px] text-accent hover:underline font-medium disabled:opacity-50"
                            >
                              {descargando === notif.id
                                ? t("documentos.descargando")
                                : t("documentos.descargarDocumento")}
                            </button>
                          )}
                          {!notif.leida && (
                            <button
                              type="button"
                              onClick={() => marcarLeida(notif)}
                              className="text-[11px] text-muted hover:text-primary hover:underline font-medium"
                            >
                              {t("notificaciones.marcarLeida")}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {pagina < totalPaginas && notificaciones.length > 0 && (
              <button
                type="button"
                onClick={() => cargar(pagina + 1)}
                disabled={cargando}
                className="w-full p-2 text-xs text-primary hover:bg-surface-alt font-medium disabled:opacity-50"
              >
                {cargando ? t("notificaciones.cargando") : t("notificaciones.cargarMas")}
              </button>
            )}
            {errorCarga && notificaciones.length > 0 && (
              <p role="alert" className="p-2 text-center text-xs text-primary">
                {t("notificaciones.error")}
              </p>
            )}
          </div>

          {/* Historial completo */}
          <Link
            to="/notificaciones"
            onClick={() => setAbierto(false)}
            className="block border-t border-line bg-surface-alt p-2.5 text-center text-sm font-medium text-primary hover:underline"
          >
            {t("notificaciones.verTodas")}
          </Link>
        </div>
      )}
    </div>
  );
};
