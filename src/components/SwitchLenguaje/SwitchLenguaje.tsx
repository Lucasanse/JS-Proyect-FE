import { useTranslation } from "react-i18next";

const IDIOMAS = [
  { codigo: "es", etiqueta: "ES" },
  { codigo: "en", etiqueta: "EN" },
] as const;

type CodigoIdioma = (typeof IDIOMAS)[number]["codigo"];

export function SwitchLenguaje() {
  const { i18n } = useTranslation();
  const idiomaActual = i18n.resolvedLanguage || "es";

  const cambiarIdioma = (codigo: CodigoIdioma) => {
    i18n.changeLanguage(codigo);
  };

  return (
    <div className="inline-flex rounded-lg border border-border bg-surface p-1 text-xs font-medium">
      {IDIOMAS.map(({ codigo, etiqueta }) => {
        const activo = idiomaActual === codigo;

        return (
          <button
            key={codigo}
            type="button"
            onClick={() => cambiarIdioma(codigo)}
            aria-pressed={activo}
            className={`cursor-pointer rounded-md px-2.5 py-1 transition-colors ${
              activo
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            {etiqueta}
          </button>
        );
      })}
    </div>
  );
}
