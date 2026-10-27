import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ApiError } from "../../services/adminProductos";
import { obtenerUsuarioAdmin, type UsuarioAdminDetalle } from "../../services/adminUsuarios";
import { useSession } from "../../services/auth-client";
import { useToast } from "../../components/Toast/toastContext";
import ErrorCarga from "../../components/ServicioTecnico/ErrorCarga";
import EstadoBadge from "../../components/ServicioTecnico/EstadoBadge";
import { formatoFecha } from "../../components/ServicioTecnico/formatoFecha";
import { tituloSolicitud } from "../../components/ServicioTecnico/textosSolicitud";
import { ConfirmarCambio, RolBadge, SwitchHabilitado } from "./UsuarioComponentes";

const formatoPrecio = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
});

// /admin/usuarios/:id: todos los datos de un usuario, el estado de su cuenta
// y sus últimas compras y solicitudes de servicio técnico.
export default function AdminUsuarioDetalle() {
  const { t } = useTranslation();
  const { id } = useParams();
  const location = useLocation();
  const { mostrarToast } = useToast();
  const { data: session } = useSession();
  // Si se llegó desde el listado, "Volver" respeta los filtros que tenía
  const volverA = (location.state as { volverA?: string } | null)?.volverA ?? "";

  const [usuario, setUsuario] = useState<UsuarioAdminDetalle | null>(null);
  const [error, setError] = useState<{ mensaje: string; noExiste: boolean } | null>(null);
  const [recarga, setRecarga] = useState(0);
  const pedido = `${id}-${recarga}`;
  const [pedidoRespondido, setPedidoRespondido] = useState<string | null>(null);
  const cargando = pedidoRespondido !== pedido;
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    obtenerUsuarioAdmin(Number(id), controller.signal)
      .then((u) => {
        setUsuario(u);
        setError(null);
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setError({
          mensaje: e instanceof Error ? e.message : t("admin.us.errorCargaDetalle"),
          noExiste: e instanceof ApiError && (e.status === 404 || e.status === 400),
        });
      })
      .finally(() => {
        if (!controller.signal.aborted) setPedidoRespondido(pedido);
      });
    return () => controller.abort();
  }, [id, pedido, t]);

  const alCambiar = (actualizado: UsuarioAdminDetalle) => {
    setConfirmando(false);
    setUsuario(actualizado);
    mostrarToast(
      t(actualizado.habilitado ? "admin.us.toastHabilitado" : "admin.us.toastDeshabilitado", {
        nombre: actualizado.nombre,
      }),
      "exito",
    );
  };

  return (
    <section className="w-full">
      <Link to={`..${volverA}`} relative="path" className="text-sm font-semibold text-secondary-dark hover:underline">
        ← {t("admin.us.volver")}
      </Link>

      {cargando && !usuario && !error && <p className="mt-6 text-muted">{t("nav.cargando")}</p>}

      {error?.noExiste && (
        <div className="mt-6 rounded-xl border border-dashed border-line px-4 py-12 text-center text-muted">
          {t("admin.us.noEncontrado")}
        </div>
      )}

      {error && !error.noExiste && !cargando && (
        <ErrorCarga mensaje={error.mensaje} onReintentar={() => setRecarga((r) => r + 1)} />
      )}

      {usuario && !error?.noExiste && (
        <div className={`transition-opacity ${cargando ? "opacity-60" : ""}`} aria-busy={cargando}>
          <header className="mt-4 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-muted">
                {t("admin.us.usuario")} #{usuario.id}
              </p>
              <h1 className="m-0 text-2xl font-bold break-words text-ink sm:text-3xl">{usuario.nombre}</h1>
              <p className="mt-1 break-all text-muted">{usuario.correo}</p>
            </div>
            <div className="flex items-center gap-2">
              <RolBadge rol={usuario.rol} />
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                  usuario.habilitado ? "bg-green-100 text-green-800 ring-green-200" : "bg-red-100 text-red-800 ring-red-200"
                }`}
              >
                {usuario.habilitado ? t("admin.us.habilitado") : t("admin.us.deshabilitado")}
              </span>
            </div>
          </header>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
            {/* Columna principal: datos, compras y solicitudes */}
            <div className="space-y-6">
              <Tarjeta titulo={t("admin.us.datos")}>
                <dl className="grid gap-4 text-sm sm:grid-cols-2">
                  <Dato etiqueta={t("admin.us.col.nombre")}>{usuario.nombre}</Dato>
                  <Dato etiqueta={t("admin.us.col.email")}>
                    <a href={`mailto:${usuario.correo}`} className="break-all text-secondary-dark hover:underline">
                      {usuario.correo}
                    </a>
                    {usuario.correoVerificado && (
                      <span className="ml-2 text-xs text-green-700">{t("admin.us.verificado")}</span>
                    )}
                  </Dato>
                  <Dato etiqueta={t("admin.us.telefono")}>
                    {usuario.telefono ? (
                      <a href={`tel:${usuario.telefono}`} className="text-secondary-dark hover:underline">
                        {usuario.telefono}
                      </a>
                    ) : (
                      <SinDato />
                    )}
                  </Dato>
                  <Dato etiqueta={t("admin.us.direccion")}>{usuario.direccion || <SinDato />}</Dato>
                  {usuario.rol === "ADMIN" && <Dato etiqueta={t("admin.us.cargo")}>{usuario.cargo || <SinDato />}</Dato>}
                  <Dato etiqueta={t("admin.us.idioma")}>
                    {t(`admin.us.idiomas.${usuario.idioma}`, { defaultValue: usuario.idioma })}
                  </Dato>
                  <Dato etiqueta={t("admin.us.col.alta")}>{formatoFecha(usuario.creadoEn)}</Dato>
                  <Dato etiqueta={t("admin.us.actualizado")}>{formatoFecha(usuario.actualizadoEn)}</Dato>
                </dl>
              </Tarjeta>

              <Tarjeta titulo={t("admin.us.compras", { count: usuario.cantidadCompras })}>
                {usuario.ultimasCompras.length === 0 ? (
                  <p className="text-sm text-muted">{t("admin.us.sinCompras")}</p>
                ) : (
                  <ul className="divide-y divide-line text-sm">
                    {usuario.ultimasCompras.map((c) => (
                      <li key={c.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5">
                        <div className="min-w-0">
                          <Link to={`/admin/ventas/${c.id}`} className="font-semibold text-ink hover:text-primary hover:underline">
                            {t("admin.us.compra")} #{c.id}
                          </Link>
                          <p className="text-xs text-muted">
                            {formatoFecha(c.fecha)} · {t("admin.us.productos", { count: c.cantidadProductos })}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="rounded-full bg-surface-alt px-2.5 py-0.5 text-xs font-semibold text-muted">
                            {c.estado}
                          </span>
                          <span className="font-semibold text-ink">{formatoPrecio.format(c.total)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {usuario.cantidadCompras > usuario.ultimasCompras.length && (
                  <p className="mt-2 text-xs text-muted">
                    {t("admin.us.mostrandoUltimas", { count: usuario.ultimasCompras.length })}
                  </p>
                )}
              </Tarjeta>

              <Tarjeta titulo={t("admin.us.solicitudes", { count: usuario.cantidadSolicitudes })}>
                {usuario.ultimasSolicitudes.length === 0 ? (
                  <p className="text-sm text-muted">{t("admin.us.sinSolicitudes")}</p>
                ) : (
                  <ul className="divide-y divide-line text-sm">
                    {usuario.ultimasSolicitudes.map((s) => (
                      <li key={s.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5">
                        <div className="min-w-0">
                          <Link
                            to={`/admin/servicio-tecnico/${s.id}`}
                            className="font-semibold text-ink hover:text-primary hover:underline"
                          >
                            #{s.id} · {tituloSolicitud(s, t)}
                          </Link>
                          <p className="text-xs text-muted">{formatoFecha(s.fecha)}</p>
                        </div>
                        <EstadoBadge estado={s.estado} />
                      </li>
                    ))}
                  </ul>
                )}
                {usuario.cantidadSolicitudes > usuario.ultimasSolicitudes.length && (
                  <Link
                    to={`/admin/servicio-tecnico?q=${encodeURIComponent(usuario.correo)}`}
                    className="mt-2 inline-block text-xs font-semibold text-secondary-dark hover:underline"
                  >
                    {t("admin.us.verTodasSolicitudes")}
                  </Link>
                )}
              </Tarjeta>
            </div>

            {/* Columna lateral: estado de la cuenta */}
            <aside className="space-y-6 lg:sticky lg:top-24">
              <Tarjeta titulo={t("admin.us.cuenta")}>
                <SwitchHabilitado
                  usuario={usuario}
                  propio={session?.user.id === String(usuario.id)}
                  onCambiar={() => setConfirmando(true)}
                />
                <p className="mt-3 text-sm text-muted">
                  {usuario.habilitado ? t("admin.us.explicacionHabilitado") : t("admin.us.explicacionDeshabilitado")}
                  {usuario.rol === "ADMIN" && usuario.habilitado && ` ${t("admin.us.adminNoSeDeshabilita")}`}
                </p>
                <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">{t("admin.us.sesionesActivas")}</dt>
                    <dd className="m-0 font-semibold text-ink">{usuario.sesionesActivas}</dd>
                  </div>
                </dl>
              </Tarjeta>
            </aside>
          </div>
        </div>
      )}

      {confirmando && usuario && (
        <ConfirmarCambio usuario={usuario} onCerrar={() => setConfirmando(false)} onCambiado={alCambiar} />
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
    <div className="min-w-0">
      <dt className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">{etiqueta}</dt>
      <dd className="m-0 break-words text-ink">{children}</dd>
    </div>
  );
}

function SinDato() {
  return <span className="text-muted">—</span>;
}
