import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import jsLogo from "../../assets/js-logo.png";
import { useSession } from "../../services/auth-client";
import { useCarrito } from "../CarritoProvider/carritoContext";
import { SwitchLenguaje } from "../SwitchLenguaje/SwitchLenguaje";

// Guardamos la clave de traducción (labelKey) en lugar del texto fijo
const NAV_LINKS = [
  { to: "/productos", labelKey: "nav.productos" },
  { to: "/armar-pc", labelKey: "nav.armarPc" },
  { to: "/servicio-tecnico", labelKey: "nav.servicioTecnico" },
] as const;

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-[15px] font-medium transition-colors ${
    isActive
      ? "bg-primary-light text-primary"
      : "text-ink hover:bg-surface-alt hover:text-primary"
  }`;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const { t } = useTranslation();
  const { data: session, isPending } = useSession();
  const { carrito } = useCarrito();
  const cantidadCarrito = carrito?.cantidadTotal ?? 0;
  const esAdmin = session?.user.rol === "ADMIN";

  return (
    <header className="sticky top-0 z-50 w-full border-b-4 border-primary bg-surface shadow-sm">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
        {/* Menú hamburguesa (solo mobile) */}
        <button
          type="button"
          aria-label={open ? t("nav.cerrarMenu") : t("nav.abrirMenu")}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-ink hover:bg-surface-alt md:hidden"
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>

        <Link
          to="/"
          onClick={close}
          className="shrink-0"
          aria-label={t("nav.inicio")}
        >
          <img src={jsLogo} alt="JS" className="h-11 w-11 object-contain" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass}>
              {t(l.labelKey)}
            </NavLink>
          ))}
          {esAdmin && (
            <NavLink to="/admin" className={linkClass}>
              {t("nav.admin")}
            </NavLink>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-3 sm:gap-5">
          <button
            type="button"
            aria-label={t("nav.notificaciones")}
            className="relative flex cursor-pointer text-muted hover:text-primary"
          >
            <BellIcon />
          </button>

          <div className="hidden items-center gap-4 md:flex">
            {isPending ? (
              <span className="text-sm text-muted">{t("nav.cargando")}</span>
            ) : session ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-ink">
                  {t("nav.hola")}{" "}
                  <strong className="text-primary">{session.user.name}</strong>
                </span>

                <Link
                  to="/logout"
                  className="rounded-lg border border-line bg-surface-alt px-4 py-2 text-sm font-semibold text-ink hover:bg-line transition-colors"
                >
                  {t("nav.cerrarSesion")}
                </Link>
              </div>
            ) : (
              <Link
                to="/login"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-surface hover:bg-primary-dark transition-colors"
              >
                {t("nav.iniciarSesion")}
              </Link>
            )}
          </div>

          <Link
            to="/carrito"
            onClick={close}
            aria-label={t("nav.carrito")}
            className="relative flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-primary text-secondary transition-colors hover:bg-primary-dark"
          >
            <CartIcon />
            {cantidadCarrito > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
                {cantidadCarrito > 99 ? "99+" : cantidadCarrito}
              </span>
            )}
          </Link>

          <SwitchLenguaje />
        </div>
      </div>

      {/* Menú desplegable mobile */}
      {open && (
        <nav className="flex flex-col gap-1 border-t border-line px-4 py-3 md:hidden">
          {NAV_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={close}
              className={(s) => `${linkClass(s)} py-3`}
            >
              {t(l.labelKey)}
            </NavLink>
          ))}
          {esAdmin && (
            <NavLink
              to="/admin"
              onClick={close}
              className={(s) => `${linkClass(s)} py-3`}
            >
              {t("nav.admin")}
            </NavLink>
          )}

          {/* Sesión (en mobile vive dentro del menú) */}
          <div className="mt-2 flex flex-col gap-2 border-t border-line pt-3">
            {isPending ? (
              <span className="px-3 text-sm text-muted">{t("nav.cargando")}</span>
            ) : session ? (
              <>
                <span className="px-3 text-sm font-medium text-ink">
                  {t("nav.hola")}{" "}
                  <strong className="text-primary">{session.user.name}</strong>
                </span>
                <Link
                  to="/logout"
                  onClick={close}
                  className="rounded-lg border border-line bg-surface-alt px-4 py-3 text-center text-sm font-semibold text-ink transition-colors hover:bg-line"
                >
                  {t("nav.cerrarSesion")}
                </Link>
              </>
            ) : (
              <Link
                to="/login"
                onClick={close}
                className="rounded-lg bg-primary px-4 py-3 text-center text-sm font-semibold text-surface transition-colors hover:bg-primary-dark"
              >
                {t("nav.iniciarSesion")}
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

function MenuIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22zm7-6V11a7 7 0 0 0-5.5-6.84V3.5a1.5 1.5 0 0 0-3 0v.66A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5v1H4v-1z" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM5.2 4H2V2h4.6l.9 2H21l-3.6 8.1a2 2 0 0 1-1.8 1.2H8.1l-1 1.7H19v2H5l2.3-4L5.2 4z" />
    </svg>
  );
}
