import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { TipoComponente } from "../../services/adminProductos";
import Campo from "./Campo";
import { claseInput, sinFlechas } from "./estilosForm";

interface Props {
  tipos: TipoComponente[];
  cargando: boolean;
  idTipo: string; // "" = no es un componente
  watts: string;
  valores: Record<number, string>; // idAtributo -> valor
  errores: Record<string, string | undefined>;
  sugerido: boolean; // el tipo se eligió solo a partir de la categoría
  onTipo: (idTipo: string) => void;
  onWatts: (watts: string) => void;
  onValor: (idAtributo: number, valor: string) => void;
}

// Datos de componente de PC: tipo, consumo y los atributos técnicos de ese tipo.
// Los atributos numéricos se cargan como número con su unidad; el resto como texto
// con sugerencias (las del seed + valores ya cargados), pero se puede escribir otro.
export default function SeccionComponente({
  tipos,
  cargando,
  idTipo,
  watts,
  valores,
  errores,
  sugerido,
  onTipo,
  onWatts,
  onValor,
}: Props) {
  const { t } = useTranslation();
  const tipo = tipos.find((x) => String(x.id) === idTipo);

  return (
    <>
      <p className="text-xs text-muted">{t("admin.form.componenteAyuda")}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          id="campo-idTipoComponente"
          label={t("admin.form.tipoComponente")}
          error={errores.idTipoComponente}
          ayuda={sugerido ? t("admin.form.tipoSugerido") : undefined}
        >
          <select
            id="campo-idTipoComponente"
            value={idTipo}
            onChange={(e) => onTipo(e.target.value)}
            disabled={cargando}
            aria-invalid={!!errores.idTipoComponente}
            className={claseInput(errores.idTipoComponente)}
          >
            <option value="">{cargando ? t("nav.cargando") : t("admin.form.noEsComponente")}</option>
            {tipos.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nombre}
              </option>
            ))}
          </select>
        </Campo>

        {tipo && (
          <Campo
            id="campo-watts"
            label={t("admin.form.consumo")}
            error={errores.watts}
            ayuda={t("admin.form.consumoAyuda")}
            requerido
          >
            <ConUnidad unidad="W">
              <input
                id="campo-watts"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                placeholder="0"
                value={watts}
                onChange={(e) => onWatts(e.target.value)}
                aria-invalid={!!errores.watts}
                aria-describedby={errores.watts ? "campo-watts-error" : undefined}
                className={`${claseInput(errores.watts)} ${sinFlechas} pr-12`}
              />
            </ConUnidad>
          </Campo>
        )}
      </div>

      {tipo && tipo.atributos.length > 0 && (
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-ink">
            {t("admin.form.atributosDe", { tipo: tipo.nombre })}{" "}
            <span className="font-normal text-muted">({t("admin.form.atributosAyuda")})</span>
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {tipo.atributos.map((a) => {
              const id = `campo-atributo-${a.id}`;
              const error = errores[`atributo-${a.id}`];
              const listaId = a.opciones.length > 0 ? `opciones-${a.id}` : undefined;
              return (
                <Campo key={a.id} id={id} label={a.nombre} error={error}>
                  <ConUnidad unidad={a.unidad}>
                    <input
                      id={id}
                      type={a.numerico ? "number" : "text"}
                      inputMode={a.numerico ? "decimal" : undefined}
                      min={a.numerico ? "0" : undefined}
                      step={a.numerico ? "any" : undefined}
                      list={listaId}
                      maxLength={100}
                      autoComplete="off"
                      placeholder={a.opciones.length > 0 ? `${t("admin.form.ej")} ${a.opciones.slice(0, 3).join(", ")}` : undefined}
                      value={valores[a.id] ?? ""}
                      onChange={(e) => onValor(a.id, e.target.value)}
                      aria-invalid={!!error}
                      aria-describedby={error ? `${id}-error` : undefined}
                      className={`${claseInput(error)} ${a.numerico ? sinFlechas : ""} ${a.unidad ? "pr-16" : ""}`}
                    />
                  </ConUnidad>
                  {listaId && (
                    <datalist id={listaId}>
                      {a.opciones.map((o) => (
                        <option key={o} value={o} />
                      ))}
                    </datalist>
                  )}
                </Campo>
              );
            })}
          </div>
        </fieldset>
      )}
    </>
  );
}

// Muestra la unidad (W, GB, MHz...) dentro del input, a la derecha
function ConUnidad({ unidad, children }: { unidad: string | null; children: ReactNode }) {
  if (!unidad) return children;
  return (
    <div className="relative">
      {children}
      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted">{unidad}</span>
    </div>
  );
}
