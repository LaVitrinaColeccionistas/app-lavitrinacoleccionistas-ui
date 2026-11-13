import { request } from "./api";

const RUTA_ORDENES = "/api/ordenes";
const RUTA_RECLAMOS = "/api/reclamos";

const qs = (obj) => {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== "") p.set(k, v);
  });
  return p.toString();
};

export const paginaDe = (data) => ({
  items: data?.content ?? [],
  total: data?.page?.totalElements ?? data?.totalElements ?? 0,
  totalPaginas: data?.page?.totalPages ?? data?.totalPages ?? 0,
});

export const obtenerOrdenes = ({ page = 0, size = 10, idComprador, idVendedor, estadoOrden, producto } = {}) =>
  request(
    `${RUTA_ORDENES}?${qs({ page, size, sort: "fechaOrden,desc", idComprador, idVendedor, estadoOrden, producto })}`
  );

export const obtenerOrden = (id) => request(`${RUTA_ORDENES}/${id}`);

export const crearOrden = (datos) => request(RUTA_ORDENES, { method: "POST", body: datos });

export const actualizarOrden = (id, datos) =>
  request(`${RUTA_ORDENES}/${id}`, { method: "PUT", body: datos });

export const actualizarEstadoOrden = (id, estadoOrden) =>
  request(`${RUTA_ORDENES}/${id}/estado`, { method: "PATCH", body: { estadoOrden } });

export const cancelarOrden = (id) => request(`${RUTA_ORDENES}/${id}`, { method: "DELETE" });

export const obtenerReclamos = ({ page = 0, size = 10, idComprador, estado, descripcion } = {}) =>
  request(
    `${RUTA_RECLAMOS}?${qs({ page, size, sort: "fechaCreacion,desc", activo: true, idComprador, estado, descripcion })}`
  );

export const crearReclamo = (datos) => request(RUTA_RECLAMOS, { method: "POST", body: datos });

export const actualizarReclamo = (id, datos) =>
  request(`${RUTA_RECLAMOS}/${id}`, { method: "PUT", body: datos });

export const eliminarReclamo = (id) => request(`${RUTA_RECLAMOS}/${id}`, { method: "DELETE" });

export const confirmarRecepcionOrden = (id, idComprador) =>
  request(`${RUTA_ORDENES}/${id}/recepcion?${qs({ idComprador })}`, { method: "PATCH" });

export const obtenerValoracionesOrden = (idOrden) => request(`${RUTA_ORDENES}/${idOrden}/valoraciones`);

export const crearValoracion = (idOrden, datos) =>
  request(`${RUTA_ORDENES}/${idOrden}/valoraciones`, { method: "POST", body: datos });

export const obtenerValoracionesPublicacion = (idPublicacion, { page = 0, size = 5 } = {}) =>
  request(
    `${RUTA_ORDENES}/publicaciones/${idPublicacion}/valoraciones?${qs({ page, size, sort: "fechaCreacion,desc" })}`,
    { silencioso: true }
  );

export const obtenerResumenValoraciones = (idPublicacion) =>
  request(`${RUTA_ORDENES}/publicaciones/${idPublicacion}/valoraciones/resumen`, { silencioso: true });
