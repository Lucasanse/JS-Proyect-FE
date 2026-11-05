import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { ProductoComparado } from "../../services/comparador.types";

interface TablaComparativaProps {
  productos: ProductoComparado[];
}

const FRASES_KEYS = [
  "tablaComparativa.frases.esMejor",
  "tablaComparativa.frases.masRapido",
  "tablaComparativa.frases.rindeMas",
  "tablaComparativa.frases.superior",
  "tablaComparativa.frases.destaca",
];

export const TablaComparativa = ({ productos }: TablaComparativaProps) => {
  const { t } = useTranslation();

  const productosNormalizados = useMemo(() => {
    return productos.map((p) => {
      const atributosCompletos = p.atributos ? [...p.atributos] : [];

      if (p.wattsRequeridos && p.wattsRequeridos > 0) {
        atributosCompletos.unshift({
          nombre: t("tablaComparativa.consumo", "Consumo"),
          valor: String(p.wattsRequeridos),
          unidad: "W",
        });
      }

      if (p.precio) {
        atributosCompletos.unshift({
          nombre: t("tablaComparativa.precio", "Precio"),
          valor: String(p.precio),
          unidad: "ARS",
        });
      }

      return { ...p, atributos: atributosCompletos };
    });
  }, [productos, t]);

  const atributosUnicos = useMemo(() => {
    const nombres = new Set<string>();
    productosNormalizados.forEach((p) => {
      p.atributos?.forEach((attr) => nombres.add(attr.nombre));
    });
    return Array.from(nombres);
  }, [productosNormalizados]);

  const extraerNumero = (valor: string | null | undefined): number | null => {
    if (!valor) return null;
    const coincidencia = valor.match(/[\d,.]+/);
    if (coincidencia) {
      const num = parseFloat(coincidencia[0].replace(",", "."));
      return isNaN(num) ? null : num;
    }
    return null;
  };

  // Bloqueo estricto: la tabla solo existe si hay exactamente 2 productos
  if (productos.length !== 2) return null;

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-line bg-surface shadow-sm">
      {/* min-w-[600px] fuerza a que la tabla mantenga su ancho en móviles, activando el scroll horizontal nativo */}
      <table className="w-full text-left border-collapse min-w-[600px] sm:min-w-full">
        <thead>
          <tr className="bg-surface-alt/50 border-b border-line">
            <th className="p-4 font-bold text-xs text-ink w-1/3">
              {t("tablaComparativa.especificaciones", "Especificaciones")}
            </th>
            {productosNormalizados.map((prod, idx) => (
              <th key={prod.id || idx} className="p-4 text-xs w-1/3">
                <span className="text-[10px] text-accent uppercase block truncate">
                  {prod.marca}
                </span>
                <span
                  className="font-bold text-ink line-clamp-2"
                  title={prod.nombre}
                >
                  {prod.nombre}
                </span>
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-line/50">
          {atributosUnicos.map((nombreAttr, filaIdx) => {
            const valoresCrudos = productosNormalizados.map((p) => {
              const attr = p.atributos?.find((a) => a.nombre === nombreAttr);
              return attr ? `${attr.valor} ${attr.unidad || ""}`.trim() : "-";
            });

            const noSeCompara =
              nombreAttr.toLowerCase().includes("socket") ||
              nombreAttr.toLowerCase().includes("precio") ||
              nombreAttr.toLowerCase().includes("consumo");

            const valoresNumericos = valoresCrudos.map(extraerNumero);

            const numerosValidos = valoresNumericos.filter(
              (n): n is number => n !== null,
            );
            const tieneNumeros = numerosValidos.length > 1 && !noSeCompara;

            const minValor = tieneNumeros ? Math.min(...numerosValidos) : null;
            const maxValor = tieneNumeros ? Math.max(...numerosValidos) : null;

            return (
              <tr
                key={filaIdx}
                className="hover:bg-surface-alt/20 transition-colors"
              >
                <td className="p-4 text-xs font-semibold text-muted bg-surface-alt/10">
                  {nombreAttr}
                </td>

                {valoresCrudos.map((valorTxt, colIdx) => {
                  const num = valoresNumericos[colIdx];
                  let porcentajeBadge = null;

                  if (
                    tieneNumeros &&
                    num !== null &&
                    minValor !== null &&
                    num > minValor
                  ) {
                    const diffPorcentaje = Math.round(
                      ((num - minValor) / minValor) * 100,
                    );

                    const esElMaximo = num === maxValor;

                    const randomKey =
                      FRASES_KEYS[
                        Math.floor(Math.random() * FRASES_KEYS.length)
                      ];
                    const fraseAleatoria = t(randomKey);

                    const titleTraducido = t(
                      "tablaComparativa.respectoMinimo",
                      {
                        diff: diffPorcentaje,
                        min: minValor,
                        defaultValue: `+${diffPorcentaje}% respecto al valor más bajo (${minValor})`,
                      },
                    );

                    porcentajeBadge = (
                      <span
                        className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap inline-block mt-1 sm:mt-0 ${
                          esElMaximo
                            ? "bg-green-500/10 text-green-600 border border-green-500/20"
                            : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                        }`}
                        title={titleTraducido}
                      >
                        +{diffPorcentaje}%{" "}
                        {esElMaximo ? `- ${fraseAleatoria}` : ""}
                      </span>
                    );
                  }

                  return (
                    <td
                      key={colIdx}
                      className="p-4 text-xs text-ink align-middle"
                    >
                      <div className="flex flex-wrap items-center">
                        <span
                          className={
                            num === maxValor && tieneNumeros ? "font-bold" : ""
                          }
                        >
                          {valorTxt}
                        </span>
                        {porcentajeBadge}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
