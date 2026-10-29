export { formatearDinero, formatearFecha, imagenDePublicacion } from "../vendedor/opciones";

const opt = (value, label) => ({ value, label });

export const METODOS_PAGO = [
  opt("TARJETA", "Tarjeta"),
  opt("EFECTIVO", "Efectivo"),
  opt("TRANSFERENCIA", "Transferencia"),
];

export const ESTADOS_ORDEN = [
  opt("PENDIENTE", "Pendiente"),
  opt("PAGADA", "Pagada"),
  opt("ENVIADA", "Enviada"),
  opt("ENTREGADA", "Entregada"),
  opt("CANCELADA", "Cancelada"),
];

export const TIPOS_RECLAMO = [
  opt("PRODUCTO_DANADO", "Producto dañado"),
  opt("PRODUCTO_NO_RECIBIDO", "Producto no recibido"),
  opt("COBRO_INCORRECTO", "Cobro incorrecto"),
  opt("OTRO", "Otro"),
];

export const ESTADOS_RECLAMO = [
  opt("ABIERTO", "Abierto"),
  opt("EN_REVISION", "En revisión"),
  opt("RESUELTO", "Resuelto"),
  opt("RECHAZADO", "Rechazado"),
];

export const variantesOrden = {
  PENDIENTE: "warning",
  PAGADA: "info",
  ENVIADA: "primary",
  ENTREGADA: "success",
  CANCELADA: "neutral",
};

export const variantesReclamo = {
  ABIERTO: "warning",
  EN_REVISION: "info",
  RESUELTO: "success",
  RECHAZADO: "danger",
};

export const TRANSICIONES_ORDEN = {
  PENDIENTE: ["PAGADA", "CANCELADA"],
  PAGADA: ["ENVIADA", "CANCELADA"],
  ENVIADA: ["ENTREGADA"],
  ENTREGADA: [],
  CANCELADA: [],
};

export const etiqueta = (lista, valor) =>
  lista.find((o) => o.value === valor)?.label ?? valor ?? "-";

export function resumenProductos(orden) {
  const nombres = (orden?.detalles ?? []).map((d) => d.nombreProductoSnapshot);
  if (nombres.length === 0) return "-";
  if (nombres.length <= 2) return nombres.join(", ");
  return `${nombres[0]}, ${nombres[1]} y ${nombres.length - 2} más`;
}

export const nombreCompleto = (perfil) =>
  perfil ? [perfil.nombre, perfil.apellido].filter(Boolean).join(" ") : "";
