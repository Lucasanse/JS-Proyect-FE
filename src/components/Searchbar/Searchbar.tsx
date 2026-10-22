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

// Campos que se escriben: se aplican solos cuando se deja de escribir
type Textos = { q: string; precioMin: string; precioMax: string };

const textosDe = (f: FiltrosProductos): Textos => ({
  q: f.q ?? "",
  precioMin: f.precioMin ?? "",
  precioMax: f.precioMax ?? "",
});

const rangoInvalido = (t: Textos) =>
  t.precioMin !== "" && t.precioMax !== "" && Number(t.precioMin) > Number(t.precioMax);

export default function SearchBar({ filtros, onChange }: Props) {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [marcas, setMarcas] = useState<string[]>([]);
  const [textos, setTextos] = useState<Textos>(() => textosDe(filtros));

  // Si la URL cambia desde afuera ("Limpiar filtros", el botón atrás del navegador),
  // los campos se ponen al día. Se compara sin espacios para no pisar lo que se está escribiendo.
  const enUrl = textosDe(filtros);
  const [urlVista, setUrlVista] = useState(enUrl);
  if (JSON.stringify(urlVista) !== JSON.stringify(enUrl)) {
    setUrlVista(enUrl);
    setTextos((prev) => ({
      q: prev.q.trim() === enUrl.q ? prev.q : enUrl.q,
      precioMin: prev.precioMin === enUrl.precioMin ? prev.precioMin : enUrl.precioMin,
      precioMax: prev.precioMax === enUrl.precioMax ? prev.precioMax : enUrl.precioMax,
    }));
  }

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

  // Arma los filtros con lo escrito + los cambios pedidos y avisa (sin los vacíos).
  // Con el rango de precio al revés no se aplica el precio hasta que se corrija.
  const aplicar = (cambios: FiltrosProductos = {}) => {
    const precio = rangoInvalido(textos)
      ? { precioMin: filtros.precioMin ?? "", precioMax: filtros.precioMax ?? "" }
      : { precioMin: textos.precioMin, precioMax: textos.precioMax };
    const nuevos: FiltrosProductos = { ...filtros, q: textos.q.trim(), ...precio, ...cambios };
    onChange(Object.fromEntries(Object.entries(nuevos).filter(([, v]) => v)));
  };

  // La búsqueda y los precios se aplican cuando se deja de escribir
  const clave = JSON.stringify(filtros);
  useEffect(() => {
    const pendiente =
      textos.q.trim() !== (filtros.q ?? "") ||
      (!rangoInvalido(textos) &&
        (textos.precioMin !== (filtros.precioMin ?? "") || textos.precioMax !== (filtros.precioMax ?? "")));
    if (!pendiente) return;
    const timer = setTimeout(() => aplicar(), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textos, clave]);

  // Solo se aceptan dígitos: así no se pueden cargar negativos (ni "e", "+", etc.)
  const cambiarPrecio = (campo: "precioMin" | "precioMax", valor: string) =>
    setTextos((prev) => ({ ...prev, [campo]: valor.replace(/[^0-9]/g, "") }));
  const bloquearTeclas = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["-", "+", "e", "E", ".", ","].includes(e.key)) e.preventDefault();
  };

  const hayFiltros = Object.keys(filtros).length > 0 || Object.values(textos).some((v) => v.trim());

  return (
    <div role="search" className="w-full bg-surface-alt p-4 rounded-lg shadow-md">
      {/* Buscador principal: busca solo mientras se escribe */}
      <div className="flex gap-2">
        <input
          type="search"
          value={textos.q}
          onChange={(e) => setTextos((prev) => ({ ...prev, q: e.target.value }))}
          placeholder={t("buscador.placeholder")}
          aria-label={t("buscador.placeholder")}
          className={`min-w-0 flex-1 ${inputClass}`}
        />
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
            Al cambiar de categoría se descarta la marca: puede no existir en la categoría nueva. */}
        <select
          aria-label={t("buscador.categoria")}
          value={filtros.categoria ?? ""}
          onChange={(e) => aplicar({ categoria: e.target.value, marca: "" })}
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
          aria-label={t("buscador.marca")}
          value={filtros.marca ?? ""}
          onChange={(e) => aplicar({ marca: e.target.value })}
          className={inputClass}
        >
          <option value="">{t("buscador.todasMarcas")}</option>
          {marcas.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        {/* Rango de precio: también se aplica al dejar de escribir */}
        <div className="flex flex-col gap-1">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              inputMode="numeric"
              value={textos.precioMin}
              onChange={(e) => cambiarPrecio("precioMin", e.target.value)}
              onKeyDown={bloquearTeclas}
              placeholder={t("buscador.precioMin")}
              aria-label={t("buscador.precioMin")}
              aria-invalid={rangoInvalido(textos)}
              className={`min-w-0 flex-1 md:w-32 md:flex-none ${inputClass}`}
            />
            <span>-</span>
            <input
              type="text"
              inputMode="numeric"
              value={textos.precioMax}
              onChange={(e) => cambiarPrecio("precioMax", e.target.value)}
              onKeyDown={bloquearTeclas}
              placeholder={t("buscador.precioMax")}
              aria-label={t("buscador.precioMax")}
              aria-invalid={rangoInvalido(textos)}
              className={`min-w-0 flex-1 md:w-32 md:flex-none ${inputClass}`}
            />
          </div>
          {rangoInvalido(textos) && (
            <p role="alert" className="text-xs text-red-600">
              {t("buscador.rangoInvalido")}
            </p>
          )}
        </div>

        {/* Switch "En stock": se aplica apenas se cambia */}
        <label className="flex cursor-pointer items-center gap-2 select-none">
          <input
            type="checkbox"
            checked={filtros.conStock === "true"}
            onChange={(e) => aplicar({ conStock: e.target.checked ? "true" : "" })}
            className="peer sr-only"
          />
          <span className="relative h-6 w-11 shrink-0 rounded-full bg-line transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-surface after:shadow after:transition-transform peer-checked:bg-primary peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-primary" />
          <span className="text-ink">{t("buscador.enStock")}</span>
        </label>

        <button
          type="button"
          onClick={() => {
            setTextos(textosDe({}));
            onChange({});
          }}
          disabled={!hayFiltros}
          className="px-4 py-2 border border-line rounded-md hover:bg-surface transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("buscador.limpiar")}
        </button>
      </div>
    </div>
  );
}
