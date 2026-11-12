import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import Alert from "../../components/common/Alert";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import ConfirmActionModal from "../../components/common/ConfirmActionModal";
import Input from "../../components/common/Input";
import Pagination from "../../components/common/Pagination";
import Select from "../../components/common/Select";
import Table from "../../components/common/Table";
import { useAuth } from "../../context/AuthContext";
import useDebouncedValue from "../../hooks/useDebouncedValue";
import useNombres from "../../hooks/useNombres";
import {
  ORIGEN_RESERVA,
  crearOferta,
  obtenerOfertas,
  obtenerPublicacion,
  obtenerReservas,
  reasignarReserva,
} from "../../services/catalogoService";
import { actualizarEstadoOrden, cancelarOrden, crearOrden } from "../../services/comprasService";
import { METODOS_PAGO } from "../compras/opciones";
import { esOfertable, porcentajeDe, precioTotal, unidadesDelLote } from "../../utils/precios";
import {
  formatearDinero,
  formatearFecha,
  imagenDePublicacion,
} from "../vendedor/opciones";

const POR_PAGINA = 8;

const ESTADOS = {
  PENDIENTE: { label: "Pendiente", variant: "warning" },
  ACEPTADA: { label: "Oferta aceptada", variant: "success" },
  RECHAZADA: { label: "Oferta rechazada", variant: "danger" },
  EXPIRADA: { label: "Expirada", variant: "neutral" },
};

const filtrosVacios = { precioMin: "", precioMax: "", fechaMin: "", fechaMax: "" };

const soloDigitos = (v) => v.replace(/\D/g, "");
const dia = (f) => (f ? String(f).slice(0, 10) : "");

function Miniatura({ src }) {
  return src ? (
    <img src={src} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover" />
  ) : (
    <div className="h-10 w-10 shrink-0 rounded-md bg-[#F6F6F8]" />
  );
}

export default function OfertasPage() {
  const { usuarioId } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const idPublicacion = searchParams.get("publicacion");

  // Formulario
  const [pub, setPub] = useState(null);
  const [monto, setMonto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [errorForm, setErrorForm] = useState("");
  const [exito, setExito] = useState("");

  // Lista de ofertas enviadas
  const [ofertas, setOfertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorLista, setErrorLista] = useState("");
  const [filtros, setFiltros] = useState(filtrosVacios);
  const filtrosAplicados = useDebouncedValue(filtros);
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const pedido = useRef(0); // solo se aplica la respuesta del último pedido

  const nombreDe = useNombres(ofertas.map((o) => o.idVendedor));

  // Pago de una oferta aceptada
  const navigate = useNavigate();
  const [aPagar, setAPagar] = useState(null);
  const [metodoPago, setMetodoPago] = useState(METODOS_PAGO[0].value);
  const [pagando, setPagando] = useState(false);

  useEffect(() => {
    if (!idPublicacion) return undefined;

    let cancelado = false;
    obtenerPublicacion(idPublicacion)
      .then((data) => !cancelado && setPub(data))
      .catch(
        (err) =>
          !cancelado &&
          setErrorForm(err.message || "No se pudo cargar la publicación.")
      );

    return () => {
      cancelado = true;
    };
  }, [idPublicacion]);

  const pubVisible = idPublicacion ? pub : null;

  /* Ofertas enviadas por el comprador (página y filtros los resuelve el servidor) + su publicación */
  const cargarOfertas = useCallback(async () => {
    if (!usuarioId) return;
    const actual = ++pedido.current;

    try {
      setCargando(true);
      setErrorLista("");

      const data = await obtenerOfertas({
        idComprador: usuarioId,
        page: pagina,
        size: POR_PAGINA,
        montoMin: filtrosAplicados.precioMin,
        montoMax: filtrosAplicados.precioMax,
        fechaDesde: filtrosAplicados.fechaMin,
        fechaHasta: filtrosAplicados.fechaMax,
      });
      const lista = data?.content ?? [];

      const ids = [...new Set(lista.map((o) => o.idPublicacion))];
      // La oferta sigue ACEPTADA después de pagarla: lo que dice si aún se puede pagar es su reserva.
      // RESERVADA = pendiente de pago; sin reservas = ya pasó a una orden; LIBERADA = venció.
      const [pubs, reservasAceptadas] = await Promise.all([
        Promise.all(ids.map((id) => obtenerPublicacion(id).catch(() => null))),
        Promise.all(
          lista
            .filter((o) => o.estadoOferta === "ACEPTADA")
            .map((o) =>
              obtenerReservas(ORIGEN_RESERVA.OFERTA, o.id)
                .then((rs) => [o.id, rs ?? []])
                .catch(() => [o.id, null])
            )
        ),
      ]);
      if (actual !== pedido.current) return;
      const reservasDe = new Map(reservasAceptadas);
      const pagoDe = (o) => {
        if (o.estadoOferta !== "ACEPTADA") return null;
        const rs = reservasDe.get(o.id);
        if (rs == null) return "PENDIENTE"; // no se pudo consultar: se valida al pagar
        if (rs.some((r) => r.estadoReserva === "RESERVADA")) return "PENDIENTE";
        return rs.length === 0 ? "EN_COMPRAS" : "VENCIDA";
      };

      const porId = Object.fromEntries(
        pubs.filter(Boolean).map((p) => [p.id, p])
      );

      setTotalPaginas(data?.totalPages ?? 0);
      setOfertas(
        lista.map((o) => ({
          ...o,
          pago: pagoDe(o),
          idVendedor: porId[o.idPublicacion]?.idVendedor,
          titulo: porId[o.idPublicacion]?.titulo ?? "Publicación no disponible",
          imagen: imagenDePublicacion(porId[o.idPublicacion]),
          valorLote: precioTotal(porId[o.idPublicacion]),
        }))
      );
    } catch (err) {
      if (actual !== pedido.current) return;
      console.error(err);
      setErrorLista(err.message || "No fue posible cargar tus ofertas.");
    } finally {
      if (actual === pedido.current) setCargando(false);
    }
  }, [usuarioId, pagina, filtrosAplicados]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { cargarOfertas(); }, [cargarOfertas]);

  const hayFiltros = Object.values(filtros).some((v) => v !== "");

  const cambiarFiltro = (e) => {
    setFiltros((f) => ({ ...f, [e.target.name]: e.target.value }));
    setPagina(0);
  };

  /* Envío de la oferta */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorForm("");
    setExito("");

    if (!pubVisible) {
      return setErrorForm("Elegí una publicación del catálogo para hacer tu oferta.");
    }
    if (pubVisible.estadoPublicacion !== "ACTIVA") {
      return setErrorForm("Esta publicación ya no está disponible.");
    }
    if (pubVisible.idVendedor === usuarioId) {
      return setErrorForm("No podés ofertar en tu propia publicación.");
    }
    if (!esOfertable(pubVisible)) {
      return setErrorForm(
        "Esta publicación tiene unidades reservadas. La oferta es por el lote completo, probá más tarde."
      );
    }

    const valor = Number(monto);
    if (!valor || valor <= 0) {
      return setErrorForm("Ingresá un monto mayor a cero.");
    }

    try {
      setEnviando(true);

      await crearOferta({
        idPublicacion: pubVisible.id,
        idComprador: usuarioId,
        montoOfertado: valor,
      });

      setExito("Oferta enviada. El vendedor la evaluará.");
      setMonto("");
      setPub(null);
      setSearchParams({}, { replace: true });
      if (pagina === 0) await cargarOfertas();
      else setPagina(0);
    } catch (err) {
      setErrorForm(err.message || "No fue posible enviar la oferta.");
    } finally {
      setEnviando(false);
    }
  };

  /*
   * Oferta aceptada -> orden de compra. Las unidades ya están reservadas para vos desde que el
   * vendedor aceptó: se crea la orden con esas cantidades y la reserva pasa a ser de la orden.
   * Si la reserva venció, la orden recién creada se cancela.
   */
  const pagarOferta = async () => {
    if (!aPagar) return;
    try {
      setPagando(true);
      setErrorLista("");

      const todas = await obtenerReservas(ORIGEN_RESERVA.OFERTA, aPagar.id);
      const reservas = todas.filter((r) => r.estadoReserva === "RESERVADA");
      if (!reservas.length) {
        const mensaje = todas.length
          ? "La reserva de esta oferta venció."
          : "Esta oferta ya tiene una compra registrada. Revisala en Mis compras.";
        throw Object.assign(new Error(mensaje), { status: 409 });
      }

      const orden = await crearOrden({
        idComprador: usuarioId,
        metodoPago,
        detalles: reservas.map((r) => ({
          idProducto: r.idProducto,
          idPublicacion: aPagar.idPublicacion,
          cantidad: r.cantidad,
        })),
      });

      try {
        await reasignarReserva(ORIGEN_RESERVA.OFERTA, aPagar.id, ORIGEN_RESERVA.ORDEN, orden.id);
      } catch (err) {
        await actualizarEstadoOrden(orden.id, "CANCELADA")
          .catch(() => cancelarOrden(orden.id))
          .catch(() => {});
        throw err;
      }

      setAPagar(null);
      navigate("/compras", { state: { mensaje: "Compra registrada a partir de tu oferta." } });
    } catch (err) {
      console.error(err);
      setAPagar(null);
      setErrorLista(err.message || "No fue posible registrar la compra.");
      await cargarOfertas();
    } finally {
      setPagando(false);
    }
  };

  const columnas = [
    { key: "articulo", label: "Artículo" },
    { key: "vendedor", label: "Vendedor" },
    { key: "oferta", label: "Tu Oferta" },
    { key: "estado", label: "Estado" },
    { key: "fecha", label: "Fecha" },
    { key: "accion", label: "" },
  ];

  // La oferta es por el lote completo: se compara contra su valor total
  const valorLote = precioTotal(pubVisible);
  const porcentaje = porcentajeDe(monto, valorLote);
  const unidades = unidadesDelLote(pubVisible);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="grid items-start gap-6 lg:grid-cols-[380px_1fr]">
        {/* ───────── HACER UNA OFERTA ───────── */}
        <Card
          title="Hacer una Oferta"
          subtitle="Proponé un precio inferior. El vendedor evaluará tu propuesta."
        >
          {exito && (
            <Alert variant="success" className="mb-4" onClose={() => setExito("")}>
              {exito}
            </Alert>
          )}
          {errorForm && (
            <Alert variant="danger" className="mb-4" onClose={() => setErrorForm("")}>
              {errorForm}
            </Alert>
          )}

          {pubVisible ? (
            <div className="mb-5 flex items-center gap-3 rounded-lg bg-[#F6F6F8] p-3">
              <Miniatura src={imagenDePublicacion(pubVisible)} />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#1F2937]">
                  {pubVisible.titulo}
                </p>
                {valorLote != null && (
                  <p className="text-xs text-[#6B7280]">
                    Valor de referencia del lote: {formatearDinero(valorLote)}
                    {unidades > 1 && ` (${unidades} unidades)`}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="mb-5 rounded-lg bg-[#F6F6F8] p-3 text-sm text-[#6B7280]">
              Elegí un artículo desde el{" "}
              <Link to="/catalogo" className="font-semibold text-[#5146E5] underline">
                catálogo
              </Link>{" "}
              y presioná &ldquo;Hacer oferta&rdquo;.
            </p>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Input
              label="Monto Ofrecido (Gs.)"
              name="monto"
              inputMode="numeric"
              placeholder="0"
              value={monto ? Number(monto).toLocaleString("es-PY") : ""}
              onChange={(e) => setMonto(soloDigitos(e.target.value))}
              disabled={!pubVisible}
            />
            {porcentaje != null && (
              <p
                className={`-mt-2 text-xs ${
                  porcentaje < 50 ? "text-[#B45309]" : "text-[#6B7280]"
                }`}
              >
                Tu oferta: {formatearDinero(Number(monto))} ({porcentaje} % del valor del lote)
                {porcentaje < 50 && " · Es una oferta baja, es probable que el vendedor la rechace."}
                {porcentaje > 100 && " · Supera el valor de referencia."}
              </p>
            )}

            <Button type="submit" fullWidth loading={enviando} disabled={!pubVisible}>
              Enviar Oferta y Confirmar
            </Button>
          </form>
        </Card>

        {/* ───────── MIS OFERTAS ENVIADAS ───────── */}
        <Card title="Mis Ofertas Enviadas">
          {errorLista && (
            <Alert variant="danger" className="mb-4" onClose={() => setErrorLista("")}>
              {errorLista}
            </Alert>
          )}

          <div className="mb-5 grid gap-4 rounded-lg border border-[#E5E7EB] p-4 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase text-[#4B5563]">
                Rango de precio
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Input name="precioMin" type="number" min="0" placeholder="Min"
                  value={filtros.precioMin} onChange={cambiarFiltro} />
                <Input name="precioMax" type="number" min="0" placeholder="Max"
                  value={filtros.precioMax} onChange={cambiarFiltro} />
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase text-[#4B5563]">
                Rango de fecha
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Input name="fechaMin" type="date"
                  value={filtros.fechaMin} onChange={cambiarFiltro} />
                <Input name="fechaMax" type="date"
                  value={filtros.fechaMax} onChange={cambiarFiltro} />
              </div>
            </div>
          </div>

          {cargando ? (
            <p className="py-12 text-center text-sm text-[#6B7280]">Cargando...</p>
          ) : (
            <Table
              columns={columnas}
              data={ofertas}
              emptyMessage={
                hayFiltros ? "Ninguna oferta coincide con los filtros." : "Todavía no enviaste ofertas."
              }
              renderRow={(o) => (
                <>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <Miniatura src={o.imagen} />
                      <span className="font-semibold text-[#1F2937]">{o.titulo}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-[#4B5563]">
                    {o.idVendedor != null ? nombreDe(o.idVendedor, "Vendedor") : "-"}
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-bold text-[#1F2937]">{formatearDinero(o.montoOfertado)}</span>
                    {porcentajeDe(o.montoOfertado, o.valorLote) != null && (
                      <span className="block text-xs text-[#6B7280]">
                        {porcentajeDe(o.montoOfertado, o.valorLote)} % de {formatearDinero(o.valorLote)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant={ESTADOS[o.estadoOferta]?.variant ?? "neutral"}>
                      {ESTADOS[o.estadoOferta]?.label ?? o.estadoOferta}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-[#6B7280]">
                    {formatearFecha(o.fechaOferta)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    {o.pago === "PENDIENTE" && (
                      <Button size="sm" variant="success" onClick={() => setAPagar(o)}>
                        Pagar
                      </Button>
                    )}
                    {o.pago === "EN_COMPRAS" && (
                      <span className="text-xs font-medium text-[#6B7280]">Compra registrada</span>
                    )}
                    {o.pago === "VENCIDA" && (
                      <span className="text-xs font-medium text-[#DC2626]">Reserva vencida</span>
                    )}
                  </td>
                </>
              )}
            />
          )}

          <div className="mt-5">
            <Pagination
              currentPage={pagina + 1}
              totalPages={totalPaginas}
              onPageChange={(p) => setPagina(p - 1)}
            />
          </div>
        </Card>
      </div>
      <ConfirmActionModal
        isOpen={Boolean(aPagar)}
        onClose={() => !pagando && setAPagar(null)}
        onConfirm={pagarOferta}
        title="Pagar oferta aceptada"
        confirmLabel="Registrar compra"
        confirmVariant="success"
        loading={pagando}
        message={
          aPagar
            ? `Vas a comprar "${aPagar.titulo}" por ${formatearDinero(aPagar.montoOfertado)}. Las unidades están reservadas para vos hasta que venza la oferta.`
            : ""
        }
      >
        <Select
          label="Método de pago"
          name="metodoPago"
          value={metodoPago}
          onChange={(e) => setMetodoPago(e.target.value)}
          options={METODOS_PAGO}
        />
      </ConfirmActionModal>
    </div>
  );
}