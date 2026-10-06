// src/pages/Detalles.tsx
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useSession } from "../../services/auth-client";
import { useCarrito } from "../../components/CarritoProvider/carritoContext";
import {
  obtenerProductoPorId,
  type ProductoDetalle,
} from "../../services/productoDetalle.ts";

export default function Detalles() {
  const { id } = useParams<{ id: string }>();

  const [producto, setProducto] = useState<ProductoDetalle | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cantidad, setCantidad] = useState<number>(1);
  const [agregando, setAgregando] = useState(false);
  const [errorCarrito, setErrorCarrito] = useState("");
  const navigate = useNavigate();
  const { data: session } = useSession();
  const { agregar, cantidadEnCarrito } = useCarrito();

  const handleAgregar = async () => {
    if (!producto) return;
    if (!session) {
      navigate("/login");
      return;
    }
    setErrorCarrito("");
    setAgregando(true);
    try {
      await agregar(producto.id, cantidad);
      setCantidad(1);
    } catch (e) {
      setErrorCarrito(e instanceof Error ? e.message : "No se pudo agregar");
    } finally {
      setAgregando(false);
    }
  };

  useEffect(() => {
    const idNumero = Number(id);
    if (!id || isNaN(idNumero) || idNumero <= 0) {
      setError("El ID del producto no es válido.");
      setCargando(false);
      return;
    }

    const controller = new AbortController();
    setCargando(true);
    setError(null);

    obtenerProductoPorId(idNumero, controller.signal)
      .then((data) => {
        setProducto(data);
        setCantidad(1);
        setCargando(false);
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setError(err.message || "No se pudo cargar el producto.");
        setCargando(false);
      });

    return () => controller.abort();
  }, [id]);

  // CARGA (Skeleton animado)
  if (cargando) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 animate-pulse">
        <div className="h-4 w-40 bg-slate-200 rounded mb-8"></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="lg:col-span-6 h-96 bg-slate-100 rounded-xl"></div>
          <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="h-6 w-32 bg-slate-200 rounded-full"></div>
              <div className="h-9 w-3/4 bg-slate-200 rounded"></div>
              <div className="h-10 w-44 bg-slate-200 rounded mt-4"></div>
              <div className="h-24 w-full bg-slate-100 rounded mt-6"></div>
            </div>
            <div className="h-12 w-full bg-slate-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  //404
  if (error || !producto) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            !
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            No encontramos este producto
          </h2>
          <p className="text-slate-500 mb-6">
            {error ?? "El producto que buscas no existe o fue eliminado."}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition"
          >
            ← Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  //VISTA PRINCIPAL DEL PRODUCTO
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb / Navegación superior */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-indigo-600 transition font-medium">
          Catálogo
        </Link>
        <span>/</span>
        <span className="text-slate-700 font-medium">
          {producto.categoria.nombre}
        </span>
        <span>/</span>
        <span className="text-slate-400 truncate max-w-xs">
          {producto.nombre}
        </span>
      </nav>

      {/* Tarjeta Principal: Imagen + Compra */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm">
        {/* Columna Izquierda: Imagen del Producto */}
        <div className="lg:col-span-6 flex items-center justify-center bg-slate-50 rounded-xl p-8 border border-slate-100 relative min-h-[340px]">
          {producto.esComponentePC && (
            <span className="absolute top-4 left-4 bg-slate-900 text-white text-xs font-semibold px-3 py-1 rounded-full   z-10 tracking-wide uppercase">
              {producto.tipoComponente}
            </span>
          )}

          {producto.imagenUrl ? (
            <img
              src={producto.imagenUrl}
              alt={producto.nombre}
              className="max-h-80 w-auto object-contain transition-transform duration-300 hover:scale-105 overflow-hidden"
            />
          ) : (
            <div className="text-center text-slate-400 overflow-hidden">
              <svg
                className="w-16 h-16 mx-auto mb-2 stroke-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm">Sin imagen disponible</span>
            </div>
          )}
        </div>

        {/* Columna Derecha: Info Comercial y Acciones */}
        <div className="lg:col-span-6 flex flex-col justify-between">
          <div>
            {/* Categoría y Marca */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                {producto.marca}
              </span>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {producto.categoria.nombre}
              </span>
            </div>

            {/* Título */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {producto.nombre}
            </h1>

            {/* Precio y Estado de Stock */}
            <div className="mt-5 pb-5 border-b border-slate-100 flex flex-wrap items-baseline justify-between gap-4">
              <div>
                <span className="text-3xl sm:text-4xl font-black text-slate-900">
                  ${producto.precio.toLocaleString("es-AR")}
                </span>
                <p className="text-xs text-slate-400 mt-1">
                  Precio final con impuestos incluidos
                </p>
              </div>

              {producto.disponible ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Stock disponible ({producto.stock} u.)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Agotado temporalmente
                </span>
              )}
            </div>

            {/* Descripción */}
            <div className="mt-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Descripción del producto
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                {producto.descripcion}
              </p>
            </div>
          </div>

          {/* Controles de Compra */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Selector de Cantidad */}
              {producto.disponible && (
                <div className="flex items-center justify-between border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 sm:w-36">
                  <button
                    type="button"
                    onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:shadow-sm transition font-bold"
                  >
                    -
                  </button>
                  <span className="font-semibold text-slate-900 text-sm">
                    {cantidad}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCantidad((c) =>
                        Math.min(
                          Math.max(producto.stock - cantidadEnCarrito(producto.id), 1),
                          c + 1,
                        ),
                      )
                    }
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:shadow-sm transition font-bold"
                  >
                    +
                  </button>
                </div>
              )}

              {/* Botón Agregar al Carrito */}
              <button
                type="button"
                onClick={handleAgregar}
                disabled={!producto.disponible || agregando}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-indigo-600 text-white py-3.5 px-6 rounded-xl font-semibold hover:bg-indigo-700 active:scale-[0.99] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition shadow-sm"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {!producto.disponible
                  ? "Sin stock"
                  : agregando
                    ? "Agregando..."
                    : "Agregar al carrito"}
              </button>
            </div>
            {errorCarrito && (
              <p className="mt-2 text-sm text-red-600">{errorCarrito}</p>
            )}
          </div>
        </div>
      </div>

      {/* Sección Inferior: Ficha Técnica (Solo si esComponentePC === true) */}
      {producto.esComponentePC && (
        <div className="mt-8 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Especificaciones Técnicas
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Atributos de compatibilidad y rendimiento para{" "}
                <span className="font-semibold text-slate-700">
                  {producto.tipoComponente}
                </span>
              </p>
            </div>

            {/* Badge de Consumo Energético */}
            {producto.wattsRequeridos > 0 && (
              <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200/80 text-amber-900 px-4 py-2 rounded-xl text-sm font-semibold">
                <svg
                  className="w-4 h-4 text-amber-500 fill-current"
                  viewBox="0 0 20 20"
                >
                  <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                </svg>
                Consumo requerido: {producto.wattsRequeridos} W
              </div>
            )}
          </div>

          {producto.atributos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {producto.atributos.map((attr) => (
                <div
                  key={attr.nombre}
                  className="flex flex-col justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition"
                >
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    {attr.nombre.replace(/_/g, " ")}
                  </span>
                  <span className="text-base font-bold text-slate-900 mt-1">
                    {attr.valor}{" "}
                    {attr.unidad && (
                      <span className="text-sm font-medium text-slate-500">
                        {attr.unidad}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">
              No hay atributos técnicos adicionales registrados para este
              componente.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
