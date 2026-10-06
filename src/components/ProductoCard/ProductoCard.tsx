import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { ProductoResumen } from "../../services/productos";
import { useSession } from "../../services/auth-client";
import { useCarrito } from "../CarritoProvider/carritoContext";

const formatoPrecio = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
});

interface Props {
  producto: ProductoResumen;
  esFavorito: boolean;
  onToggleFavorito: (id: number) => void;
}

export default function ProductoCard({ producto, esFavorito, onToggleFavorito }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: session } = useSession();
  const { agregar, cantidadEnCarrito } = useCarrito();
  // Lo que todavía se puede agregar = stock menos lo que ya está en el carrito
  const enCarrito = cantidadEnCarrito(producto.id);
  const stock = Math.max(producto.stock - enCarrito, 0);
  const sinStock = producto.stock <= 0;
  const topeAlcanzado = !sinStock && stock === 0;
  const deshabilitado = sinStock || topeAlcanzado;
  const [cantidad, setCantidad] = useState(1);
  const [agregando, setAgregando] = useState(false);
  const [error, setError] = useState("");

  // La cantidad siempre queda entre 1 y el stock disponible
  const cambiarCantidad = (valor: number) => {
    if (Number.isNaN(valor)) return;
    setCantidad(Math.min(Math.max(valor, 1), stock));
  };

  const handleAgregar = async () => {
    if (!session) {
      navigate("/login");
      return;
    }
    setError("");
    setAgregando(true);
    try {
      await agregar(producto.id, Math.min(cantidad, stock));
      setCantidad(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("card.errorAgregar"));
    } finally {
      setAgregando(false);
    }
  };

  return (
    // El link del nombre se estira (after:inset-0) para que toda la card lleve a /productos/:id.
    // Los controles llevan "relative z-10" para quedar por encima y seguir siendo clickeables.
    <article className="relative flex flex-col gap-3 rounded-xl border border-line bg-surface p-3 shadow-sm transition duration-200 hover:z-20 hover:scale-105 hover:shadow-lg">
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-surface">
        {producto.imagenUrl ? (
          <img
            src={producto.imagenUrl}
            alt={producto.nombre}
            loading="lazy"
            className="h-full w-full object-contain"
          />
        ) : (
          <span className="text-sm text-muted">{t("card.sinImagen")}</span>
        )}
        <button
          type="button"
          aria-label={
            esFavorito ? t("card.quitarFavoritos") : t("card.agregarFavoritos")
          }
          aria-pressed={esFavorito}
          onClick={() => onToggleFavorito(producto.id)}
          className={`absolute right-1.5 top-1.5 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-surface/90 shadow-sm transition-colors ${esFavorito ? "text-primary" : "text-muted hover:text-primary"}`}
        >
          <HeartIcon filled={esFavorito} />
        </button>
      </div>

      <h3 className="line-clamp-2 text-sm font-bold leading-snug text-ink">
        <Link
          to={`/detalleProducto/${producto.id}`}
          className="after:absolute after:inset-0 after:rounded-xl hover:text-primary"
        >
          {producto.nombre}
        </Link>
      </h3>

      <p className="mt-auto text-xl font-semibold text-ink">
        {formatoPrecio.format(producto.precio)}
      </p>

      {/* flex-wrap: si la card es angosta, el botón baja a otra línea en vez de desbordarse */}
      <div className="relative z-10 flex flex-wrap items-center gap-2">
        <div className="flex h-9 items-center rounded-lg border border-line bg-surface">
          <button
            type="button"
            aria-label={t("card.restar")}
            onClick={() => cambiarCantidad(cantidad - 1)}
            disabled={deshabilitado || cantidad <= 1}
            className="h-full w-7 cursor-pointer text-muted hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            −
          </button>
          <input
            type="number"
            aria-label={t("card.cantidad")}
            min={1}
            max={stock}
            value={deshabilitado ? 0 : Math.min(cantidad, stock)}
            disabled={deshabilitado}
            onChange={(e) => cambiarCantidad(e.target.valueAsNumber)}
            className="h-full w-8 [appearance:textfield] bg-transparent text-center text-sm text-ink outline-none disabled:opacity-40 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <button
            type="button"
            aria-label={t("card.sumar")}
            onClick={() => cambiarCantidad(cantidad + 1)}
            disabled={deshabilitado || cantidad >= stock}
            className="h-full w-7 cursor-pointer text-muted hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={handleAgregar}
          disabled={deshabilitado || agregando}
          title={topeAlcanzado ? t("card.topeAlcanzado") : undefined}
          className="flex h-9 grow basis-28 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-primary px-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
        >
          <CartIcon />
          {sinStock ? t("card.sinStock") : topeAlcanzado ? t("card.enCarrito") : agregando ? t("card.agregando") : t("card.agregar")}
        </button>
      </div>
      {error && <p className="relative z-10 text-xs text-primary">{error}</p>}
    </article>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    >
      <path d="M12 20.5s-7.5-4.6-9.2-9.4C1.7 7.9 3.9 4.5 7.3 4.5c2 0 3.6 1.1 4.7 2.8 1.1-1.7 2.7-2.8 4.7-2.8 3.4 0 5.6 3.4 4.5 6.6-1.7 4.8-9.2 9.4-9.2 9.4z" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM5.2 4H2V2h4.6l.9 2H21l-3.6 8.1a2 2 0 0 1-1.8 1.2H8.1l-1 1.7H19v2H5l2.3-4L5.2 4z" />
    </svg>
  );
}
