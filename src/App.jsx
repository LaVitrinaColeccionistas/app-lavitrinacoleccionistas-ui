import { Navigate, Route, Routes, useNavigate } from "react-router-dom";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import CatalogoPage from "./pages/catalogo/CatalogoPage";
import DetallePublicacionPage from "./pages/catalogo/DetallePublicacionPage";
import OfertasPage from "./pages/ofertas/OfertasPage";
import IntercambiosPage from "./pages/intercambios/IntercambiosPage";
import ProponerIntercambioPage from "./pages/intercambios/ProponerIntercambioPage";
import SoportePage from "./pages/soporte/SoportePage";
import PanelVendedorPage from "./pages/vendedor/PanelVendedorPage";
import NuevaPublicacionPage from "./pages/vendedor/NuevaPublicacionPage";
import NuevoProductoPage from "./pages/vendedor/NuevoProductoPage";
import CarritoPage from "./pages/compras/CarritoPage";
import ComprasPage from "./pages/compras/ComprasPage";
import SolicitudesRegistroPage from "./pages/admin/SolicitudesRegistroPage";
import NotFoundPage from "./pages/errores/NotFoundPage";
import ServerErrorPage from "./pages/errores/ServerErrorPage";

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
const admin = ["ADMIN"];
const comprador = ["COMPRADOR", "ADMIN"];

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
        path="/catalogo/:id" 
        element={withLayout(<DetallePublicacionPage />)} 
      />

      <Route
        path="/ofertas"
        element={protegida(withLayout(<OfertasPage />))}
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
        path="/carrito"
        element={protegida(withLayout(<CarritoPage />), comprador)}
      />

      <Route
        path="/compras"
        element={protegida(withLayout(<ComprasPage />))}
      />

      <Route
        path="/compras/:id/editar"
        element={protegida(withLayout(<CarritoPage />), comprador)}
      />

      <Route
        path="/admin/solicitudes"
        element={protegida(withLayout(<SolicitudesRegistroPage />), admin)}
      />

      <Route
        path="/"
        element={
          <Navigate
            to={autenticado ? inicio : "/login"}
            replace
          />
        }
      />

      <Route path="/error" element={<ServerErrorPage />} />

      <Route path="/404" element={<NotFoundPage />} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}