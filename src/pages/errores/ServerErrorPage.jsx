import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Logo from "../../components/layout/Logo";

export default function ServerErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8F9FC] px-6">
      <Logo to="/catalogo" />

      <Card padding="lg" className="mt-8 w-full max-w-md text-center">
        <p className="text-6xl font-bold text-[#DC2626]">500</p>
        <h1 className="mt-3 text-xl font-bold text-[#1F2937]">Algo salió mal</h1>
        <p className="mt-2 text-sm text-[#6B7280]">
          No pudimos completar la operación en este momento. Intentá de nuevo en unos instantes.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" fullWidth onClick={() => window.location.reload()}>
            Reintentar
          </Button>
          <Button fullWidth onClick={() => window.location.assign("/catalogo")}>
            Ir al inicio
          </Button>
        </div>
      </Card>
    </div>
  );
}
