
import { useEffect, useRef, useState } from "react";
import { ArrowLeftRight, Search } from "lucide-react";

import Alert from "../../components/common/Alert";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import FormOverlay from "../../components/common/FormOverlay";
import Pagination from "../../components/common/Pagination";
import Table from "../../components/common/Table";
import ConfirmDeleteModal from "../../components/common/ConfirmDeleteModal";

import { useAuth } from "../../context/AuthContext";
import useDebouncedValue from "../../hooks/useDebouncedValue";
import { obtenerNombresUsuarios } from "../../services/authService";
import { obtenerProducto } from "../../services/catalogoService";

import {
  obtenerIntercambios,
  cambiarEstadoIntercambio,
  eliminarIntercambio,
} from "../../services/intercambiosService";

const variantesEstado = {
  PROPUESTO: "warning",
  ACEPTADO: "success",
  RECHAZADO: "danger",
  CANCELADO: "neutral",
  COMPLETADO: "success",
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

export default function IntercambiosPage() {
  const { usuarioId, tieneRol } = useAuth();
  const esAdmin = tieneRol("ADMIN");

  const columnas = [
    ...(esAdmin
      ? [
          { key: "proponente", label: "Proponente" },
          { key: "receptor", label: "Receptor" },
        ]
      : [{ key: "contraparte", label: "Contraparte" }]),
    { key: "publicacion", label: "Publicación" },
    { key: "estado", label: "Estado" },
    { key: "fecha", label: "Fecha" },
    { key: "accion", label: "Acción" },
  ];

  const [eliminando, setEliminando] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [intercambios, setIntercambios] = useState([]);
  const [nombresUsuarios, setNombresUsuarios] = useState({});
  const [seleccionado, setSeleccionado] = useState(null);

  const [busqueda, setBusqueda] = useState("");
  const busquedaAplicada = useDebouncedValue(busqueda, 400);

  const [filtroEstado, setFiltroEstado] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [actualizandoEstado, setActualizandoEstado] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [datosProductos, setDatosProductos] = useState({});
  const productosConsultados = useRef(new Set());

  useEffect(() => {
    let activo = true;

    async function cargarIntercambios() {
      try {
        setCargando(true);
        setError("");

        const data = await obtenerIntercambios(
          pagina,
          10,
          busquedaAplicada,
          filtroEstado,
          fechaDesde,
          fechaHasta
        );

        if (!activo) return;

        const contenido = data.content ?? [];

        setIntercambios(contenido);
        setTotalPaginas(data.totalPages ?? 0);

        const ids = [
          ...new Set(
            contenido.flatMap((intercambio) => [
              intercambio.idUsuarioProponente,
              intercambio.idUsuarioReceptor,
            ])
          ),
        ].filter((id) => id != null);

        if (ids.length) {
          try {
            const perfiles = await obtenerNombresUsuarios(ids);

            if (!activo) return;

            setNombresUsuarios(
              Object.fromEntries(
                perfiles.map((perfil) => [
                  perfil.idUsuario,
                  [perfil.nombre, perfil.apellido]
                    .filter(Boolean)
                    .join(" "),
                ])
              )
            );
          } catch (err) {
            if (!activo) return;

            console.error(
              "No fue posible obtener los nombres de usuarios:",
              err
            );
            setNombresUsuarios({});
          }
        } else {
          setNombresUsuarios({});
        }

        setSeleccionado((actual) => {
          if (actual) {
            const actualizado = contenido.find(
              (item) => item.id === actual.id
            );

            if (actualizado) return actualizado;
          }

          return null;
        });
      } catch (err) {
        if (!activo) return;

        console.error(err);
        setError("No fue posible cargar los intercambios.");
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarIntercambios();

    return () => {
      activo = false;
    };
  }, [pagina, busquedaAplicada, filtroEstado, fechaDesde, fechaHasta]);

  useEffect(() => {
    const ids = [
      ...new Set(
        intercambios.flatMap((intercambio) =>
          (intercambio.detalles ?? []).map(
            (detalle) => detalle.idProducto
          )
        )
      ),
    ].filter(
      (id) =>
        id != null &&
        !productosConsultados.current.has(String(id))
    );

    if (ids.length === 0) return;

    ids.forEach((id) => {
      productosConsultados.current.add(String(id));
    });

    async function cargarProductos() {
      const resultados = await Promise.allSettled(
        ids.map((id) => obtenerProducto(id))
      );

      const productos = {};

      resultados.forEach((resultado, index) => {
        if (resultado.status === "fulfilled") {
          productos[ids[index]] = resultado.value;
        } else {
          console.error(
            `No fue posible obtener el producto ${ids[index]}`,
            resultado.reason
          );
        }
      });

      if (Object.keys(productos).length > 0) {
        setDatosProductos((actuales) => ({
          ...actuales,
          ...productos,
        }));
      }
    }

    cargarProductos();
  }, [intercambios]);

  const esProponente =
    seleccionado != null &&
    usuarioId != null &&
    Number(usuarioId) ===
      Number(seleccionado.idUsuarioProponente);

  const esReceptor =
    seleccionado != null &&
    usuarioId != null &&
    Number(usuarioId) ===
      Number(seleccionado.idUsuarioReceptor);

  const puedeAceptarORechazar =
    seleccionado?.estado === "PROPUESTO" && esReceptor;

  const puedeCancelar =
    seleccionado?.estado === "PROPUESTO" && esProponente;

  const puedeCompletar =
    seleccionado?.estado === "ACEPTADO" && esReceptor;

  async function cambiarEstado(nuevoEstado) {
    if (!seleccionado || actualizandoEstado) return;

    const permitido =
      nuevoEstado === "CANCELADO"
        ? puedeCancelar
        : nuevoEstado === "COMPLETADO"
          ? puedeCompletar
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
            : nuevoEstado === "COMPLETADO"
              ? "El intercambio fue completado correctamente."
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
      setSeleccionado(null);
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

  function nombreUsuario(id) {
    return nombresUsuarios[id] || "No disponible";
  }

  function obtenerPagador(intercambio) {
    const idPagador = intercambio.usuarioPagaDiferencia;

    if (idPagador == null) return "No especificado";

    if (
      Number(idPagador) ===
      Number(intercambio.idUsuarioProponente)
    ) {
      return `Proponente: ${nombreUsuario(idPagador)}`;
    }

    if (
      Number(idPagador) ===
      Number(intercambio.idUsuarioReceptor)
    ) {
      return `Receptor: ${nombreUsuario(idPagador)}`;
    }

    return "No especificado";
  }

  function seleccionarIntercambio(intercambio) {
    setSeleccionado(intercambio);
    setMensaje("");
    setError("");
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
            Intercambios
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Consulta y administra las propuestas de intercambio.
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

      {/* MODAL DETALLE */}
      {seleccionado && (
        <FormOverlay
          onClose={() => {
            if (
              !modalEliminar &&
              !actualizandoEstado &&
              !eliminando
            ) {
              setSeleccionado(null);
            }
          }}
          maxWidth="max-w-3xl"
        >
          <Card padding="lg">
            <div className="mb-6 pr-8">
              <h2 className="text-lg font-bold text-[#1F2937]">
                Detalle del intercambio
              </h2>
              <p className="mt-1 text-sm text-[#6B7280]">
                Propuesta realizada el{" "}
                {formatearFecha(seleccionado.fechaCreacion)}
              </p>
            </div>

            {/* DATOS Y ESTADO */}
            <dl className="mb-6 grid gap-5 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-[#8B909A]">
                  Publicación
                </dt>
                <dd className="mt-1 font-semibold text-[#1F2937]">
                  {seleccionado.tituloPublicacionSnapshot ||
                    "Publicación no disponible"}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-[#8B909A]">
                  Estado
                </dt>
                <dd className="mt-1">
                  <Badge
                    variant={
                      variantesEstado[seleccionado.estado] ??
                      "neutral"
                    }
                  >
                    {formatearEstado(seleccionado.estado)}
                  </Badge>
                </dd>
              </div>
            </dl>

            {/* TABLA DE PRODUCTOS */}
            <div className="overflow-hidden rounded-lg border border-[#ECEEF2]">
              <Table
                columns={[
                  { key: "producto", label: "PRODUCTO" },
                  { key: "movimiento", label: "TIPO" },
                  { key: "cantidad", label: "CANTIDAD" },
                  {
                    key: "precio",
                    label: "PRECIO U.",
                    className: "text-right",
                  },
                ]}
                data={seleccionado.detalles ?? []}
                emptyMessage="Este intercambio no tiene productos."
                renderRow={(detalle) => (
                  <>
                    <td className="px-4 py-3 font-semibold text-[#1F2937]">
                      {detalle.nombreProductoSnapshot ||
                        datosProductos[detalle.idProducto]?.nombre ||
                        "Producto"}
                    </td>

                    <td className="px-4 py-3 text-[#4B5563]">
                      {detalle.tipoMovimiento === "SOLICITADO"
                        ? "Solicitado"
                        : "Ofrecido"}
                    </td>

                    <td className="px-4 py-3 text-[#4B5563]">
                      {detalle.cantidad}
                    </td>

                    <td className="px-4 py-3 text-right text-[#4B5563]">
                      {datosProductos[detalle.idProducto]
                        ?.precioReferencia == null
                        ? "-"
                        : formatearDinero(
                            datosProductos[detalle.idProducto]
                              .precioReferencia
                          )}
                    </td>
                  </>
                )}
              />
            </div>

            {/* TOTALES DE REFERENCIA POR TIPO DE MOVIMIENTO */}
            {seleccionado.detalles?.length > 0 && (
              <div className="mt-4 space-y-2 rounded-lg bg-[#F9FAFB] p-4 text-sm">
                {["SOLICITADO", "OFRECIDO"].map((tipo) => {
                  const detalles = seleccionado.detalles.filter(
                    (detalle) => detalle.tipoMovimiento === tipo
                  );
                  if (!detalles.length) return null;
                  const sinPrecio = detalles.some(
                    (detalle) => datosProductos[detalle.idProducto]?.precioReferencia == null
                  );
                  const total = detalles.reduce(
                    (suma, detalle) =>
                      suma +
                      Number(datosProductos[detalle.idProducto]?.precioReferencia ?? 0) *
                        Number(detalle.cantidad ?? 0),
                    0
                  );
                  return (
                    <div key={tipo} className="flex justify-between gap-4">
                      <span className="text-[#4B5563]">
                        Total de referencia {tipo === "SOLICITADO" ? "solicitado" : "ofrecido"}
                      </span>
                      <strong className="text-[#1F2937]">
                        {sinPrecio ? "No disponible" : formatearDinero(total)}
                      </strong>
                    </div>
                  );
                })}
              </div>
            )}

            {/* COMPENSACIÓN ECONÓMICA */}
            <dl className="ml-auto mt-5 w-full max-w-sm space-y-3 text-sm">
              <div className="flex justify-between gap-4 text-[#4B5563]">
                <dt>Compensación económica</dt>
                <dd className="font-bold text-[#1F2937]">
                  {formatearDinero(seleccionado.diferenciaDinero)}
                </dd>
              </div>

              {Number(seleccionado.diferenciaDinero) > 0 && (
                <div className="flex justify-between gap-4 text-[#4B5563]">
                  <dt>Paga la diferencia</dt>
                  <dd className="text-right">
                    {obtenerPagador(seleccionado)}
                  </dd>
                </div>
              )}
            </dl>

            {/* ACCIONES */}
            {(puedeAceptarORechazar ||
              puedeCancelar ||
              puedeCompletar) && (
              <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-[#ECEEF2] pt-5">
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

                {puedeCompletar && (
                  <Button
                    variant="success"
                    loading={actualizandoEstado}
                    onClick={() => cambiarEstado("COMPLETADO")}
                  >
                    Completado
                  </Button>
                )}
              </div>
            )}

            {esAdmin && (
              <div className="mt-5 flex justify-end">
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
        </FormOverlay>
      )}

      {/* HISTORIAL */}
      <Card padding="none" className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-[#E5E7EB] p-5 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
            />

            <Input
              name="busqueda"
              value={busqueda}
              onChange={(event) => {
                setBusqueda(event.target.value);
                setPagina(0);
              }}
              placeholder="Buscar por publicación..."
              className="[&_input]:pl-10 [&_input]:text-[#111827]"
            />
          </div>

          <select
            value={filtroEstado}
            onChange={(event) => {
              setFiltroEstado(event.target.value);
              setPagina(0);
            }}
            className="h-[46px] w-full rounded-lg border border-[#D1D5DB] bg-white px-4 text-sm text-[#111827] sm:w-[260px]"
          >
            <option value="" className="text-gray-400">
              Todos los estados
            </option>
            <option value="PROPUESTO">Propuesto</option>
            <option value="ACEPTADO">Aceptado</option>
            <option value="RECHAZADO">Rechazado</option>
            <option value="CANCELADO">Cancelado</option>
            <option value="COMPLETADO">Completado</option>
          </select>
        </div>

        <div className="grid gap-4 border-b border-[#E5E7EB] px-5 pb-5 sm:grid-cols-2">
          <Input
            label="Fecha desde"
            name="fechaDesde"
            type="date"
            value={fechaDesde}
            max={fechaHasta || undefined}
            onChange={(event) => {
              setFechaDesde(event.target.value);
              setPagina(0);
            }}
          />
          <Input
            label="Fecha hasta"
            name="fechaHasta"
            type="date"
            value={fechaHasta}
            min={fechaDesde || undefined}
            onChange={(event) => {
              setFechaHasta(event.target.value);
              setPagina(0);
            }}
          />
        </div>

        <Table
          columns={columnas}
          data={intercambios}
          emptyMessage={
            cargando
              ? "Cargando intercambios..."
              : "No se encontraron intercambios."
          }
          renderRow={(intercambio) => (
            <>
              {esAdmin ? (
                <>
                  <td className="px-4 py-4 text-[#4B5563]">
                    {nombreUsuario(
                      intercambio.idUsuarioProponente
                    )}
                  </td>

                  <td className="px-4 py-4 text-[#4B5563]">
                    {nombreUsuario(
                      intercambio.idUsuarioReceptor
                    )}
                  </td>
                </>
              ) : (
                <td className="px-4 py-4 text-[#4B5563]">
                  {nombreUsuario(
                    Number(intercambio.idUsuarioProponente) ===
                      Number(usuarioId)
                      ? intercambio.idUsuarioReceptor
                      : intercambio.idUsuarioProponente
                  )}
                </td>
              )}

              <td className="px-4 py-4 font-medium text-[#1F2937]">
                {intercambio.tituloPublicacionSnapshot ||
                  "Publicación no disponible"}
              </td>

              <td className="px-4 py-4">
                <Badge
                  variant={
                    variantesEstado[intercambio.estado] ??
                    "neutral"
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
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      seleccionarIntercambio(intercambio)
                    }
                  >
                    Ver detalle
                  </Button>
                </div>
              </td>
            </>
          )}
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