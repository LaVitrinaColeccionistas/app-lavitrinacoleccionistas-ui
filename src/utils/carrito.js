export const HORAS_DE_VIGENCIA = Number(import.meta.env.VITE_CARRITO_HORAS) || 12;

export const EVENTO_CARRITO = "lvc:carrito";

const clave = (usuarioId) => `lvc_carrito_${usuarioId}`;

export function leerCarrito(usuarioId) {
  try {
    const guardado = JSON.parse(localStorage.getItem(clave(usuarioId)));
    const vigente =
      guardado && Array.isArray(guardado.items) && Date.now() < guardado.expira;

    if (!vigente) {
      localStorage.removeItem(clave(usuarioId));
      return [];
    }

    return guardado.items;
  } catch {
    return [];
  }
}

export function guardarCarrito(usuarioId, items) {
  try {
    if (items.length === 0) {
      localStorage.removeItem(clave(usuarioId));
      window.dispatchEvent(new Event(EVENTO_CARRITO));
      return;
    }

    localStorage.setItem(
      clave(usuarioId),
      JSON.stringify({
        expira: Date.now() + HORAS_DE_VIGENCIA * 60 * 60 * 1000,
        items,
      })
    );
    window.dispatchEvent(new Event(EVENTO_CARRITO));
  } catch {
    return;
  }
}

export function entradasDePublicacion(publicacion) {
  return (publicacion?.detalles ?? [])
    .map((d) => ({
      idPublicacion: publicacion.id,
      idProducto: d.producto?.id ?? d.idProducto,
      cantidad: 1,
      disponible: d.cantidadPublicada ?? null,
    }))
    .filter((e) => e.idProducto != null);
}

export function agregarAlCarrito(usuarioId, entradas) {
  const items = leerCarrito(usuarioId);
  let agregados = 0;

  entradas.forEach((entrada) => {
    const tope = entrada.disponible ?? Infinity;
    const existente = items.find(
      (i) => i.idPublicacion === entrada.idPublicacion && i.idProducto === entrada.idProducto
    );

    if (existente) {
      if (existente.cantidad >= tope) return;
      existente.cantidad = Math.min(existente.cantidad + entrada.cantidad, tope);
      agregados += 1;
      return;
    }

    if (tope < 1) return;
    items.push({
      idPublicacion: entrada.idPublicacion,
      idProducto: entrada.idProducto,
      cantidad: Math.min(entrada.cantidad, tope),
    });
    agregados += 1;
  });

  if (agregados > 0) guardarCarrito(usuarioId, items);
  return agregados;
}
