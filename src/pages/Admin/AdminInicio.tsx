import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSession } from "../../services/auth-client";
import { SECCIONES_ADMIN } from "./secciones";

// Página de entrada del panel (/admin): una tarjeta por cada funcionalidad del admin.
export default function AdminInicio() {
  const { t } = useTranslation();
  const { data: session } = useSession();

  return (
    <section className="w-full">
      <p className="text-muted">
        {t("nav.hola")} <strong className="text-primary">{session?.user.name}</strong>
      </p>
      <h1 className="m-0 mt-1 text-3xl font-bold text-ink">{t("admin.inicio.titulo")}</h1>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {SECCIONES_ADMIN.map((s) => {
          const contenido = (
            <>
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${
                  s.disponible ? "bg-primary-light text-primary" : "bg-surface-alt text-muted"
                }`}
              >
                {s.icono}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex items-center gap-2">
                  <span className="text-lg font-bold text-ink">{t(s.tituloKey)}</span>
                  {!s.disponible && (
                    <span className="rounded-full bg-surface-alt px-2 py-0.5 text-[11px] font-semibold text-muted">
                      {t("admin.menu.pronto")}
                    </span>
                  )}
                </span>
                <span className="text-sm text-muted">{t(s.descripcionKey)}</span>
              </span>
              {s.disponible && (
                <span
                  aria-hidden
                  className="self-center text-xl text-muted transition-transform group-hover:translate-x-1 group-hover:text-primary"
                >
                  →
                </span>
              )}
            </>
          );

          const base = "flex h-full gap-4 rounded-2xl border p-5";
          return (
            <li key={s.to}>
              {s.disponible ? (
                <Link
                  to={s.to}
                  className={`group ${base} border-line bg-surface shadow-sm transition hover:border-primary hover:shadow-md`}
                >
                  {contenido}
                </Link>
              ) : (
                <div aria-disabled title={t("admin.menu.prontoAyuda")} className={`${base} border-dashed border-line bg-surface opacity-70`}>
                  {contenido}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
