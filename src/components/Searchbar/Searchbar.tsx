import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  obtenerCategorias,
  obtenerMarcas,
  type Categoria,
  type FiltrosProductos,
} from "../../services/productos";

interface Props {
  filtros: FiltrosProductos; // filtros activos (vienen de la URL)
  onChange: (filtros: FiltrosProductos) => void;
}

const inputClass =
  "px-4 py-2 border border-line rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary";

export default function SearchBar({ filtros, onChange }: Props) {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [marcas, setMarcas] = useState<string[]>([]);

  // Opciones de los selects. Si fallan, solo queda la opción "Todas".
  useEffect(() => {
    const controller = new AbortController();
    obtenerCategorias(controller.signal).then(setCategorias).catch(() => {});
    return () => controller.abort();
  }, []);

  // Las marcas dependen de la categoría elegida: se vuelven a pedir cada vez que cambia
  useEffect(() => {
    const controller = new AbortController();
    obtenerMarcas(filtros.categoria, controller.signal).then(setMarcas).catch(() => {});
    return () => controller.abort();
  }, [filtros.categoria]);

  // Solo se aceptan dígitos: así no se pueden cargar negativos (ni "e", "+", etc.)
  const soloPositivos = (e: React.FormEvent<HTMLInputElement>) => {
    e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, "");
  };
  const bloquearTeclas = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["-", "+", "e", "E", ".", ","].includes(e.key)) e.preventDefault();
  };

  // Lee todos los campos del formulario y avisa los filtros nuevos (sin los vacíos).
  // Con borrarMarca se descarta la marca elegida (se usa al cambiar de categoría,
  // porque esa marca puede no existir en la categoría nueva).
  const aplicar = (form: HTMLFormElement, borrarMarca = false) => {
    const datos = new FormData(form);
    const valor = (campo: string) => String(datos.get(campo) ?? "").trim();
    let precioMin = valor("precioMin");
    let precioMax = valor("precioMax");
    // Si los cargaron al revés, los damos vuelta
    if (precioMin && precioMax && Number(precioMin) > Number(precioMax)) {
      [precioMin, precioMax] = [precioMax, precioMin];
    }

    const nuevos: FiltrosProductos = {
      q: valor("q"),
      categoria: valor("categoria"),
      marca: borrarMarca ? "" : valor("marca"),
      precioMin,
      precioMax,
      conStock: datos.get("conStock") ? "true" : "",
    };
    onChange(
      Object.fromEntries(Object.entries(nuevos).filter(([, v]) => v !== "")),
    );
  };

  const hayFiltros = Object.keys(filtros).length > 0;

  return (
    // La key hace que el formulario se recree cuando cambian los filtros de la URL
    // (ej: "Limpiar filtros" o el botón atrás del navegador), así los campos siempre coinciden con la URL.
    <form
      key={JSON.stringify(filtros)}
      onSubmit={(e) => {
        e.preventDefault();
        aplicar(e.currentTarget);
      }}
      className="w-full bg-surface-alt p-4 rounded-lg shadow-md"
    >
      {/* Buscador principal: se aplica con "Buscar" o Enter */}
      <div className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={filtros.q}
          placeholder={t("buscador.placeholder")}
          className={`min-w-0 flex-1 ${inputClass}`}
        />
        <button
          type="submit"
          className="px-6 py-2 bg-primary text-surface rounded-md hover:bg-primary-dark transition cursor-pointer"
        >
          {t("buscador.buscar")}
        </button>
        <button
          type="button"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden px-4 py-2 border border-line rounded-md cursor-pointer"
        >
          {t("buscador.filtros")}
        </button>
      </div>

      {/* Panel de filtros (desktop siempre visible, mobile desplegable) */}
      <div
        className={`${mobileOpen ? "flex" : "hidden"} mt-4 flex-col gap-4 md:flex md:flex-row md:flex-wrap md:items-center`}
      >
        {/* Categoría y marca se aplican apenas se elige una opción.
            Usan "value" (y no defaultValue) porque las opciones llegan después de la API. */}
        <select
          name="categoria"
          aria-label={t("buscador.categoria")}
          value={filtros.categoria ?? ""}
          onChange={(e) => aplicar(e.currentTarget.form!, true)}
          className={inputClass}
        >
          <option value="">{t("buscador.todasCategorias")}</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>

        <select
          name="marca"
          aria-label={t("buscador.marca")}
          value={filtros.marca ?? ""}
          onChange={(e) => aplicar(e.currentTarget.form!)}
          className={inputClass}
        >
          <option value="">{t("buscador.todasMarcas")}</option>
          {marcas.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        {/* Rango de precio: se aplica con "Buscar" o Enter */}
        <div className="flex gap-2 items-center">
          <input
            type="number"
            name="precioMin"
            min={0}
            inputMode="numeric"
            defaultValue={filtros.precioMin}
            onInput={soloPositivos}
            onKeyDown={bloquearTeclas}
            placeholder={t("buscador.precioMin")}
            className={`min-w-0 flex-1 md:w-32 md:flex-none ${inputClass}`}
          />
          <span>-</span>
          <input
            type="number"
            name="precioMax"
            min={0}
            inputMode="numeric"
            defaultValue={filtros.precioMax}
            onInput={soloPositivos}
            onKeyDown={bloquearTeclas}
            placeholder={t("buscador.precioMax")}
            className={`min-w-0 flex-1 md:w-32 md:flex-none ${inputClass}`}
          />
        </div>

        {/* Switch "En stock": se aplica apenas se cambia */}
        <label className="flex cursor-pointer items-center gap-2 select-none">
          <input
            type="checkbox"
            name="conStock"
            defaultChecked={filtros.conStock === "true"}
            onChange={(e) => aplicar(e.currentTarget.form!)}
            className="peer sr-only"
          />
          <span className="relative h-6 w-11 shrink-0 rounded-full bg-line transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-surface after:shadow after:transition-transform peer-checked:bg-primary peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-primary" />
          <span className="text-ink">{t("buscador.enStock")}</span>
        </label>

        <button
          type="button"
          onClick={() => onChange({})}
          disabled={!hayFiltros}
          className="px-4 py-2 border border-line rounded-md hover:bg-surface transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("buscador.limpiar")}
        </button>
      </div>
    </form>
  );
}
