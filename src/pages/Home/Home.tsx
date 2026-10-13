import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ProductoCard from "../../components/ProductoCard/ProductoCard";
import {
  obtenerPaginaProductos,
  type ProductoResumen,
} from "../../services/productos";
import { useVersionCatalogo } from "../../services/catalogoEventos";

const CANTIDAD_EN_INICIO = 5;

// Usamos las claves del JSON para que se traduzcan dinámicamente al renderizar
const SERVICIOS = [
  {
    icono: "🖥️",
    tituloKey: "home.servicios.armadoTitulo",
    textoKey: "home.servicios.armadoTexto",
    to: "/armar-pc",
  },
  {
    icono: "🔧",
    tituloKey: "home.servicios.tecnicoTitulo",
    textoKey: "home.servicios.tecnicoTexto",
    to: "/servicio-tecnico",
  },
] as const;

export default function Home() {
  const { t, i18n } = useTranslation();
  const [productos, setProductos] = useState<ProductoResumen[]>([]);
  // Favoritos solo en memoria hasta que exista el endpoint en el BE
  const [favoritos, setFavoritos] = useState<Set<number>>(new Set());
  // Cambia cuando el admin modifica productos: se vuelven a pedir sin recargar la página
  const versionCatalogo = useVersionCatalogo();

  useEffect(() => {
    const controller = new AbortController();
    // En el inicio solo se muestran productos con stock
    obtenerPaginaProductos(1, controller.signal, { conStock: "true" })
      .then((body) => setProductos(body.data.slice(0, CANTIDAD_EN_INICIO)))
      .catch(() => {}); // si falla, la sección simplemente no se muestra
    return () => controller.abort();
  }, [i18n.resolvedLanguage, versionCatalogo]); // <-- Se vuelve a pedir cuando cambia el idioma o el catálogo

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
      <section className="relative overflow-hidden bg-dark text-white">
        {/* Decoración de fondo */}
        <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-secondary-dark/30 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px]" />

        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 md:py-14 lg:px-8">
          <div>
            <h1 className="text-3xl leading-tight font-extrabold text-white sm:text-4xl lg:text-5xl">
              {t("home.heroTitulo")}{" "}
              <span className="text-accent">
                {t("home.heroTituloDestacado")}
              </span>
            </h1>
            <p className="mt-3 max-w-lg text-base text-secondary">
              {t("home.heroDescripcion")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/productos"
                className="rounded-lg bg-primary px-6 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:bg-primary-dark"
              >
                {t("home.verProductos")}
              </Link>
            </div>
          </div>

          {/* Servicios */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {SERVICIOS.map((b) => (
              <Link
                key={b.to}
                to={b.to}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition hover:-translate-y-1 hover:border-primary/60"
              >
                <span className="text-2xl" aria-hidden="true">
                  {b.icono}
                </span>
                <h3 className="mt-2 font-semibold text-white">
                  {t(b.tituloKey)}
                </h3>
                <p className="mt-1 text-sm text-secondary/80">
                  {t(b.textoKey)}
                </p>
                <span className="mt-3 inline-block text-sm font-semibold text-accent">
                  {t("home.verMas")}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {productos.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-primary">
            {t("home.seccionProductos")}
          </h2>
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
