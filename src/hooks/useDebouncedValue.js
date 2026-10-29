import { useEffect, useState } from "react";

export default function useDebouncedValue(valor, retardo = 400) {
  const [debounced, setDebounced] = useState(valor);

  useEffect(() => {
    const temporizador = setTimeout(() => setDebounced(valor), retardo);
    return () => clearTimeout(temporizador);
  }, [valor, retardo]);

  return debounced;
}
