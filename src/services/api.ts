const BASE_URL = import.meta.env.VITE_API_URL || "";
export const url = `${BASE_URL}/api/productos`;
export const urlLogin = `${BASE_URL}/api/auth/login`;
export const urlRegister = `${BASE_URL}/api/auth/register`;
export const urlProductoDetalle = `${BASE_URL}/api/productoDetalle`;
