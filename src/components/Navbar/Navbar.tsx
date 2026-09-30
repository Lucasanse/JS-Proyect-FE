import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import jsLogo from "../../assets/js-logo.png";

// Links principales del menú (desktop y mobile). Para agregar uno nuevo, sumalo acá.
const NAV_LINKS = [
  { to: "/productos", label: "Productos" },
  { to: "/armar-pc", label: "Armá tu PC" },
  { to: "/servicio-tecnico", label: "Servicio técnico" },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-[15px] font-medium transition-colors ${isActive
    ? "bg-primary-light text-primary"
    : "text-ink hover:bg-surface-alt hover:text-primary"
  }`;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b-4 border-primary bg-surface shadow-sm">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
        {/* Menú hamburguesa (solo mobile) */}
        <button
          type="button"
          aria-label="Abrir menú"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-ink hover:bg-surface-alt md:hidden"
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>

        <Link to="/" onClick={close} className="shrink-0" aria-label="Inicio">
          <img src={jsLogo} alt="JS" className="h-11 w-11 object-contain" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3 sm:gap-5">
          <button
            type="button"
            aria-label="Notificaciones"
            className="relative flex cursor-pointer text-muted hover:text-primary"
          >
            <BellIcon />
          </button>

          <Link
            to="/login"
            onClick={close}
            className="group flex items-center gap-2 text-sm font-semibold text-primary"
          >
            <span className="hidden whitespace-nowrap group-hover:underline sm:inline">
              Iniciar sesión
            </span>
            <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-surface-alt text-muted ring-1 ring-line">
              <UserIcon />
            </span>
          </Link>

          <Link
            to="/carrito"
            onClick={close}
            aria-label="Carrito"
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-primary text-secondary transition-colors hover:bg-primary-dark"
          >
            <CartIcon />
          </Link>
        </div>
      </div>

      {/* Menú desplegable mobile */}
      {open && (
        <nav className="flex flex-col gap-1 border-t border-line px-4 py-3 md:hidden">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} onClick={close} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}

function MenuIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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

// Silueta genérica de usuario (sin sesión iniciada)
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
