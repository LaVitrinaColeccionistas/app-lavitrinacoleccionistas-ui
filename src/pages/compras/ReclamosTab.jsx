import { useEffect, useRef, useState } from "react";
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
  eliminarReclamo,
  obtenerOrden,
  obtenerReclamos,
  paginaDe,
} from "../../services/comprasService";
import { resolverError } from "../../utils/errores";
import ReclamoForm from "./ReclamoForm";
import {
  ESTADOS_RECLAMO,
  TIPOS_RECLAMO,
  etiqueta,
  formatearDinero,
  formatearFecha,
  nombreCompleto,
  resumenProductos,
  variantesReclamo,
} from "./opciones";

const POR_PAGINA = 10;

const resumenDeOrden = (orden) =>
  orden ? `${formatearFecha(orden.fechaOrden)} · ${resumenProductos(orden)} · ${formatearDinero(orden.montoTotal)}` : "-";

export default function ReclamosTab({ usuarioId, esAdmin, esGestor, puedeCrear, onMensaje }) {
  const navigate = useNavigate();
  const ordenesConocidas = useRef(new Map());

  const [reclamos, setReclamos] = useState([]);
  const [resumenes, setResumenes] = useState({});
  const [nombres, setNombres] = useState({});
  const [busqueda, setBusqueda] = useState("");
  const busquedaAplicada = useDebouncedValue(busqueda);
  const [estado, setEstado] = useState("");
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [recarga, setRecarga] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [formulario, setFormulario] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      try {
        setCargando(true);
        setError("");

        const data = await obtenerReclamos({
          page: pagina,
          size: POR_PAGINA,
          idComprador: esGestor ? undefined : usuarioId,
          estado,
          descripcion: busquedaAplicada.trim(),
        });
        if (cancelado) return;

        const { items, totalPaginas: paginas } = paginaDe(data);
        setReclamos(items);
        setTotalPaginas(paginas);

        const faltantes = [...new Set(items.map((r) => r.idOrden))].filter(
          (id) => !ordenesConocidas.current.has(id)
        );
        await Promise.all(
          faltantes.map((id) =>
            obtenerOrden(id)
              .then((orden) => ordenesConocidas.current.set(id, orden))
              .catch(() => null)
          )
        );
        if (cancelado) return;
        setResumenes(
          Object.fromEntries(items.map((r) => [r.idOrden, resumenDeOrden(ordenesConocidas.current.get(r.idOrden))]))
        );

        const ids = [...new Set(items.map((r) => r.idComprador))].filter((x) => x != null);
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
        if (!resolverError(err, navigate)) setError(err.message || "No fue posible cargar los reclamos.");
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, [pagina, estado, busquedaAplicada, usuarioId, esGestor, recarga, navigate]);

  const eliminar = async () => {
    try {
      setProcesando(true);
      setError("");
      await eliminarReclamo(aEliminar.id);
      setAEliminar(null);
      onMensaje("El reclamo fue eliminado.");
      setRecarga((n) => n + 1);
    } catch (err) {
      setAEliminar(null);
      if (!resolverError(err, navigate)) setError(err.message);
    } finally {
      setProcesando(false);
    }
  };

  const columnas = [
    { key: "compra", label: "COMPRA" },
    ...(esGestor ? [{ key: "comprador", label: "COMPRADOR" }] : []),
    { key: "tipo", label: "TIPO" },
    { key: "descripcion", label: "DESCRIPCIÓN" },
    { key: "estado", label: "ESTADO" },
    { key: "fecha", label: "FECHA" },
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
          placeholder="Buscar en la descripción del reclamo..."
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
            options={ESTADOS_RECLAMO}
          />
        </div>
        {puedeCrear && <Button onClick={() => setFormulario({ reclamo: null })}>+ Nuevo reclamo</Button>}
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
            data={reclamos}
            emptyMessage={
              busquedaAplicada || estado ? "No hay reclamos que coincidan con la búsqueda." : "Todavía no hay reclamos."
            }
            renderRow={(r) => (
              <>
                <td className="max-w-xs px-4 py-4 text-[#4B5563]">{resumenes[r.idOrden] ?? "-"}</td>
                {esGestor && <td className="px-4 py-4 text-[#4B5563]">{nombres[r.idComprador] ?? "-"}</td>}
                <td className="px-4 py-4 font-semibold text-[#1F2937]">{etiqueta(TIPOS_RECLAMO, r.tipoReclamo)}</td>
                <td className="max-w-xs truncate px-4 py-4 text-[#4B5563]" title={r.descripcion}>
                  {r.descripcion}
                </td>
                <td className="px-4 py-4">
                  <Badge variant={variantesReclamo[r.estado] ?? "neutral"}>{etiqueta(ESTADOS_RECLAMO, r.estado)}</Badge>
                </td>
                <td className="px-4 py-4 text-[#6B7280]">{formatearFecha(r.fechaCreacion)}</td>
                <td className="px-4 py-4">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => setFormulario({ reclamo: r })}>
                      {esAdmin || (!esGestor && r.estado === "ABIERTO") ? "Editar" : "Ver"}
                    </Button>
                    {esAdmin && (
                      <Button size="sm" variant="outlineDanger" onClick={() => setAEliminar(r)}>
                        Eliminar
                      </Button>
                    )}
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

      {formulario && (
        <FormOverlay onClose={() => setFormulario(null)} maxWidth="max-w-xl">
          <ReclamoForm
            reclamo={formulario.reclamo}
            resumenOrden={formulario.reclamo ? resumenes[formulario.reclamo.idOrden] : ""}
            esAdmin={esAdmin}
            usuarioId={usuarioId}
            soloLectura={esGestor && !esAdmin}
            onCancelar={() => setFormulario(null)}
            onGuardado={(mensaje) => {
              setFormulario(null);
              onMensaje(mensaje);
              setRecarga((n) => n + 1);
            }}
          />
        </FormOverlay>
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(aEliminar)}
        onClose={() => setAEliminar(null)}
        elemento="este reclamo"
        loading={procesando}
        onConfirm={eliminar}
      />
    </>
  );
}
