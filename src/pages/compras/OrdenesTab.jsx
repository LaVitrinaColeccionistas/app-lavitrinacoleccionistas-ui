import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Alert from "../../components/common/Alert";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import ConfirmDeleteModal from "../../components/common/ConfirmDeleteModal";
import FormOverlay from "../../components/common/FormOverlay";
import Pagination from "../../components/common/Pagination";
import SearchInput from "../../components/common/SearchInput";
import Select from "../../components/common/Select";
import Table from "../../components/common/Table";
import useDebouncedValue from "../../hooks/useDebouncedValue";
import { obtenerNombresUsuarios } from "../../services/authService";
import { ORIGEN_RESERVA, liberarReserva } from "../../services/catalogoService";
import {
  actualizarEstadoOrden,
  cancelarOrden,
  confirmarRecepcionOrden,
  obtenerOrdenes,
  paginaDe,
} from "../../services/comprasService";
import { resolverError } from "../../utils/errores";
import OrdenDetalle from "./OrdenDetalle";
import ReclamoForm from "./ReclamoForm";
import {
  ESTADOS_ORDEN,
  METODOS_PAGO,
  TRANSICIONES_ORDEN,
  etiqueta,
  formatearDinero,
  formatearFecha,
  nombreCompleto,
  resumenProductos,
  variantesOrden,
} from "./opciones";

const POR_PAGINA = 10;

export default function OrdenesTab({ usuarioId, esAdmin, modo = "compras", onMensaje, onReclamoCreado }) {
  const navigate = useNavigate();
  const esVentas = modo === "ventas";
  const verComprador = modo !== "compras";

  const [ordenes, setOrdenes] = useState([]);
  const [nombres, setNombres] = useState({});
  const [busqueda, setBusqueda] = useState("");
  const busquedaAplicada = useDebouncedValue(busqueda);
  const [estado, setEstado] = useState("");
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [recarga, setRecarga] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [seleccionada, setSeleccionada] = useState(null);
  const [reclamando, setReclamando] = useState(null);
  const [aCancelar, setACancelar] = useState(null);
  const [pendientes, setPendientes] = useState({ porCobrar: 0, porEnviar: 0 });
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      try {
        setCargando(true);
        setError("");

        const data = await obtenerOrdenes({
          page: pagina,
          size: POR_PAGINA,
          idComprador: modo === "compras" ? usuarioId : undefined,
          idVendedor: esVentas ? usuarioId : undefined,
          estadoOrden: estado,
          producto: busquedaAplicada.trim(),
        });
        if (cancelado) return;

        const { items, totalPaginas: paginas } = paginaDe(data);
        setOrdenes(items);
        setTotalPaginas(paginas);

        const ids = [...new Set(items.map((o) => o.idComprador))].filter((x) => x != null);
        if (verComprador && ids.length) {
          try {
            const perfiles = await obtenerNombresUsuarios(ids);
            if (!cancelado) {
              setNombres((previos) => ({
                ...previos,
                ...Object.fromEntries(perfiles.map((p) => [p.idUsuario, nombreCompleto(p)])),
              }));
            }
          } catch {
            return;
          }
        }
      } catch (err) {
        if (cancelado) return;
        if (!resolverError(err, navigate)) setError(err.message || "No fue posible cargar las compras.");
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, [pagina, estado, busquedaAplicada, usuarioId, modo, esVentas, verComprador, recarga, navigate]);

  useEffect(() => {
    if (!esVentas) return;
    let cancelado = false;

    Promise.all([
      obtenerOrdenes({ page: 0, size: 1, idVendedor: usuarioId, estadoOrden: "PENDIENTE" }),
      obtenerOrdenes({ page: 0, size: 1, idVendedor: usuarioId, estadoOrden: "PAGADA" }),
    ])
      .then(([porCobrar, porEnviar]) => {
        if (!cancelado) {
          setPendientes({ porCobrar: paginaDe(porCobrar).total, porEnviar: paginaDe(porEnviar).total });
        }
      })
      .catch(() => {});

    return () => {
      cancelado = true;
    };
  }, [esVentas, usuarioId, recarga]);

  const confirmarRecepcion = async (orden) => {
    try {
      setProcesando(true);
      setError("");
      const actualizada = await confirmarRecepcionOrden(orden.id, usuarioId);
      setSeleccionada(actualizada);
      setRecarga((n) => n + 1);
    } catch (err) {
      if (!resolverError(err, navigate)) setError(err.message);
    } finally {
      setProcesando(false);
    }
  };

  const estadosSiguientesDe = (orden) => {
    if (modo === "compras") return [];
    const siguientes = TRANSICIONES_ORDEN[orden.estadoOrden].filter((e) => e !== "CANCELADA");
    return esVentas ? siguientes.filter((e) => e !== "ENTREGADA") : siguientes;
  };

  const ejecutar = async (accion, textoOk) => {
    try {
      setProcesando(true);
      setError("");
      await accion();
      setSeleccionada(null);
      setACancelar(null);
      onMensaje(textoOk);
      setRecarga((n) => n + 1);
    } catch (err) {
      if (!resolverError(err, navigate)) setError(err.message);
      setACancelar(null);
    } finally {
      setProcesando(false);
    }
  };

  const esDueno = (orden) => orden.idComprador === usuarioId;

  const columnas = [
    { key: "productos", label: "PRODUCTOS" },
    ...(verComprador ? [{ key: "comprador", label: "COMPRADOR" }] : []),
    { key: "fecha", label: "FECHA" },
    { key: "pago", label: "PAGO" },
    { key: "total", label: "TOTAL" },
    { key: "estado", label: "ESTADO" },
    { key: "acciones", label: "ACCIONES", className: "text-right" },
  ];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          className="min-w-64 flex-1"
          value={busqueda}
          onChange={(valor) => {
            setBusqueda(valor);
            setPagina(0);
          }}
          placeholder="Buscar por nombre de producto..."
        />
        <div className="w-52">
          <Select
            name="estado"
            value={estado}
            onChange={(e) => {
              setEstado(e.target.value);
              setPagina(0);
            }}
            placeholder="Todos los estados"
            options={ESTADOS_ORDEN}
          />
        </div>
      </div>

      {esVentas && (pendientes.porCobrar > 0 || pendientes.porEnviar > 0) && (
        <Alert variant="info" className="mb-4">
          {pendientes.porCobrar > 0 &&
            `Tenés ${pendientes.porCobrar} ${pendientes.porCobrar === 1 ? "pedido esperando" : "pedidos esperando"} el pago del comprador. `}
          {pendientes.porEnviar > 0 &&
            `Tenés ${pendientes.porEnviar} ${pendientes.porEnviar === 1 ? "venta pagada" : "ventas pagadas"} para enviar.`}
        </Alert>
      )}

      {error && (
        <Alert variant="danger" className="mb-4" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Card padding="none" className="overflow-hidden">
        {cargando ? (
          <p className="py-16 text-center text-sm text-[#6B7280]">Cargando...</p>
        ) : (
          <Table
            columns={columnas}
            data={ordenes}
            emptyMessage={
              busquedaAplicada || estado
                ? "No hay resultados para la búsqueda."
                : esVentas
                  ? "Todavía no recibiste pedidos."
                  : "Todavía no hay compras."
            }
            renderRow={(o) => (
              <>
                <td className="px-4 py-4">
                  <p className="font-semibold text-[#1F2937]">{resumenProductos(o)}</p>
                  <p className="text-xs text-[#6B7280]">
                    {o.detalles?.length ?? 0} {(o.detalles?.length ?? 0) === 1 ? "producto" : "productos"}
                  </p>
                </td>
                {verComprador && <td className="px-4 py-4 text-[#4B5563]">{nombres[o.idComprador] ?? "-"}</td>}
                <td className="px-4 py-4 text-[#6B7280]">{formatearFecha(o.fechaOrden)}</td>
                <td className="px-4 py-4 text-[#4B5563]">{etiqueta(METODOS_PAGO, o.metodoPago)}</td>
                <td className="px-4 py-4 font-bold text-[#1F2937]">{formatearDinero(o.montoTotal)}</td>
                <td className="px-4 py-4">
                  <Badge variant={variantesOrden[o.estadoOrden] ?? "neutral"}>
                    {etiqueta(ESTADOS_ORDEN, o.estadoOrden)}
                  </Badge>
                </td>
                <td className="px-4 py-4">
                  <div className="flex justify-end">
                    <Button size="sm" variant="outline" onClick={() => setSeleccionada(o)}>
                      Ver detalle
                    </Button>
                  </div>
                </td>
              </>
            )}
          />
        )}
      </Card>

      <div className="mt-6">
        <Pagination currentPage={pagina + 1} totalPages={totalPaginas} onPageChange={(p) => setPagina(p - 1)} />
      </div>

      {seleccionada && !reclamando && (
        <FormOverlay onClose={() => setSeleccionada(null)} maxWidth="max-w-3xl">
          <OrdenDetalle
            orden={seleccionada}
            nombreComprador={verComprador ? nombres[seleccionada.idComprador] : ""}
            estadosSiguientes={estadosSiguientesDe(seleccionada)}
            modoVenta={esVentas}
            usuarioId={usuarioId}
            puedeEditar={!esVentas && seleccionada.estadoOrden === "PENDIENTE" && (esAdmin || esDueno(seleccionada))}
            puedeCancelar={esAdmin && TRANSICIONES_ORDEN[seleccionada.estadoOrden].includes("CANCELADA")}
            puedeReclamar={
              !esVentas && seleccionada.estadoOrden !== "CANCELADA" && (esAdmin || esDueno(seleccionada))
            }
            puedeConfirmarRecepcion={
              modo === "compras" && seleccionada.estadoOrden === "ENVIADA" && esDueno(seleccionada)
            }
            puedeValorar={!esVentas && seleccionada.estadoOrden === "ENTREGADA" && esDueno(seleccionada)}
            onConfirmarRecepcion={() => confirmarRecepcion(seleccionada)}
            procesando={procesando}
            onEditar={() => navigate(`/compras/${seleccionada.id}/editar`)}
            onCambiarEstado={(nuevo) =>
              ejecutar(
                () => actualizarEstadoOrden(seleccionada.id, nuevo),
                `La compra pasó a ${etiqueta(ESTADOS_ORDEN, nuevo).toLowerCase()}.`
              )
            }
            onCancelar={() => setACancelar(seleccionada)}
            onReclamar={() => setReclamando(seleccionada)}
          />
        </FormOverlay>
      )}

      {reclamando && (
        <FormOverlay onClose={() => setReclamando(null)} maxWidth="max-w-xl">
          <ReclamoForm
            ordenInicial={reclamando}
            esAdmin={esAdmin}
            usuarioId={usuarioId}
            onCancelar={() => setReclamando(null)}
            onGuardado={() => {
              setReclamando(null);
              setSeleccionada(null);
              onReclamoCreado();
            }}
          />
        </FormOverlay>
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(aCancelar)}
        onClose={() => setACancelar(null)}
        elemento="esta compra (quedará cancelada)"
        loading={procesando}
        onConfirm={() =>
          ejecutar(async () => {
            // Primero se libera el stock apartado; si la orden ya se confirmó, el backend responde 409
            await liberarReserva(ORIGEN_RESERVA.ORDEN, aCancelar.id);
            await cancelarOrden(aCancelar.id);
          }, "La compra fue cancelada.")
        }
      />
    </>
  );
}
