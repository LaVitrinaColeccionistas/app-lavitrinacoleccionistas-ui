import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import Breadcrumb from "../../components/layout/Breadcrumb";
import { useAuth } from "../../context/AuthContext";
import OrdenesTab from "./OrdenesTab";
import ReclamosTab from "./ReclamosTab";

const TABS = [
  { id: "ordenes", label: "Compras" },
  { id: "reclamos", label: "Reclamos" },
];

export default function ComprasPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { usuarioId, tieneRol } = useAuth();

  const esAdmin = tieneRol("ADMIN");
  const esGestor = esAdmin || tieneRol("VENDEDOR");
  const puedeComprar = esAdmin || tieneRol("COMPRADOR");

  const [tab, setTab] = useState(state?.tab ?? "ordenes");
  const [mensaje, setMensaje] = useState(state?.mensaje ?? "");

  const cambiarTab = (id) => {
    setTab(id);
    setMensaje("");
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: "Mi cuenta" }, { label: esGestor ? "Gestión de compras" : "Mis compras" }]} />
          <h1 className="mt-2 text-3xl font-bold text-[#111827]">{esGestor ? "Compras" : "Mis compras"}</h1>
        </div>
        {puedeComprar && <Button onClick={() => navigate("/carrito")}>+ Nueva compra</Button>}
      </div>

      {mensaje && (
        <Alert variant="success" className="mb-4" onClose={() => setMensaje("")}>
          {mensaje}
        </Alert>
      )}

      <div className="mb-4 flex gap-6 border-b border-[#E5E7EB]">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => cambiarTab(t.id)}
            className={`-mb-px border-b-2 pb-3 text-sm font-semibold transition-colors ${
              tab === t.id
                ? "border-[#5146E5] text-[#5146E5]"
                : "border-transparent text-[#6B7280] hover:text-[#1F2937]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "ordenes" ? (
        <OrdenesTab
          usuarioId={usuarioId}
          esAdmin={esAdmin}
          esGestor={esGestor}
          onMensaje={setMensaje}
          onReclamoCreado={() => {
            setTab("reclamos");
            setMensaje("Reclamo registrado correctamente.");
          }}
        />
      ) : (
        <ReclamosTab
          usuarioId={usuarioId}
          esAdmin={esAdmin}
          esGestor={esGestor}
          puedeCrear={puedeComprar}
          onMensaje={setMensaje}
        />
      )}
    </div>
  );
}
