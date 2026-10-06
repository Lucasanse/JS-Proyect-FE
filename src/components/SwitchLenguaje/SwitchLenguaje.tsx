import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSession } from "../../services/auth-client";

const URL_IDIOMA_USUARIO = "http://localhost:3000/api/usuario/idioma";

const IDIOMAS = [
  { codigo: "es", etiqueta: "ES" },
  { codigo: "en", etiqueta: "EN" },
] as const;

export function SwitchLenguaje() {
  const { i18n } = useTranslation();
  const { data: session } = useSession();
  const idiomaActual = (i18n.resolvedLanguage || "es").slice(0, 2);

  // Al cargar la sesión (o dar F5), trae el idioma guardado en la tabla Usuario
  useEffect(() => {
    if (!session?.user) return;

    const controller = new AbortController();

    fetch(URL_IDIOMA_USUARIO, {
      credentials: "include",
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { codigoIdioma?: string } | null) => {
        const codigo = data?.codigoIdioma;
        if (codigo === "es" || codigo === "en") {
          localStorage.setItem("i18nextLng", codigo);
          if (i18n.resolvedLanguage !== codigo) {
            i18n.changeLanguage(codigo);
          }
        }
      })
      .catch(() => {});

    return () => controller.abort();
  }, [session?.user?.id, i18n]);

  const cambiarIdioma = async (codigo: "es" | "en") => {
    // 1. Actualiza localStorage y la UI al instante
    localStorage.setItem("i18nextLng", codigo);
    await i18n.changeLanguage(codigo);

    // 2. Si tiene sesión iniciada, guarda el nuevo idioma en la tabla Usuario
    if (session?.user) {
      fetch(URL_IDIOMA_USUARIO, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ codigoIdioma: codigo }),
      }).catch(() => {});
    }
  };

  return (
    <div className="inline-flex rounded-lg border border-line bg-surface-alt p-1 text-xs font-semibold">
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
                ? "bg-primary text-surface"
                : "text-muted hover:text-ink"
            }`}
          >
            {etiqueta}
          </button>
        );
      })}
    </div>
  );
}