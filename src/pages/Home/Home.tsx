import { useEffect, useState } from "react";
import ProductoCard from "../../components/ProductoCard/ProductoCard";
import { obtenerPaginaProductos } from "../../services/productos";
import type { ProductoResumen } from "../../types/producto";

const CANTIDAD_EN_INICIO = 5;

export default function Home() {
  const [productos, setProductos] = useState<ProductoResumen[]>([]);
  // Favoritos solo en memoria hasta que exista el endpoint en el BE
  const [favoritos, setFavoritos] = useState<Set<number>>(new Set());

  useEffect(() => {
    const controller = new AbortController();
    obtenerPaginaProductos(1, controller.signal)
      .then((body) => setProductos(body.data.slice(0, CANTIDAD_EN_INICIO)))
      .catch(() => {}); // si falla, la sección simplemente no se muestra
    return () => controller.abort();
  }, []);

  const toggleFavorito = (id: number) => {
    setFavoritos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-br from-primary to-primary-dark px-4 py-20 text-center text-white">
        <h1 className="mb-6 text-4xl font-bold text-white sm:text-5xl">Bienvenido a JS-Proyect</h1>
        <p className="mb-8 max-w-md text-lg text-secondary">
          Hola soy un P. Soy como una p pero en mayusculas.
        </p>
      </div>

      {productos.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-primary">Productos</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {productos.map((p) => (
              <ProductoCard
                key={p.id}
                producto={p}
                esFavorito={favoritos.has(p.id)}
                onToggleFavorito={toggleFavorito}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
