import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// Comprueba que haya sesión válida (token existente, legible y no vencido)
// y, si se indican `roles`, que el usuario tenga alguno de ellos.
export default function ProtectedRoute({ children, roles }) {
  const { autenticado, tieneRol } = useAuth();
  const location = useLocation();

  if (!autenticado) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  }

  if (roles?.length && !roles.some((rol) => tieneRol(rol))) {
    return (
      <Navigate
        to={tieneRol("VENDEDOR") ? "/vendedor" : "/catalogo"}
        replace
      />
    );
  }

  return children;
}