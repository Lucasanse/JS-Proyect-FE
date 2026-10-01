export default function SearchBar() {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-center bg-surface-alt p-4 rounded-lg shadow-md">
      <input
        type="text"
        placeholder="Buscar productos..."
        className="flex-1 px-4 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
      />

      <select className="px-4 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
        <option value="">Todas las categorías</option>
        <option value="gpu">Placas de Video</option>
        <option value="cpu">Procesadores</option>
        <option value="perifericos">Periféricos</option>
      </select>

      <select className="px-4 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
        <option value="">Todas las marcas</option>
        <option value="nvidia">NVIDIA</option>
        <option value="amd">AMD</option>
        <option value="intel">Intel</option>
        <option value="cougar">Cougar</option>
      </select>

      <button
        type="button"
        className="px-6 py-2 bg-primary text-surface rounded-md hover:bg-primary-dark transition"
      >
        Buscar
      </button>
    </div>
  );
}
