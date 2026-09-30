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
      { path: "armar-pc", element: <ArmarPc /> },
      { path: "servicio-tecnico", element: <ServicioTecnico /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router} />,
);
