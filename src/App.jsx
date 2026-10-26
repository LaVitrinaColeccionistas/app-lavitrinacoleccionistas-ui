import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import CatalogoPage from "./pages/catalogo/CatalogoPage";

import IntercambiosPage from "./pages/intercambios/IntercambiosPage";
import ProponerIntercambioPage from "./pages/intercambios/ProponerIntercambioPage";
import SoportePage from "./pages/soporte/SoportePage";
import { getUserId } from "./utils/session";
import PageLayout from "./components/layout/PageLayout";

const links = [
  { label: "Catálogo", to: "/catalogo" },
  { label: "Mis Ofertas", to: "/ofertas" },
  { label: "Carrito", to: "/carrito" },
  { label: "Mis Compras", to: "/compras" },
  { label: "Mis Intercambios", to: "/intercambios" },
];
const withLayout = (page) => <PageLayout links={links}>{page}</PageLayout>;

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route path="/intercambios" element={withLayout(<IntercambiosPage />)} />
      <Route path="/intercambios/nuevo" element={withLayout(<ProponerIntercambioPage usuarioId={getUserId()} />)} />
      <Route path="/soporte" element={withLayout(<SoportePage />)} />
      <Route path="/catalogo" element={<CatalogoPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}