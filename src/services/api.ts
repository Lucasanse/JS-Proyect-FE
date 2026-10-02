const BASE_URL = import.meta.env.VITE_API_URL || "";
export const url = `${BASE_URL}/api/productos`;
export const urlCategorias = `${BASE_URL}/api/categorias`;
export const urlMarcas = `${BASE_URL}/api/marcas`;
export const urlLogin = `${BASE_URL}/api/auth/login`;
export const urlRegister = `${BASE_URL}/api/auth/register`;
