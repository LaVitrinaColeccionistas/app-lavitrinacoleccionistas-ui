const opt = (v, l = v) => ({ value: v, label: l });

export const CATEGORIAS = ["Figuras", "Cartas", "Videojuegos", "Consolas", "Cómics", "Juguetes", "Antigüedades", "Otros"].map((v) => opt(v));
export const ESTADOS_CONSERVACION = ["Nuevo", "Mint", "Near Mint", "Excelente", "Buen Estado", "Detalles"].map((v) => opt(v));
export const RAREZAS = ["Común", "Poco Común", "Raro", "Ultra Raro"].map((v) => opt(v));

export const TIPOS_VENTA = [opt("PRECIO_FIJO", "Precio Fijo"), opt("OFERTA_LIBRE", "Oferta Libre")];
export const ESTADOS_PUBLICACION = [opt("ACTIVA", "Activa"), opt("PAUSADA", "Pausada")];

export const formatearDinero = (valor) =>
  new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG", maximumFractionDigits: 0 }).format(Number(valor ?? 0));

export const formatearFecha = (f) =>
  f ? new Intl.DateTimeFormat("es-PY", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(f)) : "-";

export const imagenDePublicacion = (pub) => pub?.detalles?.[0]?.producto?.urlImagen ?? "";