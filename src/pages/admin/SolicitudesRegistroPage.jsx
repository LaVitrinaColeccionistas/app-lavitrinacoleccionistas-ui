import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Alert from "../../components/common/Alert";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Pagination from "../../components/common/Pagination";
import SearchInput from "../../components/common/SearchInput";
import Table from "../../components/common/Table";
import Textarea from "../../components/common/Textarea";
import Breadcrumb from "../../components/layout/Breadcrumb";
import { obtenerNombresUsuarios } from "../../services/authService";
import { actualizarUsuario, obtenerUsuarios } from "../../services/usuariosService";
import { resolverError } from "../../utils/errores";
import { formatearFecha, nombreCompleto } from "../compras/opciones";

const POR_PAGINA = 5;
const ESTADO_PENDIENTE = "PENDIENTE_VERIFICACION";
const TAMANO_LOTE_USUARIOS = 20;
const MAX_PAGINAS_USUARIOS = 50;

const etiquetasRol = { COMPRADOR: "Comprador", VENDEDOR: "Vendedor", ADMIN: "Administrador" };
const variantesRol = { COMPRADOR: "success", VENDEDOR: "info", ADMIN: "primary" };

async function obtenerTodosLosUsuarios() {
  const primera = await obtenerUsuarios({ page: 0, size: TAMANO_LOTE_USUARIOS });
  const totalPaginas = Math.min(primera?.totalPages ?? 1, MAX_PAGINAS_USUARIOS);

  const restantes = await Promise.all(
    Array.from({ length: Math.max(totalPaginas - 1, 0) }, (_, i) =>
      obtenerUsuarios({ page: i + 1, size: TAMANO_LOTE_USUARIOS })
    )
  );

  return [primera, ...restantes].flatMap((data) => data?.content ?? []);
}

export default function SolicitudesRegistroPage() {
  const navigate = useNavigate();

  const [solicitudes, setSolicitudes] = useState([]);
  const [perfiles, setPerfiles] = useState({});
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(0);
  const [seleccionadaId, setSeleccionadaId] = useState(null);
  const [motivo, setMotivo] = useState("");
  const [recarga, setRecarga] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState("");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      try {
        setCargando(true);
        setError("");

        const usuarios = await obtenerTodosLosUsuarios();
        const pendientes = usuarios
          .filter((u) => u.estado === ESTADO_PENDIENTE)
          .sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
        if (cancelado) return;

        let mapa = {};
        if (pendientes.length) {
          const datos = await obtenerNombresUsuarios(pendientes.map((u) => u.id));
          mapa = Object.fromEntries(datos.map((p) => [p.idUsuario, p]));
        }
        if (cancelado) return;

        setPerfiles(mapa);
        setSolicitudes(pendientes);
      } catch (err) {
        if (cancelado) return;
        if (!resolverError(err, navigate)) setError(err.message || "No fue posible cargar las solicitudes.");
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, [recarga, navigate]);

  const filtradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return solicitudes;
    return solicitudes.filter(
      (u) =>
        nombreCompleto(perfiles[u.id]).toLowerCase().includes(termino) || u.email.toLowerCase().includes(termino)
    );
  }, [solicitudes, perfiles, busqueda]);

  const totalPaginas = Math.ceil(filtradas.length / POR_PAGINA);
  const paginaVisible = filtradas.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA);
  const seleccionada =
    filtradas.find((u) => u.id === seleccionadaId) ?? paginaVisible[0] ?? null;
  const perfilSeleccionado = seleccionada ? perfiles[seleccionada.id] : null;

  const resolver = async (estado, textoOk) => {
    try {
      setProcesando(estado);
      setError("");
      await actualizarUsuario(seleccionada.id, {
        estado,
        idRoles: (seleccionada.roles ?? []).map((r) => r.id),
      });
      setMensaje(textoOk);
      setMotivo("");
      setSeleccionadaId(null);
      setRecarga((n) => n + 1);
    } catch (err) {
      if (!resolverError(err, navigate)) setError(err.message);
    } finally {
      setProcesando("");
    }
  };

  const columnas = [
    { key: "nombre", label: "NOMBRE" },
    { key: "correo", label: "CORREO" },
    { key: "tipo", label: "TIPO SOLICITADO" },
    { key: "fecha", label: "FECHA" },
    { key: "acciones", label: "ACCIONES", className: "text-right" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8">
        <Breadcrumb items={[{ label: "Área restringida" }, { label: "Gestión de usuarios" }]} />
        <h1 className="mt-2 text-3xl font-bold text-[#111827]">Solicitudes de Registro</h1>
      </div>

      {mensaje && (
        <Alert variant="success" className="mb-4" onClose={() => setMensaje("")}>
          {mensaje}
        </Alert>
      )}
      {error && (
        <Alert variant="danger" className="mb-4" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SearchInput
            className="mb-4"
            value={busqueda}
            onChange={(valor) => {
              setBusqueda(valor);
              setPagina(0);
            }}
            placeholder="Buscar por nombre o correo..."
          />

          <Card padding="none" className="overflow-hidden">
            {cargando ? (
              <p className="py-16 text-center text-sm text-[#6B7280]">Cargando solicitudes...</p>
            ) : (
              <Table
                columns={columnas}
                data={paginaVisible}
                emptyMessage={
                  busqueda ? "No hay solicitudes que coincidan con la búsqueda." : "No hay solicitudes pendientes."
                }
                renderRow={(u) => (
                  <>
                    <td
                      className={`px-4 py-4 font-semibold text-[#1F2937] ${
                        seleccionada?.id === u.id ? "bg-[#F3F4F8]" : ""
                      }`}
                    >
                      {nombreCompleto(perfiles[u.id]) || "-"}
                    </td>
                    <td
                      className={`max-w-48 break-words px-4 py-4 text-[#4B5563] ${
                        seleccionada?.id === u.id ? "bg-[#F3F4F8]" : ""
                      }`}
                    >
                      {u.email}
                    </td>
                    <td className={`px-4 py-4 ${seleccionada?.id === u.id ? "bg-[#F3F4F8]" : ""}`}>
                      <div className="flex flex-wrap gap-1">
                        {(u.roles ?? []).map((r) => (
                          <Badge key={r.id} size="sm" variant={variantesRol[r.tipoRol] ?? "neutral"}>
                            {etiquetasRol[r.tipoRol] ?? r.tipoRol}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className={`px-4 py-4 text-[#6B7280] ${seleccionada?.id === u.id ? "bg-[#F3F4F8]" : ""}`}>
                      {formatearFecha(u.fechaCreacion)}
                    </td>
                    <td className={`px-4 py-4 text-right ${seleccionada?.id === u.id ? "bg-[#F3F4F8]" : ""}`}>
                      <button
                        type="button"
                        onClick={() => {
                          setSeleccionadaId(u.id);
                          setMotivo("");
                        }}
                        className="text-sm font-semibold text-[#1F2937] underline hover:text-[#5146E5]"
                      >
                        Ver solicitud
                      </button>
                    </td>
                  </>
                )}
              />
            )}

            <div className="border-t border-[#ECEEF2] py-4">
              <Pagination
                currentPage={pagina + 1}
                totalPages={totalPaginas}
                onPageChange={(p) => setPagina(p - 1)}
              />
            </div>
          </Card>
        </div>

        <Card padding="lg">
          <h2 className="text-lg font-bold text-[#1F2937]">Detalle de Solicitud</h2>

          {seleccionada ? (
            <>
              <p className="mt-1 text-sm text-[#6B7280]">
                Revisando datos de {nombreCompleto(perfilSeleccionado) || seleccionada.email}
              </p>

              <dl className="mt-5 space-y-4 border-b border-[#ECEEF2] pb-5 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[#8B909A]">Teléfono</dt>
                  <dd className="mt-1 font-semibold text-[#1F2937]">{perfilSeleccionado?.telefono || "No disponible"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[#8B909A]">Dirección</dt>
                  <dd className="mt-1 font-semibold text-[#1F2937]">
                    {perfilSeleccionado?.direccionEnvio || "No disponible"}
                  </dd>
                </div>
              </dl>

              <Textarea
                className="mt-5"
                label="Motivo del rechazo (opcional)"
                name="motivo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={3}
                placeholder="Ej: Dirección incompleta o inválida"
              />

              <div className="mt-5 flex gap-3">
                <Button
                  variant="success"
                  fullWidth
                  loading={procesando === "ACTIVO"}
                  disabled={Boolean(procesando)}
                  onClick={() => resolver("ACTIVO", "La solicitud fue aceptada y el usuario ya puede ingresar.")}
                >
                  Aceptar
                </Button>
                <Button
                  variant="outlineDanger"
                  fullWidth
                  loading={procesando === "RECHAZADO"}
                  disabled={Boolean(procesando)}
                  onClick={() => resolver("RECHAZADO", "La solicitud fue rechazada.")}
                >
                  Rechazar
                </Button>
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-[#6B7280]">Seleccioná una solicitud para revisarla.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
