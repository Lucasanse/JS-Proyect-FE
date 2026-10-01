import { useEffect, useRef, useState } from "react";
import ProductoCard from "../../components/ProductoCard/ProductoCard";
import {
  obtenerPaginaProductos,
  type ProductoResumen,
} from "../../services/productos";
import SearchBar from "../../components/Searchbar/Searchbar";

export default function Productos() {
  const [productos, setProductos] = useState<ProductoResumen[]>([]);
  const [pagina, setPagina] = useState(1);
  const [hayMas, setHayMas] = useState(true);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Favoritos solo en memoria hasta que exista el endpoint en el BE
  const [favoritos, setFavoritos] = useState<Set<number>>(new Set());
  // Elemento al final de la lista: cuando entra en pantalla se pide la página siguiente
  const finDeLista = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    obtenerPaginaProductos(pagina, controller.signal)
      .then((body) => {
        setProductos((prev) => [...prev, ...body.data]);
        setHayMas(body.paginacion.hasNext);
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          e instanceof Error
            ? e.message
            : "No se pudieron cargar los productos",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setCargando(false);
      });
    return () => controller.abort();
  }, [pagina]);

  useEffect(() => {
    const el = finDeLista.current;
    if (!el || cargando || !hayMas || error) return;

    const observer = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return;
        observer.disconnect();
        setCargando(true);
        setPagina((p) => p + 1);
      },
      { rootMargin: "300px" }, // empieza a cargar un poco antes de llegar al final
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [cargando, hayMas, error]);

  const toggleFavorito = (id: number) => {
    setFavoritos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SearchBar></SearchBar>
      <h1 className="text-3xl font-bold text-primary">Productos</h1>

      {!cargando && !error && productos.length === 0 && (
        <p className="mt-6 text-muted">No hay productos para mostrar.</p>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {productos.map((p) => (
          <ProductoCard
            key={p.id}
            producto={p}
            esFavorito={favoritos.has(p.id)}
            onToggleFavorito={toggleFavorito}
          />
        ))}
      </div>

      <div ref={finDeLista} />
      {cargando && (
        <p className="mt-6 text-center text-muted">Cargando productos...</p>
      )}
      {error && <p className="mt-6 text-center text-primary">{error}</p>}
    </section>
  );
}
