import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Precio from "../../components/Precio/Precio";
import ErrorCarga from "../../components/ServicioTecnico/ErrorCarga";
import { useToast } from "../../components/Toast/toastContext";
import { useSession } from "../../services/auth-client";
import { PASOS_ARMADOR, eliminarPreset, listarPresets, type PresetArmado } from "../../services/armador";
import { guardarEnPestana, leerServicios, separarArmado } from "../ArmarPc/armadoPestana";
import { useTextosArmador } from "../ArmarPc/textosArmador";

// /presets: los armados que guardó el usuario, con lo que lleva cada uno.
// "Abrir en el armador" lo deja cargado en la pestaña y va a /armar-pc, que lo vuelve a validar.
export default function Presets() {
  const { t, i18n } = useTranslation();
  const { data: session, isPending } = useSession();
  const { mostrarToast } = useToast();
  const navigate = useNavigate();
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
  }, [userId, reintento, i18n.resolvedLanguage, t]);

  const abrir = (preset: PresetArmado) => {
    const { seleccion, perifericos } = separarArmado(preset.componentes);
    // Los servicios elegidos no se guardan en el armado: se mantienen los que ya estaban
    guardarEnPestana(seleccion, perifericos, leerServicios());
    navigate("/armar-pc");
  };

  const eliminar = async (preset: PresetArmado) => {
    if (!window.confirm(t("presets.confirmarEliminar", { nombre: preset.nombre }))) return;
    setEliminando(preset.id);
    try {
      await eliminarPreset(preset.id);
      setPresets((actuales) => actuales?.filter((p) => p.id !== preset.id) ?? null);
      mostrarToast(t("presets.eliminado", { nombre: preset.nombre }), "exito");
    } catch (e) {
      mostrarToast(e instanceof Error ? e.message : t("armarPc.errorEliminar"), "error");
    } finally {
      setEliminando(null);
    }
  };

  return (
    <section className="w-full flex-1 bg-surface-alt">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-ink">{t("presets.titulo")}</h1>
        <p className="mt-2 text-muted">{t("presets.subtitulo")}</p>

        {isPending ? (
          <Esqueleto />
        ) : !session ? (
          <p className="mt-6 rounded-xl border border-line bg-surface p-4 text-muted">
            <Link to="/login" className="font-semibold text-primary hover:underline">
              {t("armarPc.iniciaSesion")}
            </Link>{" "}
            {t("presets.paraVer")}
          </p>
        ) : error ? (
          <ErrorCarga mensaje={error} onReintentar={() => setReintento((r) => r + 1)} />
        ) : !presets ? (
          <Esqueleto />
        ) : presets.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-line bg-surface px-4 py-12 text-center">
            <p className="text-muted">{t("presets.sinArmados")}</p>
            <Link
              to="/armar-pc"
              className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 font-semibold text-white hover:bg-primary-dark"
            >
              {t("presets.armarUno")}
            </Link>
          </div>
        ) : (
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {presets.map((preset) => (
              <li key={preset.id}>
                <TarjetaPreset
                  preset={preset}
                  eliminando={eliminando === preset.id}
                  onAbrir={() => abrir(preset)}
                  onEliminar={() => eliminar(preset)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function TarjetaPreset({
  preset,
  eliminando,
  onAbrir,
  onEliminar,
}: {
  preset: PresetArmado;
  eliminando: boolean;
  onAbrir: () => void;
  onEliminar: () => void;
}) {
  const { t } = useTranslation();
  const textos = useTextosArmador();
  // En el orden de los pasos del armador
  const componentes = [...preset.componentes].sort(
    (a, b) => PASOS_ARMADOR.indexOf(a.producto.paso) - PASOS_ARMADOR.indexOf(b.producto.paso),
  );
  const total = componentes.reduce((acc, c) => acc + c.producto.precio * c.cantidad, 0);

  return (
    <article className="flex h-full flex-col rounded-xl border border-line bg-surface p-4 shadow-sm">
      <h2 className="truncate text-lg font-bold text-ink" title={preset.nombre}>
        {preset.nombre}
      </h2>
      <p className="text-xs text-muted">
        {t("armarPc.resumenArmado", { count: componentes.length, watts: preset.potenciaWatts })}
      </p>

      <ul className="mt-3 divide-y divide-line text-sm">
        {componentes.map(({ producto, cantidad }) => (
          <li key={producto.id} className="flex items-center gap-3 py-1.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded border border-line bg-white">
              {producto.imagenUrl && (
                <img src={producto.imagenUrl} alt="" loading="lazy" className="h-full w-full object-contain p-0.5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">{textos.tipo(producto.paso)}</p>
              <p className="truncate text-ink" title={producto.nombre}>
                {cantidad > 1 && `${cantidad} × `}
                {producto.nombre}
              </p>
            </div>
            <Precio precio={producto.precio * cantidad} className="shrink-0 text-ink" />
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-3">
        <div className="flex items-baseline justify-between border-t border-line pt-3">
          <span className="font-semibold text-ink">{t("armarPc.total")}</span>
          <Precio precio={total} className="text-xl font-bold text-primary" />
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onAbrir}
            className="flex-1 cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            {t("presets.abrir")}
          </button>
          <button
            type="button"
            disabled={eliminando}
            onClick={onEliminar}
            className="cursor-pointer rounded-lg border border-line px-4 py-2 text-sm font-semibold text-muted hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("armarPc.eliminar")}
          </button>
        </div>
      </div>
    </article>
  );
}

function Esqueleto() {
  return (
    <ul className="mt-6 grid gap-4 md:grid-cols-2" aria-hidden>
      {[0, 1].map((i) => (
        <li key={i} className="h-72 animate-pulse rounded-xl bg-surface" />
      ))}
    </ul>
  );
}
