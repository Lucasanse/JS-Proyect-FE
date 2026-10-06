import { useTranslation } from "react-i18next";

// Página de prueba. Reemplazar con el contenido real.
export default function ArmarPc() {
  const { t } = useTranslation();

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-primary">{t("armarPc.titulo")}</h1>
      <p className="mt-2 text-muted">{t("armarPc.enConstruccion")}</p>
    </section>
  );
}
