import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import ErrorCarga from "../../components/ServicioTecnico/ErrorCarga";
import {
  obtenerCompatibles,
  type ComponenteElegido,
  type PasoExtra,
  type ProductoArmador,
} from "../../services/armador";
import { ListaCargando, TarjetaProducto } from "./PasoComponentes";
import { useTextosArmador } from "./textosArmador";

interface Props {
  paso: PasoExtra; // "Monitor" o "Perifericos" (mouse, teclado, auriculares...)
  perifericos: ComponenteElegido[];
  onAgregar: (producto: ProductoArmador) => void;
  onCantidad: (idProducto: number, cantidad: number) => void;
  onQuitar: (idProducto: number) => void;
}

// Pasos opcionales: el monitor y los demás periféricos (mouse, teclado, auriculares...). No tienen
// reglas de compatibilidad, así que se muestran todos y se puede agregar más de uno.
// Si el paso tiene varias categorías, se pueden filtrar.
export default function PasoPerifericos({ paso, perifericos, onAgregar, onCantidad, onQuitar }: Props) {
  const { t, i18n } = useTranslation();
  const textos = useTextosArmador();
  const [productos, setProductos] = useState<ProductoArmador[] | null>(null);
  // Para qué pedido es la última respuesta: si no coincide con el actual, está cargando
  const [respuesta, setRespuesta] = useState<{ clave: string; error: string } | null>(null);
  const [reintento, setReintento] = useState(0);
  const [categoria, setCategoria] = useState<string | null>(null); // null = todas

  const clave = `${reintento}|${i18n.resolvedLanguage}`;
  const cargando = respuesta?.clave !== clave;
  const error = cargando ? "" : respuesta.error;

  useEffect(() => {
    const controller = new AbortController();
    obtenerCompatibles(paso, [], controller.signal)
      .then((data) => {
        setProductos(data.productos);
        setRespuesta({ clave, error: "" });
      })
      .catch((e) => {
        if (!controller.signal.aborted) {
          setRespuesta({ clave, error: e instanceof Error ? e.message : t("armarPc.errorCargar") });
        }
      });
    return () => controller.abort();
  }, [clave, paso, t]);

  // Categorías en el orden en que vienen (el BE ordena por categoría y precio)
  const categorias = [...new Set((productos ?? []).map((p) => p.categoria.nombre))];
  const visibles = (productos ?? []).filter((p) => !categoria || p.categoria.nombre === categoria);

  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-sm sm:p-6">
      <h2 className="text-xl font-bold text-ink">{t(`armarPc.pasos.${paso}.titulo`)}</h2>
      <p className="mt-1 text-sm text-muted">{t(`armarPc.pasos.${paso}.ayuda`)}</p>

      {error ? (
        <ErrorCarga mensaje={error} onReintentar={() => setReintento((r) => r + 1)} />
      ) : !productos ? (
        <ListaCargando />
      ) : (
        <>
          {categorias.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={t("armarPc.filtrarCategoria")}>
              {[null, ...categorias].map((c) => (
                <button
                  key={c ?? "todas"}
                  type="button"
                  aria-pressed={categoria === c}
                  onClick={() => setCategoria(c)}
                  className={`cursor-pointer rounded-full border px-3 py-1 text-sm font-semibold transition-colors ${
                    categoria === c ? "border-primary bg-primary text-white" : "border-line bg-surface text-ink hover:border-primary"
                  }`}
                >
                  {c ? textos.categoria(c) : t("armarPc.todas")}
                </button>
              ))}
            </div>
          )}

          {visibles.length === 0 ? (
            <p className="mt-4 rounded-lg border border-line bg-surface-alt p-4 text-sm text-muted">
              {t("armarPc.sinPerifericos")}
            </p>
          ) : (
            <ul className={`mt-4 grid gap-3 transition-opacity md:grid-cols-2 ${cargando ? "opacity-60" : ""}`}>
              {visibles.map((producto) => {
                const elegido = perifericos.find((p) => p.producto.id === producto.id);
                return (
                  <li key={producto.id}>
                    <TarjetaProducto
                      producto={producto}
                      elegido={!!elegido}
                      cantidad={elegido?.cantidad ?? 1}
                      onElegir={() => onAgregar(producto)}
                      onCantidad={(c) => onCantidad(producto.id, c)}
                      onQuitar={() => onQuitar(producto.id)}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
