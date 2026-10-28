
import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, Search } from "lucide-react";

import Alert from "../../components/common/Alert";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import ItemCompareCard from "../../components/common/ItemCompareCard";
import Pagination from "../../components/common/Pagination";
import Table from "../../components/common/Table";
import { useAuth } from "../../context/AuthContext";
import ConfirmDeleteModal from "../../components/common/ConfirmDeleteModal";

import {
  obtenerIntercambios,
  cambiarEstadoIntercambio,
  eliminarIntercambio,
} from "../../services/intercambiosService";

const columnas = [
  { key: "solicitado", label: "Artículos solicitados" },
  { key: "ofrecido", label: "Artículos ofrecidos" },
  { key: "diferencia", label: "Diferencia" },
  { key: "estado", label: "Estado" },
  { key: "fecha", label: "Fecha" },
  { key: "accion", label: "Acción" },
];

const variantesEstado = {
  PROPUESTO: "warning",
  ACEPTADO: "success",
  RECHAZADO: "danger",
  CANCELADO: "neutral",
};

function formatearEstado(estado) {
  if (!estado) return "-";

  return (
    estado.charAt(0).toUpperCase() +
    estado.slice(1).toLowerCase()
  );
}

function formatearFecha(fecha) {
  if (!fecha) return "-";

  return new Intl.DateTimeFormat("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(fecha));
}

function formatearDinero(valor) {
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(Number(valor ?? 0));
}

function obtenerProductos(intercambio, tipo) {
  return (
    intercambio?.detalles?.filter(
      (detalle) => detalle.tipoMovimiento === tipo
    ) ?? []
  );
}

function nombresProductos(detalles) {
  if (!detalles.length) return "-";

  return detalles
    .map((detalle) => detalle.nombreProductoSnapshot)
    .join(", ");
}

function convertirDetalleAItem(detalle) {
  return {
    nombre: detalle.nombreProductoSnapshot,
    estado: `Cantidad: ${detalle.cantidad}`,
  };
}

export default function IntercambiosPage() {
  const { usuarioId, tieneRol } = useAuth();
  const esAdmin = tieneRol("ADMIN");
  const [eliminando, setEliminando] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [intercambios, setIntercambios] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [actualizandoEstado, setActualizandoEstado] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    async function cargarIntercambios() {
      try {
        setCargando(true);
        setError("");

        const data = await obtenerIntercambios(pagina, 10);
        const contenido = data.content ?? [];

        setIntercambios(contenido);
        setTotalPaginas(data.totalPages ?? 0);

        setSeleccionado((actual) => {
          if (actual) {
            const actualizado = contenido.find(
              (item) => item.id === actual.id
            );

            if (actualizado) return actualizado;
          }

          return contenido[0] ?? null;
        });
      } catch (err) {
        console.error(err);
        setError("No fue posible cargar los intercambios.");
      } finally {
        setCargando(false);
      }
    }

    cargarIntercambios();
  }, [pagina]);

  const intercambiosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) return intercambios;

    return intercambios.filter((intercambio) => {
      const ofrecidos = nombresProductos(
        obtenerProductos(intercambio, "OFRECIDO")
      ).toLowerCase();

      const solicitados = nombresProductos(
        obtenerProductos(intercambio, "SOLICITADO")
      ).toLowerCase();

      const estado = intercambio.estado?.toLowerCase() ?? "";

      return (
        ofrecidos.includes(texto) ||
        solicitados.includes(texto) ||
        estado.includes(texto)
      );
    });
  }, [intercambios, busqueda]);

  const esProponente =
    seleccionado != null &&
    usuarioId != null &&
    usuarioId === Number(seleccionado.idUsuarioProponente);

  const esReceptor =
    seleccionado != null &&
    usuarioId != null &&
    usuarioId === Number(seleccionado.idUsuarioReceptor);

  const puedeAceptarORechazar =
    seleccionado?.estado === "PROPUESTO" && esReceptor;

  const puedeCancelar =
    seleccionado?.estado === "PROPUESTO" && esProponente;

  async function cambiarEstado(nuevoEstado) {
    if (!seleccionado || actualizandoEstado) return;

    const permitido =
      nuevoEstado === "CANCELADO"
        ? puedeCancelar
        : ["ACEPTADO", "RECHAZADO"].includes(nuevoEstado) &&
          puedeAceptarORechazar;

    if (!permitido) return;

    try {
      setActualizandoEstado(true);
      setError("");
      setMensaje("");

      const actualizado = await cambiarEstadoIntercambio(
        seleccionado.id,
        nuevoEstado
      );

      setSeleccionado(actualizado);

      setIntercambios((actuales) =>
        actuales.map((intercambio) =>
          intercambio.id === actualizado.id
            ? actualizado
            : intercambio
        )
      );

      setMensaje(
        nuevoEstado === "ACEPTADO"
          ? "El intercambio fue aceptado correctamente."
          : nuevoEstado === "RECHAZADO"
            ? "La propuesta fue rechazada correctamente."
            : "La propuesta fue cancelada correctamente."
      );
    } catch (err) {
      console.error(err);
      setError("No fue posible actualizar el estado del intercambio.");
    } finally {
      setActualizandoEstado(false);
    }
  }

  async function handleEliminar() {
    if (!seleccionado || eliminando || !esAdmin) return;

    try {
      setEliminando(true);
      setError("");
      setMensaje("");

      await eliminarIntercambio(seleccionado.id);

      const restantes = intercambios.filter(
        (intercambio) => intercambio.id !== seleccionado.id
      );

      setIntercambios(restantes);
      setSeleccionado(restantes[0] ?? null);
      setModalEliminar(false);
      setMensaje("El intercambio fue eliminado correctamente.");
    } catch (err) {
      console.error(err);
      setError("No fue posible eliminar el intercambio.");
      setModalEliminar(false);
    } finally {
      setEliminando(false);
    }
  }

  function seleccionarIntercambio(intercambio) {
    setSeleccionado(intercambio);
    setMensaje("");
    setError("");
  }

  const productosSolicitados = obtenerProductos(
    seleccionado,
    "SOLICITADO"
  );

  const productosOfrecidos = obtenerProductos(
    seleccionado,
    "OFRECIDO"
  );

  if (cargando) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Card>
          <p className="text-center text-sm text-[#6B7280]">
            Cargando intercambios...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* ENCABEZADO */}
      <div className="mb-7 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F0EFFF]">
          <ArrowLeftRight
            size={20}
            className="text-[#5146E5]"
          />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">
            Mis Intercambios
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Consulta y administra tus propuestas de intercambio.
          </p>
        </div>
      </div>

      {/* ALERTAS */}
      {error && (
        <Alert
          variant="danger"
          className="mb-5"
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      {mensaje && (
        <Alert
          variant="success"
          className="mb-5"
          onClose={() => setMensaje("")}
        >
          {mensaje}
        </Alert>
      )}

      {/* DETALLE */}
      {seleccionado && (
        <Card
          className="mb-8"
          title="Detalle del intercambio"
          subtitle={`Propuesta realizada el ${formatearFecha(
            seleccionado.fechaCreacion
          )}`}
          headerAction={
            <Badge
              variant={
                variantesEstado[seleccionado.estado] ?? "neutral"
              }
            >
              {formatearEstado(seleccionado.estado)}
            </Badge>
          }
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-3">
              {productosSolicitados.length > 0 ? (
                productosSolicitados.map((detalle) => (
                  <ItemCompareCard
                    key={detalle.id}
                    title="Artículos solicitados"
                    item={convertirDetalleAItem(detalle)}
                  />
                ))
              ) : (
                <p className="text-sm text-[#6B7280]">
                  No hay artículos solicitados.
                </p>
              )}
            </div>

            <div className="space-y-3">
              {productosOfrecidos.length > 0 ? (
                productosOfrecidos.map((detalle, index) => (
                  <ItemCompareCard
                    key={detalle.id}
                    title={
                      index === 0
                        ? "Artículo ofrecido"
                        : "Artículo ofrecido adicional"
                    }
                    item={convertirDetalleAItem(detalle)}
                  />
                ))
              ) : (
                <p className="text-sm text-[#6B7280]">
                  No hay artículos ofrecidos.
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 rounded-lg bg-[#F6F6F8] p-4">
            <p className="text-sm text-[#6B7280]">
              Compensación económica
            </p>
            <p className="mt-1 text-lg font-bold text-[#1F2937]">
              {formatearDinero(seleccionado.diferenciaDinero)}
            </p>
          </div>

          {(puedeAceptarORechazar || puedeCancelar) && (
            <div className="mt-5 flex flex-wrap justify-end gap-3">
              {puedeAceptarORechazar && (
                <>
                  <Button
                    variant="success"
                    loading={actualizandoEstado}
                    onClick={() => cambiarEstado("ACEPTADO")}
                  >
                    Aceptar
                  </Button>

                  <Button
                    variant="outlineDanger"
                    disabled={actualizandoEstado}
                    onClick={() => cambiarEstado("RECHAZADO")}
                  >
                    Rechazar
                  </Button>
                </>
              )}

              {puedeCancelar && (
                <Button
                  variant="outlineDanger"
                  disabled={actualizandoEstado}
                  onClick={() => cambiarEstado("CANCELADO")}
                >
                  Cancelar
                </Button>
              )}
            </div>
          )}
          {esAdmin && (
            <div className="mt-5">
              <Button
                type="button"
                variant="outlineDanger"
                loading={eliminando}
                onClick={() => setModalEliminar(true)}
              >
                Eliminar
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* HISTORIAL */}
      <Card padding="none" className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-[#E5E7EB] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-[#1F2937]">
              Historial de intercambios
            </h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              Revisa las propuestas enviadas y recibidas.
            </p>
          </div>

          <div className="relative w-full sm:w-80">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[#9CA3AF]"
            />

            <Input
              name="busqueda"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar intercambio..."
              className="[&_input]:pl-10"
            />
          </div>
        </div>

        <Table
          columns={columnas}
          data={intercambiosFiltrados}
          emptyMessage="No se encontraron intercambios."
          renderRow={(intercambio) => {
            const solicitados = obtenerProductos(
              intercambio,
              "SOLICITADO"
            );

            const ofrecidos = obtenerProductos(
              intercambio,
              "OFRECIDO"
            );

            return (
              <>
                <td className="px-4 py-4 font-medium text-[#1F2937]">
                  {nombresProductos(solicitados)}
                </td>

                <td className="px-4 py-4 text-[#4B5563]">
                  {nombresProductos(ofrecidos)}
                </td>

                <td className="px-4 py-4 text-[#4B5563]">
                  {formatearDinero(intercambio.diferenciaDinero)}
                </td>

                <td className="px-4 py-4">
                  <Badge
                    variant={
                      variantesEstado[intercambio.estado] ?? "neutral"
                    }
                    size="sm"
                  >
                    {formatearEstado(intercambio.estado)}
                  </Badge>
                </td>

                <td className="px-4 py-4 text-[#6B7280]">
                  {formatearFecha(intercambio.fechaCreacion)}
                </td>

                <td className="px-4 py-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => seleccionarIntercambio(intercambio)}
                  >
                    Ver detalle
                  </Button>
                </td>
              </>
            );
          }}
        />

        <div className="border-t border-[#E5E7EB] p-4">
          <Pagination
            currentPage={pagina + 1}
            totalPages={totalPaginas}
            onPageChange={(nuevaPagina) =>
              setPagina(nuevaPagina - 1)
            }
          />
        </div>
      </Card>
    <ConfirmDeleteModal
      isOpen={modalEliminar}
      onClose={() => {
        if (!eliminando) setModalEliminar(false);
      }}
      onConfirm={handleEliminar}
      elemento="el intercambio"
      loading={eliminando}
    />
    </div>
  );
}