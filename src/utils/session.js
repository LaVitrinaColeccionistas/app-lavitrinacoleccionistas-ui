const KEY = "lvc_token";
export const getToken = () => localStorage.getItem(KEY);
export const saveToken = (t) => localStorage.setItem(KEY, t);
export const clearToken = () => localStorage.removeItem(KEY);
export function getUserId() {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    const id = payload.idUsuario ?? payload.usuarioId ?? payload.userId ?? payload.id;
    return id == null ? null : Number(id);
  } catch { return null; }
}
