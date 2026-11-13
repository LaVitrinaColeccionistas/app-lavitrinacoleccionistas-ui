import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import Alert from "../../components/common/Alert";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import ConfirmActionModal from "../../components/common/ConfirmActionModal";
import FormOverlay from "../../components/common/FormOverlay";
import Pagination from "../../components/common/Pagination";
import Select from "../../components/common/Select";
import Table from "../../components/common/Table";
import Breadcrumb from "../../components/layout/Breadcrumb";
import {
  ORIGEN_RESERVA,
  aceptarOferta,
  actualizarEstadoPublicacion,
  confirmarReserva,
  eliminarProducto,
  liberarReserva,
  obtenerPublicacion,
  eliminarPublicacion,
  obtenerOfertas,
  obtenerProductos,
  obtenerPublicaciones,
  rechazarOferta,
} from "../../services/catalogoService";
import { actualizarEstadoOrden, obtenerOrdenes } from "../../services/comprasService";
import NuevoProductoPage from "./NuevoProductoPage";
import { getUserId } from "../../utils/session";
import useNombres from "../../hooks/useNombres";
import { formatearDinero, formatearFecha, imagenDePublicacion } from "./opciones";
import { ESTADOS_ORDEN, etiqueta, variantesOrden } from "../compras/opciones";
import { porcentajeDe, precioTotal } from "../../utils/precios";

const POR_PAGINA = 10;

/** " (83 % del lote de Gs. 300.000)" o "" si no hay valor de referencia. */
const textoPorcentaje = (o) => {
  const pct = porcentajeDe(o.montoOfertado, o.valorLote);
  return pct == null ? "" : ` (${pct} % del lote de ${formatearDinero(o.valorLote)})`;
};

const variantesOferta = { PENDIENTE: "warning", ACEPTADA: "success", RECHAZADA: "danger", EXPIRADA: "neutral" };
const variantesPublicacion = { ACTIVA: "success", PAUSADA: "warning", VENDIDA: "info", ELIMINADA: "neutral" };

const capitalizar = (s) => (s ? s.charAt(0) + s.slice(1).toLowerCase() : "-");
const paginar = (lista, pagina) => lista.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA);

// Listados paginados por el servidor
const PAGINA_VACIA = { items: [], total: 0, totalPaginas: 0 };
const paginaDe = (data) => ({
  items: data?.content ?? [],
  total: data?.totalElements ?? 0,
  totalPaginas: data?.totalPages ?? 0,
});
// Conteo sin traer el listado: una página de 1 elemento y se lee totalElements
const totalDe = (promesa) => promesa.then((d) => d?.totalElements ?? 0).catch(() => 0);

const TODAS = "TODAS";
const FILTRO_ESTADO_OFERTA = [
  { value: TODAS, label: "Todos los estados" },
  { value: "PENDIENTE", label: "Pendientes" },
  { value: "ACEPTADA", label: "Aceptadas" },
  { value: "RECHAZADA", label: "Rechazadas" },
  { value: "EXPIRADA", label: "Expiradas" },
];

function Miniatura({ src, alt = "" }) {
  return src ? (
    <img src={src} alt={alt} className="h-10 w-10 shrink-0 rounded-md object-cover" />
  ) : (
    <div className="h-10 w-10 shrink-0 rounded-md bg-[#F6F6F8]" />
  );
}

function Stat({ label, value, hint, valueClass = "text-[#1F2937]", hintClass = "text-[#6B7280]" }) {
  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#4B5563]">{label}</p>
      <p className={`mt-3 text-3xl font-bold ${valueClass}`}>{value}</p>
      <p className={`mt-1 text-xs ${hintClass}`}>{hint}</p>
    </Card>
  );
}

// Flujo de la orden: PENDIENTE → PAGADA → ENVIADA → ENTREGADA (o CANCELADA desde PENDIENTE).
// Cada avance confirma la reserva (idempotente): la primera vez descuenta el stock y las
// siguientes solo verifican que la reserva siga CONFIRMADA.
const PASOS_ORDEN = ["PENDIENTE", "PAGADA", "ENVIADA", "ENTREGADA"];

const SIGUIENTE_ESTADO = {
  PENDIENTE: {
    estado: "PAGADA",
    boton: "Pagada",
    variante: "success",
    detalle: "Se confirma la reserva: se descuenta el stock y, si la publicación se queda sin cantidad, pasa a VENDIDA. Después ya no se podrá cancelar.",
  },
  PAGADA: { estado: "ENVIADA", boton: "Enviada", variante: "info", detalle: "La orden pasará a ENVIADA." },
  ENVIADA: { estado: "ENTREGADA", boton: "Entregada", variante: "primary", detalle: "La orden pasará a ENTREGADA y quedará cerrada." },
};

// Solo antes del pago: después de confirmar la reserva el stock ya se descontó y no se puede liberar
const PUEDE_CANCELAR = ["PENDIENTE"];

// Botones según el estado: Cancelar (solo PENDIENTE) y el siguiente paso del flujo
function AccionesOrden({ orden, ocupado, onAccion }) {
  const sig = SIGUIENTE_ESTADO[orden.estadoOrden];
  return (
    <>
      {PUEDE_CANCELAR.includes(orden.estadoOrden) && (
        <Button size="sm" variant="outlineDanger" disabled={ocupado}
          onClick={() => onAccion({ tipo: "cancelarOrden", data: orden })}>
          Cancelar
        </Button>
      )}
      {sig && (
        <Button size="sm" variant={sig.variante} loading={ocupado}
          onClick={() => onAccion({ tipo: "avanzarOrden", data: orden })}>
          {sig.boton}
        </Button>
      )}
    </>
  );
}

function PasosOrden({ estado }) {
  if (estado === "CANCELADA") {
    return (
      <p className="rounded-lg bg-[#F3F4F6] px-3 py-2 text-sm text-[#4B5563]">
        Orden cancelada. Las reservas se liberaron y el stock volvió a estar disponible.
      </p>
    );
  }
  const actual = PASOS_ORDEN.indexOf(estado);
  return (
    <ol className="flex items-center gap-2">
      {PASOS_ORDEN.map((paso, i) => (
        <li key={paso} className="flex flex-1 items-center gap-2">
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              i <= actual ? "bg-[#5146E5] text-white" : "bg-[#E5E7EB] text-[#6B7280]"
            }`}
          >
            {i + 1}
          </span>
          <span className={`text-xs font-semibold ${i <= actual ? "text-[#1F2937]" : "text-[#9CA3AF]"}`}>
            {etiqueta(ESTADOS_ORDEN, paso)}
          </span>
          {i < PASOS_ORDEN.length - 1 && (
            <span className={`h-0.5 flex-1 ${i < actual ? "bg-[#5146E5]" : "bg-[#E5E7EB]"}`} />
          )}
        </li>
      ))}
    </ol>
  );
}

const TIPO_VENTA = { PRECIO_FIJO: "Precio fijo", OFERTA_LIBRE: "Subasta" };

function Dato({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">{label}</dt>
      <dd className="mt-0.5 text-sm text-[#1F2937]">{children ?? "-"}</dd>
    </div>
  );
}

/* Detalle de la publicación (productos, cantidades y precios) cargado por id */
function PublicacionResumen({ id }) {
  const [pub, setPub] = useState(null);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    let cancelado = false;
    obtenerPublicacion(id)
      .then((p) => !cancelado && setPub(p))
      .catch(() => !cancelado && setFallo(true));
    return () => { cancelado = true; };
  }, [id]);

  if (fallo) return <p className="text-sm text-[#6B7280]">La publicación fue eliminada. Los ítems vendidos se muestran arriba.</p>;
  if (!pub) return <p className="text-sm text-[#6B7280]">Cargando publicación...</p>;

  return (
    <div className="rounded-lg border border-[#E5E7EB] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-[#1F2937]">{pub.titulo}</p>
        <div className="flex gap-2">
          <Badge variant="primary">{TIPO_VENTA[pub.tipoVenta] ?? pub.tipoVenta}</Badge>
          <Badge variant={variantesPublicacion[pub.estadoPublicacion] ?? "neutral"}>{capitalizar(pub.estadoPublicacion)}</Badge>
        </div>
      </div>
      {pub.descripcion && <p className="mt-2 text-sm text-[#4B5563]">{pub.descripcion}</p>}
      <ul className="mt-3 divide-y divide-[#E5E7EB]">
        {(pub.detalles ?? []).map((d) => (
          <li key={d.id} className="flex items-center gap-3 py-2">
            <Miniatura src={d.producto?.urlImagen} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#1F2937]">{d.producto?.nombre}</p>
              <p className="text-xs text-[#6B7280]">
                {d.producto?.categoria}{d.producto?.rareza ? ` · ${d.producto.rareza}` : ""}
              </p>
            </div>
            <p className="text-sm text-[#4B5563]">{d.cantidadPublicada} × {formatearDinero(d.precioUnitario)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

const TABS = [
  { id: "ofertas", label: "Ofertas recibidas" },
  { id: "ordenes", label: "Órdenes" },
  { id: "publicaciones", label: "Publicaciones" },
  { id: "productos", label: "Productos" },
];

export default function PanelVendedorPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const idVendedor = getUserId();

  const [tab, setTab] = useState(state?.tab ?? "ofertas");
  // Página (0-based) de cada pestaña
  const [paginas, setPaginas] = useState({ ofertas: 0, ordenes: 0, publicaciones: 0, productos: 0 });
  const pagina = paginas[tab];
  const irAPagina = (idTab, n) => setPaginas((p) => ({ ...p, [idTab]: n }));
  const [publicaciones, setPublicaciones] = useState(PAGINA_VACIA);
  const [ofertas, setOfertas] = useState(PAGINA_VACIA);
  const [estadoOferta, setEstadoOferta] = useState(TODAS);
  const [resumen, setResumen] = useState({ activas: 0, pausadas: 0, vendidas: 0, pendientes: 0 });
  const [ventas, setVentas] = useState([]);
  const [productoForm, setProductoForm] = useState(null); // null = cerrado, {} = alta, ProductoDTO = edición
  const [recargaProductos, setRecargaProductos] = useState(0);
  const [detalle, setDetalle] = useState(null); // { tipo: "oferta" | "orden", data }
  const [productos, setProductos] = useState({ items: [], total: 0, totalPaginas: 0 });
  const [cargando, setCargando] = useState({ ofertas: true, ordenes: true, publicaciones: true });
  const [procesando, setProcesando] = useState(null); // id en acción
  const [accion, setAccion] = useState(null); // acción pendiente de confirmar en modal: { tipo, data }
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState(state?.mensaje ?? "");

  const nombreDe = useNombres([...ofertas.items.map((o) => o.idComprador), ...ventas.map((v) => v.idComprador)]);

  const marcarCarga = (idTab, valor) => setCargando((c) => ({ ...c, [idTab]: valor }));

  /* Tarjetas de resumen: solo conteos */
  const cargarResumen = useCallback(async () => {
    if (!idVendedor) return;
    const contarPubs = (estadoPublicacion) =>
      totalDe(obtenerPublicaciones({ idVendedor, estadoPublicacion, size: 1 }));
    const [activas, pausadas, vendidas, pendientes] = await Promise.all([
      contarPubs("ACTIVA"),
      contarPubs("PAUSADA"),
      contarPubs("VENDIDA"),
      totalDe(obtenerOfertas({ idVendedor, estadoOferta: "PENDIENTE", size: 1 })),
    ]);
    setResumen({ activas, pausadas, vendidas, pendientes });
  }, [idVendedor]);

  /* Ofertas recibidas: paginación del servidor + datos de la publicación de cada fila */
  const cargarOfertas = useCallback(async () => {
    if (!idVendedor) return;
    try {
      marcarCarga("ofertas", true);
      const pag = paginaDe(
        await obtenerOfertas({
          idVendedor,
          estadoOferta: estadoOferta === TODAS ? undefined : estadoOferta,
          page: paginas.ofertas,
          size: POR_PAGINA,
        })
      );
      const ids = [...new Set(pag.items.map((o) => o.idPublicacion))];
      const pubs = await Promise.all(ids.map((id) => obtenerPublicacion(id).catch(() => null)));
      const porId = Object.fromEntries(pubs.filter(Boolean).map((p) => [p.id, p]));
      setOfertas({
        ...pag,
        items: pag.items.map((o) => {
          const p = porId[o.idPublicacion];
          return {
            ...o,
            tituloPublicacion: p?.titulo ?? "Publicación eliminada",
            imagen: imagenDePublicacion(p),
            valorLote: precioTotal(p),
          };
        }),
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "No fue posible cargar las ofertas recibidas.");
    } finally {
      marcarCarga("ofertas", false);
    }
  }, [idVendedor, paginas.ofertas, estadoOferta]);

  /* Publicaciones: paginación del servidor (el back ya excluye las ELIMINADAS) */
  const cargarPublicaciones = useCallback(async () => {
    if (!idVendedor) return;
    try {
      marcarCarga("publicaciones", true);
      setPublicaciones(
        paginaDe(
          await obtenerPublicaciones({
            idVendedor,
            estadoPublicacion: null,
            page: paginas.publicaciones,
            size: POR_PAGINA,
          })
        )
      );
    } catch (err) {
      console.error(err);
      setError(err.message || "No fue posible cargar tus publicaciones.");
    } finally {
      marcarCarga("publicaciones", false);
    }
  }, [idVendedor, paginas.publicaciones]);

  /*
   * Ventas: órdenes con ítems míos. Se identifican por producto o, de respaldo, por publicación
   * (si el producto fue dado de baja). El MS de compras ya devuelve solo las órdenes del vendedor;
   * se pagina en el navegador.
   */
  const cargarVentas = useCallback(async () => {
    if (!idVendedor) return;
    try {
      marcarCarga("ordenes", true);
      const [ords, prods, pubs] = await Promise.all([
        obtenerOrdenes({ page: 0, size: 100, idVendedor }),
        obtenerProductos({ idVendedor, size: 100 }).catch(() => null),
        obtenerPublicaciones({ idVendedor, estadoPublicacion: null, size: 100 }).catch(() => null),
      ]);
      const idsProductos = new Set((prods?.content ?? []).map((p) => p.id));
      const idsPropios = new Set((pubs?.content ?? []).map((p) => p.id));
      setVentas(
        (ords?.content ?? [])
          .map((o) => {
            const mios = (o.detalles ?? []).filter(
              (d) => idsProductos.has(d.idProducto) || idsPropios.has(d.idPublicacion)
            );
            return {
              ...o,
              mios,
              subtotalMio: mios.reduce((acc, d) => acc + Number(d.subtotalItem ?? 0), 0),
            };
          })
          .filter((o) => o.mios.length > 0)
          // Número correlativo para mostrar (el id real solo se usa en las llamadas al back)
          .map((o, i) => ({ ...o, numero: i + 1 }))
      );
    } catch (e) {
      console.error(e);
      setVentas([]);
    } finally {
      marcarCarga("ordenes", false);
    }
  }, [idVendedor]);

  /* Productos: paginación del servidor */
  const cargarProductos = useCallback(async () => {
    if (!idVendedor) return;
    try {
      setProductos(paginaDe(await obtenerProductos({ idVendedor, page: paginas.productos, size: POR_PAGINA })));
    } catch (err) {
      setError(err.message || "No fue posible cargar tus productos.");
    }
  }, [idVendedor, paginas.productos, recargaProductos]); // eslint-disable-line react-hooks/exhaustive-deps

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => { cargarResumen(); }, [cargarResumen]);
  useEffect(() => { cargarOfertas(); }, [cargarOfertas]);
  useEffect(() => { cargarPublicaciones(); }, [cargarPublicaciones]);
  useEffect(() => { cargarVentas(); }, [cargarVentas]);

  // Si la página actual quedó vacía (p. ej. se eliminó su último registro), retrocede a la última
  const paginado = { ofertas, publicaciones, productos }[tab];
  useEffect(() => {
    if (paginado && pagina > 0 && pagina >= paginado.totalPaginas) {
      irAPagina(tab, Math.max(0, paginado.totalPaginas - 1));
    }
  }, [tab, pagina, paginado]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const recargar = () =>
    Promise.all([cargarResumen(), cargarOfertas(), cargarPublicaciones(), cargarVentas(), cargarProductos()]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { cargarProductos(); }, [cargarProductos]);

  const cambiarTab = (id) => {
    setTab(id);
    irAPagina(id, 0);
    setMensaje("");
  };

  const ejecutar = async (id, accion, textoOk) => {
    try {
      setProcesando(id);
      setError("");
      await accion();
      setMensaje(textoOk);
      // Confirmar una orden descuenta stock: se recargan todas las pestañas y el resumen
      await recargar();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setProcesando(null);
    }
  };

  /* Textos y acción real de cada modal de confirmación */
  const ACCIONES = {
    aceptarOferta: (o) => ({
      title: "Aceptar oferta",
      confirmLabel: "Aceptar oferta",
      confirmVariant: "success",
      id: o.id,
      mensaje: `Vas a aceptar la oferta de ${formatearDinero(o.montoOfertado)}${textoPorcentaje(o)} de ${nombreDe(o.idComprador, "Comprador")} por "${o.tituloPublicacion}".`,
      detalle: "Se reservan todas las unidades de la publicación para el comprador (tiene 48 h para pagar) y se rechazan las demás ofertas pendientes. No se puede deshacer.",
      run: () => aceptarOferta(o.id),
      ok: "Oferta aceptada.",
    }),
    rechazarOferta: (o) => ({
      title: "Rechazar oferta",
      confirmLabel: "Rechazar oferta",
      confirmVariant: "danger",
      id: o.id,
      mensaje: `Vas a rechazar la oferta de ${formatearDinero(o.montoOfertado)} de ${nombreDe(o.idComprador, "Comprador")} por "${o.tituloPublicacion}".`,
      detalle: "Esta acción no se puede deshacer.",
      run: () => rechazarOferta(o.id),
      ok: "Oferta rechazada.",
    }),
    avanzarOrden: (v) => {
      const sig = SIGUIENTE_ESTADO[v.estadoOrden];
      const nombre = etiqueta(ESTADOS_ORDEN, sig.estado).toLowerCase();
      return {
        title: sig.boton,
        confirmLabel: sig.boton,
        confirmVariant: sig.variante,
        id: `v${v.id}`,
        mensaje: `¿Marcás la orden N° ${v.numero} como ${nombre}?`,
        detalle: sig.detalle,
        // Ambos pasos son idempotentes: si el PATCH falla, reintentar no descuenta stock dos veces
        run: async () => {
          await confirmarReserva(ORIGEN_RESERVA.ORDEN, v.id);
          await actualizarEstadoOrden(v.id, sig.estado);
        },
        ok: `Orden N° ${v.numero} marcada como ${nombre}.`,
      };
    },
    cancelarOrden: (v) => ({
      title: "Cancelar orden",
      confirmLabel: "Cancelar orden",
      confirmVariant: "danger",
      id: `v${v.id}`,
      mensaje: `¿Cancelás la orden N° ${v.numero}?`,
      detalle: "Se liberan las reservas: el stock apartado vuelve a estar disponible.",
      run: async () => {
        await liberarReserva(ORIGEN_RESERVA.ORDEN, v.id);
        await actualizarEstadoOrden(v.id, "CANCELADA");
      },
      ok: `Orden N° ${v.numero} cancelada.`,
    }),
    eliminarPublicacion: (p) => ({
      title: "Eliminar publicación",
      confirmLabel: "Eliminar",
      confirmVariant: "danger",
      id: p.id,
      mensaje: `¿Estás seguro de que querés eliminar la publicación "${p.titulo}"?`,
      detalle: "Las ofertas pendientes se rechazarán automáticamente. No se puede eliminar una publicación vendida o con reservas vigentes.",
      run: () => eliminarPublicacion(p.id),
      ok: "Publicación eliminada.",
    }),
    eliminarProducto: (p) => ({
      title: "Eliminar producto",
      confirmLabel: "Eliminar",
      confirmVariant: "danger",
      id: `p${p.id}`,
      mensaje: `¿Estás seguro de que querés eliminar el producto "${p.nombre}"?`,
      detalle: "El producto dejará de estar disponible para nuevas publicaciones.",
      run: async () => {
        await eliminarProducto(p.id);
        setRecargaProductos((n) => n + 1);
      },
      ok: "Producto eliminado.",
    }),
  };

  const accionActual = accion ? ACCIONES[accion.tipo](accion.data) : null;

  const confirmarAccion = async () => {
    if (!accionActual) return;
    const ok = await ejecutar(accionActual.id, accionActual.run, accionActual.ok);
    setAccion(null);
    if (ok) setDetalle(null); // el detalle abierto quedaría con el estado viejo
  };

  const { activas, pausadas, vendidas, pendientes } = resumen;
  const ventasValidas = ventas.filter((v) => v.estadoOrden !== "CANCELADA");
  const ingresos = ventasValidas
    .filter((v) => v.estadoOrden !== "PENDIENTE")
    .reduce((acc, v) => acc + v.subtotalMio, 0);

  if (!idVendedor) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Alert variant="danger">No se pudo identificar al usuario. Volvé a iniciar sesión.</Alert>
      </div>
    );
  }

  /* ───────── Tablas por pestaña ───────── */
  const ventasPagina = paginar(ventas, pagina);

  const tablas = {
    ofertas: {
      total: ofertas.total,
      columnas: [
        { key: "comprador", label: "COMPRADOR" },
        { key: "articulo", label: "PUBLICACIÓN" },
        { key: "monto", label: "MONTO OFERTADO" },
        { key: "estado", label: "ESTADO" },
        { key: "fecha", label: "FECHA" },
        { key: "acciones", label: "ACCIONES RÁPIDAS", className: "text-right" },
      ],
      datos: ofertas.items,
      vacio: estadoOferta === TODAS ? "Todavía no recibiste ofertas." : "No hay ofertas en ese estado.",
      fila: (o) => (
        <>
          <td className="px-4 py-4 font-semibold text-[#1F2937]">
            {nombreDe(o.idComprador, "Comprador")}
          </td>
          <td className="px-4 py-4">
            <div className="flex items-center gap-3">
              <Miniatura src={o.imagen} />
              <span className="font-semibold text-[#1F2937]">{o.tituloPublicacion}</span>
            </div>
          </td>
          <td className="px-4 py-4">
            <span className="font-bold text-[#1F2937]">{formatearDinero(o.montoOfertado)}</span>
            {porcentajeDe(o.montoOfertado, o.valorLote) != null && (
              <span className="block text-xs text-[#6B7280]">
                {porcentajeDe(o.montoOfertado, o.valorLote)} % del lote ({formatearDinero(o.valorLote)})
              </span>
            )}
          </td>
          <td className="px-4 py-4">
            <Badge variant={variantesOferta[o.estadoOferta] ?? "neutral"}>{capitalizar(o.estadoOferta)}</Badge>
          </td>
          <td className="px-4 py-4 text-[#6B7280]">{formatearFecha(o.fechaOferta)}</td>
          <td className="px-4 py-4">
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setDetalle({ tipo: "oferta", data: o })}>
                Ver detalle
              </Button>
              {o.estadoOferta === "PENDIENTE" && (
                <>
                <Button size="sm" variant="success" loading={procesando === o.id}
                  onClick={() => setAccion({ tipo: "aceptarOferta", data: o })}>
                  Aceptar
                </Button>
                <Button size="sm" variant="outlineDanger" disabled={procesando === o.id}
                  onClick={() => setAccion({ tipo: "rechazarOferta", data: o })}>
                  Rechazar
                </Button>
                </>
              )}
            </div>
          </td>
        </>
      ),
    },

    ordenes: {
      total: ventas.length,
      columnas: [
        { key: "orden", label: "N°" },
        { key: "productos", label: "PRODUCTOS" },
        { key: "comprador", label: "COMPRADOR" },
        { key: "fecha", label: "FECHA" },
        { key: "total", label: "MI TOTAL" },
        { key: "estado", label: "ESTADO" },
        { key: "acciones", label: "ACCIONES", className: "text-right" },
      ],
      datos: ventasPagina,
      vacio: "Todavía no recibiste órdenes.",
      fila: (v) => (
        <>
          <td className="px-4 py-4 font-semibold text-[#1F2937]">{v.numero}</td>
          <td className="px-4 py-4">
            {v.mios.map((d) => (
              <p key={d.id} className="text-[#1F2937]">
                {d.nombreProductoSnapshot} <span className="text-xs text-[#6B7280]">× {d.cantidad}</span>
              </p>
            ))}
          </td>
          <td className="px-4 py-4 text-[#4B5563]">{nombreDe(v.idComprador, "Comprador")}</td>
          <td className="px-4 py-4 text-[#6B7280]">{formatearFecha(v.fechaOrden)}</td>
          <td className="px-4 py-4 font-bold text-[#1F2937]">{formatearDinero(v.subtotalMio)}</td>
          <td className="px-4 py-4">
            <Badge variant={variantesOrden[v.estadoOrden] ?? "neutral"}>{etiqueta(ESTADOS_ORDEN, v.estadoOrden)}</Badge>
          </td>
          <td className="px-4 py-4">
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setDetalle({ tipo: "orden", data: v })}>
                Ver detalle
              </Button>
              <AccionesOrden orden={v} ocupado={procesando === `v${v.id}`} onAccion={setAccion} />
            </div>
          </td>
        </>
      ),
    },

    publicaciones: {
      total: publicaciones.total,
      columnas: [
        { key: "titulo", label: "PUBLICACIÓN" },
        { key: "tipo", label: "TIPO DE VENTA" },
        { key: "items", label: "ÍTEMS" },
        { key: "estado", label: "ESTADO" },
        { key: "fecha", label: "PUBLICADA" },
        { key: "acciones", label: "ACCIONES", className: "text-right" },
      ],
      datos: publicaciones.items,
      vacio: "Todavía no tenés publicaciones.",
      fila: (p) => (
        <>
          <td className="px-4 py-4">
            <div className="flex items-center gap-3">
              <Miniatura src={imagenDePublicacion(p)} />
              <span className="font-semibold text-[#1F2937]">{p.titulo}</span>
            </div>
          </td>
          <td className="px-4 py-4 text-[#4B5563]">
            {p.tipoVenta === "PRECIO_FIJO" ? "Precio fijo" : "Subasta"}
          </td>
          <td className="px-4 py-4 text-[#4B5563]">{p.detalles?.length ?? 0}</td>
          <td className="px-4 py-4">
            <Badge variant={variantesPublicacion[p.estadoPublicacion] ?? "neutral"}>
              {capitalizar(p.estadoPublicacion)}
            </Badge>
          </td>
          <td className="px-4 py-4 text-[#6B7280]">{formatearFecha(p.fechaPublicacion)}</td>
          <td className="px-4 py-4">
            <div className="flex justify-end gap-2">
              {(p.estadoPublicacion === "ACTIVA" || p.estadoPublicacion === "PAUSADA") && (
                <Button size="sm" disabled={procesando === p.id}
                  variant={p.estadoPublicacion === "ACTIVA" ? "outlineWarning" : "outlineSuccess"}
                  onClick={() => {
                    const nuevo = p.estadoPublicacion === "ACTIVA" ? "PAUSADA" : "ACTIVA";
                    ejecutar(p.id, () => actualizarEstadoPublicacion(p.id, nuevo),
                      nuevo === "PAUSADA" ? "Publicación pausada." : "Publicación activada.");
                  }}>
                  {p.estadoPublicacion === "ACTIVA" ? "Pausar" : "Activar"}
                </Button>
              )}
              {p.estadoPublicacion !== "VENDIDA" && (
                <Button size="sm" variant="outlineInfo" disabled={procesando === p.id}
                  onClick={() => navigate(`/vendedor/publicaciones/${p.id}/editar`)}>
                  Editar
                </Button>
              )}
              <Button size="sm" variant="outlineDanger" disabled={procesando === p.id}
                onClick={() => setAccion({ tipo: "eliminarPublicacion", data: p })}>
                Eliminar
              </Button>
            </div>
          </td>
        </>
      ),
    },

    productos: {
      total: productos.total,
      columnas: [
        { key: "nombre", label: "PRODUCTO" },
        { key: "categoria", label: "CATEGORÍA" },
        { key: "rareza", label: "RAREZA" },
        { key: "stock", label: "STOCK" },
        { key: "precio", label: "PRECIO REF." },
        { key: "acciones", label: "ACCIONES", className: "text-right" },
      ],
      datos: productos.items,
      vacio: "Todavía no cargaste productos.",
      fila: (p) => (
        <>
          <td className="px-4 py-4">
            <div className="flex items-center gap-3">
              <Miniatura src={p.urlImagen} />
              <div>
                <p className="font-semibold text-[#1F2937]">{p.nombre}</p>
                {p.estadoConservacion && <p className="text-xs text-[#6B7280]">{p.estadoConservacion}</p>}
              </div>
            </div>
          </td>
          <td className="px-4 py-4 text-[#4B5563]">{p.categoria ?? "-"}</td>
          <td className="px-4 py-4">{p.rareza ? <Badge variant="primary">{p.rareza}</Badge> : "-"}</td>
          <td className="px-4 py-4 text-[#4B5563]">{p.stock ?? 0}</td>
          <td className="px-4 py-4 font-bold text-[#1F2937]">{formatearDinero(p.precioReferencia)}</td>
          <td className="px-4 py-4">
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outlineInfo" disabled={procesando === `p${p.id}`}
                onClick={() => setProductoForm(p)}>
                Editar
              </Button>
              <Button size="sm" variant="outlineDanger" disabled={procesando === `p${p.id}`}
                onClick={() => setAccion({ tipo: "eliminarProducto", data: p })}>
                Eliminar
              </Button>
            </div>
          </td>
        </>
      ),
    },
  };

  const actual = tablas[tab];
  const totalPaginas = paginado ? paginado.totalPaginas : Math.ceil(actual.total / POR_PAGINA);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* ENCABEZADO */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: "Mi negocio" }, { label: "Panel de control" }]} />
          <h1 className="mt-2 text-3xl font-bold text-[#111827]">Panel del Vendedor</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setProductoForm({})}>
            + Nuevo Producto
          </Button>
          <Button onClick={() => navigate("/vendedor/publicaciones/nueva")}>
            + Nueva Publicación
          </Button>
        </div>
      </div>

      {mensaje && <Alert variant="success" className="mb-4" onClose={() => setMensaje("")}>{mensaje}</Alert>}
      {error && <Alert variant="danger" className="mb-4" onClose={() => setError("")}>{error}</Alert>}

      {/* ESTADÍSTICAS */}
      <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Activos en vitrina" value={`${activas} ítems`}
          hint={pausadas ? `${pausadas} pausadas` : "Publicaciones activas"}
          hintClass="text-[#5146E5]" />
        <Stat label="Ofertas pendientes" value={`${pendientes} ${pendientes === 1 ? "oferta" : "ofertas"}`}
          hint="Esperan tu respuesta" valueClass="text-[#D97706]" />
        <Stat label="Órdenes" value={ventasValidas.length}
          hint={`${formatearDinero(ingresos)} cobrados · ${vendidas} publ. vendidas`} />
        <Stat label="Productos cargados" value={productos.total} hint="En tu inventario" />
      </div>

      {/* TABS */}
      <div className="mb-4 flex gap-6 border-b border-[#E5E7EB]">
        {TABS.map((t) => (
          <button key={t.id} type="button" onClick={() => cambiarTab(t.id)}
            className={`-mb-px border-b-2 pb-3 text-sm font-semibold transition-colors ${
              tab === t.id
                ? "border-[#5146E5] text-[#5146E5]"
                : "border-transparent text-[#6B7280] hover:text-[#1F2937]"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "ofertas" && (
        <div className="mb-4 max-w-xs">
          <Select name="estadoOferta" value={estadoOferta} options={FILTRO_ESTADO_OFERTA}
            onChange={(e) => { setEstadoOferta(e.target.value); irAPagina("ofertas", 0); }} />
        </div>
      )}

      {/* TABLA */}
      <Card padding="none" className="overflow-hidden">
        {cargando[tab] ? (
          <p className="py-16 text-center text-sm text-[#6B7280]">Cargando...</p>
        ) : (
          <Table columns={actual.columnas} data={actual.datos}
            renderRow={actual.fila} emptyMessage={actual.vacio} />
        )}
      </Card>

      <div className="mt-6">
        <Pagination currentPage={pagina + 1} totalPages={totalPaginas}
          onPageChange={(p) => irAPagina(tab, p - 1)} />
      </div>

      <ConfirmActionModal
        isOpen={Boolean(accionActual)}
        onClose={() => setAccion(null)}
        onConfirm={confirmarAccion}
        title={accionActual?.title}
        message={accionActual?.mensaje}
        confirmLabel={accionActual?.confirmLabel}
        confirmVariant={accionActual?.confirmVariant}
        loading={Boolean(accionActual) && procesando === accionActual.id}
      >
        {accionActual?.detalle}
      </ConfirmActionModal>

      {productoForm && (
        <FormOverlay onClose={() => setProductoForm(null)} maxWidth="max-w-2xl">
          <NuevoProductoPage
            key={productoForm.id ?? "nuevo"}
            producto={productoForm.id ? productoForm : undefined}
            onCancel={() => setProductoForm(null)}
            onCreated={(_, texto) => {
              const eraEdicion = Boolean(productoForm.id);
              setProductoForm(null);
              setTab("productos");
              if (!eraEdicion) irAPagina("productos", 0); // en edición se queda en la página actual
              setRecargaProductos((n) => n + 1);
              setMensaje(texto);
            }}
          />
        </FormOverlay>
      )}

      {detalle && (
        <FormOverlay onClose={() => setDetalle(null)} maxWidth="max-w-2xl">
          <Card padding="lg">
            {detalle.tipo === "oferta" ? (
              <>
                <h2 className="mb-5 text-lg font-bold text-[#1F2937]">Detalle de la oferta</h2>
                <dl className="mb-5 grid gap-4 sm:grid-cols-2">
                  <Dato label="Comprador">
                    {nombreDe(detalle.data.idComprador, "Comprador")}
                  </Dato>
                  <Dato label="Monto ofertado">
                    <span className="font-bold">{formatearDinero(detalle.data.montoOfertado)}</span>
                  </Dato>
                  <Dato label="Estado">
                    <Badge variant={variantesOferta[detalle.data.estadoOferta] ?? "neutral"}>
                      {capitalizar(detalle.data.estadoOferta)}
                    </Badge>
                  </Dato>
                  <Dato label="Fecha de la oferta">{formatearFecha(detalle.data.fechaOferta)}</Dato>
                  <Dato label="Fecha de respuesta">{formatearFecha(detalle.data.fechaRespuesta)}</Dato>
                </dl>
                <h3 className="mb-2 text-sm font-semibold text-[#374151]">Publicación</h3>
                <PublicacionResumen id={detalle.data.idPublicacion} />
              </>
            ) : (
              <>
                <h2 className="mb-5 text-lg font-bold text-[#1F2937]">Detalle de la orden N° {detalle.data.numero}</h2>
                <div className="mb-5">
                  <PasosOrden estado={detalle.data.estadoOrden} />
                </div>
                <dl className="mb-5 grid gap-4 sm:grid-cols-2">
                  <Dato label="Comprador">
                    {nombreDe(detalle.data.idComprador, "Comprador")}
                  </Dato>
                  <Dato label="Estado">
                    <Badge variant={variantesOrden[detalle.data.estadoOrden] ?? "neutral"}>
                      {etiqueta(ESTADOS_ORDEN, detalle.data.estadoOrden)}
                    </Badge>
                  </Dato>
                  <Dato label="Fecha">{formatearFecha(detalle.data.fechaOrden)}</Dato>
                  <Dato label="Mi total">
                    <span className="font-bold">{formatearDinero(detalle.data.subtotalMio)}</span>
                  </Dato>
                </dl>
                <h3 className="mb-2 text-sm font-semibold text-[#374151]">Ítems</h3>
                <ul className="mb-5 divide-y divide-[#E5E7EB] rounded-lg border border-[#E5E7EB] px-3">
                  {detalle.data.mios.map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <span className="font-semibold text-[#1F2937]">{d.nombreProductoSnapshot}</span>
                      <span className="text-[#4B5563]">
                        {d.cantidad} × {formatearDinero(d.precioUnitarioHistorico)} = {formatearDinero(d.subtotalItem)}
                      </span>
                    </li>
                  ))}
                </ul>
                <h3 className="mb-2 text-sm font-semibold text-[#374151]">Publicación</h3>
                <div className="space-y-3">
                  {[...new Set(detalle.data.mios.map((d) => d.idPublicacion))].map((idPub) => (
                    <PublicacionResumen key={idPub} id={idPub} />
                  ))}
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <AccionesOrden orden={detalle.data} ocupado={procesando === `v${detalle.data.id}`}
                    onAccion={setAccion} />
                </div>
              </>
            )}
          </Card>
        </FormOverlay>
      )}
    </div>
  );
}