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
      idVendedor: publicacion.idVendedor,
      idProducto: d.producto?.id ?? d.idProducto,
      cantidad: 1,
      disponible: d.cantidadDisponible ?? d.cantidadPublicada ?? null,
    }))
    .filter((e) => e.idProducto != null);
}

// Resultado de agregarAlCarrito cuando el carrito ya tiene productos de otro vendedor
export const OTRO_VENDEDOR = -1;
export const AVISO_OTRO_VENDEDOR =
  "Tu carrito ya tiene productos de otro vendedor. Cada compra es con un solo vendedor: finalizá o vaciá el carrito para comprarle a otro.";

export const SIN_STOCK = -2;
export const AVISO_SIN_STOCK =
  "Esta publicación no tiene unidades disponibles en este momento (pueden estar reservadas por otra compra).";

// Vendedor al que pertenece el carrito (null si está vacío o no se conoce)
export const vendedorDe = (items) => items.find((i) => i.idVendedor != null)?.idVendedor ?? null;

// Devuelve la cantidad de entradas agregadas, u OTRO_VENDEDOR si no se permite mezclar vendedores
export function agregarAlCarrito(usuarioId, entradas) {
  const items = leerCarrito(usuarioId);
  let agregados = 0;
  let sinStock = 0;

  const actual = vendedorDe(items);
  const nuevo = vendedorDe(entradas);
  if (actual != null && nuevo != null && actual !== nuevo) return OTRO_VENDEDOR;

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

    if (tope < 1) {
      sinStock += 1;
      return;
    }
    items.push({
      idPublicacion: entrada.idPublicacion,
      idVendedor: entrada.idVendedor,
      idProducto: entrada.idProducto,
      cantidad: Math.min(entrada.cantidad, tope),
    });
    agregados += 1;
  });

  if (agregados > 0) guardarCarrito(usuarioId, items);
  if (agregados === 0 && sinStock > 0) return SIN_STOCK;
  return agregados;
}