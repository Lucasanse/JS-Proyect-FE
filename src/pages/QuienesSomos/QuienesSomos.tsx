import { useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import IconoRed from "../../components/RedesSociales/IconoRed";
import { REDES } from "../../components/RedesSociales/redes";

// Página estática con los datos del local. Se llega desde el footer.
// Los datos fijos están acá (WhatsApp y redes en components/RedesSociales/redes.ts); los textos que cambian con el idioma, en locales (quienesSomos.*).
const LOCAL = {
  nombre: "J.S. Computación",
  direccion: "Sáenz Peña 97 - (8328) Allen, Río Negro",
  email: "ventas@jscomputacion.com.ar",
  mapa:
    "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d1550.8423078906726!2d-67.83296668419733!3d-38.976868916960285!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x960a2314cc623ff1%3A0x60ecd58069e93d40!2sJS%20Computaci%C3%B3n!5e0!3m2!1ses!2sar!4v1794175640715!5m2!1ses!2sar",
};

const RUBROS = ["insumos", "accesorios", "notebooks", "servicioTecnico"] as const;

export default function QuienesSomos() {
  const { t } = useTranslation();
  const { hash } = useLocation();

  // Se entra desde el footer (abajo de todo): arranca arriba, o en la tarjeta de contacto con #contacto
  useEffect(() => {
    const destino = hash ? document.getElementById(hash.slice(1)) : null;
    if (destino) destino.scrollIntoView({ behavior: "smooth", block: "start" });
    else window.scrollTo(0, 0);
  }, [hash]);

  return (
    <section className="w-full flex-1 bg-surface-alt">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">{t("quienesSomos.titulo")}</p>
          <h1 className="mt-1 text-3xl font-bold text-ink sm:text-4xl">{LOCAL.nombre}</h1>
          <p className="mt-3 text-lg leading-relaxed text-muted">{t("quienesSomos.intro")}</p>
        </header>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Tarjeta titulo={t("quienesSomos.queHacemos")} icono={<IconoCaja />}>
            <ul className="space-y-2">
              {RUBROS.map((r) => (
                <li key={r} className="flex gap-2">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {t(`quienesSomos.rubros.${r}`)}
                </li>
              ))}
            </ul>
          </Tarjeta>

          <Tarjeta titulo={t("quienesSomos.horarios")} icono={<IconoReloj />}>
            <p className="font-semibold text-ink">{t("quienesSomos.dias")}</p>
            <p>9:00 - 12:30</p>
            <p>17:00 - 20:30</p>
          </Tarjeta>

          {/* id para llegar directo desde "Contacto" del footer */}
          <Tarjeta id="contacto" titulo={t("quienesSomos.contacto")} icono={<IconoChat />}>
            <ul className="space-y-2">
              <li>
                <span className="block text-xs uppercase tracking-wide text-muted">{t("quienesSomos.direccion")}</span>
                {LOCAL.direccion}
              </li>
              <li>
                <span className="block text-xs uppercase tracking-wide text-muted">Email</span>
                <a href={`mailto:${LOCAL.email}`} className="break-all font-medium text-primary hover:underline">
                  {LOCAL.email}
                </a>
              </li>
              <li>
                <span className="block text-xs uppercase tracking-wide text-muted">WhatsApp</span>
                <a href={REDES.whatsapp.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                  {REDES.whatsapp.numero}
                </a>
              </li>
            </ul>
          </Tarjeta>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <BotonExterno href={REDES.whatsapp.url} className="bg-[#25d366] text-white hover:bg-[#1ebe5a]">
            <IconoRed red="whatsapp" />
            {t("quienesSomos.escribirWhatsapp")}
          </BotonExterno>
          <BotonExterno href={REDES.facebook.url} className="border border-line bg-surface text-ink hover:border-[#1877f2]">
            <span className="text-[#1877f2]">
              <IconoRed red="facebook" />
            </span>
            Facebook
          </BotonExterno>
          <BotonExterno href={REDES.instagram.url} className="border border-line bg-surface text-ink hover:border-[#e1306c]">
            <span className="text-[#e1306c]">
              <IconoRed red="instagram" />
            </span>
            Instagram
          </BotonExterno>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold text-ink">{t("quienesSomos.dondeEstamos")}</h2>
          <p className="mt-1 text-muted">{LOCAL.direccion}</p>
          <div className="mt-4 aspect-[4/3] w-full overflow-hidden rounded-xl border border-line bg-surface shadow-sm sm:aspect-[16/7]">
            <iframe
              src={LOCAL.mapa}
              title={t("quienesSomos.mapa")}
              className="h-full w-full border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Tarjeta({ id, titulo, icono, children }: { id?: string; titulo: string; icono: ReactNode; children: ReactNode }) {
  return (
    <article id={id} className="scroll-mt-24 rounded-xl border border-line bg-surface p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-primary">{icono}</span>
        <h2 className="text-lg font-bold text-ink">{titulo}</h2>
      </div>
      <div className="text-[15px] leading-relaxed text-ink">{children}</div>
    </article>
  );
}

function BotonExterno({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex h-11 items-center justify-center gap-2 rounded-lg px-5 font-semibold transition-colors ${className}`}
    >
      {children}
    </a>
  );
}

const propsIcono = {
  "aria-hidden": true,
  viewBox: "0 0 24 24",
  className: "h-5 w-5",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function IconoCaja() {
  return (
    <svg {...propsIcono}>
      <path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8" />
    </svg>
  );
}

function IconoReloj() {
  return (
    <svg {...propsIcono}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function IconoChat() {
  return (
    <svg {...propsIcono}>
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
    </svg>
  );
}
