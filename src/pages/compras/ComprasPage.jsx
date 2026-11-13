import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import Breadcrumb from "../../components/layout/Breadcrumb";
import { useAuth } from "../../context/AuthContext";
import OrdenesTab from "./OrdenesTab";
import ReclamosTab from "./ReclamosTab";

export default function ComprasPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { usuarioId, tieneRol } = useAuth();

  const esAdmin = tieneRol("ADMIN");
  const esVendedor = tieneRol("VENDEDOR");
  const esGestor = esAdmin || esVendedor;
  const puedeComprar = esAdmin || tieneRol("COMPRADOR");

  const tabs = [
    ...(esAdmin
      ? [{ id: "ordenes", label: "Compras", modo: "todas" }]
      : [
          ...(puedeComprar ? [{ id: "ordenes", label: "Mis compras", modo: "compras" }] : []),
          ...(esVendedor ? [{ id: "ventas", label: "Mis ventas", modo: "ventas" }] : []),
        ]),
    { id: "reclamos", label: "Reclamos" },
  ];

  const [tab, setTab] = useState(tabs.some((t) => t.id === state?.tab) ? state.tab : tabs[0].id);
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
        {tabs.map((t) => (
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

      {tab !== "reclamos" ? (
        <OrdenesTab
          key={tab}
          usuarioId={usuarioId}
          esAdmin={esAdmin}
          modo={tabs.find((t) => t.id === tab).modo}
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
