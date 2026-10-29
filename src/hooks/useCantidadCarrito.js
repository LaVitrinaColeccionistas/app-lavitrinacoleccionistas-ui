import { useSyncExternalStore } from "react";

import { EVENTO_CARRITO, leerCarrito } from "../utils/carrito";

function suscribir(avisar) {
  window.addEventListener(EVENTO_CARRITO, avisar);
  window.addEventListener("storage", avisar);

  return () => {
    window.removeEventListener(EVENTO_CARRITO, avisar);
    window.removeEventListener("storage", avisar);
  };
}

export default function useCantidadCarrito(usuarioId) {
  return useSyncExternalStore(suscribir, () =>
    usuarioId ? leerCarrito(usuarioId).length : 0
  );
}
