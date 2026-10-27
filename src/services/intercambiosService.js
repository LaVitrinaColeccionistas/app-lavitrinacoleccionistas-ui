import { request } from "./api";
const RUTA = "/api/intercambios";

export const obtenerIntercambios = (page = 0, size = 10) =>
  request(`${RUTA}?page=${page}&size=${size}`);

export const cambiarEstadoIntercambio = (id, estado) =>
    request(`${RUTA}/${id}/estado`, { method: "PATCH", body: { estado } });

export const crearIntercambio = (datos) => 
    request(RUTA, { method: "POST", body: datos });

export const eliminarIntercambio = (id) =>
  request(`${RUTA}/${id}`, { method: "DELETE" });