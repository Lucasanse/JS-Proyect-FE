import { NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import RutaAdmin from "../components/RutaAdmin/RutaAdmin";
import { SECCIONES_ADMIN } from "../pages/Admin/secciones";
import { IconoInicio } from "../pages/Admin/IconosAdmin";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
    isActive ? "bg-primary text-white" : "text-ink hover:bg-surface-alt hover:text-primary"
  }`;

// Estructura de todas las páginas /admin/*: menú de secciones + contenido.
// En desktop el menú va a la izquierda; en mobile, arriba como pestañas con scroll horizontal.
// RutaAdmin protege todas las secciones de una vez (solo rol ADMIN).
// Las secciones del menú se definen en pages/Admin/secciones.tsx.
export default function AdminLayout() {
  const { t } = useTranslation();

  return (
    <RutaAdmin>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 md:flex-row md:py-8 lg:px-8">
        <aside className="md:w-56 md:shrink-0">
          <nav
            aria-label={t("admin.menu.titulo")}
            className="md:sticky md:top-24 md:rounded-xl md:border md:border-line md:p-3"
          >
            <p className="mb-2 hidden px-3 text-xs font-semibold tracking-wide text-muted uppercase md:block">
              {t("admin.menu.titulo")}
            </p>
            <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-col md:overflow-visible md:px-0 md:pb-0">
              <li>
                {/* end: "Inicio" solo se marca en /admin, no en las secciones */}
                <NavLink to="" end className={linkClass}>
                  <span className="text-lg">
                    <IconoInicio />
                  </span>
                  {t("admin.menu.inicio")}
                </NavLink>
              </li>
              {SECCIONES_ADMIN.map((s) => (
                <li key={s.to}>
                  {s.disponible ? (
                    <NavLink to={s.to} className={linkClass}>
                      <span className="text-lg">{s.icono}</span>
                      {t(s.tituloKey)}
                    </NavLink>
                  ) : (
                    <span
                      aria-disabled
                      title={t("admin.menu.prontoAyuda")}
                      className="flex shrink-0 cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium whitespace-nowrap text-muted/70"
                    >
                      <span className="text-lg">{s.icono}</span>
                      {t(s.tituloKey)}
                      <span className="ml-auto rounded-full bg-surface-alt px-2 py-0.5 text-[11px] font-semibold text-muted">
                        {t("admin.menu.pronto")}
                      </span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </RutaAdmin>
  );
}
