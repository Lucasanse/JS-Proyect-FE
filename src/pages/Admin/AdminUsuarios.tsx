import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  listarUsuariosAdmin,
  type FiltroHabilitado,
  type UsuarioAdmin,
} from "../../services/adminUsuarios";
import type { Paginado } from "../../services/productos";
import { useSession } from "../../services/auth-client";
import { useToast } from "../../components/Toast/toastContext";
import ErrorCarga from "../../components/ServicioTecnico/ErrorCarga";
import { formatoFecha } from "../../components/ServicioTecnico/formatoFecha";
import { ConfirmarCambio, RolBadge, SwitchHabilitado } from "./UsuarioComponentes";

const ESTADOS: FiltroHabilitado[] = ["todos", "habilitados", "deshabilitados"];
const esEstado = (valor: string | null): valor is FiltroHabilitado =>
  (ESTADOS as (string | null)[]).includes(valor);

// /admin/usuarios: usuarios registrados, con búsqueda por nombre o email,
// y el switch para habilitar o deshabilitar cada cuenta (con confirmación).
// El nombre lleva al detalle (/admin/usuarios/:id).
export default function AdminUsuarios() {
  const { t } = useTranslation();
  const { mostrarToast } = useToast();
  const { data: session } = useSession();

  // Los filtros viven en la URL, así se mantienen al recargar
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const estadoParam = searchParams.get("estado");
  const estado = esEstado(estadoParam) ? estadoParam : "todos";
  const page = Number(searchParams.get("page")) || 1;

  const [busqueda, setBusqueda] = useState(q);
  const [datos, setDatos] = useState<Paginado<UsuarioAdmin> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recarga, setRecarga] = useState(0);
  // Se está cargando mientras la última respuesta no corresponda a los filtros actuales
  const pedido = JSON.stringify([q, estado, page, recarga]);
  const [pedidoRespondido, setPedidoRespondido] = useState<string | null>(null);
  const cargando = pedidoRespondido !== pedido;
  // Usuario al que se le va a cambiar el estado (modal de confirmación abierto)
  const [confirmando, setConfirmando] = useState<UsuarioAdmin | null>(null);

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
    listarUsuariosAdmin({ q, estado, page }, controller.signal)
      .then((respuesta) => {
        setDatos(respuesta);
        setError(null);
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : t("admin.us.errorCarga"));
      })
      .finally(() => {
        if (!controller.signal.aborted) setPedidoRespondido(pedido);
      });
    return () => controller.abort();
  }, [q, estado, page, pedido, t]);

  // El cambio se ve al instante en la fila, sin recargar la lista
  const alCambiar = (usuario: UsuarioAdmin) => {
    setConfirmando(null);
    setDatos((prev) => prev && { ...prev, data: prev.data.map((u) => (u.id === usuario.id ? usuario : u)) });
    mostrarToast(
      t(usuario.habilitado ? "admin.us.toastHabilitado" : "admin.us.toastDeshabilitado", { nombre: usuario.nombre }),
      "exito",
    );
  };

  const usuarios = datos?.data ?? [];
  const hayFiltros = !!(q || estado !== "todos");
  const esYo = (u: UsuarioAdmin) => session?.user.id === String(u.id);
  // Se manda la URL actual al detalle para que "Volver" respete los filtros
  const desde = { state: { volverA: `?${searchParams}` } };

  const switchEstado = (u: UsuarioAdmin) => (
    <SwitchHabilitado usuario={u} propio={esYo(u)} onCambiar={() => setConfirmando(u)} />
  );

  return (
    <section className="w-full">
      <header>
        <h1 className="m-0 text-3xl font-bold text-primary">{t("admin.us.titulo")}</h1>
        <p className="mt-1 text-muted">
          {datos ? t("admin.us.cantidad", { count: datos.paginacion.total }) : t("admin.us.subtitulo")}
        </p>
      </header>

      {/* Filtros: búsqueda + estado de la cuenta */}
      <div className="mt-6 flex flex-col gap-3 rounded-xl border border-line bg-surface-alt p-3 md:flex-row md:items-center">
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder={t("admin.us.buscar")}
          aria-label={t("admin.us.buscar")}
          className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
        />
        <div role="group" aria-label={t("admin.us.col.estado")} className="flex rounded-lg border border-line bg-surface p-1">
          {ESTADOS.map((e) => (
            <button
              key={e}
              type="button"
              aria-pressed={estado === e}
              onClick={() => cambiarFiltros({ estado: e === "todos" ? "" : e })}
              className={`flex-1 cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                estado === e ? "bg-primary text-white" : "text-muted hover:text-ink"
              }`}
            >
              {t(`admin.us.filtro.${e}`)}
            </button>
          ))}
        </div>
      </div>

      {error && !cargando && <ErrorCarga mensaje={error} onReintentar={() => setRecarga((r) => r + 1)} />}

      {cargando && !datos && <EsqueletoTabla />}

      {!cargando && !error && usuarios.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-line px-4 py-12 text-center text-muted">
          {hayFiltros ? t("admin.us.sinResultados") : t("admin.us.sinUsuarios")}
        </div>
      )}

      {usuarios.length > 0 && (
        <div className={`transition-opacity ${cargando ? "pointer-events-none opacity-50" : ""}`} aria-busy={cargando}>
          {/* Desktop: tabla */}
          <div className="mt-6 hidden overflow-hidden rounded-xl border border-line md:block">
            <table className="w-full table-fixed border-collapse text-left text-sm">
              <thead className="bg-surface-alt text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th className="w-[26%] px-4 py-3 font-semibold">{t("admin.us.col.nombre")}</th>
                  <th className="px-4 py-3 font-semibold">{t("admin.us.col.email")}</th>
                  <th className="w-28 px-4 py-3 font-semibold">{t("admin.us.col.rol")}</th>
                  <th className="w-28 px-4 py-3 font-semibold">{t("admin.us.col.alta")}</th>
                  <th className="w-44 px-4 py-3 font-semibold">{t("admin.us.col.estado")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {usuarios.map((u) => (
                  <tr key={u.id} className="bg-surface">
                    <td className="px-4 py-3">
                      <p className="truncate">
                        <Link
                          to={String(u.id)}
                          {...desde}
                          className={`font-semibold hover:text-primary hover:underline ${u.habilitado ? "text-ink" : "text-muted"}`}
                        >
                          {u.nombre}
                        </Link>
                        {esYo(u) && <span className="ml-1.5 text-xs font-normal text-muted">({t("admin.us.vos")})</span>}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="truncate text-muted">{u.correo}</p>
                    </td>
                    <td className="px-4 py-3">
                      <RolBadge rol={u.rol} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted">{formatoFecha(u.creadoEn, false)}</td>
                    <td className="px-4 py-3">{switchEstado(u)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: tarjetas */}
          <ul className="mt-6 space-y-3 md:hidden">
            {usuarios.map((u) => (
              <li key={u.id} className="rounded-xl border border-line bg-surface p-3 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate">
                      <Link
                        to={String(u.id)}
                        {...desde}
                        className={`font-semibold hover:text-primary hover:underline ${u.habilitado ? "text-ink" : "text-muted"}`}
                      >
                        {u.nombre}
                      </Link>
                      {esYo(u) && <span className="ml-1.5 text-xs font-normal text-muted">({t("admin.us.vos")})</span>}
                    </p>
                    <p className="truncate text-sm text-muted">{u.correo}</p>
                  </div>
                  <RolBadge rol={u.rol} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="text-xs text-muted">
                    {t("admin.us.col.alta")}: {formatoFecha(u.creadoEn, false)}
                  </p>
                  {switchEstado(u)}
                </div>
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

      {confirmando && (
        <ConfirmarCambio usuario={confirmando} onCerrar={() => setConfirmando(null)} onCambiado={alCambiar} />
      )}
    </section>
  );
}

function EsqueletoTabla() {
  return (
    <div className="mt-6 space-y-2" aria-hidden>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex animate-pulse items-center gap-3 rounded-xl border border-line p-3">
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 rounded bg-surface-alt" />
            <div className="h-3 w-1/2 rounded bg-surface-alt" />
          </div>
          <div className="h-6 w-24 rounded-full bg-surface-alt" />
        </div>
      ))}
    </div>
  );
}
