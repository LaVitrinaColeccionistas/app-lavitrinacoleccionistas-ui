import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import Alert from "../../components/common/Alert";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Pagination from "../../components/common/Pagination";
import Table from "../../components/common/Table";
import Breadcrumb from "../../components/layout/Breadcrumb";
import {
  aceptarOferta,
  actualizarEstadoPublicacion,
  eliminarPublicacion,
  obtenerOfertas,
  obtenerProductos,
  obtenerPublicaciones,
  rechazarOferta,
} from "../../services/catalogoService";
import { getUserId } from "../../utils/session";
import { formatearDinero, formatearFecha, imagenDePublicacion } from "./opciones";

const POR_PAGINA = 10;

const variantesOferta = { PENDIENTE: "warning", ACEPTADA: "success", RECHAZADA: "danger", EXPIRADA: "neutral" };
const variantesPublicacion = { ACTIVA: "success", PAUSADA: "warning", VENDIDA: "info", CANCELADA: "neutral" };

const capitalizar = (s) => (s ? s.charAt(0) + s.slice(1).toLowerCase() : "-");
const paginar = (lista, pagina) => lista.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA);

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

const TABS = [
  { id: "ofertas", label: "Ofertas recibidas" },
  { id: "publicaciones", label: "Publicaciones" },
  { id: "productos", label: "Productos" },
];

export default function PanelVendedorPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const idVendedor = getUserId();

  const [tab, setTab] = useState(state?.tab ?? "ofertas");
  const [pagina, setPagina] = useState(0); // 0-based
  const [publicaciones, setPublicaciones] = useState([]);
  const [ofertas, setOfertas] = useState([]);
  const [productos, setProductos] = useState({ items: [], total: 0, totalPaginas: 0 });
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(null); // id en acción
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState(state?.mensaje ?? "");

  /* Publicaciones del vendedor + ofertas recibidas en ellas */
  const cargarNegocio = useCallback(async () => {
    if (!idVendedor) return;
    try {
      setCargando(true);
      setError("");

      const data = await obtenerPublicaciones({ idVendedor, size: 100, estadoPublicacion: null });
      const pubs = (data?.content ?? []).filter((p) => p.estadoPublicacion !== "CANCELADA");
      setPublicaciones(pubs);

      // No existe filtro por vendedor en /ofertas: se consulta por cada publicación.
      const listas = await Promise.all(
        pubs.map((p) =>
          obtenerOfertas({ idPublicacion: p.id, size: 50 })
            .then((d) =>
              (d?.content ?? []).map((o) => ({
                ...o,
                tituloPublicacion: p.titulo,
                imagen: imagenDePublicacion(p),
              }))
            )
            .catch(() => [])
        )
      );

      const orden = { PENDIENTE: 0 };
      setOfertas(
        listas.flat().sort(
          (a, b) =>
            (orden[a.estadoOferta] ?? 1) - (orden[b.estadoOferta] ?? 1) ||
            new Date(b.fechaOferta) - new Date(a.fechaOferta)
        )
      );
    } catch (err) {
      console.error(err);
      setError(err.message || "No fue posible cargar tu panel.");
    } finally {
      setCargando(false);
    }
  }, [idVendedor]);

  /* Productos: paginación del servidor */
  const cargarProductos = useCallback(async () => {
    if (!idVendedor) return;
    try {
      const data = await obtenerProductos({ idVendedor, page: pagina, size: POR_PAGINA });
      setProductos({
        items: data?.content ?? [],
        total: data?.totalElements ?? 0,
        totalPaginas: data?.totalPages ?? 0,
      });
    } catch (err) {
      setError(err.message || "No fue posible cargar tus productos.");
    }
  }, [idVendedor, pagina]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { cargarNegocio(); }, [cargarNegocio]);

  // El total de productos se necesita para la tarjeta de estadísticas, así que se carga siempre;
  // en la pestaña "productos" además sigue la página actual.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { cargarProductos(); }, [cargarProductos]);

  const cambiarTab = (id) => {
    setTab(id);
    setPagina(0);
    setMensaje("");
  };

  const ejecutar = async (id, accion, textoOk) => {
    try {
      setProcesando(id);
      setError("");
      await accion();
      setMensaje(textoOk);
      await cargarNegocio();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(null);
    }
  };

  const activas = publicaciones.filter((p) => p.estadoPublicacion === "ACTIVA").length;
  const pausadas = publicaciones.filter((p) => p.estadoPublicacion === "PAUSADA").length;
  const vendidas = publicaciones.filter((p) => p.estadoPublicacion === "VENDIDA").length;
  const pendientes = ofertas.filter((o) => o.estadoOferta === "PENDIENTE").length;

  if (!idVendedor) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Alert variant="danger">No se pudo identificar al usuario. Volvé a iniciar sesión.</Alert>
      </div>
    );
  }

  /* ───────── Tablas por pestaña ───────── */
  const ofertasPagina = paginar(ofertas, pagina);
  const pubsPagina = paginar(publicaciones, pagina);

  const tablas = {
    ofertas: {
      total: ofertas.length,
      columnas: [
        { key: "comprador", label: "COMPRADOR" },
        { key: "articulo", label: "PUBLICACIÓN" },
        { key: "monto", label: "MONTO OFERTADO" },
        { key: "estado", label: "ESTADO" },
        { key: "fecha", label: "FECHA" },
        { key: "acciones", label: "ACCIONES RÁPIDAS", className: "text-right" },
      ],
      datos: ofertasPagina,
      vacio: "Todavía no recibiste ofertas.",
      fila: (o) => (
        <>
          <td className="px-4 py-4 font-semibold text-[#1F2937]">Comprador #{o.idComprador}</td>
          <td className="px-4 py-4">
            <div className="flex items-center gap-3">
              <Miniatura src={o.imagen} />
              <span className="font-semibold text-[#1F2937]">{o.tituloPublicacion}</span>
            </div>
          </td>
          <td className="px-4 py-4 font-bold text-[#1F2937]">{formatearDinero(o.montoOfertado)}</td>
          <td className="px-4 py-4">
            <Badge variant={variantesOferta[o.estadoOferta] ?? "neutral"}>{capitalizar(o.estadoOferta)}</Badge>
          </td>
          <td className="px-4 py-4 text-[#6B7280]">{formatearFecha(o.fechaOferta)}</td>
          <td className="px-4 py-4">
            {o.estadoOferta === "PENDIENTE" && (
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outlineDanger" disabled={procesando === o.id}
                  onClick={() => ejecutar(o.id, () => rechazarOferta(o.id), "Oferta rechazada.")}>
                  Rechazar
                </Button>
                <Button size="sm" variant="success" loading={procesando === o.id}
                  onClick={() => ejecutar(o.id, () => aceptarOferta(o.id), "Oferta aceptada.")}>
                  Aceptar
                </Button>
              </div>
            )}
          </td>
        </>
      ),
    },

    publicaciones: {
      total: publicaciones.length,
      columnas: [
        { key: "titulo", label: "PUBLICACIÓN" },
        { key: "tipo", label: "TIPO DE VENTA" },
        { key: "items", label: "ÍTEMS" },
        { key: "estado", label: "ESTADO" },
        { key: "fecha", label: "PUBLICADA" },
        { key: "acciones", label: "ACCIONES", className: "text-right" },
      ],
      datos: pubsPagina,
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
            {p.tipoVenta === "PRECIO_FIJO" ? "Precio fijo" : "Oferta libre"}
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
                <Button size="sm" variant="outline" disabled={procesando === p.id}
                  onClick={() => {
                    const nuevo = p.estadoPublicacion === "ACTIVA" ? "PAUSADA" : "ACTIVA";
                    ejecutar(p.id, () => actualizarEstadoPublicacion(p.id, nuevo),
                      nuevo === "PAUSADA" ? "Publicación pausada." : "Publicación activada.");
                  }}>
                  {p.estadoPublicacion === "ACTIVA" ? "Pausar" : "Activar"}
                </Button>
              )}
              <Button size="sm" variant="outlineDanger" disabled={procesando === p.id}
                onClick={() => {
                  if (window.confirm("¿Eliminar esta publicación?"))
                    ejecutar(p.id, () => eliminarPublicacion(p.id), "Publicación eliminada.");
                }}>
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
        </>
      ),
    },
  };

  const actual = tablas[tab];
  const totalPaginas =
    tab === "productos" ? productos.totalPaginas : Math.ceil(actual.total / POR_PAGINA);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* ENCABEZADO */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Breadcrumb items={[{ label: "Mi negocio" }, { label: "Panel de control" }]} />
          <h1 className="mt-2 text-3xl font-bold text-[#111827]">Panel del Vendedor</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate("/vendedor/productos/nuevo")}>
            + Nuevo Producto
          </Button>
          <Button onClick={() => navigate("/vendedor/publicaciones/nueva")}>
            + Publicar Nuevo Coleccionable
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
        <Stat label="Publicaciones vendidas" value={vendidas} hint="Total histórico" />
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

      {/* TABLA */}
      <Card padding="none" className="overflow-hidden">
        {cargando && tab !== "productos" ? (
          <p className="py-16 text-center text-sm text-[#6B7280]">Cargando...</p>
        ) : (
          <Table columns={actual.columnas} data={actual.datos}
            renderRow={actual.fila} emptyMessage={actual.vacio} />
        )}
      </Card>

      <div className="mt-6">
        <Pagination currentPage={pagina + 1} totalPages={totalPaginas}
          onPageChange={(p) => setPagina(p - 1)} />
      </div>
    </div>
  );
}