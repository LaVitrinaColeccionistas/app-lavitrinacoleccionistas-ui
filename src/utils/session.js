const KEY = "lvc_token";
export const getToken = () => localStorage.getItem(KEY);
export const saveToken = (t) => localStorage.setItem(KEY, t);
export const clearToken = () => localStorage.removeItem(KEY);
export function getUserId() {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    const id = payload.uid ?? payload.idUsuario ?? payload.usuarioId ?? payload.userId ?? payload.id;
    return id == null ? null : Number(id);
  } catch { return null; }
}

export function hasRole(rol) {
  const token = getToken();
  if (!token) return false;

  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );

    const roles = payload.roles ?? [];

    return (Array.isArray(roles) ? roles : [roles]).some(
      (r) => String(r).replace(/^ROLE_/, "") === rol
    );
  } catch {
    return false;
  }
}
