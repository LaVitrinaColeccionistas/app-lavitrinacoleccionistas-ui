import { Navigate, Route, Routes, useNavigate } from "react-router-dom";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import CatalogoPage from "./pages/catalogo/CatalogoPage";
import IntercambiosPage from "./pages/intercambios/IntercambiosPage";
import ProponerIntercambioPage from "./pages/intercambios/ProponerIntercambioPage";
import SoportePage from "./pages/soporte/SoportePage";
import PanelVendedorPage from "./pages/vendedor/PanelVendedorPage";
import NuevaPublicacionPage from "./pages/vendedor/NuevaPublicacionPage";
import NuevoProductoPage from "./pages/vendedor/NuevoProductoPage";

import PageLayout from "./components/layout/PageLayout";
import ProtectedRoute from "./components/common/ProtectedRoute";
import FormOverlay from "./components/common/FormOverlay";
import { useAuth } from "./context/AuthContext";

const withLayout = (page) => (
  <PageLayout>{page}</PageLayout>
);

const protegida = (page, roles) => (
  <ProtectedRoute roles={roles}>{page}</ProtectedRoute>
);

const vendedor = ["VENDEDOR"];

// Panel del vendedor de fondo + formulario encima con fondo oscuro
function FormularioVendedor({ children }) {
  const navigate = useNavigate();

  return (
    <PageLayout>
      <PanelVendedorPage />
      <FormOverlay onClose={() => navigate("/vendedor")}>
        {children}
      </FormOverlay>
    </PageLayout>
  );
}

export default function App() {
  const { usuarioId, autenticado, tieneRol } = useAuth();

  const inicio = tieneRol("VENDEDOR") ? "/vendedor" : "/catalogo";

  return (
    <Routes>
      <Route
        path="/login"
        element={
          autenticado ? (
            <Navigate to={inicio} replace />
          ) : (
            <LoginPage />
          )
        }
      />

      <Route
        path="/registro"
        element={<RegisterPage />}
      />

      <Route
        path="/catalogo"
        element={withLayout(<CatalogoPage />)}
      />

      <Route
        path="/intercambios"
        element={protegida(withLayout(<IntercambiosPage />))}
      />

      <Route
        path="/intercambios/nuevo"
        element={protegida(
          withLayout(
            <ProponerIntercambioPage usuarioId={usuarioId} />
          )
        )}
      />

      <Route
        path="/soporte"
        element={withLayout(<SoportePage />)}
      />

      <Route
        path="/vendedor"
        element={protegida(
          withLayout(<PanelVendedorPage />),
          vendedor
        )}
      />

      <Route
        path="/vendedor/publicaciones/nueva"
        element={protegida(
          <FormularioVendedor>
            <NuevaPublicacionPage />
          </FormularioVendedor>,
          vendedor
        )}
      />

      <Route
        path="/vendedor/productos/nuevo"
        element={protegida(
          <FormularioVendedor>
            <NuevoProductoPage />
          </FormularioVendedor>,
          vendedor
        )}
      />

      <Route
        path="*"
        element={
          <Navigate
            to={autenticado ? inicio : "/login"}
            replace
          />
        }
      />
    </Routes>
  );
}