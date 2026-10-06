import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSession } from "../../services/auth-client";
import { useCarrito } from "../../components/CarritoProvider/carritoContext";
import type { ItemCarrito } from "../../services/carrito";

// Por ahora todo se muestra en pesos. Para sumar dólares, agregar otra fila
// en el resumen con su propio formato (ej. currency: "USD") y la cotización.
const MONEDA = "ARS";
const formatoPrecio = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: MONEDA,
  minimumFractionDigits: 2,
});

export default function Carrito() {
  const { t } = useTranslation();
  const { data: session, isPending } = useSession();
  const { carrito, cargando } = useCarrito();

  if (isPending || cargando) {
    return <Contenedor><p className="text-muted">{t("carrito.cargando")}</p></Contenedor>;
  }

  if (!session) {
    return (
      <Contenedor>
        <Aviso>
          {t("carrito.sesionAntes")}{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            {t("carrito.sesionLink")}
          </Link>{" "}
          {t("carrito.sesionDespues")}
        </Aviso>
      </Contenedor>
    );
  }

  if (!carrito || carrito.items.length === 0) {
    return (
      <Contenedor>
        <Aviso>
          {t("carrito.vacio")}{" "}
          <Link to="/productos" className="font-semibold text-primary hover:underline">
            {t("carrito.verProductos")}
          </Link>
        </Aviso>
      </Contenedor>
    );
  }

  return (
    <Contenedor>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <ul className="flex-1 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
          {carrito.items.map((item) => (
            <FilaCarrito key={item.producto.id} item={item} />
          ))}
        </ul>

        <Resumen />
      </div>
    </Contenedor>
  );
}

function Contenedor({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <section className="w-full flex-1 bg-surface-alt">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-3xl font-bold text-ink">{t("carrito.titulo")}</h1>
        {children}
      </div>
    </section>
  );
}

function Aviso({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-line bg-surface p-6 text-muted shadow-sm">{children}</p>;
}

function FilaCarrito({ item }: { item: ItemCarrito }) {
  const { t } = useTranslation();
  const { cambiarCantidad, quitar } = useCarrito();
  const { producto, cantidad, subtotal } = item;
  const sinStock = producto.stock <= 0;
  const superaStock = cantidad > producto.stock;
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");

  // Envuelve cada acción para bloquear la fila y mostrar el error del BE
  const ejecutar = async (accion: () => Promise<void>) => {
    setError("");
    setOcupado(true);
    try {
      await accion();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("carrito.errorGenerico"));
    } finally {
      setOcupado(false);
    }
  };

  // Valor que se está escribiendo en el campo. Si el BE cambia la cantidad,
  // el campo se actualiza con el valor nuevo.
  const [valor, setValor] = useState(String(cantidad));
  const [cantidadPrevia, setCantidadPrevia] = useState(cantidad);
  if (cantidad !== cantidadPrevia) {
    setCantidadPrevia(cantidad);
    setValor(String(cantidad));
  }
  // Mientras el valor escrito sea distinto al guardado, se muestra "Confirmar" en vez de "Eliminar"
  const modificado = valor !== String(cantidad);

  // Se guarda con el botón Confirmar o con Enter. La cantidad queda entre 1 y el stock.
  const confirmarCantidad = () => {
    const numero = Number(valor);
    const nueva = Math.min(Math.max(Number.isNaN(numero) ? cantidad : numero, 1), Math.max(producto.stock, 1));
    if (nueva === cantidad) setValor(String(cantidad));
    else ejecutar(() => cambiarCantidad(producto.id, nueva));
  };

  return (
    <li className="flex flex-col gap-2 p-4">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-surface">
          {producto.imagenUrl ? (
            <img src={producto.imagenUrl} alt={producto.nombre} className="h-full w-full object-contain p-1" />
          ) : (
            <span className="text-xs text-muted">{t("carrito.sinImagen")}</span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="line-clamp-2 text-[15px] font-medium text-ink">{producto.nombre}</p>
          <p className={`flex items-center gap-1.5 text-sm ${sinStock || superaStock ? "text-primary" : "text-secondary-dark"}`}>
            <span className="h-2 w-2 rounded-full bg-current" />
            {sinStock ? t("carrito.sinStock") : superaStock ? t("carrito.soloQuedan", { count: producto.stock }) : t("carrito.stockDisponible")}
          </p>
        </div>

        <div className="flex flex-col items-start gap-1">
          <input
            type="number"
            aria-label={t("carrito.cantidad")}
            min={1}
            max={producto.stock}
            value={valor}
            disabled={ocupado || sinStock}
            onChange={(e) => setValor(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") confirmarCantidad();
              if (e.key === "Escape") setValor(String(cantidad)); // descarta el cambio
            }}
            className={`h-9 w-20 rounded-lg border bg-surface px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-primary-light disabled:opacity-50 ${modificado ? "border-ink" : "border-line focus:border-primary"}`}
          />
          {modificado ? (
            <button
              type="button"
              onClick={confirmarCantidad}
              disabled={ocupado}
              className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-ink hover:text-primary disabled:opacity-40"
            >
              <CheckIcon />
              {t("carrito.confirmar")}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => ejecutar(() => quitar(producto.id))}
              disabled={ocupado}
              className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-ink hover:text-primary disabled:opacity-40"
            >
              <TrashIcon />
              {t("carrito.eliminar")}
            </button>
          )}
        </div>

        <div className="hidden w-36 flex-col items-end sm:flex">
          <span className="text-sm text-muted">{formatoPrecio.format(producto.precio)}</span>
          <span className="text-lg font-bold text-ink">{formatoPrecio.format(subtotal)}</span>
        </div>
      </div>

      {/* En mobile el precio va debajo */}
      <p className="text-right text-sm font-bold text-ink sm:hidden">{formatoPrecio.format(subtotal)}</p>
      {error && <p className="text-xs text-primary">{error}</p>}
    </li>
  );
}

function Resumen() {
  const { t } = useTranslation();
  const { carrito, vaciar } = useCarrito();
  const [error, setError] = useState("");
  if (!carrito) return null;

  // No se puede confirmar si algún producto quedó sin stock suficiente
  const hayProblemasDeStock = carrito.items.some((i) => i.cantidad > i.producto.stock);

  const eliminarPedido = async () => {
    if (!window.confirm(t("carrito.confirmarEliminar"))) return;
    setError("");
    try {
      await vaciar();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("carrito.errorEliminar"));
    }
  };

  return (
    <aside className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5 shadow-sm lg:w-96">
      <h2 className="text-xl font-bold text-ink">{t("carrito.resumen")}</h2>

      <dl className="divide-y divide-line text-[15px]">
        <div className="flex justify-between py-3">
          <dt className="text-ink">{t("carrito.subtotal")}</dt>
          <dd className="font-semibold text-ink">{formatoPrecio.format(carrito.total)}</dd>
        </div>
        <div className="flex justify-between py-3">
          <dt className="font-bold text-ink">{t("carrito.totalPagar", { moneda: MONEDA })}</dt>
          <dd className="font-bold text-ink">{formatoPrecio.format(carrito.total)}</dd>
        </div>
      </dl>

      {hayProblemasDeStock && (
        <p className="text-sm text-primary">{t("carrito.ajustarCantidades")}</p>
      )}
      {error && <p className="text-sm text-primary">{error}</p>}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={hayProblemasDeStock}
          className="h-11 cursor-pointer rounded-lg bg-primary font-semibold text-surface transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
        >
          {t("carrito.confirmarPedido")}
        </button>
        <button
          type="button"
          onClick={eliminarPedido}
          className="h-11 cursor-pointer rounded-lg bg-surface-alt font-semibold text-muted transition-colors hover:bg-line hover:text-ink"
        >
          {t("carrito.eliminarPedido")}
        </button>
      </div>
    </aside>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm-3 6h12l-1 12H7L6 9z" />
    </svg>
  );
}
