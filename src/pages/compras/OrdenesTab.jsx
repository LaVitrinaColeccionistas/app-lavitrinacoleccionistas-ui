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
import {
  actualizarEstadoOrden,
  cancelarOrden,
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

export default function OrdenesTab({ usuarioId, esAdmin, esGestor, onMensaje, onReclamoCreado }) {
  const navigate = useNavigate();

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
          idComprador: esGestor ? undefined : usuarioId,
          estadoOrden: estado,
          producto: busquedaAplicada.trim(),
        });
        if (cancelado) return;

        const { items, totalPaginas: paginas } = paginaDe(data);
        setOrdenes(items);
        setTotalPaginas(paginas);

        const ids = [...new Set(items.map((o) => o.idComprador))].filter((x) => x != null);
        if (esGestor && ids.length) {
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
  }, [pagina, estado, busquedaAplicada, usuarioId, esGestor, recarga, navigate]);

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
    ...(esGestor ? [{ key: "comprador", label: "COMPRADOR" }] : []),
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
              busquedaAplicada || estado ? "No hay compras que coincidan con la búsqueda." : "Todavía no hay compras."
            }
            renderRow={(o) => (
              <>
                <td className="px-4 py-4">
                  <p className="font-semibold text-[#1F2937]">{resumenProductos(o)}</p>
                  <p className="text-xs text-[#6B7280]">
                    {o.detalles?.length ?? 0} {(o.detalles?.length ?? 0) === 1 ? "producto" : "productos"}
                  </p>
                </td>
                {esGestor && <td className="px-4 py-4 text-[#4B5563]">{nombres[o.idComprador] ?? "-"}</td>}
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
            nombreComprador={esGestor ? nombres[seleccionada.idComprador] : ""}
            estadosSiguientes={
              esGestor ? TRANSICIONES_ORDEN[seleccionada.estadoOrden].filter((e) => e !== "CANCELADA") : []
            }
            puedeEditar={seleccionada.estadoOrden === "PENDIENTE" && (esAdmin || esDueno(seleccionada))}
            puedeCancelar={esAdmin && TRANSICIONES_ORDEN[seleccionada.estadoOrden].includes("CANCELADA")}
            puedeReclamar={seleccionada.estadoOrden !== "CANCELADA" && (esAdmin || esDueno(seleccionada))}
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
        onConfirm={() => ejecutar(() => cancelarOrden(aCancelar.id), "La compra fue cancelada.")}
      />
    </>
  );
}
