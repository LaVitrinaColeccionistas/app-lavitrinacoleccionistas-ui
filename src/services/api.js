import { getToken } from "../utils/session";

const BASE_URL = import.meta.env.VITE_API_URL ?? ""; // vacío = usa el proxy de Vite

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    // ms-seguridad responde { status, mensaje }; el gateway responde { message }
    throw new ApiError(res.status, data?.mensaje ?? data?.message ?? "Error inesperado");
  }
  return data;
}