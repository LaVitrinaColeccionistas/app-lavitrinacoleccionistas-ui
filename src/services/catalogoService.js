import { request } from "./api";

// Todo pasa por el gateway
const RUTA_PUBLICACIONES = "/api/publicaciones";
const RUTA_PRODUCTOS = "/api/productos";
const RUTA_OFERTAS = "/api/ofertas";

// Arma el query string ignorando valores vacíos
const qs = (obj) => {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== "") p.set(k, v);
  });
  return p.toString();
};

/* ───────── Publicaciones ───────── */

// Por defecto solo ACTIVA (catálogo público). Pasar estadoPublicacion: null para traer todas.
export const obtenerPublicaciones = ({
  page = 0,
  size = 9,
  busqueda = "",
  idVendedor,
  estadoPublicacion = "ACTIVA",
} = {}) =>
  request(
    `${RUTA_PUBLICACIONES}?${qs({
      page,
      size,
      sort: "fechaPublicacion,desc",
      titulo: busqueda,
      idVendedor,
      estadoPublicacion,
    })}`
  );

export const obtenerPublicacion = (id) => request(`${RUTA_PUBLICACIONES}/${id}`);

// PublicacionCreateDTO: { idVendedor, titulo, descripcion, tipoVenta, detalles: [{ idProducto, precioUnitario, cantidadPublicada }] }
export const crearPublicacion = (datos) =>
  request(RUTA_PUBLICACIONES, { method: "POST", body: datos });

export const actualizarEstadoPublicacion = (id, estadoPublicacion) =>
  request(`${RUTA_PUBLICACIONES}/${id}/estado`, {
    method: "PATCH",
    body: { estadoPublicacion },
  });

export const eliminarPublicacion = (id) =>
  request(`${RUTA_PUBLICACIONES}/${id}`, { method: "DELETE" });

/* ───────── Productos ───────── */

export const obtenerProductos = ({ page = 0, size = 10, idVendedor, nombre } = {}) =>
  request(`${RUTA_PRODUCTOS}?${qs({ page, size, idVendedor, nombre })}`);

export const obtenerProducto = (id) => request(`${RUTA_PRODUCTOS}/${id}`);

// ProductoCreateDTO: { idVendedor, nombre, categoria, estadoConservacion, rareza, stock, precioReferencia, urlImagen }
export const crearProducto = (datos) =>
  request(RUTA_PRODUCTOS, { method: "POST", body: datos });

/* ───────── Ofertas ───────── */

export const obtenerOfertas = ({ page = 0, size = 50, idPublicacion, idComprador, estadoOferta } = {}) =>
  request(`${RUTA_OFERTAS}?${qs({ page, size, idPublicacion, idComprador, estadoOferta })}`);

// OfertaCreateDTO (confirmar con el backend): { idPublicacion, idComprador, montoOfertado, mensaje? }
export const crearOferta = (datos) =>
  request(RUTA_OFERTAS, { method: "POST", body: datos });

export const aceptarOferta = (id) => request(`${RUTA_OFERTAS}/${id}/aceptar`, { method: "POST" });
export const rechazarOferta = (id) => request(`${RUTA_OFERTAS}/${id}/rechazar`, { method: "POST" });