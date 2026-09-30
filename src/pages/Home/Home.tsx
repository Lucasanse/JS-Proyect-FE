import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 to-purple-600 flex flex-col items-center justify-center text-white">
      <h1 className="text-5xl font-bold mb-6">Bienvenido a JS-Proyect</h1>
      <p className="text-lg mb-8 max-w-md text-center">
        Hola soy un P. Soy como una p pero en mayusculas.
      </p>

      <div className="flex gap-4">
        <Link
          to="/productos"
          className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg shadow hover:bg-gray-100 transition"
        >
          Ver Productos
        </Link>
        <Link
          to="/login"
          className="px-6 py-3 bg-purple-700 font-semibold rounded-lg shadow hover:bg-purple-800 transition"
        >
          Iniciar Sesión
        </Link>
      </div>
    </div>
  );
}
