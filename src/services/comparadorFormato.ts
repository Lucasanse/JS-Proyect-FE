import type { ProductoComparado } from "./comparador.types.ts";

export interface FilaComparativa {
  nombre: string;
  unidad: string | null;
  valores: Record<number, string>;
}

//Formateador para que que no se desnivele ni falte informacion en la info del producto
export function procesarMatrizComparacion(
  productos: ProductoComparado[],
): FilaComparativa[] {
  const mapaAtributos = new Map<string, FilaComparativa>();

  productos.forEach((prod) => {
    prod.atributos.forEach((attr) => {
      if (!mapaAtributos.has(attr.nombre)) {
        mapaAtributos.set(attr.nombre, {
          nombre: attr.nombre,
          unidad: attr.unidad,
          valores: {},
        });
      }
      mapaAtributos.get(attr.nombre)!.valores[prod.id] = attr.valor;
    });
  });

  return Array.from(mapaAtributos.values());
}
