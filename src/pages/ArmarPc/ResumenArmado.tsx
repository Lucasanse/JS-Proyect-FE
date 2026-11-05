import { useState, type Dispatch, type SetStateAction } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Precio from "../../components/Precio/Precio";
import Modal from "../../components/Modal/Modal";
import { useCarrito } from "../../components/CarritoProvider/carritoContext";
import { useToast } from "../../components/Toast/toastContext";
import { useSession } from "../../services/auth-client";
import {
  PASOS_ARMADOR,
  PASO_PERIFERICOS,
  TIPOS_ARMADOR,
  guardarPreset,
  type ComponenteElegido,
  type PasoArmador,
  type PotenciaCalculada,
  type ProductoArmador,
  type ValidacionArmado,
} from "../../services/armador";
import type { ProductoResumen } from "../../services/productos";
import ServiciosArmado from "./ServiciosArmado";
import { especificacionDe, useTextosArmador } from "./textosArmador";
import type { Seleccion } from "./ArmarPc";

interface Props {
  seleccion: Seleccion;
  perifericos: ComponenteElegido[];
  servicios: ProductoResumen[];
  validacion: ValidacionArmado | null;
  potencia: PotenciaCalculada | null;
  fuenteSugerida: ProductoArmador | null;
  verificando: boolean;
  onIr: (paso: PasoArmador) => void;
  onQuitar: (producto: ProductoArmador) => void;
  onQuitarPeriferico: (idProducto: number) => void;
  onElegir: (producto: ProductoArmador) => void;
  onServicios: Dispatch<SetStateAction<ProductoResumen[]>>;
  onVaciar: () => void;
  onGuardado: () => void;
}

// Panel con lo elegido, precio total, consumo estimado y las acciones finales
export default function ResumenArmado({
  seleccion,
  perifericos,
  servicios,
  validacion,
  potencia,
  fuenteSugerida,
  verificando,
  onIr,
  onQuitar,
  onQuitarPeriferico,
  onElegir,
  onServicios,
  onVaciar,
  onGuardado,
}: Props) {
  const { t } = useTranslation();
  const textos = useTextosArmador();
  const { data: session } = useSession();
  const { agregarArmado } = useCarrito();
  const { mostrarToast } = useToast();
  const [agregando, setAgregando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  // Lo que se guarda: los componentes y los periféricos. Al comprar se suman los servicios elegidos.
  const componentes = [...TIPOS_ARMADOR.flatMap((t2) => seleccion[t2] ?? []), ...perifericos];
  const aComprar = [...componentes, ...servicios.map((producto) => ({ producto, cantidad: 1 }))];
  const total = aComprar.reduce((acc, c) => acc + c.producto.precio * c.cantidad, 0);
  const faltantes = validacion?.faltantes ?? [];
  const sinStock = aComprar.filter((c) => c.producto.stock < c.cantidad);
  // El BE también lo rechaza; acá se deshabilita para no llegar a ese error
  const listo = !verificando && !!validacion?.valida && !!validacion.completa && sinStock.length === 0;

  const limpiar = () => {
    if (!window.confirm(t("armarPc.confirmarLimpiar"))) return;
    setError("");
    onVaciar();
  };

  const agregarAlCarrito = async () => {
    setError("");
    setAgregando(true);
    try {
      await agregarArmado(aComprar);
      mostrarToast(t("armarPc.agregadoCarrito"), "exito");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("armarPc.errorCarrito"));
    } finally {
      setAgregando(false);
    }
  };

  return (
    <aside className="w-full rounded-xl border border-line bg-surface p-4 shadow-sm sm:p-6 lg:sticky lg:top-4 lg:w-96">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-ink">{t("armarPc.resumen")}</h2>
        {aComprar.length > 0 && (
          <button
            type="button"
            onClick={limpiar}
            disabled={verificando}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-muted hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
            </svg>
            {t("armarPc.limpiarArmado")}
          </button>
        )}
      </div>

      {/* Un renglón por paso, con lo elegido debajo (en almacenamiento y periféricos puede haber varios) */}
      <ul className="mt-3 divide-y divide-line">
        {PASOS_ARMADOR.map((paso) => {
          const elegidos = paso === PASO_PERIFERICOS ? perifericos : (seleccion[paso] ?? []);
          const falta = faltantes.find((f) => f.tipo === paso);
          const quitar = (producto: ProductoArmador) =>
            paso === PASO_PERIFERICOS ? onQuitarPeriferico(producto.id) : onQuitar(producto);
          return (
            <li key={paso} className="py-2 text-sm">
              <button type="button" onClick={() => onIr(paso)} className="block w-full cursor-pointer text-left">
                <span className="block text-xs font-semibold uppercase tracking-wide text-muted">{textos.tipo(paso)}</span>
                {elegidos.length === 0 && (
                  <span className={`block ${falta ? "text-primary" : "text-muted"}`}>
                    {falta
                      ? t(falta.codigo === "SIN_GRAFICOS_INTEGRADOS" ? "armarPc.faltaGpu" : "armarPc.faltaElegir")
                      : t("armarPc.opcional")}
                  </span>
                )}
              </button>
              {elegidos.map(({ producto, cantidad }) => (
                <div key={producto.id} className="mt-0.5 flex items-start gap-2">
                  <span className="min-w-0 flex-1 truncate text-ink">
                    {cantidad > 1 && `${cantidad} × `}
                    {producto.nombre}
                  </span>
                  <Precio precio={producto.precio * cantidad} className="shrink-0 font-semibold text-ink" />
                  <button
                    type="button"
                    onClick={() => quitar(producto)}
                    disabled={verificando && paso !== PASO_PERIFERICOS}
                    aria-label={t("armarPc.quitarComponente", { nombre: producto.nombre })}
                    className="shrink-0 cursor-pointer rounded px-1 text-muted hover:text-primary disabled:opacity-50"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </li>
          );
        })}
      </ul>

      <ServiciosArmado elegidos={servicios} onCambiar={onServicios} />

      <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
        <span className="font-semibold text-ink">{t("armarPc.total")}</span>
        <Precio precio={total} className="text-xl font-bold text-primary" />
      </div>

      <IndicadorPotencia potencia={potencia} fuente={seleccion.Fuente?.[0]?.producto} />

      {fuenteSugerida && (
        <div className="mt-3 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm">
          <p className="font-semibold text-emerald-900">{t("armarPc.fuenteSugerida")}</p>
          <p className="text-emerald-900">
            {fuenteSugerida.nombre} · {especificacionDe(fuenteSugerida, "Potencia")} W ·{" "}
            <Precio precio={fuenteSugerida.precio} />
          </p>
          <button
            type="button"
            disabled={verificando}
            onClick={() => onElegir(fuenteSugerida)}
            className="mt-2 cursor-pointer rounded-md bg-emerald-700 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            {t("armarPc.usarFuente")}
          </button>
        </div>
      )}

      {sinStock.length > 0 && (
        <p className="mt-3 text-sm text-red-700">
          {t("armarPc.sinStockArmado", { nombres: sinStock.map((c) => c.producto.nombre).join(", ") })}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {session ? (
        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            disabled={!listo || agregando}
            onClick={agregarAlCarrito}
            className="cursor-pointer rounded-lg bg-primary px-4 py-2.5 font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-muted"
          >
            {agregando ? t("armarPc.agregando") : t("armarPc.agregarTodo")}
          </button>
          {!listo && !verificando && faltantes.length > 0 && (
            <p className="text-xs text-muted">{t("armarPc.completaParaComprar")}</p>
          )}
          <button
            type="button"
            disabled={verificando || componentes.length === 0 || !validacion?.valida}
            onClick={() => setGuardando(true)}
            className="cursor-pointer rounded-lg border border-primary px-4 py-2 font-semibold text-primary hover:bg-primary-light disabled:cursor-not-allowed disabled:border-line disabled:text-muted"
          >
            {t("armarPc.guardar")}
          </button>
        </div>
      ) : (
        <p className="mt-4 rounded-lg bg-surface-alt p-3 text-sm text-muted">
          <Link to="/login" className="font-semibold text-primary hover:underline">
            {t("armarPc.iniciaSesion")}
          </Link>{" "}
          {t("armarPc.paraComprar")}
        </p>
      )}

      {guardando && (
        <GuardarModal
          onCerrar={() => setGuardando(false)}
          onGuardar={async (nombre) => {
            await guardarPreset(nombre, componentes);
            setGuardando(false);
            mostrarToast(t("armarPc.guardado"), "exito");
            onGuardado();
          }}
        />
      )}
    </aside>
  );
}

// Consumo estimado en watts, con una barra que muestra cuánto de la fuente usaría el equipo
function IndicadorPotencia({ potencia, fuente }: { potencia: PotenciaCalculada | null; fuente?: ProductoArmador }) {
  const { t } = useTranslation();
  if (!potencia) {
    return <p className="mt-3 text-sm text-muted">{t("armarPc.potenciaVacia")}</p>;
  }
  const potenciaFuente = Number(especificacionDe(fuente, "Potencia")) || 0;
  const escala = potenciaFuente || potencia.recomendada || 1;
  const uso = Math.min(100, Math.round((potencia.consumo / escala) * 100));
  const color = uso <= 60 ? "bg-emerald-500" : uso <= 85 ? "bg-accent" : "bg-red-500";

  return (
    <div className="mt-3 rounded-lg bg-surface-alt p-3 text-sm">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-muted">{t("armarPc.consumo")}</span>
        <span className="text-lg font-bold text-ink" aria-live="polite">
          {potencia.consumo} W
        </span>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-line"
        role="meter"
        aria-label={t("armarPc.consumo")}
        aria-valuemin={0}
        aria-valuemax={escala}
        aria-valuenow={potencia.consumo}
      >
        <div className={`h-full rounded-full transition-all duration-300 ${color}`} style={{ width: `${uso}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted">
        {t("armarPc.recomendada", { watts: potencia.recomendada, margen: potencia.margenPorcentaje })}
      </p>
      {potenciaFuente > 0 && (
        <p className="text-xs text-muted">{t("armarPc.usoFuente", { watts: potenciaFuente, uso })}</p>
      )}
    </div>
  );
}

function GuardarModal({ onCerrar, onGuardar }: { onCerrar: () => void; onGuardar: (nombre: string) => Promise<void> }) {
  const { t } = useTranslation();
  const [nombre, setNombre] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setError("");
    setEnviando(true);
    try {
      await onGuardar(nombre.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : t("armarPc.errorGuardar"));
      setEnviando(false);
    }
  };

  return (
    <Modal titulo={t("armarPc.guardarTitulo")} onCerrar={onCerrar} bloqueado={enviando} cerrarAlClicFuera={false}>
      <form onSubmit={enviar} className="flex flex-col gap-3 p-5">
        <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
          {t("armarPc.nombreArmado")}
          <input
            data-autofocus
            value={nombre}
            maxLength={80}
            onChange={(e) => setNombre(e.target.value)}
            placeholder={t("armarPc.nombrePlaceholder")}
            className="rounded-lg border border-line bg-surface px-3 py-2 font-normal text-ink"
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={enviando || !nombre.trim()}
          className="cursor-pointer rounded-lg bg-primary px-4 py-2 font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-muted"
        >
          {enviando ? t("armarPc.guardando") : t("armarPc.guardar")}
        </button>
      </form>
    </Modal>
  );
}
