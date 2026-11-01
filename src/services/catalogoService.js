import { request } from "./api";

const RUTA_PUBLICACIONES = "/api/publicaciones";
const RUTA_PRODUCTOS = "/api/productos";
const RUTA_OFERTAS = "/api/ofertas";
const RUTA_RESERVAS = "/api/reservas";
const qs = (obj) => {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== "") p.set(k, v);
  });
  return p.toString();
};

//Publicaciones

// Por defecto solo ACTIVA . Pasar estadoPublicacion: null para traer todas.
export const obtenerPublicaciones = ({
  page = 0,
  size = 9,
  busqueda = "",
  idVendedor,
  estadoPublicacion = "ACTIVA",
  tipoVenta,
} = {}) =>
  request(
    `${RUTA_PUBLICACIONES}?${qs({
      page,
      size,
      sort: "fechaPublicacion,desc",
      titulo: busqueda,
      idVendedor,
      estadoPublicacion,
      tipoVenta,
    })}`
  );

export const obtenerPublicacion = (id) => request(`${RUTA_PUBLICACIONES}/${id}`);

// GET /api/publicaciones/{id}/detalles
export const obtenerDetallesPublicacion = (id, { page = 0, size = 50 } = {}) =>
  request(`${RUTA_PUBLICACIONES}/${id}/detalles?${qs({ page, size })}`);

export const crearPublicacion = (datos) =>
  request(RUTA_PUBLICACIONES, { method: "POST", body: datos });

// PUT /api/publicaciones/{id}  { titulo?, descripcion?, tipoVenta?, detalles? }
export const actualizarPublicacion = (id, datos) =>
  request(`${RUTA_PUBLICACIONES}/${id}`, { method: "PUT", body: datos });

// PATCH /api/publicaciones/{id}/estado  (solo ACTIVA <-> PAUSADA)
export const actualizarEstadoPublicacion = (id, estadoPublicacion) =>
  request(`${RUTA_PUBLICACIONES}/${id}/estado`, {
    method: "PATCH",
    body: { estadoPublicacion },
  });

// DELETE lógico (409 si está VENDIDA o tiene reservas vigentes)
export const eliminarPublicacion = (id) =>
  request(`${RUTA_PUBLICACIONES}/${id}`, { method: "DELETE" });

//Productos

export const obtenerProductos = ({ page = 0, size = 10, idVendedor, nombre, categoria, rareza } = {}) =>
  request(`${RUTA_PRODUCTOS}?${qs({ page, size, idVendedor, nombre, categoria, rareza })}`);

export const obtenerProducto = (id) => request(`${RUTA_PRODUCTOS}/${id}`);

// ProductoCreateDTO: { idVendedor, nombre, categoria, estadoConservacion, rareza, stock, precioReferencia, urlImagen }
export const crearProducto = (datos) =>
  request(RUTA_PRODUCTOS, { method: "POST", body: datos });

// PUT /api/productos/{id}  (ProductoUpdateDTO, todos los campos opcionales)
export const actualizarProducto = (id, datos) =>
  request(`${RUTA_PRODUCTOS}/${id}`, { method: "PUT", body: datos });

// DELETE lógico (activo = false). 204 sin cuerpo
export const eliminarProducto = (id) =>
  request(`${RUTA_PRODUCTOS}/${id}`, { method: "DELETE" });

// Ofertas

export const obtenerOfertas = ({ page = 0, size = 50, idPublicacion, idComprador, estadoOferta } = {}) =>
  request(`${RUTA_OFERTAS}?${qs({ page, size, idPublicacion, idComprador, estadoOferta })}`);

export const obtenerOferta = (id) => request(`${RUTA_OFERTAS}/${id}`);

export const crearOferta = (datos) =>
  request(RUTA_OFERTAS, { method: "POST", body: datos });

// PUT /api/ofertas/{id}  { montoOfertado }  (409 si ya no está PENDIENTE)
export const actualizarOferta = (id, datos) =>
  request(`${RUTA_OFERTAS}/${id}`, { method: "PUT", body: datos });

export const aceptarOferta = (id) => request(`${RUTA_OFERTAS}/${id}/aceptar`, { method: "POST" });
export const rechazarOferta = (id) => request(`${RUTA_OFERTAS}/${id}/rechazar`, { method: "POST" });

// Reservas de stock (por orden)

// POST /api/reservas  { idOrden, items: [{ idDetallePublicacion, cantidad }] }  (todo o nada, idempotente)
export const crearReserva = (datos) =>
  request(RUTA_RESERVAS, { method: "POST", body: datos });

export const confirmarReserva = (idOrden) => request(`${RUTA_RESERVAS}/${idOrden}/confirmar`, { method: "POST" });
export const liberarReserva = (idOrden) => request(`${RUTA_RESERVAS}/${idOrden}/liberar`, { method: "POST" });

// POST /api/reservas/liberar-vencidas  -> { liberadas }
export const liberarReservasVencidas = () => request(`${RUTA_RESERVAS}/liberar-vencidas`, { method: "POST" });