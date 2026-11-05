import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  PASOS_ARMADOR,
  PASO_PERIFERICOS,
  TIPOS_ARMADOR,
  ArmadorError,
  obtenerFuenteSugerida,
  permiteVarios,
  validarArmado,
  type ComponenteElegido,
  type FuenteSugeridaRespuesta,
  type PasoArmador,
  type ProductoArmador,
  type TipoArmador,
  type ValidacionArmado,
} from "../../services/armador";
import PasoComponentes from "./PasoComponentes";
import PasoPerifericos from "./PasoPerifericos";
import ResumenArmado from "./ResumenArmado";
import MisArmados from "./MisArmados";
import { especificacionDe, useTextosArmador } from "./textosArmador";
import type { ProductoResumen } from "../../services/productos";

// Lo elegido en cada paso: un producto, o varios en almacenamiento (ver TIPOS_MULTIPLES)
export type Seleccion = Partial<Record<TipoArmador, ComponenteElegido[]>>;

// Lo elegido queda en la pestaña: si hay que iniciar sesión para comprar, no se pierde el armado
const CLAVE_STORAGE = "armarPc.seleccion";
const CLAVE_STORAGE_PERIFERICOS = "armarPc.perifericos";
const CLAVE_STORAGE_SERVICIOS = "armarPc.servicios";
const ESPERA_POTENCIA_MS = 300;

const aLista = (seleccion: Seleccion) => TIPOS_ARMADOR.flatMap((t) => seleccion[t] ?? []);

function leerGuardada(): Seleccion {
  try {
    const guardada = JSON.parse(sessionStorage.getItem(CLAVE_STORAGE) || "{}");
    // Antes se guardaba un producto por paso, sin lista
    return Object.fromEntries(
      TIPOS_ARMADOR.flatMap((t) => (guardada[t] ? [[t, [guardada[t]].flat()]] : [])),
    );
  } catch {
    return {};
  }
}

function leerPerifericos(): ComponenteElegido[] {
  try {
    const guardados = JSON.parse(sessionStorage.getItem(CLAVE_STORAGE_PERIFERICOS) || "[]");
    return Array.isArray(guardados) ? guardados : [];
  } catch {
    return [];
  }
}

function leerServicios(): ProductoResumen[] {
  try {
    const guardados = JSON.parse(sessionStorage.getItem(CLAVE_STORAGE_SERVICIOS) || "[]");
    return Array.isArray(guardados) ? guardados : [];
  } catch {
    return [];
  }
}

export default function ArmarPc() {
  const { t, i18n } = useTranslation();
  const textos = useTextosArmador();
  const [seleccion, setSeleccion] = useState<Seleccion>(leerGuardada);
  // Monitor, mouse, teclado...: no tienen reglas de compatibilidad, así que se cambian sin validar
  const [perifericos, setPerifericos] = useState<ComponenteElegido[]>(leerPerifericos);
  // Armado de la PC, instalación de Windows...: se eligen en el resumen y se compran con el armado
  const [servicios, setServicios] = useState<ProductoResumen[]>(leerServicios);
  const [paso, setPaso] = useState(0);
  const [validacion, setValidacion] = useState<ValidacionArmado | null>(null);
  const [sugerencia, setSugerencia] = useState<FuenteSugeridaRespuesta | null>(null);
  const [verificando, setVerificando] = useState(false);
  const [avisos, setAvisos] = useState<string[]>([]);
  const [error, setError] = useState("");
  // Cambia al guardar un armado, para que "Mis armados" se actualice
  const [versionPresets, setVersionPresets] = useState(0);
  // Cada cambio tiene un número: si llega la respuesta de uno viejo, se descarta
  const ultimoCambio = useRef(0);
  const pasoActual = PASOS_ARMADOR[paso];

  // Aplica un cambio solo después de validarlo con el BE, así nunca quedan elegidos
  // componentes incompatibles: si el cambio deja a otro incompatible (ej. un mother nuevo
  // con otro socket que el procesador), ese otro se quita y se avisa por qué.
  // Si lo que cambió es una cantidad, en vez de quitar otros se deja la cantidad anterior.
  const aplicarCambio = useCallback(
    async (nueva: Seleccion, cambio: { producto?: ProductoArmador; soloCantidad?: boolean; alEntrar?: boolean } = {}) => {
      const numero = ++ultimoCambio.current;
      setVerificando(true);
      setError("");
      setAvisos([]);
      try {
        let actual = nueva;
        const quitados: string[] = [];
        // Como mucho se quita un componente por paso
        for (let i = 0; i <= TIPOS_ARMADOR.length; i++) {
          // Al entrar también se revisan los periféricos guardados en la pestaña
          const resultado = await validarArmado(cambio.alEntrar ? [...aLista(actual), ...leerPerifericos()] : aLista(actual));
          if (numero !== ultimoCambio.current) return;

          if (resultado.valida) {
            setSeleccion(actual);
            setValidacion(resultado);
            setAvisos(quitados);
            return;
          }
          if (cambio.soloCantidad) {
            setAvisos(resultado.incompatibilidades.map((inc) => t("armarPc.avisoCantidad", { motivo: textos.motivo(inc) })));
            return;
          }

          // No se quitan el que se acaba de elegir ni, al sumar un disco, los otros discos
          const pasoCambiado = cambio.producto?.paso;
          const protegidos = new Set(
            pasoCambiado && pasoCambiado !== PASO_PERIFERICOS && permiteVarios(pasoCambiado)
              ? (actual[pasoCambiado] ?? []).map((e) => e.producto.id)
              : [cambio.producto?.id],
          );
          const involucrados = resultado.incompatibilidades.flatMap((inc) => inc.productos);
          // Se quitan los otros; el que se acaba de elegir solo si es el único involucrado
          const otros = involucrados.filter((id) => !protegidos.has(id));
          const aQuitar = new Set(otros.length > 0 ? otros : involucrados);
          const siguiente: Seleccion = {};
          for (const t2 of TIPOS_ARMADOR) {
            const quedan = (actual[t2] ?? []).filter((elegido) => {
              if (!aQuitar.has(elegido.producto.id)) return true;
              const motivos = resultado.incompatibilidades.filter((inc) => inc.productos.includes(elegido.producto.id));
              quitados.push(
                t("armarPc.avisoQuitado", {
                  nombre: elegido.producto.nombre,
                  motivo: motivos.map(textos.motivo).join(" · "),
                }),
              );
              return false;
            });
            if (quedan.length > 0) siguiente[t2] = quedan;
          }
          actual = siguiente;
        }
      } catch (e) {
        if (numero !== ultimoCambio.current) return;
        // El armado guardado en la pestaña puede tener productos que se borraron o cambiaron
        // de categoría: en vez de quedar trabado con un error, se descarta
        if (cambio.alEntrar && e instanceof ArmadorError && (e.status === 400 || e.status === 404)) {
          setSeleccion({});
          setPerifericos([]);
          setAvisos([t("armarPc.armadoDescartado")]);
          // Para que el resumen vuelva a marcar los componentes obligatorios que faltan
          setValidacion(await validarArmado([]).catch(() => null));
          return;
        }
        setError(e instanceof Error ? e.message : t("armarPc.errorValidar"));
      } finally {
        if (numero === ultimoCambio.current) setVerificando(false);
      }
    },
    [t, textos],
  );

  // Al entrar con un armado guardado en la pestaña, se vuelve a validar (precios, stock o datos pueden haber cambiado)
  const validadoAlEntrar = useRef(false);
  useEffect(() => {
    if (validadoAlEntrar.current) return;
    validadoAlEntrar.current = true;
    aplicarCambio(leerGuardada(), { alEntrar: true });
  }, [aplicarCambio]);

  useEffect(() => {
    try {
      sessionStorage.setItem(CLAVE_STORAGE, JSON.stringify(seleccion));
      sessionStorage.setItem(CLAVE_STORAGE_PERIFERICOS, JSON.stringify(perifericos));
      sessionStorage.setItem(CLAVE_STORAGE_SERVICIOS, JSON.stringify(servicios));
    } catch {
      // Sin storage disponible el armado solo se pierde al recargar
    }
  }, [seleccion, perifericos, servicios]);

  // Potencia y fuente sugerida: se recalculan en cada cambio, con debounce para no
  // pedirlas de más cuando se cambian varias cosas seguidas
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      obtenerFuenteSugerida(aLista(seleccion), controller.signal)
        .then(setSugerencia)
        .catch(() => {
          if (!controller.signal.aborted) setSugerencia(null);
        });
    }, ESPERA_POTENCIA_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [seleccion, i18n.resolvedLanguage]);

  // En almacenamiento el producto se suma a los otros discos; en el resto reemplaza al elegido
  const elegir = (producto: ProductoArmador) => {
    const tipo = producto.paso;
    if (tipo === PASO_PERIFERICOS) return;
    const actuales = seleccion[tipo] ?? [];
    if (actuales.some((e) => e.producto.id === producto.id)) return;
    const lista = permiteVarios(tipo)
      ? [...actuales, { producto, cantidad: 1 }]
      : [{ producto, cantidad: actuales[0]?.cantidad ?? 1 }];
    aplicarCambio({ ...seleccion, [tipo]: lista }, { producto });
  };

  const cambiarCantidad = (producto: ProductoArmador, cantidad: number) => {
    const tipo = producto.paso;
    if (tipo === PASO_PERIFERICOS) return;
    const lista = (seleccion[tipo] ?? []).map((e) => (e.producto.id === producto.id ? { ...e, cantidad } : e));
    aplicarCambio({ ...seleccion, [tipo]: lista }, { producto, soloCantidad: true });
  };

  const quitar = (producto: ProductoArmador) => {
    const tipo = producto.paso;
    if (tipo === PASO_PERIFERICOS) return;
    const siguiente = { ...seleccion, [tipo]: (seleccion[tipo] ?? []).filter((e) => e.producto.id !== producto.id) };
    if (siguiente[tipo]?.length === 0) delete siguiente[tipo];
    aplicarCambio(siguiente);
  };

  const cargarArmado = (componentes: ComponenteElegido[]) => {
    const nueva: Seleccion = {};
    for (const c of componentes) {
      if (c.producto.paso !== PASO_PERIFERICOS) (nueva[c.producto.paso] ??= []).push(c);
    }
    setPerifericos(componentes.filter((c) => c.producto.paso === PASO_PERIFERICOS));
    setPaso(0);
    aplicarCambio(nueva);
  };

  const agregarPeriferico = (producto: ProductoArmador) =>
    setPerifericos((actuales) => [...actuales, { producto, cantidad: 1 }]);
  const cambiarCantidadPeriferico = (idProducto: number, cantidad: number) =>
    setPerifericos((actuales) => actuales.map((p) => (p.producto.id === idProducto ? { ...p, cantidad } : p)));
  const quitarPeriferico = (idProducto: number) =>
    setPerifericos((actuales) => actuales.filter((p) => p.producto.id !== idProducto));

  // La GPU es opcional solo si el procesador elegido tiene gráficos integrados
  const graficosIntegrados = especificacionDe(seleccion.CPU?.[0]?.producto, "Graficos integrados");
  const fuenteSugerida = seleccion.Fuente ? null : (sugerencia?.fuentes[0] ?? null);
  const hayComponentes = aLista(seleccion).some((c) => c.producto.paso !== "Fuente");

  return (
    <section className="w-full flex-1 bg-surface-alt">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-ink">{t("armarPc.titulo")}</h1>
        <p className="mt-2 max-w-3xl text-muted">{t("armarPc.intro")}</p>

        <MisArmados version={versionPresets} onCargar={cargarArmado} />

        <Pasos
          paso={paso}
          seleccion={seleccion}
          cantidadPerifericos={perifericos.length}
          faltantes={validacion?.faltantes.map((f) => f.tipo) ?? []}
          onIr={setPaso}
        />

        {avisos.length > 0 && (
          <div role="status" className="mt-4 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <ul className="flex-1 space-y-1">
              {avisos.map((aviso) => (
                <li key={aviso}>{aviso}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setAvisos([])}
              aria-label={t("armarPc.cerrarAviso")}
              className="cursor-pointer rounded px-1 text-amber-900 hover:bg-amber-100"
            >
              ✕
            </button>
          </div>
        )}
        {error && (
          <p role="alert" className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            {pasoActual === PASO_PERIFERICOS ? (
              <PasoPerifericos
                perifericos={perifericos}
                onAgregar={agregarPeriferico}
                onCantidad={cambiarCantidadPeriferico}
                onQuitar={quitarPeriferico}
              />
            ) : (
              <PasoComponentes
                key={pasoActual}
                tipo={pasoActual}
                seleccion={seleccion}
                graficosIntegrados={graficosIntegrados}
                idSugerida={fuenteSugerida?.id}
                ocupado={verificando}
                onElegir={elegir}
                onCantidad={cambiarCantidad}
                onQuitar={quitar}
              />
            )}

            <div className="mt-4 flex justify-between gap-3">
              <button
                type="button"
                disabled={paso === 0}
                onClick={() => setPaso(paso - 1)}
                className="cursor-pointer rounded-lg border border-line bg-surface px-4 py-2 font-semibold text-ink hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← {t("armarPc.anterior")}
              </button>
              {paso < PASOS_ARMADOR.length - 1 && (
                <button
                  type="button"
                  onClick={() => setPaso(paso + 1)}
                  className="cursor-pointer rounded-lg bg-primary px-4 py-2 font-semibold text-white hover:bg-primary-dark"
                >
                  {t("armarPc.siguiente", { paso: textos.tipo(PASOS_ARMADOR[paso + 1]) })} →
                </button>
              )}
            </div>
          </div>

          <ResumenArmado
            seleccion={seleccion}
            perifericos={perifericos}
            servicios={servicios}
            validacion={validacion}
            potencia={hayComponentes ? (sugerencia?.potencia ?? validacion?.potencia ?? null) : null}
            fuenteSugerida={hayComponentes ? fuenteSugerida : null}
            verificando={verificando}
            onIr={(p) => setPaso(PASOS_ARMADOR.indexOf(p))}
            onQuitar={quitar}
            onQuitarPeriferico={quitarPeriferico}
            onElegir={elegir}
            onServicios={setServicios}
            onVaciar={() => {
              setPerifericos([]);
              setServicios([]);
              aplicarCambio({});
            }}
            onGuardado={() => setVersionPresets((v) => v + 1)}
          />
        </div>
      </div>
    </section>
  );
}

// Barra de pasos: progreso en los colores de la marca. Lo elegido queda en bordó y muestra
// el producto; el paso actual se resalta con fondo. Permite saltar a cualquier paso.
function Pasos({
  paso,
  seleccion,
  cantidadPerifericos,
  faltantes,
  onIr,
}: {
  paso: number;
  seleccion: Seleccion;
  cantidadPerifericos: number;
  faltantes: PasoArmador[];
  onIr: (paso: number) => void;
}) {
  const { t } = useTranslation();
  const textos = useTextosArmador();
  // La GPU solo es obligatoria si el procesador no tiene video (lo dice la validación); los periféricos nunca
  const esObligatorio = (tipo: PasoArmador) =>
    (tipo !== "GPU" && tipo !== PASO_PERIFERICOS) || faltantes.includes(tipo);
  const estados = PASOS_ARMADOR.map((tipo) => {
    const elegido = tipo === PASO_PERIFERICOS ? cantidadPerifericos > 0 : !!seleccion[tipo]?.length;
    return elegido ? "listo" : esObligatorio(tipo) ? "pendiente" : "opcional";
  });
  const obligatorios = PASOS_ARMADOR.filter(esObligatorio);
  const listos = obligatorios.filter((tipo) => estados[PASOS_ARMADOR.indexOf(tipo)] === "listo").length;

  // Debajo del nombre: lo que se eligió en ese paso, o si falta / es opcional
  const detalleDe = (tipo: PasoArmador, estado: string) => {
    if (estado !== "listo") return t(`armarPc.estado.${estado}`);
    if (tipo === PASO_PERIFERICOS) return t("armarPc.cantidadProductos", { count: cantidadPerifericos });
    const elegidos = seleccion[tipo] ?? [];
    return elegidos.length > 1 ? t("armarPc.cantidadProductos", { count: elegidos.length }) : (elegidos[0]?.producto.nombre ?? "");
  };

  return (
    <nav aria-label={t("armarPc.pasosLabel")} className="mt-6 rounded-xl border border-line bg-surface p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
        <p className="text-ink">
          <span className="text-muted">{t("armarPc.pasoDe", { numero: paso + 1, total: PASOS_ARMADOR.length })}</span>
          <span className="font-semibold"> · {textos.tipo(PASOS_ARMADOR[paso])}</span>
        </p>
        <p className="text-muted">{t("armarPc.progresoObligatorios", { listos, total: obligatorios.length })}</p>
      </div>

      {/* Una columna por paso: la barra muestra el estado y, desde md, el nombre y el detalle debajo */}
      <ol className="grid grid-cols-8 gap-1.5">
        {PASOS_ARMADOR.map((tipo, i) => {
          const actual = i === paso;
          const estado = estados[i];
          const detalle = detalleDe(tipo, estado);
          const colorBarra =
            estado === "listo"
              ? "bg-primary"
              : actual
                ? "bg-primary/35"
                : estado === "pendiente"
                  ? "bg-line"
                  : "border border-dashed border-muted/50"; // opcional: contorno, sin relleno
          return (
            <li key={tipo} className="min-w-0">
              <button
                type="button"
                onClick={() => onIr(i)}
                aria-current={actual ? "step" : undefined}
                aria-label={`${i + 1}. ${textos.tipo(tipo)}: ${detalle}`}
                title={detalle}
                className={`group flex w-full cursor-pointer flex-col gap-2 rounded-lg py-1 text-left transition-colors md:p-2 ${
                  actual ? "md:bg-primary-light" : "md:hover:bg-surface-alt"
                }`}
              >
                <span className={`h-1.5 w-full rounded-full transition-colors ${colorBarra}`} />
                <span className="hidden min-w-0 md:block">
                  <span
                    className={`flex items-center gap-1.5 text-xs font-semibold ${actual ? "text-primary" : "text-ink"}`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${
                        estado === "listo"
                          ? "bg-primary text-white"
                          : actual
                            ? "border border-primary text-primary"
                            : "bg-surface-alt text-muted"
                      }`}
                    >
                      {estado === "listo" ? "✓" : i + 1}
                    </span>
                    <span className="truncate">{textos.tipo(tipo)}</span>
                  </span>
                  <span
                    className={`mt-0.5 block truncate pl-5.5 text-[11px] ${estado === "listo" ? "text-ink/70" : "text-muted"}`}
                  >
                    {detalle}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
