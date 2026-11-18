import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import jsLogo from "../../assets/js-logo.png";
import IconoRed from "../RedesSociales/IconoRed";
import { NOMBRES_REDES, REDES, type RedSocial } from "../RedesSociales/redes";

// Footer genérico de prueba. Los links y textos se pueden cambiar acá.
// Los textos son claves de i18n (src/locales).
const FOOTER_COLUMNS = [
  {
    title: "footer.tienda",
    links: [
      { to: "/productos", label: "footer.productos" },
      { to: "/armar-pc", label: "footer.armarPc" },
      { to: "/carrito", label: "footer.carrito" },
    ],
  },
  {
    title: "footer.ayuda",
    links: [
      { to: "/servicio-tecnico", label: "footer.servicioTecnico" },
      { to: "/", label: "footer.faq" },
      { to: "/quienes-somos#contacto", label: "footer.contacto" },
      { to: "/quienes-somos", label: "footer.quienesSomos" },
    ],
  },
  {
    title: "footer.cuenta",
    links: [
      { to: "/login", label: "footer.iniciarSesion" },
      { to: "/", label: "footer.misPedidos" },
    ],
  },
];

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="w-full border-t-4 border-primary bg-dark text-secondary">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <Link to="/" className="inline-flex items-center gap-3">
            <img src={jsLogo} alt="JS" className="h-11 w-11 object-contain" />
            <span className="text-lg font-semibold text-white">JS Computación</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-secondary/70">
            {t("footer.descripcion")}
          </p>
          {/* Redes del local: al pasar el mouse cada ícono toma el color de su marca */}
          <ul className="mt-5 flex gap-3">
            {(Object.keys(REDES) as RedSocial[]).map((red) => (
              <li key={red}>
                <a
                  href={REDES[red].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={red === "whatsapp" ? t("footer.escribirWhatsapp") : NOMBRES_REDES[red]}
                  title={red === "whatsapp" ? t("footer.escribirWhatsapp") : NOMBRES_REDES[red]}
                  style={{ "--color-red": REDES[red].color } as CSSProperties}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-[var(--color-red)]"
                >
                  <IconoRed red={red} />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {FOOTER_COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              {t(col.title)}
            </h3>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-sm text-secondary/70 transition-colors hover:text-white"
                  >
                    {t(l.label)}
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
