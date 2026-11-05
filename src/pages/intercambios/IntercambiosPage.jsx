
import { useEffect, useRef, useState } from "react";
import { ArrowLeftRight, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { resolverError } from "../../utils/errores";

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
import {
  obtenerProducto,
  obtenerDetallesPublicacion,
} from "../../services/catalogoService";
import {
  obtenerIntercambios,
  cambiarEstadoIntercambio,
  eliminarIntercambio,
  actualizarIntercambio,
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
  return estado.charAt(0).toUpperCase() +
    estado.slice(1).toLowerCase();
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

function extraerContenido(respuesta) {
  if (Array.isArray(respuesta)) return respuesta;
  if (Array.isArray(respuesta?.content)) return respuesta.content;
  return [];
}

function obtenerMensajeError(err, mensajeAlternativo) {
  if ([400, 403, 404, 409].includes(err?.status)) {
    return err?.message || mensajeAlternativo;
  }
  return mensajeAlternativo;
}

export default function IntercambiosPage() {
  const { usuarioId, tieneRol } = useAuth();
  const navigate = useNavigate();
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
  const [editando, setEditando] = useState(false);
  const [cargandoEdicion, setCargandoEdicion] = useState(false);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [formEdicion, setFormEdicion] = useState(null);

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
  const edicionVersion = useRef(0);

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
              "No fue posible obtener los nombres:",
              err
            );
            setNombresUsuarios({});
          }
        } else {
          setNombresUsuarios({});
        }

        setSeleccionado((actual) => {
          if (!actual) return null;
          return contenido.find(
            (item) => item.id === actual.id
          ) ?? null;
        });
      } catch (err) {
        if (!activo) return;
        console.error(err);
        if (resolverError(err, navigate)) return;
        setError("No fue posible cargar los intercambios.");
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarIntercambios();

    return () => {
      activo = false;
    };
  }, [
    pagina,
    busquedaAplicada,
    filtroEstado,
    fechaDesde,
    fechaHasta,
    navigate,
  ]);

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

    if (!ids.length) return;

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

      if (Object.keys(productos).length) {
        setDatosProductos((actuales) => ({
          ...actuales,
          ...productos,
        }));
      }
    }

    cargarProductos();
  }, [intercambios]);

  const esReceptor = seleccionado != null && usuarioId != null &&
    Number(usuarioId) === Number(seleccionado.idUsuarioReceptor);

  const puedeEditar = seleccionado?.estado === "PROPUESTO" &&
    Number(usuarioId) === Number(seleccionado?.idUsuarioProponente);

  function permisos(intercambio) {
    const proponente = usuarioId != null &&
      Number(usuarioId) === Number(intercambio.idUsuarioProponente);
    const receptor = usuarioId != null &&
      Number(usuarioId) === Number(intercambio.idUsuarioReceptor);
    return {
      editar: intercambio.estado === "PROPUESTO" && proponente,
      cancelar: intercambio.estado === "PROPUESTO" && proponente,
      aceptarRechazar: intercambio.estado === "PROPUESTO" && receptor,
      completar: intercambio.estado === "ACEPTADO" && receptor,
    };
  }

  function mostrarTipoMovimiento(tipo) {
    if (esReceptor) {
      return tipo === "OFRECIDO"
        ? "Solicitado"
        : "Ofrecido";
    }

    return tipo === "OFRECIDO"
      ? "Ofrecido"
      : "Solicitado";
  }

  async function consultarDetallesPublicacion(idPublicacion) {
    const size = 50;
    let page = 0;
    let totalPages;
    const detalles = [];

    do {
      const respuesta = await obtenerDetallesPublicacion(
        idPublicacion,
        { page, size }
      );

      if (
        !Array.isArray(respuesta) &&
        !Array.isArray(respuesta?.content)
      ) {
        throw new Error(
          "Formato de detalles de publicación no reconocido."
        );
      }

      detalles.push(...extraerContenido(respuesta));

      totalPages = Array.isArray(respuesta)
        ? 1
        : Number(respuesta.totalPages ?? 1);

      page++;
    } while (page < totalPages);

    return detalles;
  }

  async function iniciarEdicion(intercambio) {
    if (!permisos(intercambio).editar || cargandoEdicion) return;

    seleccionarIntercambio(intercambio);
    const version = ++edicionVersion.current;

    try {
      setCargandoEdicion(true);
      setError("");
      setMensaje("");

      const detallesActuales = intercambio.detalles ?? [];

      const idsProductos = [
        ...new Set(
          detallesActuales
            .map((d) => d.idProducto)
            .filter((id) => id != null)
        ),
      ];

      const [detallesPublicacion, productosActualizados] =
        await Promise.all([
          consultarDetallesPublicacion(
            intercambio.idPublicacion
          ),
          Promise.all(
            idsProductos.map((id) => obtenerProducto(id))
          ),
        ]);

      if (version !== edicionVersion.current) return;

      const productosPorId = Object.fromEntries(
        idsProductos.map((id, index) => [
          id,
          productosActualizados[index],
        ])
      );

      setDatosProductos((actuales) => ({
        ...actuales,
        ...productosPorId,
      }));

      const detallesForm = detallesActuales.map((detalle) => {
        if (detalle.tipoMovimiento === "SOLICITADO") {
          const detallePublicado = detallesPublicacion.find(
            (d) =>
              Number(d.idProducto ?? d.producto?.id) ===
              Number(detalle.idProducto)
          );

          if (!detallePublicado) {
            throw new Error(
              `El producto "${detalle.nombreProductoSnapshot}" ya no está en la publicación.`
            );
          }

          const disponible = Number(
            detallePublicado.cantidadDisponible
          );

          if (
            !Number.isInteger(disponible) ||
            disponible < 0
          ) {
            throw new Error(
              `No se pudo determinar la disponibilidad de "${detalle.nombreProductoSnapshot}".`
            );
          }

          return {
            idProducto: detalle.idProducto,
            tipoMovimiento: detalle.tipoMovimiento,
            cantidad: String(detalle.cantidad),
            maxCantidad: disponible,
            limiteVerificado: true,
          };
        }

        const stock = Number(
          productosPorId[detalle.idProducto]?.stock
        );

        if (!Number.isInteger(stock) || stock < 0) {
          throw new Error(
            `No se pudo consultar el stock de "${detalle.nombreProductoSnapshot}".`
          );
        }

        return {
          idProducto: detalle.idProducto,
          tipoMovimiento: detalle.tipoMovimiento,
          cantidad: String(detalle.cantidad),
          maxCantidad: stock,
          limiteVerificado: false,
        };
      });

      setFormEdicion({
        detalles: detallesForm,
        diferenciaDinero: String(
          intercambio.diferenciaDinero ?? 0
        ),
        usuarioPagaDiferencia:
          intercambio.usuarioPagaDiferencia == null
            ? ""
            : String(intercambio.usuarioPagaDiferencia),
      });

      setEditando(true);
    } catch (err) {
      if (version !== edicionVersion.current) return;
      console.error(err);
      if (err?.status >= 500 || err?.status == null) {
        resolverError(err, navigate);
        return;
      }
      setError(
        err?.message ||
          "No se pudo consultar la disponibilidad."
      );
    } finally {
      if (version === edicionVersion.current) {
        setCargandoEdicion(false);
      }
    }
  }

  function cancelarEdicion() {
    edicionVersion.current++;
    setEditando(false);
    setFormEdicion(null);
    setCargandoEdicion(false);
    setError("");
  }

  function cambiarCantidad(index, valor) {
    if (
      valor !== "" &&
      (!/^\d+$/.test(valor) ||
        !Number.isSafeInteger(Number(valor)))
    ) {
      return;
    }

    const limite = formEdicion?.detalles[index]?.maxCantidad;

    if (
      valor !== "" &&
      Number(valor) > limite
    ) {
      return;
    }

    setFormEdicion((actual) => ({
      ...actual,
      detalles: actual.detalles.map((detalle, i) =>
        i === index
          ? { ...detalle, cantidad: valor }
          : detalle
      ),
    }));
  }

  async function guardarEdicion() {
    if (
      !puedeEditar ||
      !formEdicion ||
      guardandoEdicion
    ) {
      return;
    }

    const detalles = formEdicion.detalles.map((d) => ({
      idProducto: d.idProducto,
      tipoMovimiento: d.tipoMovimiento,
      cantidad: Number(d.cantidad),
    }));

    if (
      detalles.some(
        (d, index) =>
          formEdicion.detalles[index].cantidad === "" ||
          !Number.isSafeInteger(d.cantidad) ||
          d.cantidad < 1
      )
    ) {
      setError(
        "Las cantidades deben ser números enteros mayores a cero."
      );
      return;
    }

    if (
      detalles.some(
        (d, index) =>
          d.cantidad >
          formEdicion.detalles[index].maxCantidad
      )
    ) {
      setError(
        "La cantidad supera la disponibilidad permitida."
      );
      return;
    }

    const diferencia = Number(
      formEdicion.diferenciaDinero
    );

    if (
      formEdicion.diferenciaDinero === "" ||
      !Number.isFinite(diferencia) ||
      diferencia < 0
    ) {
      setError(
        "La diferencia de dinero debe ser mayor o igual a cero."
      );
      return;
    }

    if (
      diferencia > 0 &&
      !formEdicion.usuarioPagaDiferencia
    ) {
      setError("Seleccioná quién paga la diferencia.");
      return;
    }

    try {
      setGuardandoEdicion(true);
      setError("");
      setMensaje("");

      const solicitados = detalles.filter(
        (d) => d.tipoMovimiento === "SOLICITADO"
      );

      if (solicitados.length) {
        const publicados =
          await consultarDetallesPublicacion(
            seleccionado.idPublicacion
          );

        for (const detalle of solicitados) {
          const publicado = publicados.find(
            (d) =>
              Number(d.idProducto ?? d.producto?.id) ===
              Number(detalle.idProducto)
          );

          const disponible = Number(
            publicado?.cantidadDisponible
          );

          if (
            !publicado ||
            !Number.isInteger(disponible) ||
            detalle.cantidad > disponible
          ) {
            throw new Error(
              "La disponibilidad de la publicación cambió. Volvé a abrir la edición para actualizar las cantidades."
            );
          }
        }
      }

      const actualizado = await actualizarIntercambio(
        seleccionado.id,
        {
          idUsuarioProponente:
            seleccionado.idUsuarioProponente,
          idUsuarioReceptor:
            seleccionado.idUsuarioReceptor,
          idPublicacion: seleccionado.idPublicacion,
          detalles,
          diferenciaDinero: diferencia,
          usuarioPagaDiferencia:
            diferencia === 0
              ? null
              : Number(
                  formEdicion.usuarioPagaDiferencia
                ),
        }
      );

      setSeleccionado(actualizado);
      setIntercambios((actuales) =>
        actuales.map((item) =>
          item.id === actualizado.id
            ? actualizado
            : item
        )
      );

      cancelarEdicion();
      setMensaje(
        "Intercambio actualizado correctamente."
      );
    } catch (err) {
      console.error(err);
      if (err?.status >= 500 || err?.status == null) {
        resolverError(err, navigate);
        return;
      }
      setError(
        obtenerMensajeError(
          err,
          err?.message ||
            "No fue posible actualizar el intercambio."
        )
      );
    } finally {
      setGuardandoEdicion(false);
    }
  }

  async function cambiarEstado(intercambio, nuevoEstado) {
    if (actualizandoEstado) return;

    const p = permisos(intercambio);
    const permitido = nuevoEstado === "CANCELADO"
      ? p.cancelar
      : nuevoEstado === "COMPLETADO"
        ? p.completar
        : ["ACEPTADO", "RECHAZADO"].includes(nuevoEstado) && p.aceptarRechazar;
    if (!permitido) return;

    try {
      setActualizandoEstado(true);
      setError("");
      setMensaje("");

      const actualizado =
        await cambiarEstadoIntercambio(
          intercambio.id,
          nuevoEstado
        );

      setSeleccionado((actual) => actual?.id === actualizado.id ? actualizado : actual);
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
      if (err?.status >= 500 || err?.status == null) {
        resolverError(err, navigate);
        return;
      }
      setError(
        err?.status === 404 &&
        nuevoEstado === "COMPLETADO"
          ? "Este intercambio no tiene stock reservado. Cancelalo y volvé a proponerlo."
          : obtenerMensajeError(
              err,
              "No fue posible actualizar el estado del intercambio."
            )
      );
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

      setIntercambios((actuales) =>
        actuales.filter(
          (intercambio) =>
            intercambio.id !== seleccionado.id
        )
      );

      setSeleccionado(null);
      setModalEliminar(false);
      setMensaje(
        "El intercambio fue eliminado correctamente."
      );
    } catch (err) {
      console.error(err);
      if (err?.status >= 500 || err?.status == null) {
        resolverError(err, navigate);
        return;
      }
      setError(
        "No fue posible eliminar el intercambio."
      );
      setModalEliminar(false);
    } finally {
      setEliminando(false);
    }
  }

  function nombreUsuario(id) {
    return nombresUsuarios[id] || "No disponible";
  }

  function obtenerPagador(intercambio) {
    const idPagador =
      intercambio.usuarioPagaDiferencia;

    if (idPagador == null) {
      return "No especificado";
    }

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
    edicionVersion.current++;
    setSeleccionado(intercambio);
    setEditando(false);
    setFormEdicion(null);
    setCargandoEdicion(false);
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
      {seleccionado && !modalEliminar && (
        <FormOverlay
          onClose={() => {
            if (
              !modalEliminar &&
              !actualizandoEstado &&
              !guardandoEdicion &&
              !eliminando
            ) {
              setSeleccionado(null);
              cancelarEdicion();
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
                {formatearFecha(
                  seleccionado.fechaCreacion
                )}
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
                      variantesEstado[
                        seleccionado.estado
                      ] ?? "neutral"
                    }
                  >
                    {formatearEstado(
                      seleccionado.estado
                    )}
                  </Badge>
                </dd>
              </div>
            </dl>

            {/* EDICIÓN */}
            {editando && formEdicion && (
              <div className="mb-6 space-y-4 rounded-lg border border-[#ECEEF2] p-4">
                <h3 className="font-semibold text-[#1F2937]">
                  Editar propuesta
                </h3>

                <p className="text-sm text-[#6B7280]">
                  Podés cambiar las cantidades, pero no agregar ni quitar productos.
                </p>

                {formEdicion.detalles.map(
                  (detalle, index) => (
                    <div
                      key={`${detalle.tipoMovimiento}-${detalle.idProducto}`}
                      className="flex items-center justify-between gap-4"
                    >
                      <div className="text-sm">
                        <p className="font-medium text-[#1F2937]">
                          {seleccionado.detalles[index]
                            ?.nombreProductoSnapshot ||
                            datosProductos[
                              detalle.idProducto
                            ]?.nombre ||
                            "Producto"}
                        </p>

                        <p className="text-[#6B7280]">
                          {mostrarTipoMovimiento(
                            detalle.tipoMovimiento
                          )}
                        </p>
                      </div>

                      <input
                        type="number"
                        min="1"
                        max={detalle.maxCantidad}
                        step="1"
                        aria-label={`Cantidad de ${
                          seleccionado.detalles[index]
                            ?.nombreProductoSnapshot ||
                          "producto"
                        }`}
                        value={detalle.cantidad}
                        onKeyDown={(e) => {
                          if (
                            ["-", "+", ".", "e", "E"].includes(
                              e.key
                            )
                          ) {
                            e.preventDefault();
                          }
                        }}
                        onChange={(e) =>
                          cambiarCantidad(
                            index,
                            e.target.value
                          )
                        }
                        className="w-24 rounded-lg border border-[#D1D5DB] p-2 text-sm"
                      />

                      <span className="text-xs text-[#6B7280]">
                        {detalle.tipoMovimiento ===
                        "SOLICITADO"
                          ? "Disponible"
                          : "Stock total"}
                        : {detalle.maxCantidad}
                      </span>
                    </div>
                  )
                )}

                <Input
                  name="diferenciaDineroEdicion"
                  label="Diferencia en guaraníes"
                  type="number"
                  min="0"
                  step="1"
                  value={
                    formEdicion.diferenciaDinero
                  }
                  onKeyDown={(e) => {
                    if (
                      ["-", "e", "E"].includes(e.key)
                    ) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const valor = e.target.value;

                    if (
                      valor !== "" &&
                      (!/^\d*\.?\d*$/.test(valor) ||
                        Number(valor) < 0)
                    ) {
                      return;
                    }

                    setFormEdicion((actual) => ({
                      ...actual,
                      diferenciaDinero: valor,
                    }));
                  }}
                />

                {Number(
                  formEdicion.diferenciaDinero
                ) > 0 && (
                  <div>
                    <label
                      htmlFor="pagadorEdicion"
                      className="mb-2 block text-sm font-medium"
                    >
                      ¿Quién paga la diferencia?
                    </label>

                    <select
                      id="pagadorEdicion"
                      value={
                        formEdicion.usuarioPagaDiferencia
                      }
                      onChange={(e) =>
                        setFormEdicion(
                          (actual) => ({
                            ...actual,
                            usuarioPagaDiferencia:
                              e.target.value,
                          })
                        )
                      }
                      className="w-full rounded-lg border border-[#D1D5DB] p-2 text-sm"
                    >
                      <option
                        value=""
                        disabled
                      >
                        Seleccionar
                      </option>

                      <option
                        value={
                          seleccionado.idUsuarioProponente
                        }
                      >
                        Proponente:{" "}
                        {nombreUsuario(
                          seleccionado.idUsuarioProponente
                        )}
                      </option>

                      <option
                        value={
                          seleccionado.idUsuarioReceptor
                        }
                      >
                        Receptor:{" "}
                        {nombreUsuario(
                          seleccionado.idUsuarioReceptor
                        )}
                      </option>
                    </select>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    disabled={guardandoEdicion}
                    onClick={cancelarEdicion}
                  >
                    Volver
                  </Button>

                  <Button
                    loading={guardandoEdicion}
                    disabled={guardandoEdicion}
                    onClick={guardarEdicion}
                  >
                    Guardar cambios
                  </Button>
                </div>
              </div>
            )}

            {/* TABLA DE PRODUCTOS */}
            <div className="overflow-hidden rounded-lg border border-[#ECEEF2]">
              <Table
                columns={[
                  {
                    key: "producto",
                    label: "PRODUCTO",
                  },
                  {
                    key: "movimiento",
                    label: "TIPO",
                  },
                  {
                    key: "cantidad",
                    label: "CANTIDAD",
                  },
                  {
                    key: "precio",
                    label: "PRECIO U.",
                    className: "text-right",
                  },
                ]}
                data={
                  seleccionado.detalles ?? []
                }
                emptyMessage="Este intercambio no tiene productos."
                renderRow={(detalle) => (
                  <>
                    <td className="px-4 py-3 font-semibold text-[#1F2937]">
                      {detalle.nombreProductoSnapshot ||
                        datosProductos[
                          detalle.idProducto
                        ]?.nombre ||
                        "Producto"}
                    </td>

                    <td className="px-4 py-3 text-[#4B5563]">
                      {mostrarTipoMovimiento(
                        detalle.tipoMovimiento
                      )}
                    </td>

                    <td className="px-4 py-3 text-[#4B5563]">
                      {detalle.cantidad}
                    </td>

                    <td className="px-4 py-3 text-right text-[#4B5563]">
                      {datosProductos[
                        detalle.idProducto
                      ]?.precioReferencia == null
                        ? "-"
                        : formatearDinero(
                            datosProductos[
                              detalle.idProducto
                            ].precioReferencia
                          )}
                    </td>
                  </>
                )}
              />
            </div>

            {/* TOTALES */}
            {seleccionado.detalles?.length >
              0 && (
              <div className="mt-4 space-y-2 rounded-lg bg-[#F9FAFB] p-4 text-sm">
                {[
                  "SOLICITADO",
                  "OFRECIDO",
                ].map((tipo) => {
                  const detalles =
                    seleccionado.detalles.filter(
                      (detalle) =>
                        detalle.tipoMovimiento ===
                        tipo
                    );

                  if (!detalles.length) {
                    return null;
                  }

                  const sinPrecio =
                    detalles.some(
                      (detalle) =>
                        datosProductos[
                          detalle.idProducto
                        ]?.precioReferencia == null
                    );

                  const total =
                    detalles.reduce(
                      (suma, detalle) =>
                        suma +
                        Number(
                          datosProductos[
                            detalle.idProducto
                          ]?.precioReferencia ?? 0
                        ) *
                          Number(
                            detalle.cantidad ?? 0
                          ),
                      0
                    );

                  return (
                    <div
                      key={tipo}
                      className="flex justify-between gap-4"
                    >
                      <span className="text-[#4B5563]">
                        Total de referencia{" "}
                        {mostrarTipoMovimiento(
                          tipo
                        ).toLowerCase()}
                      </span>

                      <strong className="text-[#1F2937]">
                        {sinPrecio
                          ? "No disponible"
                          : formatearDinero(
                              total
                            )}
                      </strong>
                    </div>
                  );
                })}
              </div>
            )}

            {/* COMPENSACIÓN */}
            <dl className="ml-auto mt-5 w-full max-w-sm space-y-3 text-sm">
              <div className="flex justify-between gap-4 text-[#4B5563]">
                <dt>
                  Compensación económica
                </dt>
                <dd className="font-bold text-[#1F2937]">
                  {formatearDinero(
                    seleccionado.diferenciaDinero
                  )}
                </dd>
              </div>

              {Number(
                seleccionado.diferenciaDinero
              ) > 0 && (
                <div className="flex justify-between gap-4 text-[#4B5563]">
                  <dt>
                    Paga la diferencia
                  </dt>
                  <dd className="text-right">
                    {obtenerPagador(
                      seleccionado
                    )}
                  </dd>
                </div>
              )}
            </dl>

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
                setBusqueda(
                  event.target.value
                );
                setPagina(0);
              }}
              placeholder="Buscar por publicación..."
              className="[&_input]:pl-10 [&_input]:text-[#111827]"
            />
          </div>

          <select
            value={filtroEstado}
            onChange={(event) => {
              setFiltroEstado(
                event.target.value
              );
              setPagina(0);
            }}
            className="h-[46px] w-full rounded-lg border border-[#D1D5DB] bg-white px-4 text-sm text-[#111827] sm:w-[260px]"
          >
            <option value="">
              Todos los estados
            </option>
            <option value="PROPUESTO">
              Propuesto
            </option>
            <option value="ACEPTADO">
              Aceptado
            </option>
            <option value="RECHAZADO">
              Rechazado
            </option>
            <option value="CANCELADO">
              Cancelado
            </option>
            <option value="COMPLETADO">
              Completado
            </option>
          </select>
        </div>

        <div className="grid gap-4 border-b border-[#E5E7EB] px-5 pb-5 sm:grid-cols-2">
          <Input
            label="Fecha desde"
            name="fechaDesde"
            type="date"
            value={fechaDesde}
            max={
              fechaHasta || undefined
            }
            onChange={(event) => {
              setFechaDesde(
                event.target.value
              );
              setPagina(0);
            }}
          />

          <Input
            label="Fecha hasta"
            name="fechaHasta"
            type="date"
            value={fechaHasta}
            min={
              fechaDesde || undefined
            }
            onChange={(event) => {
              setFechaHasta(
                event.target.value
              );
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
                    Number(
                      intercambio.idUsuarioProponente
                    ) === Number(usuarioId)
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
                    variantesEstado[
                      intercambio.estado
                    ] ?? "neutral"
                  }
                  size="sm"
                >
                  {formatearEstado(
                    intercambio.estado
                  )}
                </Badge>
              </td>

              <td className="px-4 py-4 text-[#6B7280]">
                {formatearFecha(
                  intercambio.fechaCreacion
                )}
              </td>

              <td className="px-4 py-4">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Button variant="outline" size="sm"
                    onClick={() => seleccionarIntercambio(intercambio)}>
                    Ver detalle
                  </Button>
                  {permisos(intercambio).editar && (
                    <Button variant="outlineInfo" size="sm"
                      disabled={cargandoEdicion || actualizandoEstado}
                      loading={cargandoEdicion}
                      onClick={() => iniciarEdicion(intercambio)}>
                      Editar
                    </Button>
                  )}
                  {permisos(intercambio).aceptarRechazar && (
                    <>
                      <Button variant="success" size="sm"
                        disabled={actualizandoEstado}
                        onClick={() => cambiarEstado(intercambio, "ACEPTADO")}>Aceptar</Button>
                      <Button variant="outlineDanger" size="sm"
                        disabled={actualizandoEstado}
                        onClick={() => cambiarEstado(intercambio, "RECHAZADO")}>Rechazar</Button>
                    </>
                  )}
                  {permisos(intercambio).cancelar && (
                    <Button variant="outlineDanger" size="sm"
                      disabled={actualizandoEstado}
                      onClick={() => cambiarEstado(intercambio, "CANCELADO")}>Cancelar</Button>
                  )}
                  {permisos(intercambio).completar && (
                    <Button variant="success" size="sm"
                      disabled={actualizandoEstado}
                      onClick={() => cambiarEstado(intercambio, "COMPLETADO")}>Completar</Button>
                  )}
                  {esAdmin && (
                    <Button variant="outlineDanger" size="sm"
                      disabled={eliminando}
                      onClick={() => {
                        seleccionarIntercambio(intercambio);
                        setModalEliminar(true);
                      }}>Eliminar</Button>
                  )}
                </div>
              </td>
            </>
          )}
        />

        <div className="border-t border-[#E5E7EB] p-4">
          <Pagination
            currentPage={pagina + 1}
            totalPages={totalPaginas}
            onPageChange={(
              nuevaPagina
            ) =>
              setPagina(
                nuevaPagina - 1
              )
            }
          />
        </div>
      </Card>

      <ConfirmDeleteModal
        isOpen={modalEliminar}
        onClose={() => {
          if (!eliminando) {
            setModalEliminar(false);
          }
        }}
        onConfirm={handleEliminar}
        elemento="el intercambio"
        loading={eliminando}
      />
    </div>
  );
}