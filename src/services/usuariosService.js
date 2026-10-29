import { request } from "./api";

const RUTA = "/api/usuarios";

export const obtenerUsuarios = ({ page = 0, size = 20 } = {}) =>
  request(`${RUTA}?${new URLSearchParams({ page, size }).toString()}`);

export const actualizarUsuario = (id, datos) =>
  request(`${RUTA}/${id}`, { method: "PUT", body: datos });
