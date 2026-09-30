import { Link } from "react-router-dom";
import jsLogo from "../../assets/js-logo.png";

// Footer genérico de prueba. Los links y textos se pueden cambiar acá.
const FOOTER_COLUMNS = [
  {
    title: "Tienda",
    links: [
      { to: "/productos", label: "Productos" },
      { to: "/armar-pc", label: "Armá tu PC" },
      { to: "/carrito", label: "Carrito" },
    ],
  },
  {
    title: "Ayuda",
    links: [
      { to: "/servicio-tecnico", label: "Servicio técnico" },
      { to: "/", label: "Preguntas frecuentes" },
      { to: "/", label: "Contacto" },
    ],
  },
  {
    title: "Cuenta",
    links: [
      { to: "/login", label: "Iniciar sesión" },
      { to: "/", label: "Mis pedidos" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="w-full border-t-4 border-primary bg-dark text-secondary">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <Link to="/" className="inline-flex items-center gap-3">
            <img src={jsLogo} alt="JS" className="h-11 w-11 object-contain" />
            <span className="text-lg font-semibold text-white">JS-Proyect</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-secondary/70">
            Hardware, componentes y servicio técnico.
          </p>
        </div>

        {FOOTER_COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              {col.title}
            </h3>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-sm text-secondary/70 transition-colors hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      
    </footer>
  );
}
