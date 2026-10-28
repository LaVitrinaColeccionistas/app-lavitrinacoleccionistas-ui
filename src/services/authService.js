import { request } from "./api";

// IDs confirmados con GET /api/roles
export const ROLES = { COMPRADOR: 1, VENDEDOR: 2, ADMIN: 3 };

export const login = ({ email, password }) =>
  request("/api/auth/login", { method: "POST", body: { email, password }, auth: false });

export const register = (payload) =>
  request("/api/auth/register", { method: "POST", body: payload, auth: false });