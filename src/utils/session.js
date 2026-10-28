const KEY = "lvc_token";

export function decodePayload(token) {
  try {
    const segment = token.split(".")[1];
    if (!segment) return null;

    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));

    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

function isExpired(token) {
  const payload = decodePayload(token);
  // Token ilegible = sesión inválida. Sin "exp" se asume que no vence.
  if (!payload) return true;
  if (payload.exp == null) return false;
  return Date.now() >= Number(payload.exp) * 1000;
}

// Si el token venció o está dañado, se borra y se devuelve null
// (así ProtectedRoute manda al login).
export const getToken = () => {
  const token = localStorage.getItem(KEY);
  if (!token) return null;
  if (isExpired(token)) {
    localStorage.removeItem(KEY);
    return null;
  }
  return token;
};
export const saveToken = (t) => localStorage.setItem(KEY, t);
export const clearToken = () => localStorage.removeItem(KEY);

function getTokenPayload() {
  const token = getToken();
  return token ? decodePayload(token) : null;
}

export function getUserId() {
  const payload = getTokenPayload();

  const id =
    payload?.uid ??
    payload?.idUsuario ??
    payload?.usuarioId ??
    payload?.userId ??
    payload?.id;

  return id == null ? null : Number(id);
}

// IDs confirmados con GET /api/roles: 1 = COMPRADOR, 2 = VENDEDOR, 3 = ADMIN
const ROL_POR_ID = { 1: "COMPRADOR", 2: "VENDEDOR", 3: "ADMIN" };

// Lista de roles del token ya normalizados: ["VENDEDOR"], ["ADMIN", "COMPRADOR"], etc.
function getRolesNormalizados() {
  const payload = getTokenPayload();

  if (!payload) return [];

  const rawRoles = [
    payload.rol,
    payload.role,
    payload.tipo,
    payload.tipoUsuario,
    payload.authorities,
    payload.roles,
    payload.idRoles,
    payload.idRol,
    payload.rolUsuario,
  ]
    .flat()
    .filter((value) => value != null);

  return rawRoles.map((value) => {
    const texto =
      typeof value === "object"
        ? String(
            value.authority ??
              value.tipoRol ??
              value.name ??
              value.rol ??
              value.id ??
              ""
          )
        : String(value);

    // "ROLE_ADMIN" -> "ADMIN", "ROLE_3" -> "ADMIN", "3" -> "ADMIN"
    const limpio = texto.toUpperCase().replace(/^ROLE_/, "");
    return ROL_POR_ID[limpio] ?? limpio;
  });
}

export function hasRole(rol) {
  return getRolesNormalizados().includes(String(rol).toUpperCase());
}

export function getUserRole() {
  const roles = getRolesNormalizados();

  // Prioridad: ADMIN > VENDEDOR > COMPRADOR
  for (const rol of ["ADMIN", "VENDEDOR", "COMPRADOR"]) {
    if (roles.includes(rol)) return rol;
  }

  return null;
}

export function getNombreCompleto() {
  const token = getToken();
  if (!token) return "";

  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );

    return [payload.nombre, payload.apellido]
      .filter(Boolean)
      .join(" ");
  } catch {
    return "";
  }
}