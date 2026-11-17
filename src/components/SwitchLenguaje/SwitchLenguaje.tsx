import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import MenuDesplegable from "../MenuDesplegable/MenuDesplegable";
import { useSession } from "../../services/auth-client";
import { IDIOMAS, URL_IDIOMA_USUARIO, useIdioma } from "./idioma";

export function SwitchLenguaje() {
  const { t, i18n } = useTranslation();
  const { data: session } = useSession();
  const { idiomaActual, cambiarIdioma } = useIdioma();

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

  return (
    <MenuDesplegable
      trigger={idiomaActual.toUpperCase()}
      ariaLabel={t("nav.idioma")}
      opciones={IDIOMAS.map(({ codigo, nombre }) => ({
        clave: codigo,
        etiqueta: nombre,
        activa: idiomaActual === codigo,
        onClick: () => cambiarIdioma(codigo),
      }))}
    />
  );
}
