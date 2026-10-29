import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Table from "../../components/common/Table";
import {
  ESTADOS_ORDEN,
  METODOS_PAGO,
  etiqueta,
  formatearDinero,
  formatearFecha,
  variantesOrden,
} from "./opciones";

const columnas = [
  { key: "producto", label: "PRODUCTO" },
  { key: "cantidad", label: "CANTIDAD" },
  { key: "precio", label: "PRECIO UNIT.", className: "text-right" },
  { key: "subtotal", label: "SUBTOTAL", className: "text-right" },
];

export default function OrdenDetalle({
  orden,
  nombreComprador,
  estadosSiguientes = [],
  puedeEditar = false,
  puedeCancelar = false,
  puedeReclamar = false,
  procesando = false,
  onEditar,
  onCambiarEstado,
  onCancelar,
  onReclamar,
}) {
  return (
    <Card padding="lg">
      <div className="mb-5 pr-8">
        <h2 className="text-lg font-bold text-[#1F2937]">Detalle de la compra</h2>
        <p className="mt-1 text-sm text-[#6B7280]">Realizada el {formatearFecha(orden.fechaOrden)}</p>
      </div>

      <dl className="mb-5 grid gap-4 text-sm sm:grid-cols-3">
        {nombreComprador && (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#8B909A]">Comprador</dt>
            <dd className="mt-1 font-semibold text-[#1F2937]">{nombreComprador}</dd>
          </div>
        )}
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-[#8B909A]">Método de pago</dt>
          <dd className="mt-1 font-semibold text-[#1F2937]">{etiqueta(METODOS_PAGO, orden.metodoPago)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-[#8B909A]">Estado</dt>
          <dd className="mt-1">
            <Badge variant={variantesOrden[orden.estadoOrden] ?? "neutral"}>
              {etiqueta(ESTADOS_ORDEN, orden.estadoOrden)}
            </Badge>
          </dd>
        </div>
      </dl>

      <div className="overflow-hidden rounded-lg border border-[#ECEEF2]">
        <Table
          columns={columnas}
          data={orden.detalles ?? []}
          emptyMessage="Esta compra no tiene productos."
          renderRow={(d) => (
            <>
              <td className="px-4 py-3 font-semibold text-[#1F2937]">{d.nombreProductoSnapshot}</td>
              <td className="px-4 py-3 text-[#4B5563]">{d.cantidad}</td>
              <td className="px-4 py-3 text-right text-[#4B5563]">{formatearDinero(d.precioUnitarioHistorico)}</td>
              <td className="px-4 py-3 text-right font-bold text-[#1F2937]">{formatearDinero(d.subtotalItem)}</td>
            </>
          )}
        />
      </div>

      <dl className="ml-auto mt-4 w-full max-w-xs space-y-2 text-sm">
        <div className="flex justify-between text-[#4B5563]">
          <dt>Subtotal</dt>
          <dd>{formatearDinero(orden.montoSubtotal)}</dd>
        </div>
        <div className="flex justify-between text-[#4B5563]">
          <dt>Envío</dt>
          <dd>{formatearDinero(orden.costoEnvio)}</dd>
        </div>
        <div className="flex justify-between text-base font-bold text-[#1F2937]">
          <dt>Total</dt>
          <dd>{formatearDinero(orden.montoTotal)}</dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-[#ECEEF2] pt-5">
        {puedeCancelar && (
          <Button variant="outlineDanger" disabled={procesando} onClick={onCancelar}>
            Cancelar compra
          </Button>
        )}
        {estadosSiguientes.map((estado) => (
          <Button key={estado} variant="outline" loading={procesando} onClick={() => onCambiarEstado(estado)}>
            Marcar como {etiqueta(ESTADOS_ORDEN, estado).toLowerCase()}
          </Button>
        ))}
        {puedeReclamar && (
          <Button variant="outline" disabled={procesando} onClick={onReclamar}>
            Iniciar reclamo
          </Button>
        )}
        {puedeEditar && (
          <Button disabled={procesando} onClick={onEditar}>
            Editar compra
          </Button>
        )}
      </div>
    </Card>
  );
}
