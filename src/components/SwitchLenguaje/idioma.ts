import { useTranslation } from "react-i18next";
import { useSession } from "../../services/auth-client";
import { BASE_URL } from "../../services/api";

export const URL_IDIOMA_USUARIO = `${BASE_URL}/api/usuario/idioma`;

export const IDIOMAS = [
  { codigo: "es", nombre: "Español" },
  { codigo: "en", nombre: "English" },
] as const;
export type CodigoIdioma = (typeof IDIOMAS)[number]["codigo"];

// Idioma actual y cómo cambiarlo (lo usan el selector del navbar y el menú de celular)
export function useIdioma() {
  const { i18n } = useTranslation();
  const { data: session } = useSession();
  const idiomaActual = (i18n.resolvedLanguage || "es").slice(0, 2);

  const cambiarIdioma = async (codigo: CodigoIdioma) => {
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

  return { idiomaActual, cambiarIdioma };
}
