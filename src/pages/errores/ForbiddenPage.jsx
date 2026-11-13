import { useNavigate } from "react-router-dom";

import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Logo from "../../components/layout/Logo";

export default function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8F9FC] px-6">
      <Logo to="/catalogo" />

      <Card padding="lg" className="mt-8 w-full max-w-md text-center">
        <p className="text-6xl font-bold text-[#F59E0B]">403</p>
        <h1 className="mt-3 text-xl font-bold text-[#1F2937]">No tenés acceso a esta sección</h1>
        <p className="mt-2 text-sm text-[#6B7280]">
          Tu usuario no tiene los permisos necesarios para ver esta página.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" fullWidth onClick={() => navigate(-1)}>
            Volver
          </Button>
          <Button fullWidth onClick={() => navigate("/catalogo", { replace: true })}>
            Ir al inicio
          </Button>
        </div>
      </Card>
    </div>
  );
}
