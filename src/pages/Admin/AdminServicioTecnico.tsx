import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ESTADOS_SOLICITUD,
  listarSolicitudesAdmin,
  type EstadoSolicitud,
  type ListadoSolicitudesAdmin,
} from "../../services/servicioTecnico";
import EstadoBadge from "../../components/ServicioTecnico/EstadoBadge";
import ErrorCarga from "../../components/ServicioTecnico/ErrorCarga";
import { formatoFecha } from "../../components/ServicioTecnico/formatoFecha";
import { resumenSolicitud, tituloSolicitud } from "../../components/ServicioTecnico/textosSolicitud";

const esEstado = (valor: string | null): valor is EstadoSolicitud =>
  (ESTADOS_SOLICITUD as readonly (string | null)[]).includes(valor);

// /admin/servicio-tecnico: todas las solicitudes, con filtro por estado y búsqueda.
export default function AdminServicioTecnico() {
  const { t } = useTranslation();

  // Los filtros viven en la URL, así se mantienen al recargar y al volver del detalle
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const estadoParam = searchParams.get("estado");
  const estado = esEstado(estadoParam) ? estadoParam : "";
  const page = Number(searchParams.get("page")) || 1;

  const [busqueda, setBusqueda] = useState(q);
  const [datos, setDatos] = useState<ListadoSolicitudesAdmin | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recarga, setRecarga] = useState(0);
  // Se está cargando mientras la última respuesta no corresponda a los filtros actuales
  const pedido = JSON.stringify([q, estado, page, recarga]);
  const [pedidoRespondido, setPedidoRespondido] = useState<string | null>(null);
  const cargando = pedidoRespondido !== pedido;

  const cambiarFiltros = (nuevos: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    for (const [clave, valor] of Object.entries(nuevos)) {
      if (valor) params.set(clave, valor);
      else params.delete(clave);
    }
    if (!("page" in nuevos)) params.delete("page");
    setSearchParams(params, { replace: true });
  };

  // La búsqueda se aplica cuando el admin deja de escribir
  useEffect(() => {
    if (busqueda.trim() === q) return;
    const timer = setTimeout(() => cambiarFiltros({ q: busqueda.trim() }), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda]);

  useEffect(() => {
    const controller = new AbortController();
    listarSolicitudesAdmin({ q, estado, page }, controller.signal)
      .then((respuesta) => {
        setDatos(respuesta);
        setError(null);
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : t("admin.errorCarga"));
      })
      .finally(() => {
        if (!controller.signal.aborted) setPedidoRespondido(pedido);
      });
    return () => controller.abort();
  }, [q, estado, page, pedido, t]);

  const solicitudes = datos?.data ?? [];
  const conteo = datos?.conteoPorEstado;
  const totalSinFiltroEstado = conteo ? Object.values(conteo).reduce((a, b) => a + b, 0) : null;
  const hayFiltros = !!(q || estado);
  // Se manda la URL actual al detalle para que "Volver" respete los filtros
  const desde = { state: { volverA: `?${searchParams}` } };

  return (
    <section className="w-full">
      <header>
        <h1 className="m-0 text-3xl font-bold text-primary">{t("admin.st.titulo")}</h1>
        <p className="mt-1 text-muted">
          {datos ? t("admin.st.cantidad", { count: datos.paginacion.total }) : t("admin.st.subtitulo")}
        </p>
      </header>

      {/* Filtros: búsqueda + estado (con la cantidad de solicitudes de cada uno) */}
      <div className="mt-6 flex flex-col gap-3 rounded-xl border border-line bg-surface-alt p-3 md:flex-row md:items-center">
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder={t("admin.st.buscar")}
          aria-label={t("admin.st.buscar")}
          className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
        />
        <select
          value={estado}
          onChange={(e) => cambiarFiltros({ estado: e.target.value })}
          aria-label={t("admin.st.filtroEstado")}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-ink outline-none focus:border-primary md:w-60"
        >
          <option value="">
            {t("admin.st.todosEstados")}
            {totalSinFiltroEstado !== null && ` (${totalSinFiltroEstado})`}
          </option>
          {ESTADOS_SOLICITUD.map((e) => (
            <option key={e} value={e}>
              {t(`servicioTecnico.estados.${e}`)}
              {conteo && ` (${conteo[e]})`}
            </option>
          ))}
        </select>
      </div>

      {error && !cargando && <ErrorCarga mensaje={error} onReintentar={() => setRecarga((r) => r + 1)} />}

      {cargando && !datos && <EsqueletoTabla />}

      {!cargando && !error && solicitudes.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-line px-4 py-12 text-center text-muted">
          {hayFiltros ? t("admin.st.sinResultados") : t("admin.st.sinSolicitudes")}
        </div>
      )}

      {solicitudes.length > 0 && (
        <div className={`transition-opacity ${cargando ? "pointer-events-none opacity-50" : ""}`} aria-busy={cargando}>
          {/* Desktop: tabla */}
          <div className="mt-6 hidden overflow-hidden rounded-xl border border-line md:block">
            <table className="w-full table-fixed border-collapse text-left text-sm">
              <thead className="bg-surface-alt text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th className="w-14 px-4 py-3 font-semibold">#</th>
                  <th className="w-[28%] px-4 py-3 font-semibold">{t("admin.st.col.cliente")}</th>
                  <th className="px-4 py-3 font-semibold">{t("admin.st.col.servicio")}</th>
                  <th className="w-36 px-4 py-3 font-semibold">{t("admin.st.col.estado")}</th>
                  <th className="w-28 px-4 py-3 font-semibold">{t("admin.st.col.fecha")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {solicitudes.map((s) => (
                  // Toda la fila es clickeable: el link del servicio se estira sobre la fila (after:inset-0)
                  <tr key={s.id} className="relative bg-surface transition-colors hover:bg-surface-alt/60">
                    <td className="px-4 py-3 font-semibold text-muted">{s.id}</td>
                    <td className="px-4 py-3">
                      <p className="truncate font-semibold text-ink">{s.cliente.nombre}</p>
                      <p className="truncate text-xs text-muted">{s.cliente.correo}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={String(s.id)}
                        {...desde}
                        className="block truncate font-medium text-ink after:absolute after:inset-0 hover:text-primary hover:underline"
                      >
                        {tituloSolicitud(s, t)}
                      </Link>
                      <p className="truncate text-xs text-muted">{resumenSolicitud(s, t)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <EstadoBadge estado={s.estado} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted">
                      {formatoFecha(s.fecha, false)}
                      {s.cantidadRespuestas > 0 && (
                        <p className="text-xs">{t("servicioTecnico.respuestas", { count: s.cantidadRespuestas })}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: tarjetas */}
          <ul className="mt-6 space-y-3 md:hidden">
            {solicitudes.map((s) => (
              <li key={s.id}>
                <Link
                  to={String(s.id)}
                  {...desde}
                  className="block rounded-xl border border-line bg-surface p-3 shadow-sm transition hover:border-primary"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-muted">
                        #{s.id} · {formatoFecha(s.fecha, false)}
                      </p>
                      <p className="font-semibold text-ink">{tituloSolicitud(s, t)}</p>
                    </div>
                    <EstadoBadge estado={s.estado} />
                  </div>
                  <p className="mt-1 truncate text-sm text-muted">
                    {s.cliente.nombre} · {s.cliente.correo}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          {datos && datos.paginacion.totalPages > 1 && (
            <nav className="mt-6 flex items-center justify-center gap-3" aria-label={t("admin.paginacion")}>
              <button
                type="button"
                disabled={!datos.paginacion.hasPrev}
                onClick={() => cambiarFiltros({ page: String(page - 1) })}
                className="cursor-pointer rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-ink hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← {t("admin.anterior")}
              </button>
              <span className="text-sm text-muted">
                {t("admin.pagina", { actual: page, total: datos.paginacion.totalPages })}
              </span>
              <button
                type="button"
                disabled={!datos.paginacion.hasNext}
                onClick={() => cambiarFiltros({ page: String(page + 1) })}
                className="cursor-pointer rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-ink hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("admin.siguiente")} →
              </button>
            </nav>
          )}
        </div>
      )}
    </section>
  );
}

function EsqueletoTabla() {
  return (
    <div className="mt-6 space-y-2" aria-hidden>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex animate-pulse items-center gap-3 rounded-xl border border-line p-3">
          <div className="h-4 w-8 rounded bg-surface-alt" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/2 rounded bg-surface-alt" />
            <div className="h-3 w-1/4 rounded bg-surface-alt" />
          </div>
          <div className="h-6 w-24 rounded-full bg-surface-alt" />
        </div>
      ))}
    </div>
  );
}
