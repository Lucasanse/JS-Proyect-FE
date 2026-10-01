import { useState } from "react";

export default function SearchBar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="w-full bg-surface-alt p-4 rounded-lg shadow-md">
      {/* Buscador principal */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Buscar productos..."
          className="flex-1 px-4 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="button"
          className="px-6 py-2 bg-primary text-surface rounded-md hover:bg-primary-dark transition"
        >
          Buscar
        </button>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden px-4 py-2 border border-line rounded-md"
        >
          Filtros
        </button>
      </div>

      {/* Panel de filtros (desktop visible, mobile desplegable) */}
      <div
        className={`mt-4 flex-row gap-4 md:flex  ${mobileOpen ? "flex" : "hidden md:flex"} flex-1 flex `}
      >
        {/* Categoría */}
        <select className="px-4 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="">Todas las categorías</option>
          <option value="gpu">Placas de Video</option>
          <option value="cpu">Procesadores</option>
          <option value="perifericos">Periféricos</option>
        </select>

        {/* Marca */}
        <select className="px-4 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="">Todas las marcas</option>
          <option value="nvidia">NVIDIA</option>
          <option value="amd">AMD</option>
          <option value="intel">Intel</option>
          <option value="cougar">Cougar</option>
        </select>

        {/* Rango de precio */}
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Precio mín."
            className="w-32 px-2 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <span>-</span>
          <input
            type="number"
            placeholder="Precio máx."
            className="w-32 px-2 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Botón limpiar */}
        <button
          type="button"
          className="px-4 py-2 border border-line rounded-md hover:bg-surface transition"
        >
          Limpiar filtros
        </button>
      </div>

      {/* Estados (solo visual) */}
      <div className="mt-4">
        {/* Ejemplo de estados */}
        <p className="text-sm text-muted">Cargando productos...</p>
        {/* <p className="text-sm text-muted">No encontramos productos con esos filtros</p> */}
        {/* <p className="text-sm text-error">Error al cargar productos</p> */}
      </div>
    </div>
  );
}
