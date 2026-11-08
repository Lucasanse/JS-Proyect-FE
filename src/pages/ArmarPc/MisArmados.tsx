import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Precio from "../../components/Precio/Precio";
import ErrorCarga from "../../components/ServicioTecnico/ErrorCarga";
import BotonPresupuesto from "../../components/Documentos/BotonPresupuesto";
import { useToast } from "../../components/Toast/toastContext";
import { useSession } from "../../services/auth-client";
import { eliminarPreset, listarPresets, type ComponenteElegido, type PresetArmado } from "../../services/armador";

interface Props {
  version: number; // cambia al guardar un armado nuevo
  onCargar: (componentes: ComponenteElegido[]) => void;
}

// Armados guardados por el usuario (presupuestos): se pueden volver a cargar en el asistente
export default function MisArmados({ version, onCargar }: Props) {
  const { t, i18n } = useTranslation();
  const { data: session } = useSession();
  const { mostrarToast } = useToast();
  const [presets, setPresets] = useState<PresetArmado[] | null>(null);
  const [error, setError] = useState("");
  const [reintento, setReintento] = useState(0);
  const [eliminando, setEliminando] = useState<number | null>(null);
  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    listarPresets(controller.signal)
      .then((data) => {
        setPresets(data);
        setError("");
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : t("armarPc.errorArmados"));
      });
    return () => controller.abort();
  }, [userId, version, reintento, i18n.resolvedLanguage, t]);

  if (!session) return null;

  const eliminar = async (id: number) => {
    setEliminando(id);
    try {
      await eliminarPreset(id);
      setPresets((actuales) => actuales?.filter((p) => p.id !== id) ?? null);
    } catch (e) {
      mostrarToast(e instanceof Error ? e.message : t("armarPc.errorEliminar"), "error");
    } finally {
      setEliminando(null);
    }
  };

  return (
    // Arriba del asistente y en una fila con scroll horizontal, para tenerlos a mano sin empujar los pasos
    <section className="mt-6">
      <h2 className="text-lg font-bold text-ink">{t("armarPc.misArmados")}</h2>
      {error ? (
        <ErrorCarga mensaje={error} onReintentar={() => setReintento((r) => r + 1)} />
      ) : !presets ? (
        <p className="mt-2 text-sm text-muted">{t("armarPc.cargando")}</p>
      ) : presets.length === 0 ? (
        <p className="mt-2 text-sm text-muted">{t("armarPc.sinArmados")}</p>
      ) : (
        <ul className="mt-2 flex gap-3 overflow-x-auto pb-2">
          {presets.map((preset) => (
            <li
              key={preset.id}
              className="flex w-60 shrink-0 flex-col gap-1 rounded-xl border border-line bg-surface p-3 shadow-sm"
            >
              <h3 className="truncate font-semibold text-ink" title={preset.nombre}>
                {preset.nombre}
              </h3>
              <p className="text-xs text-muted">
                {t("armarPc.resumenArmado", { count: preset.componentes.length, watts: preset.potenciaWatts })}
              </p>
              <Precio
                precio={preset.componentes.reduce((acc, c) => acc + c.producto.precio * c.cantidad, 0)}
                className="font-bold text-ink"
              />
              <div className="mt-auto flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onCargar(preset.componentes)}
                  className="cursor-pointer rounded-md bg-primary px-3 py-1 text-sm font-semibold text-white hover:bg-primary-dark"
                >
                  {t("armarPc.cargar")}
                </button>
                <button
                  type="button"
                  disabled={eliminando === preset.id}
                  onClick={() => eliminar(preset.id)}
                  className="cursor-pointer rounded-md border border-line px-3 py-1 text-sm font-semibold text-muted hover:text-primary disabled:opacity-50"
                >
                  {t("armarPc.eliminar")}
                </button>
              </div>
              <BotonPresupuesto
                origen={() => ({ origen: "preset", idPreset: preset.id })}
                className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-line px-3 py-1 text-sm font-semibold text-ink hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
