import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductoCard from "../../components/ProductoCard/ProductoCard";
import {
  obtenerPaginaProductos,
  type FiltrosProductos,
  type ProductoResumen,
} from "../../services/productos";
import SearchBar from "../../components/Searchbar/Searchbar";

export default function Productos() {
  // Los filtros viven en la URL (?q=...&marca=...), así se pueden compartir o recargar la página
  const [searchParams, setSearchParams] = useSearchParams();
  const filtros: FiltrosProductos = Object.fromEntries(searchParams);
  // Favoritos solo en memoria hasta que exista el endpoint en el BE
  const [favoritos, setFavoritos] = useState<Set<number>>(new Set());

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
      <SearchBar
        filtros={filtros}
        onChange={(nuevos) => setSearchParams(nuevos as Record<string, string>)}
      />
      <h1 className="mt-8 text-3xl font-bold text-primary">Productos</h1>

      {/* La key hace que la lista arranque de cero (página 1) cada vez que cambian los filtros */}
      <ListaProductos
        key={searchParams.toString()}
        filtros={filtros}
        favoritos={favoritos}
        onToggleFavorito={toggleFavorito}
      />
    </section>
  );
}

interface ListaProps {
  filtros: FiltrosProductos;
  favoritos: Set<number>;
  onToggleFavorito: (id: number) => void;
}

// Lista con scroll infinito para un conjunto de filtros fijo
function ListaProductos({ filtros, favoritos, onToggleFavorito }: ListaProps) {
  const [productos, setProductos] = useState<ProductoResumen[]>([]);
  const [pagina, setPagina] = useState(1);
  const [hayMas, setHayMas] = useState(true);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Elemento al final de la lista: cuando entra en pantalla se pide la página siguiente
  const finDeLista = useRef<HTMLDivElement>(null);
  // Los filtros no cambian durante la vida de este componente (por la key), así que alcanza con guardarlos una vez
  const [filtrosIniciales] = useState(filtros);

  useEffect(() => {
    const controller = new AbortController();
    obtenerPaginaProductos(pagina, controller.signal, filtrosIniciales)
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
  }, [pagina, filtrosIniciales]);

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

  const hayFiltros = Object.keys(filtros).length > 0;

  return (
    <>
      {!cargando && !error && productos.length === 0 && (
        <p className="mt-6 text-muted">
          {hayFiltros
            ? "No encontramos productos con esos filtros."
            : "No hay productos para mostrar."}
        </p>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {productos.map((p) => (
          <ProductoCard
            key={p.id}
            producto={p}
            esFavorito={favoritos.has(p.id)}
            onToggleFavorito={onToggleFavorito}
          />
        ))}
      </div>

      <div ref={finDeLista} />
      {cargando && (
        <p className="mt-6 text-center text-muted">Cargando productos...</p>
      )}
      {error && <p className="mt-6 text-center text-primary">{error}</p>}
    </>
  );
}
