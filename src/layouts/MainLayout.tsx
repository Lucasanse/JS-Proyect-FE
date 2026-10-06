import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import CarritoProvider from "../components/CarritoProvider/CarritoProvider";

// Estructura común de todas las páginas: Navbar arriba, contenido y Footer abajo.
// Cada página se renderiza dentro del <Outlet />.
// CarritoProvider deja el carrito disponible en todas las páginas (useCarrito).
export default function MainLayout() {
  return (
    <CarritoProvider>
      <div className="flex min-h-svh w-full flex-col bg-surface text-ink">
        <Navbar />
        <main className="flex w-full flex-1 flex-col">
          <Outlet />
        </main>
        <Footer />
      </div>
    </CarritoProvider>
  );
}
