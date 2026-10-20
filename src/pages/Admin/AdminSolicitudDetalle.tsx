import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ApiError } from "../../services/adminProductos";
import {
  LIMITES,
  cambiarEstadoSolicitud,
  obtenerSolicitudAdmin,
  responderSolicitud,
  type EstadoSolicitud,
  type SolicitudDetalle,
} from "../../services/servicioTecnico";
import { useToast } from "../../components/Toast/toastContext";
import Modal from "../../components/Modal/Modal";
import EstadoBadge from "../../components/ServicioTecnico/EstadoBadge";
import ErrorCarga from "../../components/ServicioTecnico/ErrorCarga";
import DetalleServicio from "../../components/ServicioTecnico/DetalleServicio";
import { tituloSolicitud } from "../../components/ServicioTecnico/textosSolicitud";
import { claseInput } from "./estilosForm";

// /admin/servicio-tecnico/:id: datos de la solicitud, historial, responder y cambiar estado.
export default function AdminSolicitudDetalle() {
  const { t } = useTranslation();
  const { id } = useParams();
  const location = useLocation();
  // Si se llegó desde el listado, "Volver" respeta los filtros que tenía
  const volverA = (location.state as { volverA?: string } | null)?.volverA ?? "";

  const [solicitud, setSolicitud] = useState<SolicitudDetalle | null>(null);
  const [error, setError] = useState<{ mensaje: string; noExiste: boolean } | null>(null);
  const [recarga, setRecarga] = useState(0);
  const pedido = `${id}-${recarga}`;
  const [pedidoRespondido, setPedidoRespondido] = useState<string | null>(null);
  const cargando = pedidoRespondido !== pedido;

  useEffect(() => {
    const controller = new AbortController();
    obtenerSolicitudAdmin(Number(id), controller.signal)
      .then((s) => {
        setSolicitud(s);
        setError(null);
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setError({
          mensaje: e instanceof Error ? e.message : t("admin.errorCarga"),
          noExiste: e instanceof ApiError && (e.status === 404 || e.status === 400),
        });
      })
      .finally(() => {
        if (!controller.signal.aborted) setPedidoRespondido(pedido);
      });
    return () => controller.abort();
  }, [id, pedido, t]);

  const recargar = () => setRecarga((r) => r + 1);

  return (
    <section className="w-full">
      <Link to={`..${volverA}`} relative="path" className="text-sm font-semibold text-secondary-dark hover:underline">
        ← {t("admin.st.volver")}
      </Link>

      {cargando && !solicitud && !error && <p className="mt-6 text-muted">{t("nav.cargando")}</p>}

      {error?.noExiste && (
        <div className="mt-6 rounded-xl border border-dashed border-line px-4 py-12 text-center text-muted">
          {t("admin.st.noEncontrada")}
        </div>
      )}

      {error && !error.noExiste && !cargando && <ErrorCarga mensaje={error.mensaje} onReintentar={recargar} />}

      {solicitud && !error?.noExiste && (
        <div className={`transition-opacity ${cargando ? "opacity-60" : ""}`} aria-busy={cargando}>
          <header className="mt-4 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-muted">
                {t("servicioTecnico.solicitud")} #{solicitud.id}
              </p>
              <h1 className="m-0 text-2xl font-bold break-words text-ink sm:text-3xl">
                {tituloSolicitud(solicitud, t)}
              </h1>
            </div>
            <EstadoBadge estado={solicitud.estado} grande />
          </header>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
            {/* Columna principal: qué pidió, historial y respuesta */}
            <div className="space-y-6">
              <DetalleServicio solicitud={solicitud} mostrarFecha={false} />

              {solicitud.aceptaRespuestas ? (
                <FormRespuesta idSolicitud={solicitud.id} onRespondida={setSolicitud} />
              ) : (
                <p className="rounded-xl border border-line bg-surface-alt px-4 py-3 text-sm text-muted">
                  {t("admin.st.cerradaSinRespuestas")}
                </p>
              )}
            </div>

            {/* Columna lateral: estado y datos del cliente */}
            <aside className="space-y-6 lg:sticky lg:top-24">
              <CambiarEstado solicitud={solicitud} onCambiado={setSolicitud} onConflicto={recargar} />

              <Tarjeta titulo={t("admin.st.cliente")}>
                <dl className="space-y-2 text-sm">
                  <Dato etiqueta={t("admin.st.nombre")}>{solicitud.cliente.nombre}</Dato>
                  <Dato etiqueta={t("admin.st.correo")}>
                    <a
                      href={`mailto:${solicitud.cliente.correo}`}
                      className="break-all text-secondary-dark hover:underline"
                    >
                      {solicitud.cliente.correo}
                    </a>
                  </Dato>
                  <Dato etiqueta={t("admin.st.telefono")}>
                    {solicitud.cliente.telefono ? (
                      <a href={`tel:${solicitud.cliente.telefono}`} className="text-secondary-dark hover:underline">
                        {solicitud.cliente.telefono}
                      </a>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </Dato>
                </dl>
              </Tarjeta>
            </aside>
          </div>
        </div>
      )}
    </section>
  );
}

function Tarjeta({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
      <h2 className="m-0 mb-3 text-base font-bold text-ink">{titulo}</h2>
      {children}
    </div>
  );
}

function Dato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted">{etiqueta}</dt>
      <dd className="m-0 text-ink">{children}</dd>
    </div>
  );
}

function FormRespuesta({
  idSolicitud,
  onRespondida,
}: {
  idSolicitud: number;
  onRespondida: (s: SolicitudDetalle) => void;
}) {
  const { t } = useTranslation();
  const { mostrarToast } = useToast();
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const enviar = async (ev?: FormEvent) => {
    ev?.preventDefault();
    if (enviando) return;
    if (!mensaje.trim()) {
      setError(t("admin.st.respuestaVacia"));
      return;
    }
    setError("");
    setEnviando(true);
    try {
      onRespondida(await responderSolicitud(idSolicitud, mensaje.trim()));
      setMensaje("");
      mostrarToast(t("admin.st.toastRespuesta"), "exito");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.errorGenerico"));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={enviar} noValidate className="rounded-xl border border-line bg-surface p-5 shadow-sm">
      <label htmlFor="respuesta" className="mb-2 block text-base font-bold text-ink">
        {t("admin.st.responder")}
      </label>
      <textarea
        id="respuesta"
        value={mensaje}
        onChange={(e) => {
          setMensaje(e.target.value);
          if (error) setError("");
        }}
        // Ctrl/Cmd + Enter envía
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) enviar();
        }}
        rows={4}
        maxLength={LIMITES.mensaje.max}
        disabled={enviando}
        placeholder={t("admin.st.respuestaPlaceholder")}
        aria-invalid={!!error}
        className={`${claseInput(error)} resize-y`}
      />
      <div className="mt-1 flex justify-between gap-3 text-xs text-muted">
        <span>{t("admin.st.atajo")}</span>
        <span>
          {mensaje.length}/{LIMITES.mensaje.max}
        </span>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={enviando}
          className="cursor-pointer rounded-lg bg-primary px-4 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:cursor-wait disabled:opacity-60"
        >
          {enviando ? t("admin.st.enviando") : t("admin.st.enviarRespuesta")}
        </button>
      </div>
    </form>
  );
}

function CambiarEstado({
  solicitud,
  onCambiado,
  onConflicto,
}: {
  solicitud: SolicitudDetalle;
  onCambiado: (s: SolicitudDetalle) => void;
  onConflicto: () => void;
}) {
  const { t } = useTranslation();
  const { mostrarToast } = useToast();
  const posibles = solicitud.transicionesPosibles ?? [];
  const [elegido, setElegido] = useState<EstadoSolicitud | "">("");
  const [confirmando, setConfirmando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  // Al rechazar hay que explicarle el motivo al cliente (se guarda como respuesta)
  const [motivo, setMotivo] = useState("");
  const rechazando = elegido === "RECHAZADA";
  const finaliza = elegido === "RECHAZADA" || elegido === "CERRADA";

  const cerrarModal = () => {
    setConfirmando(false);
    setError("");
  };

  // Si cambia el estado actual (por un cambio o una recarga), se limpia la elección
  const [estadoVisto, setEstadoVisto] = useState(solicitud.estado);
  if (estadoVisto !== solicitud.estado) {
    setEstadoVisto(solicitud.estado);
    setElegido("");
  }

  const confirmar = async () => {
    if (!elegido) return;
    if (rechazando && motivo.trim().length < LIMITES.motivoRechazo.min) {
      setError(
        motivo.trim()
          ? t("admin.st.motivoMinimo", { count: LIMITES.motivoRechazo.min })
          : t("admin.st.motivoRequerido"),
      );
      document.getElementById("motivo-rechazo")?.focus();
      return;
    }
    setGuardando(true);
    setError("");
    try {
      const actualizada = await cambiarEstadoSolicitud(solicitud.id, elegido, rechazando ? motivo.trim() : undefined);
      setConfirmando(false);
      setMotivo("");
      onCambiado(actualizada);
      mostrarToast(
        t("admin.st.toastEstado", { id: actualizada.id, estado: t(`servicioTecnico.estados.${actualizada.estado}`) }),
        "exito",
      );
    } catch (e) {
      // 409: la transición ya no es válida (otro admin la cambió). Se recarga para ver el estado real.
      if (e instanceof ApiError && e.status === 409) {
        setConfirmando(false);
        mostrarToast(e.message, "error");
        onConflicto();
      } else {
        setError(e instanceof Error ? e.message : t("admin.errorGenerico"));
      }
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
      <h2 className="m-0 mb-3 text-base font-bold text-ink">{t("admin.st.estado")}</h2>
      <p className="mb-3 flex items-center gap-2 text-sm text-muted">
        {t("admin.st.estadoActual")} <EstadoBadge estado={solicitud.estado} />
      </p>

      {posibles.length === 0 ? (
        <p className="text-sm text-muted">{t("admin.st.estadoFinal")}</p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (elegido) setConfirmando(true);
          }}
          className="space-y-3"
        >
          <label htmlFor="nuevo-estado" className="sr-only">
            {t("admin.st.nuevoEstado")}
          </label>
          <select
            id="nuevo-estado"
            value={elegido}
            onChange={(e) => setElegido(e.target.value as EstadoSolicitud | "")}
            className={claseInput()}
          >
            <option value="">{t("admin.st.elegirEstado")}</option>
            {posibles.map((e) => (
              <option key={e} value={e}>
                {t(`servicioTecnico.estados.${e}`)}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!elegido}
            className="w-full cursor-pointer rounded-lg border border-primary px-4 py-2 font-semibold text-primary transition-colors hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:border-line disabled:text-muted disabled:hover:bg-transparent"
          >
            {t("admin.st.cambiarEstado")}
          </button>
        </form>
      )}

      {confirmando && elegido && (
        <Modal
          titulo={rechazando ? t("admin.st.rechazarTitulo") : t("admin.st.confirmarTitulo")}
          onCerrar={cerrarModal}
          bloqueado={guardando}
          cerrarAlClicFuera={!rechazando}
        >
          <div className="space-y-3 px-5 py-4 text-sm">
            <p className="flex flex-wrap items-center gap-2 text-ink">
              {t("admin.st.confirmarPregunta", { id: solicitud.id })}
              <EstadoBadge estado={solicitud.estado} />
              <span aria-hidden>→</span>
              <EstadoBadge estado={elegido} />
              {t("admin.st.confirmarPreguntaFin")}
            </p>
            <p className="text-muted">
              {rechazando
                ? t("admin.st.confirmarRechazar")
                : elegido === "CERRADA"
                  ? t("admin.st.confirmarCerrar")
                  : t("admin.st.confirmarAviso")}
            </p>
            {rechazando && (
              <div>
                <label htmlFor="motivo-rechazo" className="mb-1 block font-semibold text-ink">
                  {t("admin.st.motivoRechazo")}
                </label>
                <textarea
                  id="motivo-rechazo"
                  value={motivo}
                  onChange={(e) => {
                    setMotivo(e.target.value);
                    if (error) setError("");
                  }}
                  rows={4}
                  maxLength={LIMITES.mensaje.max}
                  disabled={guardando}
                  data-autofocus
                  placeholder={t("admin.st.motivoPlaceholder")}
                  aria-invalid={!!error}
                  className={`${claseInput(error)} resize-y`}
                />
              </div>
            )}
            {error && (
              <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-red-700">
                {error}
              </p>
            )}
          </div>
          <footer className="flex flex-col-reverse gap-2 border-t border-line bg-surface-alt px-5 py-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={cerrarModal}
              disabled={guardando}
              className="cursor-pointer rounded-lg border border-line bg-surface px-4 py-2 font-semibold text-ink transition-colors hover:bg-line disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("admin.cancelar")}
            </button>
            <button
              type="button"
              onClick={confirmar}
              disabled={guardando}
              data-autofocus={rechazando ? undefined : true}
              className={`cursor-pointer rounded-lg px-4 py-2 font-semibold text-white transition-colors disabled:cursor-wait disabled:opacity-60 ${
                finaliza ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:bg-primary-dark"
              }`}
            >
              {guardando ? t("admin.st.guardando") : rechazando ? t("admin.st.rechazar") : t("admin.st.confirmar")}
            </button>
          </footer>
        </Modal>
      )}
    </div>
  );
}
