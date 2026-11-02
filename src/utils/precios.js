const detallesDe = (pub) => pub?.detalles ?? [];

const disponibleDe = (d) =>
  Math.max(0, Number(d.cantidadDisponible ?? d.cantidadPublicada ?? 0));

export function precioDesde(pub) {
  if (pub?.precioDesde != null) return Number(pub.precioDesde);
  const detalles = detallesDe(pub);
  const conStock = detalles.filter((d) => disponibleDe(d) > 0);
  const precios = (conStock.length ? conStock : detalles)
    .map((d) => Number(d.precioUnitario))
    .filter((n) => !Number.isNaN(n));
  return precios.length ? Math.min(...precios) : null;
}

/** Valor del lote completo: lo que se reserva al aceptar una oferta. */
export function precioTotal(pub) {
  if (pub?.precioTotal != null) return Number(pub.precioTotal);
  const detalles = detallesDe(pub);
  if (!detalles.length) return null;
  return detalles.reduce(
    (total, d) => total + Number(d.precioUnitario ?? 0) * Number(d.cantidadPublicada ?? 0),
    0
  );
}

/** Activa, con unidades y sin reservas: una oferta reserva el lote completo. */
export function esOfertable(pub) {
  if (pub?.ofertable != null) return Boolean(pub.ofertable);
  const detalles = detallesDe(pub);
  return (
    pub?.estadoPublicacion === "ACTIVA" &&
    detalles.some((d) => Number(d.cantidadPublicada) > 0) &&
    detalles.every((d) => disponibleDe(d) === Number(d.cantidadPublicada ?? 0))
  );
}

/** Cantidad total de unidades del lote (publicadas). */
export function unidadesDelLote(pub) {
  return detallesDe(pub).reduce((s, d) => s + Number(d.cantidadPublicada ?? 0), 0);
}

/**
 * Precio principal para mostrar:
 *  - un solo producto: su precio
 *  - OFERTA_LIBRE: el valor del lote (se oferta por todo)
 *  - PRECIO_FIJO con varios productos: "desde" (se pueden comprar sueltos)
 * Devuelve { valor, etiqueta } con etiqueta "", "Lote" o "Desde".
 */
export function precioPrincipal(pub) {
  const detalles = detallesDe(pub);
  if (detalles.length <= 1) {
    const unico = precioDesde(pub);
    return { valor: unico, etiqueta: "" };
  }
  if (pub?.tipoVenta === "OFERTA_LIBRE") {
    return { valor: precioTotal(pub), etiqueta: "Lote" };
  }
  return { valor: precioDesde(pub), etiqueta: "Desde" };
}

/** Porcentaje entero de monto sobre total, o null si no se puede calcular. */
export function porcentajeDe(monto, total) {
  const m = Number(monto);
  const t = Number(total);
  if (!m || !t || t <= 0) return null;
  return Math.round((m * 100) / t);
}