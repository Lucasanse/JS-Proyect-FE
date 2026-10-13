import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useSession } from "../../services/auth-client";
import * as api from "../../services/carrito";
import { CarritoContext } from "./carritoContext";
import AvisoCarrito from "../AvisoCarrito/AvisoCarrito";
import type { ProductoResumen } from "../../services/productos";
import { useVersionCatalogo } from "../../services/catalogoEventos";

// Estado global del carrito. Siempre se sincroniza con el BE: cada acción
// devuelve el carrito actualizado y lo guardamos tal cual.
export default function CarritoProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const userId = session?.user.id;
  // Se guarda junto al usuario dueño, así al cerrar sesión o cambiar de usuario
  // no se muestra el carrito anterior.
  const [estado, setEstado] = useState<{ userId: string; data: api.CarritoDetalle | null } | null>(null);
  const carrito = userId && estado?.userId === userId ? estado.data : null;
  const cargando = !!userId && estado?.userId !== userId;
  // Último producto agregado, para mostrar el aviso. "id" cambia en cada agregado
  // y se usa como key, así la animación se repite aunque se agregue el mismo producto.
  const [aviso, setAviso] = useState<{ id: number; producto: ProductoResumen; cantidad: number } | null>(null);
  const cerrarAviso = useCallback(() => setAviso(null), []);
  // Cambia cuando el admin modifica productos: precios y stock del carrito se actualizan
  const versionCatalogo = useVersionCatalogo();
  const setCarrito = (data: api.CarritoDetalle) => {
    if (userId) setEstado({ userId, data });
  };

  // Al iniciar sesión (o recargar la página) se trae el carrito guardado en la base
  useEffect(() => {
    if (!userId) return;
    api
      .obtenerCarrito()
      .then((data) => setEstado({ userId, data }))
      .catch(() => setEstado({ userId, data: null }));
  }, [userId, versionCatalogo]);

  const value = {
    carrito,
    cargando,
    agregar: async (idProducto: number, cantidad: number) => {
      const data = await api.agregarAlCarrito(idProducto, cantidad);
      setCarrito(data);
      const item = data.items.find((i) => i.producto.id === idProducto);
      if (item) setAviso({ id: Date.now(), producto: item.producto, cantidad });
    },
    cambiarCantidad: async (idProducto: number, cantidad: number) =>
      setCarrito(await api.modificarCantidad(idProducto, cantidad)),
    quitar: async (idProducto: number) => setCarrito(await api.quitarDelCarrito(idProducto)),
    vaciar: async () => setCarrito(await api.vaciarCarrito()),
    cantidadEnCarrito: (idProducto: number) =>
      carrito?.items.find((i) => i.producto.id === idProducto)?.cantidad ?? 0,
  };

  return (
    <CarritoContext.Provider value={value}>
      {children}
      {aviso && <AvisoCarrito key={aviso.id} producto={aviso.producto} cantidad={aviso.cantidad} onCerrar={cerrarAviso} />}
    </CarritoContext.Provider>
  );
}
