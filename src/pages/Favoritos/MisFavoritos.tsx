import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSession } from "../../services/auth-client";
import { useFavoritos } from "../../hooks/useFavoritos";
import ProductoCard from "../../components/ProductoCard/ProductoCard";
import type { ProductoResumen } from "../../services/productos";

export default function MisFavoritos() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();
  const { favoritos, cargando, toggleFavorito } = useFavoritos(
    session?.user?.id,
  );

  useEffect(() => {
    if (!isPending && !session) {
      navigate("/login");
    }
  }, [isPending, session, navigate]);

  if (isPending || cargando) {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="h-9 w-56 animate-pulse rounded bg-slate-200" />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="h-72 animate-pulse rounded-xl bg-slate-100"
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-3xl font-bold text-primary">
          {t("favoritos.titulo")}
        </h1>
        {favoritos.length > 0 && (
          <span className="text-sm text-muted">
            {t("favoritos.cantidad", { count: favoritos.length })}
          </span>
        )}
      </div>

      {favoritos.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-800">
            {t("favoritos.vacioTitulo")}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {t("favoritos.vacioTexto")}
          </p>
          <Link
            to="/productos"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            {t("favoritos.irCatalogo")}
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {favoritos.map((fav) => {
            const productoCardData = {
              ...fav.producto,
              categoria: fav.producto.categoria.nombre,
            } as unknown as ProductoResumen;

            return (
              <ProductoCard
                key={fav.idFavorito}
                producto={productoCardData}
                esFavorito={true}
                onToggleFavorito={toggleFavorito}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
