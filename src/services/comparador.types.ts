export interface AtributoProducto {
  nombre: string;
  valor: string;
  unidad: string | null;
}

export interface ProductoComparado {
  id: number;
  nombre: string;
  descripcion: string;
  marca: string;
  precio: number;
  stock: number;
  imagenUrl?: string | null;
  disponible: boolean;
  categoria: {
    id: number;
    nombre: string;
  };
  esComponentePC: boolean;
  tipoComponente: string | null;
  wattsRequeridos: number | null;
  atributos: AtributoProducto[];
}
