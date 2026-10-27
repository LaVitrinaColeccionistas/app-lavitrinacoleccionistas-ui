import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

//comprueba que el token exista, pueda decodificarse y no esté expirado.
export default function ProtectedRoute({ children }) {
  const { autenticado } = useAuth();
  const location = useLocation();

  if (!autenticado) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  return children;
}
