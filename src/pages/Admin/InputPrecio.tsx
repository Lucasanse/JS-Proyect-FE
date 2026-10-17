import { useLayoutEffect, useRef, type ChangeEvent } from "react";

interface Props {
  id: string;
  name: string;
  value: string; // precio sin formato, con punto decimal (ej. "1234.5"), como lo lee la validación
  onValor: (valor: string) => void;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
  className: string;
}

const MAX_DIGITOS_ENTEROS = 9; // el BE acepta hasta 99.999.999,99: con 9 se ve el error de "muy alto"

// "1234.5" -> "1.234,5". Si termina en punto, se muestra la coma para seguir escribiendo decimales.
function formatear(valor: string): string {
  if (!valor) return "";
  const [entero, decimales] = valor.split(".");
  const conMiles = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return decimales === undefined ? conMiles : `${conMiles},${decimales}`;
}

// Por costumbre, si el admin escribe un punto al final (o pega "1500.50") y todavía no hay
// coma, ese punto se toma como coma decimal. Al borrar no: si se borra un dígito de "1.500"
// queda "1.50", y ahí el punto sigue siendo de miles.
const puntoComoComa = (texto: string, borró: boolean) =>
  !borró && !texto.includes(",") ? texto.replace(/\.(\d{0,2})$/, ",$1") : texto;

// Texto del input -> precio sin formato. Los puntos son separadores de miles y la coma es
// la decimal (como en Argentina). Se ignora todo lo demás y se dejan 2 decimales como máximo.
function normalizar(texto: string): string {
  const coma = texto.indexOf(",");
  const entero = (coma === -1 ? texto : texto.slice(0, coma))
    .replace(/\D/g, "")
    .replace(/^0+(?=\d)/, "")
    .slice(0, MAX_DIGITOS_ENTEROS);
  if (coma === -1) return entero;
  const decimales = texto.slice(coma + 1).replace(/\D/g, "").slice(0, 2);
  return `${entero || "0"}.${decimales}`;
}

// Cantidad de dígitos y comas antes de una posición del texto (sin contar los puntos de miles)
const signosAntes = (texto: string, posicion: number) => texto.slice(0, posicion).replace(/[^\d,]/g, "").length;

// Input del precio que muestra separador de miles y coma decimal mientras se escribe
// ("1.234.567,89"), así es fácil leer el número. El formulario recibe el valor sin formato.
export default function InputPrecio({ value, onValor, ...props }: Props) {
  const input = useRef<HTMLInputElement>(null);
  // Al agregar o quitar puntos de miles el cursor se correría: se guarda cuántos dígitos
  // tenía antes y, después de mostrar el nuevo texto, se lo deja en el mismo lugar
  const signosCursor = useRef<number | null>(null);

  const ubicarCursor = (el: HTMLInputElement, signos: number) => {
    let posicion = 0;
    while (posicion < el.value.length && signosAntes(el.value, posicion) < signos) posicion++;
    el.setSelectionRange(posicion, posicion);
  };

  useLayoutEffect(() => {
    if (signosCursor.current === null || !input.current) return;
    ubicarCursor(input.current, signosCursor.current);
    signosCursor.current = null;
  });

  const cambiar = (e: ChangeEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    const borró = (e.nativeEvent as InputEvent).inputType?.startsWith("delete") ?? false;
    const texto = puntoComoComa(el.value, borró);
    const nuevo = normalizar(texto);
    const signos = signosAntes(texto, el.selectionStart ?? texto.length);
    if (nuevo !== value) {
      signosCursor.current = signos;
      onValor(nuevo);
    } else {
      // Sin cambio en el número (una letra, un tercer decimal, borrar un punto de miles):
      // React vuelve a poner el texto anterior y el cursor quedaría al final
      requestAnimationFrame(() => ubicarCursor(el, signos));
    }
  };

  return (
    <input
      {...props}
      ref={input}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      placeholder="0,00"
      value={formatear(value)}
      onChange={cambiar}
    />
  );
}
