import type { ReactNode } from "react";
import { Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSession } from "../../services/auth-client";

// Protege las páginas de administración: sin sesión manda al login,
// y un usuario que no es ADMIN ve un aviso de acceso denegado.
// (El BE igual valida el rol en cada endpoint y responde 403.)
export default function RutaAdmin({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <p className="mx-auto w-full max-w-7xl px-4 py-12 text-muted">{t("nav.cargando")}</p>;
  }

  if (!session) return <Navigate to="/login" replace />;

  if (session.user.rol !== "ADMIN") {
    return (
      <section className="mx-auto w-full max-w-xl px-4 py-20 text-center">
        <div className="rounded-2xl border border-line bg-surface p-8 shadow-sm">
          <p className="text-5xl font-extrabold text-primary">403</p>
          <h2 className="mt-3 text-xl font-bold text-ink">{t("admin.sinPermisoTitulo")}</h2>
          <p className="mt-2 text-muted">{t("admin.sinPermisoTexto")}</p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            {t("admin.volverInicio")}
          </Link>
        </div>
      </section>
    );
  }

  return children;
}
