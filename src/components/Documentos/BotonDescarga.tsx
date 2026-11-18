import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DocumentoIcon, Spinner } from "./BotonPresupuesto";

interface Props {
  etiqueta: string;
  descargar: () => Promise<void>;
}

// Botón de descarga de un PDF con su estado de carga y de error
export default function BotonDescarga({ etiqueta, descargar }: Props) {
  const { t } = useTranslation();
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState("");

  const onClick = async () => {
    setError("");
    setDescargando(true);
    try {
      await descargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("documentos.errorDescargar"));
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={descargando}
        aria-busy={descargando}
        className="flex cursor-pointer items-center gap-2 rounded-lg border border-primary px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-60"
      >
        {descargando ? <Spinner /> : <DocumentoIcon />}
        {descargando ? t("documentos.descargando") : etiqueta}
      </button>
      {error && (
        <p role="alert" className="text-xs text-primary">
          {error}
        </p>
      )}
    </div>
  );
}
