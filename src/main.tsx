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
import DetalleSolicitud from "./pages/ServicioTecnico/DetalleSolicitud.tsx";
import Register from "./pages/Register/Register.tsx";
import Logout from "./pages/Logout/Logout.tsx";
import DetalleProducto from "./pages/DetalleProducto/DetalleProducto.tsx";
import AdminInicio from "./pages/Admin/AdminInicio.tsx";
import AdminProductos from "./pages/Admin/AdminProductos.tsx";
import AdminLayout from "./layouts/AdminLayout.tsx";
import AdminServicioTecnico from "./pages/Admin/AdminServicioTecnico.tsx";
import AdminSolicitudDetalle from "./pages/Admin/AdminSolicitudDetalle.tsx";
import AdminUsuarios from "./pages/Admin/AdminUsuarios.tsx";
import AdminUsuarioDetalle from "./pages/Admin/AdminUsuarioDetalle.tsx";
import Captura from "./pages/Captura/Captura.tsx";
import { PantallaEstadoPago } from "./pages/EstadoPago/EstadoPago.tsx";
import { MisCompras } from "./pages/MisCompras/MisCompras.tsx";
import { VentasAdmin } from "./pages/Admin/AdminPedidos.tsx";
import { VentaDetalleAdmin } from "./pages/Admin/VentaDetalleAdmin.tsx";

// Todas las rutas hijas se muestran dentro de MainLayout (Navbar + Footer)
const router = createBrowserRouter([
  // Página que abre el celular con el QR del formulario de productos (sin Navbar ni Footer)
  { path: "/captura/:token", element: <Captura /> },
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
      { path: "servicio-tecnico/:id", element: <DetalleSolicitud /> },
      { path: "detalleProducto/:id", element: <DetalleProducto /> },
      { path: "checkout/:estado", element: <PantallaEstadoPago /> },
      { path: "misCompras", element: <MisCompras /> },
      // Panel de administración (solo rol ADMIN, lo controla AdminLayout).
      // Cada sección nueva va como ruta hija y en el menú de AdminLayout.
      {
        path: "admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminInicio /> },
          { path: "productos", element: <AdminProductos /> },
          { path: "servicio-tecnico", element: <AdminServicioTecnico /> },
          { path: "servicio-tecnico/:id", element: <AdminSolicitudDetalle /> },
          { path: "ventas", element: <VentasAdmin /> },
          { path: "ventas/:id", element: <VentaDetalleAdmin /> },
          { path: "usuarios", element: <AdminUsuarios /> },
          { path: "usuarios/:id", element: <AdminUsuarioDetalle /> },
        ],
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router} />,
);
