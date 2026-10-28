import { Navigate, Route, Routes } from "react-router-dom";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import CatalogoPage from "./pages/catalogo/CatalogoPage";
import IntercambiosPage from "./pages/intercambios/IntercambiosPage";
import ProponerIntercambioPage from "./pages/intercambios/ProponerIntercambioPage";
import SoportePage from "./pages/soporte/SoportePage";

import PageLayout from "./components/layout/PageLayout";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

const withLayout = (page) => (
  <PageLayout>{page}</PageLayout>
);

export default function App() {
  const { usuarioId } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/registro"
        element={<RegisterPage />}
      />

      <Route
        path="/intercambios"
        element={
          <ProtectedRoute>
            {withLayout(<IntercambiosPage />)}
          </ProtectedRoute>
        }
      />

      <Route
        path="/intercambios/nuevo"
        element={
          <ProtectedRoute>
            {withLayout(
              <ProponerIntercambioPage usuarioId={usuarioId} />
            )}
          </ProtectedRoute>
        }
      />

      <Route
        path="/soporte"
        element={withLayout(<SoportePage />)}
      />

      <Route
        path="/catalogo"
        element={withLayout(<CatalogoPage />)}
      />

      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
}