import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { obtenerCategorias, type Categoria, type Paginado } from "../../services/productos";
import {
  cambiarEstadoProducto,
  listarProductosAdmin,
  type FiltroEstado,
  type ProductoAdmin,
} from "../../services/adminProductos";
import { notificarCambioCatalogo } from "../../services/catalogoEventos";
import { useToast } from "../../components/Toast/toastContext";
import ProductoFormModal from "./ProductoFormModal";
import EliminarProductoModal from "./EliminarProductoModal";

const formatoPrecio = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
});

const ESTADOS: FiltroEstado[] = ["todos", "activos", "inactivos"];

type ModalAbierto =
  | { tipo: "form"; producto: ProductoAdmin | null }
  | { tipo: "eliminar"; producto: ProductoAdmin }
  | null;

export default function AdminProductos() {
  const { t } = useTranslation();
  const { mostrarToast } = useToast();

  // Los filtros viven en la URL, así se mantienen al recargar la página
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const categoria = searchParams.get("categoria") ?? "";
  const estado = (searchParams.get("estado") as FiltroEstado | null) ?? "todos";
  const page = Number(searchParams.get("page")) || 1;

  const [busqueda, setBusqueda] = useState(q);
  const [datos, setDatos] = useState<Paginado<ProductoAdmin> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recarga, setRecarga] = useState(0);
  // Se está cargando mientras la última respuesta no corresponda a los filtros actuales.
  // Mientras tanto se siguen mostrando los datos anteriores (atenuados).
  const pedido = JSON.stringify([q, categoria, estado, page, recarga]);
  const [pedidoRespondido, setPedidoRespondido] = useState<string | null>(null);
  const cargando = pedidoRespondido !== pedido;
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [modal, setModal] = useState<ModalAbierto>(null);
  // Productos a los que se les está cambiando el estado (para deshabilitar el switch)
  const [cambiandoEstado, setCambiandoEstado] = useState<Set<number>>(new Set());

  const cambiarFiltros = (nuevos: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    for (const [clave, valor] of Object.entries(nuevos)) {
      if (valor) params.set(clave, valor);
      else params.delete(clave);
    }
    // Cambiar un filtro vuelve a la primera página
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
    obtenerCategorias(controller.signal)
      .then(setCategorias)
      .catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    listarProductosAdmin({ q, categoria, estado, page }, controller.signal)
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
  }, [q, categoria, estado, page, pedido, t]);

  // Si se borró el último producto de una página, se vuelve a la anterior
  useEffect(() => {
    if (datos && datos.data.length === 0 && page > 1 && !cargando) {
      cambiarFiltros({ page: String(page - 1) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datos, cargando]);

  const recargar = () => setRecarga((r) => r + 1);

  const reemplazarFila = (producto: ProductoAdmin) =>
    setDatos((prev) => prev && { ...prev, data: prev.data.map((p) => (p.id === producto.id ? producto : p)) });

  const toggleEstado = async (producto: ProductoAdmin) => {
    setCambiandoEstado((prev) => new Set(prev).add(producto.id));
    try {
      const actualizado = await cambiarEstadoProducto(producto.id, !producto.activo);
      reemplazarFila(actualizado);
      notificarCambioCatalogo();
      mostrarToast(
        actualizado.activo
          ? t("admin.toast.activado", { nombre: actualizado.nombre })
          : t("admin.toast.desactivado", { nombre: actualizado.nombre }),
        "exito",
      );
    } catch (e) {
      mostrarToast(e instanceof Error ? e.message : t("admin.errorGenerico"), "error");
    } finally {
      setCambiandoEstado((prev) => {
        const next = new Set(prev);
        next.delete(producto.id);
        return next;
      });
    }
  };

  const alGuardar = (producto: ProductoAdmin) => {
    const esNuevo = modal?.tipo === "form" && modal.producto === null;
    setModal(null);
    notificarCambioCatalogo();
    if (esNuevo) {
      mostrarToast(t("admin.toast.creado", { nombre: producto.nombre }), "exito");
      // Los nuevos aparecen primero: se va a la página 1 sin filtros que lo puedan ocultar
      setBusqueda("");
      setSearchParams({}, { replace: true });
      recargar();
    } else {
      mostrarToast(t("admin.toast.guardado", { nombre: producto.nombre }), "exito");
      reemplazarFila(producto);
    }
  };

  const alEliminar = (producto: ProductoAdmin) => {
    setModal(null);
    notificarCambioCatalogo();
    mostrarToast(t("admin.toast.eliminado", { nombre: producto.nombre }), "exito");
    recargar();
  };

  const alDesactivarDesdeEliminar = (producto: ProductoAdmin) => {
    setModal(null);
    notificarCambioCatalogo();
    reemplazarFila(producto);
    mostrarToast(t("admin.toast.desactivado", { nombre: producto.nombre }), "exito");
  };

  const productos = datos?.data ?? [];
  const hayFiltros = !!(q || categoria || estado !== "todos");

  const acciones = (p: ProductoAdmin) => (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={() => setModal({ tipo: "form", producto: p })}
        className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-semibold text-secondary-dark transition-colors hover:bg-secondary"
      >
        {t("admin.editar")}
      </button>
      <button
        type="button"
        onClick={() => setModal({ tipo: "eliminar", producto: p })}
        className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
      >
        {t("admin.eliminarBoton")}
      </button>
    </div>
  );

  const switchEstado = (p: ProductoAdmin) => (
    <SwitchEstado activo={p.activo} deshabilitado={cambiandoEstado.has(p.id)} onCambiar={() => toggleEstado(p)} />
  );

  return (
    <section className="w-full">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-3xl font-bold text-primary">{t("admin.titulo")}</h1>
          <p className="mt-1 text-muted">
            {datos ? t("admin.cantidad", { count: datos.paginacion.total }) : t("admin.subtitulo")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ tipo: "form", producto: null })}
          className="flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark"
        >
          <span aria-hidden className="text-lg leading-none">
            +
          </span>
          {t("admin.nuevo")}
        </button>
      </header>

      {/* Filtros */}
      <div className="mt-6 flex flex-col gap-3 rounded-xl border border-line bg-surface-alt p-3 md:flex-row md:items-center">
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder={t("admin.buscar")}
          aria-label={t("admin.buscar")}
          className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
        />
        <select
          value={categoria}
          onChange={(e) => cambiarFiltros({ categoria: e.target.value })}
          aria-label={t("buscador.categoria")}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-ink outline-none focus:border-primary"
        >
          <option value="">{t("buscador.todasCategorias")}</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <div role="group" aria-label={t("admin.estado")} className="flex rounded-lg border border-line bg-surface p-1">
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
              {t(`admin.filtro.${e}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Estados de carga, error y vacío */}
      {error && !cargando && (
        <div role="alert" className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-700">
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={recargar}
            className="cursor-pointer rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-red-100"
          >
            {t("admin.reintentar")}
          </button>
        </div>
      )}

      {cargando && !datos && <EsqueletoTabla />}

      {!cargando && !error && productos.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-line px-4 py-12 text-center">
          <p className="text-muted">{hayFiltros ? t("admin.sinResultados") : t("admin.sinProductos")}</p>
          {!hayFiltros && (
            <button
              type="button"
              onClick={() => setModal({ tipo: "form", producto: null })}
              className="mt-4 cursor-pointer rounded-lg bg-primary px-4 py-2 font-semibold text-white hover:bg-primary-dark"
            >
              {t("admin.crearPrimero")}
            </button>
          )}
        </div>
      )}

      {productos.length > 0 && (
        <div className={`transition-opacity ${cargando ? "pointer-events-none opacity-50" : ""}`} aria-busy={cargando}>
          {/* Desktop: tabla */}
          <div className="mt-6 hidden overflow-hidden rounded-xl border border-line md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-surface-alt text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-4 py-3 font-semibold">{t("admin.col.producto")}</th>
                  <th className="px-4 py-3 font-semibold">{t("admin.col.categoria")}</th>
                  <th className="px-4 py-3 text-right font-semibold">{t("admin.col.precio")}</th>
                  <th className="px-4 py-3 text-right font-semibold">{t("admin.col.stock")}</th>
                  <th className="px-4 py-3 font-semibold">{t("admin.col.estado")}</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    <span className="sr-only">{t("admin.col.acciones")}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {productos.map((p) => (
                  <tr key={p.id} className="bg-surface transition-colors hover:bg-surface-alt/60">
                    <td className="px-4 py-3">
                      <InfoProducto producto={p} />
                    </td>
                    <td className="px-4 py-3 text-muted">{p.categoria.nombre}</td>
                    <td className="px-4 py-3 text-right font-semibold whitespace-nowrap text-ink">
                      {formatoPrecio.format(p.precio)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Stock stock={p.stock} />
                    </td>
                    <td className="px-4 py-3">{switchEstado(p)}</td>
                    <td className="px-4 py-3">{acciones(p)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: tarjetas */}
          <ul className="mt-6 space-y-3 md:hidden">
            {productos.map((p) => (
              <li key={p.id} className="rounded-xl border border-line bg-surface p-3 shadow-sm">
                <InfoProducto producto={p} />
                <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <dt className="text-xs text-muted">{t("admin.col.precio")}</dt>
                    <dd className="font-semibold text-ink">{formatoPrecio.format(p.precio)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">{t("admin.col.stock")}</dt>
                    <dd>
                      <Stock stock={p.stock} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">{t("admin.col.categoria")}</dt>
                    <dd className="truncate text-ink">{p.categoria.nombre}</dd>
                  </div>
                </dl>
                <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                  {switchEstado(p)}
                  {acciones(p)}
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

      {modal?.tipo === "form" && (
        <ProductoFormModal
          producto={modal.producto}
          categorias={categorias}
          onCerrar={() => setModal(null)}
          onGuardado={alGuardar}
        />
      )}
      {modal?.tipo === "eliminar" && (
        <EliminarProductoModal
          producto={modal.producto}
          onCerrar={() => setModal(null)}
          onEliminado={() => alEliminar(modal.producto)}
          onDesactivado={alDesactivarDesdeEliminar}
        />
      )}
    </section>
  );
}

function InfoProducto({ producto }: { producto: ProductoAdmin }) {
  const { t } = useTranslation();
  return (
    <div className={`flex min-w-0 items-center gap-3 ${producto.activo ? "" : "opacity-60"}`}>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-surface">
        {producto.imagenUrl ? (
          <img src={producto.imagenUrl} alt="" loading="lazy" className="h-full w-full object-contain" />
        ) : (
          <span aria-hidden className="text-lg text-muted">
            🖼️
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="line-clamp-2 font-semibold text-ink">{producto.nombre}</p>
        <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted">
          {producto.marca.nombre}
          {producto.traduccionEn && <span title={t("admin.tieneTraduccion")}>· EN</span>}
          {producto.componente && (
            <span
              title={t("admin.esComponente")}
              className="rounded bg-secondary px-1.5 py-px font-semibold text-secondary-dark"
            >
              {producto.componente.tipo}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

function Stock({ stock }: { stock: number }) {
  const { t } = useTranslation();
  if (stock === 0) {
    return (
      <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-red-700">
        {t("admin.sinStock")}
      </span>
    );
  }
  return <span className={`font-semibold ${stock <= 5 ? "text-amber-600" : "text-ink"}`}>{stock}</span>;
}

function SwitchEstado({
  activo,
  deshabilitado,
  onCambiar,
}: {
  activo: boolean;
  deshabilitado: boolean;
  onCambiar: () => void;
}) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      disabled={deshabilitado}
      onClick={onCambiar}
      title={activo ? t("admin.ayudaDesactivar") : t("admin.ayudaActivar")}
      className="group flex cursor-pointer items-center gap-2 disabled:cursor-wait disabled:opacity-60"
    >
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          activo ? "bg-green-600" : "bg-line"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
            activo ? "translate-x-5.5" : "translate-x-0.5"
          }`}
        />
      </span>
      <span className={`text-sm font-medium ${activo ? "text-green-700" : "text-muted"}`}>
        {activo ? t("admin.activo") : t("admin.inactivo")}
      </span>
    </button>
  );
}

function EsqueletoTabla() {
  return (
    <div className="mt-6 space-y-2" aria-hidden>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex animate-pulse items-center gap-3 rounded-xl border border-line p-3">
          <div className="h-12 w-12 rounded-lg bg-surface-alt" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/2 rounded bg-surface-alt" />
            <div className="h-3 w-1/4 rounded bg-surface-alt" />
          </div>
          <div className="h-6 w-20 rounded bg-surface-alt" />
        </div>
      ))}
    </div>
  );
}
