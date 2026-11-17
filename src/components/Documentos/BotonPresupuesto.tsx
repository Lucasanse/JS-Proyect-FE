import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "../Toast/toastContext";
import { descargarPresupuesto, generarPresupuesto, type OrigenPresupuesto } from "../../services/documentos";

interface Props {
  origen: () => OrigenPresupuesto; // se lee al hacer clic, con lo elegido en ese momento
  disabled?: boolean;
  className?: string;
}

// "Generar presupuesto": lo crea en el BE (sin comprar) y descarga el PDF.
// Queda guardado en Mis compras para descargarlo de nuevo cuando se quiera.
export default function BotonPresupuesto({ origen, disabled, className }: Props) {
  const { t } = useTranslation();
  const { mostrarToast } = useToast();
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState("");

  const generar = async () => {
    setError("");
    setGenerando(true);
    try {
      const documento = await generarPresupuesto(origen());
      await descargarPresupuesto(documento);
      mostrarToast(t("documentos.presupuestoListo", { numero: documento.numero }), "exito");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("documentos.errorGenerar"));
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={generar}
        disabled={disabled || generando}
        aria-busy={generando}
        className={
          className ??
          "flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-primary font-semibold text-primary transition-colors hover:bg-primary-light disabled:cursor-not-allowed disabled:border-line disabled:text-muted"
        }
      >
        {generando ? <Spinner /> : <DocumentoIcon />}
        {generando ? t("documentos.generando") : t("documentos.generarPresupuesto")}
      </button>
      {error && (
        <p role="alert" className="text-sm text-primary">
          {error}
        </p>
      )}
    </div>
  );
}

export function Spinner() {
  return <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />;
}

export function DocumentoIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M12 12v6M9 15l3 3 3-3" />
    </svg>
  );
}
