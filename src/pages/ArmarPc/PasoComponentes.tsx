import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Precio from "../../components/Precio/Precio";
import ErrorCarga from "../../components/ServicioTecnico/ErrorCarga";
import {
  CANTIDAD_MAXIMA,
  TIPOS_ARMADOR,
  TIPOS_CON_CANTIDAD,
  obtenerCompatibles,
  permiteVarios,
  type CompatiblesRespuesta,
  type Incompatibilidad,
  type ProductoArmador,
  type TipoArmador,
} from "../../services/armador";
import { especificacionDe, useTextosArmador } from "./textosArmador";
import type { Seleccion } from "./ArmarPc";

interface Props {
  tipo: TipoArmador;
  seleccion: Seleccion;
  graficosIntegrados?: string; // "Si" / "No" del procesador elegido
  idSugerida?: number; // fuente sugerida para el armado
  ocupado: boolean; // mientras se valida un cambio no se puede elegir otro
  onElegir: (producto: ProductoArmador) => void;
  onCantidad: (producto: ProductoArmador, cantidad: number) => void;
  onQuitar: (producto: ProductoArmador) => void;
}

// Un paso del asistente: explicación simple y productos compatibles con lo ya elegido.
// Los incompatibles se pueden ver aparte, deshabilitados y con el motivo.
export default function PasoComponentes({
  tipo,
  seleccion,
  graficosIntegrados,
  idSugerida,
  ocupado,
  onElegir,
  onCantidad,
  onQuitar,
}: Props) {
  const { t, i18n } = useTranslation();
  // Mientras llega la lista nueva se sigue mostrando la anterior (atenuada)
  const [datos, setDatos] = useState<CompatiblesRespuesta | null>(null);
  // Para qué pedido es la última respuesta: si no coincide con el actual, está cargando
  const [respuesta, setRespuesta] = useState<{ clave: string; error: string } | null>(null);
  const [reintento, setReintento] = useState(0);
  const elegidoDe = (idProducto: number) => seleccion[tipo]?.find((e) => e.producto.id === idProducto);
  const varios = permiteVarios(tipo);

  // Se vuelve a pedir cuando cambia lo elegido en los otros pasos (o la cantidad de este)
  const claveSeleccion = TIPOS_ARMADOR.flatMap((t2) => seleccion[t2] ?? [])
    .map((e) => `${e.producto.id}x${e.cantidad}`)
    .join(",");
  const clave = `${tipo}|${claveSeleccion}|${reintento}|${i18n.resolvedLanguage}`;
  const cargando = respuesta?.clave !== clave;
  const error = cargando ? "" : respuesta.error;

  useEffect(() => {
    const controller = new AbortController();
    const componentes = TIPOS_ARMADOR.flatMap((t2) => seleccion[t2] ?? []);
    obtenerCompatibles(tipo, componentes, controller.signal)
      .then((data) => {
        setDatos(data);
        setRespuesta({ clave, error: "" });
      })
      .catch((e) => {
        if (!controller.signal.aborted) {
          setRespuesta({ clave, error: e instanceof Error ? e.message : t("armarPc.errorCargar") });
        }
      });
    return () => controller.abort();
    // seleccion se sigue por la clave, para no repetir el pedido si solo cambia la referencia
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, t]);

  const ayudaGpu =
    tipo === "GPU" && graficosIntegrados
      ? t(graficosIntegrados === "No" ? "armarPc.gpuObligatoria" : "armarPc.gpuOpcional")
      : null;
  // En almacenamiento: cuántos discos entran según el motherboard elegido
  const mother = seleccion.Motherboard?.[0]?.producto;
  const ranurasM2 = especificacionDe(mother, "Ranuras M.2");
  const puertosSata = especificacionDe(mother, "Puertos SATA");
  const ayudaDiscos =
    varios && mother && ranurasM2 && puertosSata
      ? t("armarPc.conexionesMother", { nombre: mother.nombre, m2: ranurasM2, sata: puertosSata })
      : null;

  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-sm sm:p-6">
      <h2 className="text-xl font-bold text-ink">{t(`armarPc.pasos.${tipo}.titulo`)}</h2>
      <p className="mt-1 text-sm text-muted">{t(`armarPc.pasos.${tipo}.ayuda`)}</p>
      {(ayudaGpu || ayudaDiscos) && (
        <p className="mt-2 rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-dark">{ayudaGpu ?? ayudaDiscos}</p>
      )}

      {error ? (
        <ErrorCarga mensaje={error} onReintentar={() => setReintento((r) => r + 1)} />
      ) : !datos ? (
        <ListaCargando />
      ) : (
        <div className={`mt-4 transition-opacity ${cargando ? "opacity-60" : ""}`} aria-busy={cargando}>
          {datos.productos.length === 0 ? (
            <p className="rounded-lg border border-line bg-surface-alt p-4 text-sm text-muted">
              {t("armarPc.sinCompatibles")}
            </p>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {datos.productos.map((producto) => (
                <li key={producto.id}>
                  <TarjetaProducto
                    producto={producto}
                    elegido={!!elegidoDe(producto.id)}
                    cantidad={elegidoDe(producto.id)?.cantidad ?? 1}
                    sugerido={producto.id === idSugerida}
                    ocupado={ocupado}
                    agregar={varios}
                    onElegir={() => onElegir(producto)}
                    onCantidad={(c) => onCantidad(producto, c)}
                    onQuitar={() => onQuitar(producto)}
                  />
                </li>
              ))}
            </ul>
          )}

          {datos.incompatibles.length > 0 && (
            <details className="mt-4 rounded-lg border border-line">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-muted hover:text-ink">
                {t("armarPc.verIncompatibles", { count: datos.incompatibles.length })}
              </summary>
              <ul className="grid gap-3 px-4 pb-4 md:grid-cols-2">
                {datos.incompatibles.map(({ producto, motivos }) => {
                  // Elegirlo igual quita lo que ya estaba elegido y no es compatible con él
                  // (ej. cambiar de plataforma). Si el problema es solo del producto (la potencia
                  // de la fuente), no hay nada que quitar y no se puede elegir.
                  const idsAQuitar = new Set(motivos.flatMap((m) => m.productos).filter((id) => id !== producto.id));
                  // Al sumar un disco, los otros discos no se quitan
                  const aQuitar = TIPOS_ARMADOR.filter((t2) => !(varios && t2 === tipo)).flatMap((t2) =>
                    (seleccion[t2] ?? []).filter((e) => idsAQuitar.has(e.producto.id)).map((e) => e.producto.nombre),
                  );
                  return (
                    <li key={producto.id}>
                      <TarjetaProducto
                        producto={producto}
                        motivos={motivos}
                        aQuitar={aQuitar}
                        ocupado={ocupado}
                        onElegir={aQuitar.length > 0 ? () => onElegir(producto) : undefined}
                      />
                    </li>
                  );
                })}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

export function ListaCargando() {
  const { t } = useTranslation();
  return (
    <ul className="mt-4 grid gap-3 md:grid-cols-2" aria-label={t("armarPc.cargando")}>
      {[0, 1, 2, 3].map((i) => (
        <li key={i} className="h-28 animate-pulse rounded-lg bg-surface-alt" />
      ))}
    </ul>
  );
}

interface TarjetaProps {
  producto: ProductoArmador;
  // Con motivos, el producto es incompatible: se muestra atenuado, con el motivo
  motivos?: Incompatibilidad[];
  // Incompatible: lo que se quitaría al elegirlo igual (sin onElegir no se puede elegir)
  aQuitar?: string[];
  elegido?: boolean;
  cantidad?: number;
  sugerido?: boolean;
  ocupado?: boolean;
  agregar?: boolean; // en los pasos con varios productos el botón dice "Agregar" en vez de "Elegir"
  onElegir?: () => void;
  onCantidad?: (cantidad: number) => void;
  onQuitar?: () => void;
}

export function TarjetaProducto({
  producto,
  motivos,
  aQuitar = [],
  elegido = false,
  cantidad = 1,
  sugerido = false,
  ocupado = false,
  agregar = false,
  onElegir,
  onCantidad,
  onQuitar,
}: TarjetaProps) {
  const { t } = useTranslation();
  const textos = useTextosArmador();
  const incompatible = !!motivos;
  const sinStock = producto.stock <= 0;
  const conCantidad = TIPOS_CON_CANTIDAD.includes(producto.paso);
  const maximo = Math.min(CANTIDAD_MAXIMA, Math.max(producto.stock, 1));

  return (
    <article
      className={`flex h-full gap-3 rounded-lg border p-3 ${
        elegido ? "border-primary bg-primary-light" : "border-line bg-surface"
      } ${incompatible ? "opacity-70" : ""}`}
    >
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-surface">
        {producto.imagenUrl ? (
          <img src={producto.imagenUrl} alt="" loading="lazy" className="h-full w-full object-contain p-1" />
        ) : (
          <span className="text-[10px] text-muted">{t("card.sinImagen")}</span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-ink">{producto.nombre}</h3>
          {elegido && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-white">
              ✓ {t("armarPc.elegido")}
            </span>
          )}
          {sugerido && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
              {t("armarPc.sugerida")}
            </span>
          )}
        </div>
        <p className="text-xs text-muted">{producto.marca}</p>
        {producto.especificaciones.length > 0 && (
          <ul className="flex flex-wrap gap-1">
            {producto.especificaciones.map((e) => (
              <li key={e.nombre} className="rounded bg-surface-alt px-1.5 py-0.5 text-[11px] text-muted">
                {textos.especificacion(e)}
              </li>
            ))}
          </ul>
        )}

        {motivos && (
          <ul className="mt-1 space-y-0.5 text-xs text-red-700">
            {motivos.map((m) => (
              <li key={`${m.codigo}-${m.productos.join("-")}`}>✕ {textos.motivo(m)}</li>
            ))}
          </ul>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
          <Precio precio={producto.precio} className="font-bold text-ink" />
          {incompatible && onElegir && !sinStock && (
            <button
              type="button"
              disabled={ocupado}
              onClick={onElegir}
              title={t("armarPc.elegirIgualDetalle", { nombres: aQuitar.join(", ") })}
              className="cursor-pointer rounded-md border border-primary px-3 py-1 text-xs font-semibold text-primary hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("armarPc.elegirIgual", { nombres: aQuitar.join(", ") })}
            </button>
          )}
          {!incompatible &&
            (elegido ? (
              <div className="flex items-center gap-2">
                {conCantidad && onCantidad && (
                  <label className="flex items-center gap-1 text-xs text-muted">
                    {t("armarPc.cantidad")}
                    <select
                      value={cantidad}
                      disabled={ocupado}
                      onChange={(e) => onCantidad(Number(e.target.value))}
                      className="rounded border border-line bg-surface px-1 py-0.5 text-sm text-ink"
                    >
                      {Array.from({ length: maximo }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <button
                  type="button"
                  disabled={ocupado}
                  onClick={onQuitar}
                  className="cursor-pointer rounded-md border border-line bg-surface px-2 py-1 text-xs font-semibold text-muted hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t("armarPc.quitar")}
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={ocupado || sinStock}
                onClick={onElegir}
                className="cursor-pointer rounded-md bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-muted"
              >
                {sinStock ? t("armarPc.sinStock") : t(agregar ? "armarPc.agregar" : "armarPc.elegir")}
              </button>
            ))}
        </div>
      </div>
    </article>
  );
}
