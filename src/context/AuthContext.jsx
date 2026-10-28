/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getToken,
  saveToken,
  clearToken,
  decodePayload,
} from "../utils/session";

//mantiene el token, el ID del usuario y sus roles disponibles para los componentes.

const AuthContext = createContext(null);

function leerPayload(token) {
  if (!token) return null;

  const payload = decodePayload(token);
  if (!payload) return null;

  if (
    typeof payload.exp === "number" &&
    payload.exp * 1000 <= Date.now()
  ) {
    return null;
  }

  return payload;
}

function obtenerUsuarioId(payload) {
  if (!payload) return null;

  const id =
    payload.uid ??
    payload.idUsuario ??
    payload.usuarioId ??
    payload.userId ??
    payload.id;

  if (id == null) return null;

  const numero = Number(id);
  return Number.isFinite(numero) ? numero : null;
}

function obtenerRoles(payload) {
  if (!payload) return [];

  const roles = payload.roles ?? [];
  const lista = Array.isArray(roles) ? roles : [roles];

  return lista.map((rol) =>
    String(rol).replace(/^ROLE_/, "")
  );
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const guardado = getToken();
    return leerPayload(guardado) ? guardado : null;
  });

  const payload = useMemo(() => leerPayload(token), [token]);

  const usuarioId = obtenerUsuarioId(payload);

  const nombreCompleto = [
    payload?.nombre,
    payload?.apellido,
  ]
    .filter(Boolean)
    .join(" ");

  const roles = useMemo(() => obtenerRoles(payload), [payload]);

  const autenticado = Boolean(payload);

  // Cuando el token vence con la app abierta, cierra la sesión sola:
  // ProtectedRoute detecta autenticado=false y redirige al login.
  useEffect(() => {
    if (!payload?.exp) return undefined;

    const restante = payload.exp * 1000 - Date.now();
    const temporizador = setTimeout(() => {
      clearToken();
      setToken(null);
    }, Math.max(restante, 0));

    return () => clearTimeout(temporizador);
  }, [payload]);

  function iniciarSesion(nuevoToken) {
    if (!leerPayload(nuevoToken)) {
      throw new Error("El token recibido no es válido o expiró.");
    }

    saveToken(nuevoToken);
    setToken(nuevoToken);
  }

  function cerrarSesion() {
    clearToken();
    setToken(null);
  }

  function tieneRol(rol) {
    return roles.includes(
      String(rol).replace(/^ROLE_/, "")
    );
  }

  const value = {
    token: autenticado ? token : null,
    usuarioId,
    nombreCompleto,
    roles,
    autenticado,
    iniciarSesion,
    cerrarSesion,
    tieneRol,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth debe utilizarse dentro de AuthProvider"
    );
  }

  return context;
}