import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import CatalogoPage from "./pages/catalogo/CatalogoPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route path="/catalogo" element={<CatalogoPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}