import { request } from "./api";

// TODO: confirmar IDs contra el seed de Liquibase
export const ROLES = { COMPRADOR: 2, VENDEDOR: 3 };

export const login = ({ email, password }) =>
  request("/api/auth/login", { method: "POST", body: { email, password }, auth: false });

export const register = (payload) =>
  request("/api/auth/register", { method: "POST", body: payload, auth: false });