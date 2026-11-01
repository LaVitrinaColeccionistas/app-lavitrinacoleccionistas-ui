import { clearToken, getToken } from "../utils/session";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = auth ? getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const esJson = res.headers.get("content-type")?.includes("application/json");
  const data = esJson ? await res.json().catch(() => null) : null;

  // Si llega HTML en vez de JSON, el proxy o el gateway no está enrutando
  if (res.ok && res.status !== 204 && !esJson) {
    throw new ApiError(502, "Respuesta inválida del servidor (revisar proxy/gateway)");
  }

  if (res.status === 401 && auth) {
    clearToken();
    if (window.location.pathname !== "/login") window.location.replace("/login");
  }

  if (!res.ok) {
    throw new ApiError(res.status, data?.mensaje ?? data?.message ?? "Error inesperado");
  }
  return data;
}