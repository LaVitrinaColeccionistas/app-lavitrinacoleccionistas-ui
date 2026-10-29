import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Select from "../../components/common/Select";
import Textarea from "../../components/common/Textarea";
import { actualizarReclamo, crearReclamo, obtenerOrdenes } from "../../services/comprasService";
import { resolverError } from "../../utils/errores";
import {
  ESTADOS_RECLAMO,
  TIPOS_RECLAMO,
  formatearDinero,
  formatearFecha,
  resumenProductos,
} from "./opciones";

const MAXIMO = 1000;

const etiquetaOrden = (o) =>
  `${formatearFecha(o.fechaOrden)} · ${resumenProductos(o)} · ${formatearDinero(o.montoTotal)}`;

export default function ReclamoForm({
  reclamo,
  resumenOrden,
  ordenInicial,
  esAdmin,
  usuarioId,
  soloLectura = false,
  onCancelar,
  onGuardado,
}) {
  const navigate = useNavigate();
  const editando = Boolean(reclamo);
  const editable = !soloLectura && (!editando || esAdmin || reclamo.estado === "ABIERTO");

  const [ordenes, setOrdenes] = useState(ordenInicial ? [ordenInicial] : []);
  const [form, setForm] = useState({
    idOrden: ordenInicial ? String(ordenInicial.id) : "",
    tipoReclamo: reclamo?.tipoReclamo ?? "",
    descripcion: reclamo?.descripcion ?? "",
    estado: reclamo?.estado ?? "ABIERTO",
    respuesta: reclamo?.respuesta ?? "",
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (editando || ordenInicial) return undefined;
    let cancelado = false;

    async function cargarOrdenes() {
      try {
        const data = await obtenerOrdenes({
          size: 100,
          idComprador: esAdmin ? undefined : usuarioId,
        });
        if (!cancelado) {
          setOrdenes((data?.content ?? []).filter((o) => o.estadoOrden !== "CANCELADA"));
        }
      } catch (err) {
        if (cancelado) return;
        if (!resolverError(err, navigate)) setApiError(err.message || "No se pudieron cargar tus compras.");
      }
    }

    cargarOrdenes();
    return () => {
      cancelado = true;
    };
  }, [editando, ordenInicial, esAdmin, usuarioId, navigate]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = {};
    if (!editando && !form.idOrden) v.idOrden = "Seleccioná la compra";
    if (!form.tipoReclamo) v.tipoReclamo = "Seleccioná el tipo de reclamo";
    if (!form.descripcion.trim()) v.descripcion = "Describí el problema";
    else if (form.descripcion.length > MAXIMO) v.descripcion = `Máximo ${MAXIMO} caracteres`;
    if (form.respuesta.length > MAXIMO) v.respuesta = `Máximo ${MAXIMO} caracteres`;
    setErrors(v);
    if (Object.keys(v).length) return;

    setGuardando(true);
    setApiError("");
    try {
      if (editando) {
        await actualizarReclamo(reclamo.id, {
          tipoReclamo: form.tipoReclamo,
          descripcion: form.descripcion.trim(),
          ...(esAdmin && { estado: form.estado, respuesta: form.respuesta.trim() || undefined }),
        });
        onGuardado("Reclamo actualizado correctamente.");
      } else {
        const orden = ordenes.find((o) => String(o.id) === form.idOrden);
        await crearReclamo({
          idOrden: orden.id,
          idComprador: orden.idComprador,
          tipoReclamo: form.tipoReclamo,
          descripcion: form.descripcion.trim(),
        });
        onGuardado("Reclamo registrado correctamente.");
      }
    } catch (err) {
      if (!resolverError(err, navigate)) setApiError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const titulo = !editando ? "Nuevo reclamo" : editable ? "Editar reclamo" : "Detalle del reclamo";

  return (
    <Card padding="lg">
      <h2 className="mb-5 pr-8 text-lg font-bold text-[#1F2937]">{titulo}</h2>

      {apiError && (
        <Alert variant="danger" className="mb-4" onClose={() => setApiError("")}>
          {apiError}
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {editando ? (
          <div>
            <p className="mb-1.5 text-sm font-semibold text-[#374151]">Compra</p>
            <p className="rounded-lg border border-[#E5E7EB] bg-[#FAFAFC] px-3.5 py-2.5 text-sm text-[#4B5563]">
              {resumenOrden || "-"}
            </p>
          </div>
        ) : (
          <Select
            label="Compra"
            name="idOrden"
            value={form.idOrden}
            onChange={handleChange}
            disabled={Boolean(ordenInicial)}
            placeholder="Seleccioná la compra a reclamar"
            options={ordenes.map((o) => ({ value: String(o.id), label: etiquetaOrden(o) }))}
            error={errors.idOrden}
            required
          />
        )}

        <Select
          label="Tipo de reclamo"
          name="tipoReclamo"
          value={form.tipoReclamo}
          onChange={handleChange}
          disabled={!editable}
          placeholder="Seleccioná el motivo"
          options={TIPOS_RECLAMO}
          error={errors.tipoReclamo}
          required
        />

        <Textarea
          label="Descripción"
          name="descripcion"
          value={form.descripcion}
          onChange={handleChange}
          disabled={!editable}
          rows={5}
          maxLength={MAXIMO}
          showCount
          placeholder="Contanos qué pasó con tu compra"
          error={errors.descripcion}
          required
        />

        {editando && esAdmin && (
          <>
            <Select
              label="Estado"
              name="estado"
              value={form.estado}
              onChange={handleChange}
              options={ESTADOS_RECLAMO}
            />
            <Textarea
              label="Respuesta"
              name="respuesta"
              value={form.respuesta}
              onChange={handleChange}
              rows={4}
              maxLength={MAXIMO}
              showCount
              placeholder="Respuesta para el comprador"
              error={errors.respuesta}
            />
          </>
        )}

        {editando && !esAdmin && reclamo.respuesta && (
          <div>
            <p className="mb-1.5 text-sm font-semibold text-[#374151]">Respuesta</p>
            <p className="rounded-lg border border-[#E5E7EB] bg-[#F5F3FF] px-3.5 py-2.5 text-sm text-[#4B5563]">
              {reclamo.respuesta}
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <Button variant="outline" fullWidth onClick={onCancelar}>
            {editable ? "Cancelar" : "Cerrar"}
          </Button>
          {editable && (
            <Button type="submit" fullWidth loading={guardando}>
              {editando ? "Guardar cambios" : "Registrar reclamo"}
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
