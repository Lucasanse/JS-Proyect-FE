import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSession } from "../../services/auth-client";
import { ApiError } from "../../services/adminProductos";
import {
  obtenerMiSolicitud,
  type EventoHistorial,
  type SolicitudDetalle,
  type TipoServicio,
} from "../../services/servicioTecnico";
import ErrorCarga from "../../components/ServicioTecnico/ErrorCarga";
import { COLORES_ESTADO } from "../../components/ServicioTecnico/coloresEstado";
import { tituloSolicitud } from "../../components/ServicioTecnico/textosSolicitud";
import { formatoFecha } from "../../components/ServicioTecnico/formatoFecha";

// /servicio-tecnico/:id: lo que ve el cliente de una solicitud, todo como texto y listas
// (sin tarjetas ni botones): estado, respuestas del comercio, lo que se va a hacer y sus comentarios.
export default function DetalleSolicitud() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { data: session, isPending } = useSession();
  const [solicitud, setSolicitud] = useState<SolicitudDetalle | null>(null);
  const [error, setError] = useState<{ mensaje: string; noExiste: boolean } | null>(null);
  const [recarga, setRecarga] = useState(0);
  // Se está cargando mientras la última respuesta no corresponda al pedido actual
  const pedido = `${id}-${recarga}`;
  const [pedidoRespondido, setPedidoRespondido] = useState<string | null>(null);
  const cargando = pedidoRespondido !== pedido;

  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    obtenerMiSolicitud(Number(id), controller.signal)
      .then((s) => {
        setSolicitud(s);
        setError(null);
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setError({
          mensaje: e instanceof Error ? e.message : t("servicioTecnico.errorCarga"),
          noExiste: e instanceof ApiError && (e.status === 404 || e.status === 400),
        });
      })
      .finally(() => {
        if (!controller.signal.aborted) setPedidoRespondido(pedido);
      });
    return () => controller.abort();
  }, [id, session, pedido, t]);

  let contenido;
  if (isPending || (session && cargando && !solicitud && !error)) {
    contenido = <p className="mt-6 text-muted">{t("nav.cargando")}</p>;
  } else if (!session) {
    contenido = (
      <p className="mt-6 text-ink">
        {t("servicioTecnico.sesionAntes")}{" "}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          {t("servicioTecnico.sesionLink")}
        </Link>{" "}
        {t("servicioTecnico.sesionDespuesDetalle")}
      </p>
    );
  } else if (error?.noExiste) {
    contenido = <p className="mt-6 text-muted">{t("servicioTecnico.noEncontrada")}</p>;
  } else if (error && !solicitud) {
    contenido = <ErrorCarga mensaje={error.mensaje} onReintentar={() => setRecarga((r) => r + 1)} />;
  } else if (solicitud) {
    contenido = <Detalle solicitud={solicitud} />;
  }

  return (
    <section className="w-full flex-1 bg-surface-alt">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-line bg-surface px-5 py-6 sm:px-8">
          <Link to="/servicio-tecnico?tab=mis" className="text-sm font-semibold text-secondary-dark hover:underline">
            ← {t("servicioTecnico.volver")}
          </Link>
          {contenido}
        </div>
      </div>
    </section>
  );
}

type Respuesta = Extract<EventoHistorial, { tipo: "respuesta" }>;

function Detalle({ solicitud: s }: { solicitud: SolicitudDetalle }) {
  const { t } = useTranslation();
  // Lo que respondió el comercio, la más nueva primero
  const respuestas = s.historial.filter((e): e is Respuesta => e.tipo === "respuesta").reverse();
  const pide = (servicio: TipoServicio) => s.servicios.includes(servicio);

  return (
    <>
      <header className="mt-4">
        <p className="text-sm text-muted">
          {t("servicioTecnico.solicitud")} #{s.id} · {t("servicioTecnico.lista.enviada")} {formatoFecha(s.fecha, false)}
        </p>
        <h1 className="m-0 mt-1 text-2xl font-bold break-words text-ink sm:text-3xl">{tituloSolicitud(s, t)}</h1>
        <p className="mt-2 text-ink">
          {t("servicioTecnico.lista.estado")}{" "}
          <strong className={COLORES_ESTADO[s.estado]?.texto}>{t(`servicioTecnico.estados.${s.estado}`)}</strong>
        </p>
        {s.estado === "CERRADA" && <p className="mt-1 text-sm text-muted">{t("servicioTecnico.cerradaAviso")}</p>}
        {s.estado === "RECHAZADA" && <p className="mt-1 text-sm text-muted">{t("servicioTecnico.rechazadaAviso")}</p>}
      </header>

      {respuestas.length > 0 ? (
        <RespuestasComercio respuestas={respuestas} rechazada={s.estado === "RECHAZADA"} />
      ) : (
        <Seccion titulo={t("servicioTecnico.respuestasTitulo", { count: 1 })}>
          <p className="text-muted">
            {s.estado === "CERRADA" || s.estado === "RECHAZADA"
              ? t("servicioTecnico.lista.sinRespuestas")
              : t("servicioTecnico.esperandoRespuesta")}
          </p>
        </Seccion>
      )}

      {/* Si se rechazó, no se va a hacer nada: se muestra como lo que pidió el cliente */}
      <Seccion
        titulo={
          s.estado === "RECHAZADA" ? t("servicioTecnico.lista.loQuePediste") : t("servicioTecnico.lista.queVamosAHacer")
        }
      >
        <ol className="list-decimal space-y-1 pl-5">
          {s.servicios.map((servicio) => (
            <li key={servicio}>
              {t(`servicioTecnico.lista.servicios.${servicio}`)}
              <Detalles>
                {servicio === "REPARACION" && s.tipoEquipo && (
                  <li>
                    {t("servicioTecnico.lista.equipo")} {t(`servicioTecnico.equipos.${s.tipoEquipo}`)}
                  </li>
                )}
                {servicio === "LIMPIEZA" && s.conPastaTermica && <li>{t("servicioTecnico.lista.pastaTermica")}</li>}
                {servicio === "FORMATEO" && s.conBackup && <li>{t("servicioTecnico.lista.backup")}</li>}
                {servicio === "INSTALACION_SOFTWARE" &&
                  s.software.map((p) => <li key={p}>{t(`servicioTecnico.software.${p}`)}</li>)}
              </Detalles>
            </li>
          ))}
        </ol>
      </Seccion>

      {s.descripcion && (
        <Seccion
          titulo={
            pide("REPARACION")
              ? t("servicioTecnico.lista.queLeSucede")
              : pide("OTRO")
                ? t("servicioTecnico.lista.queNecesitas")
                : t("servicioTecnico.lista.comentarios")
          }
        >
          <p className="whitespace-pre-wrap break-words text-muted">{s.descripcion}</p>
        </Seccion>
      )}
    </>
  );
}

// Bloque separado por una línea, con su título
function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="mt-5 border-t border-line pt-5">
      <h2 className="m-0 mb-2 text-lg font-bold text-ink">{titulo}</h2>
      <div className="text-ink">{children}</div>
    </section>
  );
}

// Sublista de un servicio (pasta térmica, backup, programas...). Si no tiene nada no se muestra.
function Detalles({ children }: { children: ReactNode }) {
  const items = (Array.isArray(children) ? children.flat() : [children]).filter(Boolean);
  if (items.length === 0) return null;
  return <ul className="list-[circle] pl-5 text-muted">{children}</ul>;
}

// Lo que respondió el comercio, destacado con el color de la marca para que se vea primero.
// La más nueva va arriba, más grande y marcada como "Última respuesta".
// Si la solicitud fue rechazada, la última respuesta es el motivo (el admin lo escribe al rechazar).
function RespuestasComercio({ respuestas, rechazada }: { respuestas: Respuesta[]; rechazada: boolean }) {
  const { t } = useTranslation();
  const etiquetaPrimera = rechazada
    ? t("servicioTecnico.lista.motivoRechazo")
    : respuestas.length > 1
      ? t("servicioTecnico.lista.ultimaRespuesta")
      : null;
  return (
    <section className="mt-5 rounded-xl border border-primary/25 border-l-4 border-l-primary bg-primary-light px-4 py-4 sm:px-5">
      <h2 className="m-0 text-lg font-bold text-primary">
        {t("servicioTecnico.respuestasTitulo", { count: respuestas.length })}
      </h2>
      <ul className="mt-3 space-y-3">
        {respuestas.map((r, i) => (
          <li key={r.id} className={`rounded-lg bg-surface px-4 py-3 ${i === 0 ? "ring-1 ring-primary/30" : ""}`}>
            {i === 0 && etiquetaPrimera && (
              <p className="mb-1 text-xs font-bold tracking-wide text-primary uppercase">{etiquetaPrimera}</p>
            )}
            <p className={`whitespace-pre-wrap break-words text-ink ${i === 0 ? "text-base font-medium" : "text-sm"}`}>
              {r.mensaje}
            </p>
            <time dateTime={r.fecha} className="mt-1 block text-xs text-muted">
              {formatoFecha(r.fecha)}
            </time>
          </li>
        ))}
      </ul>
    </section>
  );
}
