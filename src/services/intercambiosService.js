import { request } from "./api";
const RUTA = "/api/intercambios";

export const obtenerIntercambios = (page = 0, size = 10, busqueda = "") => {
  const params = new URLSearchParams({ page, size });

  if (busqueda.trim()) {
    params.set("busqueda", busqueda.trim());
  }

  return request(`${RUTA}?${params.toString()}`);
};

export const cambiarEstadoIntercambio = (id, estado) =>
    request(`${RUTA}/${id}/estado`, { method: "PATCH", body: { estado } });

export const crearIntercambio = (datos) => 
    request(RUTA, { method: "POST", body: datos });

export const eliminarIntercambio = (id) =>
  request(`${RUTA}/${id}`, { method: "DELETE" });