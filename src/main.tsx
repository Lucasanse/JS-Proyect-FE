import { createRoot } from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import MainLayout from "./layouts/MainLayout.tsx";
import Home from "./pages/Home/Home.tsx";
import Productos from "./pages/Productos/Productos.tsx";
import Carrito from "./pages/Carrito/Carrito.tsx";
import Login from "./pages/Login/Login.tsx";
import ArmarPc from "./pages/ArmarPc/ArmarPc.tsx";
import ServicioTecnico from "./pages/ServicioTecnico/ServicioTecnico.tsx";
import Register from "./pages/Register/Register.tsx";
import Logout from "./pages/Logout/Logout.tsx";
import DetalleProducto from "./pages/DetalleProducto/DetalleProducto.tsx";
import AdminInicio from "./pages/Admin/AdminInicio.tsx";
import AdminProductos from "./pages/Admin/AdminProductos.tsx";
import AdminLayout from "./layouts/AdminLayout.tsx";

// Todas las rutas hijas se muestran dentro de MainLayout (Navbar + Footer)
const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "productos", element: <Productos /> },
      { path: "carrito", element: <Carrito /> },
      { path: "login", element: <Login /> },
      { path: "logout", element: <Logout /> },
      { path: "register", element: <Register /> },
      { path: "armar-pc", element: <ArmarPc /> },
      { path: "servicio-tecnico", element: <ServicioTecnico /> },
      { path: "detalleProducto/:id", element: <DetalleProducto /> },
      // Panel de administración (solo rol ADMIN, lo controla AdminLayout).
      // Cada sección nueva va como ruta hija y en el menú de AdminLayout.
      {
        path: "admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminInicio /> },
          { path: "productos", element: <AdminProductos /> },
        ],
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router} />,
);
