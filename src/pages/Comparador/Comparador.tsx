import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SelectorCategoria } from "../../components/Comparador/SelectorCategoria";
import { SlotProducto } from "../../components/Comparador/SlotProducto";
import { TablaComparativa } from "../../components/Comparador/TablaComparativa";
import type { ProductoComparado } from "../../services/comparador.types";
import { obtenerProductoPorId } from "../../services/productoDetalle";

export const ComparadorPage = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Siempre inicializamos con exactamente 2 posiciones
  const idsParam = searchParams.get("ids");
  const idsIniciales = idsParam ? idsParam.split(",") : [];
  const [slots, setSlots] = useState<[number | null, number | null]>(() => {
    if (idsIniciales.length === 0) return [null, null];
    if (idsIniciales.length === 1) return [Number(idsIniciales[0]), null];
    return [Number(idsIniciales[0]), Number(idsIniciales[1])];
  });

  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState<string>("");
  const [productosComparados, setProductosComparados] = useState<
    ProductoComparado[]
  >([]);

  useEffect(() => {
    const idsValidos = slots.filter((id): id is number => id !== null);

    if (idsValidos.length === 0) {
      setProductosComparados([]);
      return;
    }

    let activo = true;

    Promise.all(idsValidos.map((id) => obtenerProductoPorId(id)))
      .then((resultados) => {
        if (activo) {
          setProductosComparados(resultados);

          if (resultados.length > 0 && resultados[0].categoria) {
            const categoriaDelProducto = String(resultados[0].categoria.id);
            if (categoriaSeleccionada !== categoriaDelProducto) {
              setCategoriaSeleccionada(categoriaDelProducto);
            }
          }
        }
      })
      .catch((err) => console.error("Error al cargar productos:", err));

    return () => {
      activo = false;
    };
  }, [slots]);

  useEffect(() => {
    const idsValidos = slots.filter((id): id is number => id !== null);

    if (idsValidos.length > 0) {
      setSearchParams({ ids: idsValidos.join(",") }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [slots, setSearchParams]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 w-full max-w-[100vw] overflow-x-hidden sm:overflow-x-visible box-border">
      <header className="border-b border-line pb-4">
        <h1 className="text-2xl font-bold text-ink">
          {t("comparador.titulo", "Comparador de Productos")}
        </h1>
        <p className="text-xs text-muted mt-1">
          {t(
            "comparador.descripcion",
            "Contrastá especificaciones técnicas, consumo y precios en tiempo real.",
          )}
        </p>
      </header>

      <section
        aria-label={t("comparador.ariaFiltro", "Filtro de productos")}
        className="p-4 rounded-xl border border-line bg-surface-alt"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
          <SelectorCategoria
            valorSeleccionado={categoriaSeleccionada}
            onSeleccionar={(nuevaCategoria) => {
              if (
                categoriaSeleccionada !== "" &&
                nuevaCategoria !== categoriaSeleccionada
              ) {
                setSlots([null, null]);
                setProductosComparados([]);
              }
              setSearchParams({}, { replace: true });
              setCategoriaSeleccionada(nuevaCategoria);
            }}
          />
        </div>
      </section>

      <section
        aria-label={t(
          "comparador.ariaSlots",
          "Slots de selección de productos",
        )}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {slots.map((id, index) => {
          const productoDetalle = productosComparados.find((p) => p.id === id);

          return (
            <SlotProducto
              key={index}
              indice={index}
              idProducto={id}
              producto={productoDetalle}
              idsSeleccionados={slots}
              idCategoria={categoriaSeleccionada}
              // Ya no pasamos puedeEliminarSlot ni onEliminarSlot
              onSeleccionar={(nuevoId) => {
                setSlots((prev) => {
                  const actualizados: [number | null, number | null] = [
                    ...prev,
                  ];
                  actualizados[index] = nuevoId;
                  return actualizados;
                });
              }}
              onLimpiar={() => {
                setSlots((prev) => {
                  const actualizados: [number | null, number | null] = [
                    ...prev,
                  ];
                  actualizados[index] = null;
                  return actualizados;
                });
              }}
            />
          );
        })}
      </section>

      {/* Contenedor de Tabla con Restricción de Desbordamiento */}
      <section
        aria-label={t("comparador.ariaTabla", "Tabla comparativa")}
        className="w-full overflow-hidden"
      >
        {productosComparados.length === 2 ? (
          <div className="w-full animate-fade-in overflow-x-auto pb-4">
            <TablaComparativa productos={productosComparados} />
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-muted border-2 border-dashed border-line rounded-xl bg-surface-alt/30">
            {t(
              "comparador.estadoVacio",
              "Seleccioná 2 productos para ver la tabla comparativa cara a cara.",
            )}
          </div>
        )}
      </section>
    </div>
  );
};
