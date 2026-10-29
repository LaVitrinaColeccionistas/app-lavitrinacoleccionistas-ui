import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ShoppingCart, Trash2 } from "lucide-react";

import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import Autocomplete from "../../components/common/Autocomplete";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Breadcrumb from "../../components/layout/Breadcrumb";
import Modal from "../../components/ui/Modal";
import { useAuth } from "../../context/AuthContext";
import useDebouncedValue from "../../hooks/useDebouncedValue";
import { obtenerPublicacion, obtenerPublicaciones } from "../../services/catalogoService";
import { actualizarOrden, crearOrden, obtenerOrden } from "../../services/comprasService";
import { HORAS_DE_VIGENCIA, guardarCarrito, leerCarrito } from "../../utils/carrito";
import { resolverError } from "../../utils/errores";
import { METODOS_PAGO, formatearDinero, imagenDePublicacion } from "./opciones";

const detalleDe = (d) => ({
  idProducto: d.producto?.id ?? d.idProducto,
  nombre: d.producto?.nombre ?? d.nombreProducto ?? "Producto",
  imagen: d.producto?.urlImagen ?? "",
  precioUnitario: Number(d.precioUnitario ?? 0),
  disponible: d.cantidadPublicada ?? null,
});

const resumenPublicacion = (pub) => {
  const productos = (pub.detalles ?? []).map(detalleDe);
  const precios = productos.map((p) => p.precioUnitario);
  const cantidad = productos.length;
  const desde = precios.length ? formatearDinero(Math.min(...precios)) : "-";
  return `${cantidad} ${cantidad === 1 ? "producto" : "productos"} · desde ${desde}`;
};

const itemVacio = { idPublicacion: "", idProducto: "", cantidad: "1" };

export default function CarritoPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { usuarioId, tieneRol } = useAuth();
  const esAdmin = tieneRol("ADMIN");
  const editando = Boolean(id);
  const editaEnvio = editando && esAdmin;

  const [items, setItems] = useState([]);
  const [hidratado, setHidratado] = useState(false);
  const [aviso, setAviso] = useState("");
  const [orden, setOrden] = useState(null);
  const [metodoPago, setMetodoPago] = useState("TARJETA");
  const [costoEnvio, setCostoEnvio] = useState("0");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const busquedaAplicada = useDebouncedValue(busqueda);
  const [publicaciones, setPublicaciones] = useState([]);
  const [cargandoPublicaciones, setCargandoPublicaciones] = useState(false);
  const [publicacionElegida, setPublicacionElegida] = useState(null);
  const [nuevoItem, setNuevoItem] = useState(itemVacio);
  const [errorItem, setErrorItem] = useState("");

  useEffect(() => {
    if (!id) return undefined;
    let cancelado = false;

    async function cargarOrden() {
      try {
        const data = await obtenerOrden(id);
        if (cancelado) return;
        setOrden(data);
        setMetodoPago(data.metodoPago);
        setCostoEnvio(String(data.costoEnvio ?? 0));
        setItems(
          (data.detalles ?? []).map((d) => ({
            clave: `${d.idPublicacion}:${d.idProducto}`,
            idPublicacion: d.idPublicacion,
            idProducto: d.idProducto,
            nombre: d.nombreProductoSnapshot,
            imagen: "",
            precioUnitario: Number(d.precioUnitarioHistorico ?? 0),
            cantidad: d.cantidad,
            disponible: null,
          }))
        );
      } catch (err) {
        if (cancelado) return;
        if (!resolverError(err, navigate)) setApiError(err.message);
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargarOrden();
    return () => {
      cancelado = true;
    };
  }, [id, navigate]);

  useEffect(() => {
    if (editando) return undefined;
    let cancelado = false;

    async function hidratar() {
      const guardados = leerCarrito(usuarioId);

      if (guardados.length === 0) {
        setHidratado(true);
        setCargando(false);
        return;
      }

      let fallo = false;
      const ids = [...new Set(guardados.map((g) => g.idPublicacion))];
      const publicaciones = await Promise.all(
        ids.map((idPublicacion) =>
          obtenerPublicacion(idPublicacion).catch((err) => {
            if (err.status !== 404) fallo = true;
            return null;
          })
        )
      );
      if (cancelado) return;

      if (fallo) {
        setApiError("No se pudo verificar tu carrito en este momento. Tus productos siguen guardados.");
        setCargando(false);
        return;
      }

      const porId = new Map(publicaciones.filter(Boolean).map((p) => [p.id, p]));
      const vigentes = [];
      let descartados = 0;

      guardados.forEach((g) => {
        const pub = porId.get(g.idPublicacion);
        const detalle =
          pub?.estadoPublicacion === "ACTIVA"
            ? (pub.detalles ?? []).find((d) => String(detalleDe(d).idProducto) === String(g.idProducto))
            : null;

        if (!detalle) {
          descartados += 1;
          return;
        }

        const info = detalleDe(detalle);
        const cantidad = info.disponible != null ? Math.min(g.cantidad, info.disponible) : g.cantidad;
        if (cantidad < 1) {
          descartados += 1;
          return;
        }

        vigentes.push({
          clave: `${pub.id}:${info.idProducto}`,
          idPublicacion: pub.id,
          idProducto: info.idProducto,
          nombre: info.nombre,
          imagen: info.imagen || imagenDePublicacion(pub),
          precioUnitario: info.precioUnitario,
          cantidad,
          disponible: info.disponible,
        });
      });

      setItems(vigentes);
      if (descartados > 0) {
        setAviso(
          descartados === 1
            ? "Se quitó 1 producto que ya no está disponible."
            : `Se quitaron ${descartados} productos que ya no están disponibles.`
        );
      }
      setHidratado(true);
      setCargando(false);
    }

    hidratar();
    return () => {
      cancelado = true;
    };
  }, [editando, usuarioId]);

  useEffect(() => {
    if (editando || !hidratado) return;
    guardarCarrito(
      usuarioId,
      items.map(({ idPublicacion, idProducto, cantidad }) => ({ idPublicacion, idProducto, cantidad }))
    );
  }, [items, usuarioId, editando, hidratado]);

  useEffect(() => {
    if (!modalAbierto) return undefined;
    let cancelado = false;

    async function cargarPublicaciones() {
      try {
        setCargandoPublicaciones(true);
        const data = await obtenerPublicaciones({ size: 30, busqueda: busquedaAplicada });
        if (!cancelado) setPublicaciones(data?.content ?? []);
      } catch (err) {
        if (!cancelado) setErrorItem(err.message || "No se pudieron cargar las publicaciones.");
      } finally {
        if (!cancelado) setCargandoPublicaciones(false);
      }
    }

    cargarPublicaciones();
    return () => {
      cancelado = true;
    };
  }, [modalAbierto, busquedaAplicada]);

  const productosDePublicacion = (publicacionElegida?.detalles ?? []).map(detalleDe);
  const productoElegido = productosDePublicacion.find(
    (p) => String(p.idProducto) === String(nuevoItem.idProducto)
  );

  const subtotal = useMemo(
    () => items.reduce((suma, i) => suma + i.precioUnitario * i.cantidad, 0),
    [items]
  );
  const envio = Number(costoEnvio) || 0;
  const total = subtotal + envio;

  const cerrarModal = () => {
    setModalAbierto(false);
    setBusqueda("");
    setPublicacionElegida(null);
    setNuevoItem(itemVacio);
    setErrorItem("");
  };

  const agregarItem = () => {
    if (!publicacionElegida) return setErrorItem("Seleccioná una publicación");
    if (!productoElegido) return setErrorItem("Seleccioná un producto");

    const cantidad = Number(nuevoItem.cantidad);
    if (!Number.isInteger(cantidad) || cantidad < 1) return setErrorItem("La cantidad mínima es 1");
    if (productoElegido.disponible != null && cantidad > productoElegido.disponible)
      return setErrorItem(`Cantidad disponible: ${productoElegido.disponible}`);

    const clave = `${publicacionElegida.id}:${productoElegido.idProducto}`;

    setItems((prev) => {
      const existente = prev.find((i) => i.clave === clave);
      if (existente) {
        const suma = existente.cantidad + cantidad;
        const tope = productoElegido.disponible ?? suma;
        return prev.map((i) => (i.clave === clave ? { ...i, cantidad: Math.min(suma, tope) } : i));
      }
      return [
        ...prev,
        {
          clave,
          idPublicacion: publicacionElegida.id,
          idProducto: productoElegido.idProducto,
          nombre: productoElegido.nombre,
          imagen: productoElegido.imagen || imagenDePublicacion(publicacionElegida),
          precioUnitario: productoElegido.precioUnitario,
          cantidad,
          disponible: productoElegido.disponible,
        },
      ];
    });
    cerrarModal();
  };

  const cambiarCantidad = (clave, valor) => {
    const cantidad = Math.max(1, Math.floor(Number(valor) || 1));
    setItems((prev) =>
      prev.map((i) =>
        i.clave === clave
          ? { ...i, cantidad: i.disponible != null ? Math.min(cantidad, i.disponible) : cantidad }
          : i
      )
    );
  };

  const quitarItem = (clave) => setItems((prev) => prev.filter((i) => i.clave !== clave));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = {};
    if (items.length === 0) v.items = "Agregá al menos un producto";
    if (editaEnvio && (costoEnvio === "" || Number(costoEnvio) < 0)) v.costoEnvio = "Ingresá un costo de envío válido";
    setErrors(v);
    if (Object.keys(v).length) return;

    const idComprador = editando ? orden?.idComprador : usuarioId;
    if (!idComprador) {
      setApiError("No se pudo identificar al comprador. Volvé a iniciar sesión.");
      return;
    }

    const datos = {
      idComprador,
      metodoPago,
      ...(editando && { costoEnvio: editaEnvio ? envio : orden?.costoEnvio }),
      detalles: items.map((i) => ({
        idProducto: i.idProducto,
        idPublicacion: i.idPublicacion,
        cantidad: i.cantidad,
      })),
    };

    setGuardando(true);
    setApiError("");
    try {
      if (editando) {
        await actualizarOrden(id, datos);
      } else {
        await crearOrden(datos);
        guardarCarrito(usuarioId, []);
      }
      navigate("/compras", {
        state: { mensaje: editando ? "Compra actualizada correctamente." : "Compra registrada correctamente." },
      });
    } catch (err) {
      if (!resolverError(err, navigate)) setApiError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const sinPermiso = editando && orden && !esAdmin && orden.idComprador !== usuarioId;
  const noEditable = editando && orden && orden.estadoOrden !== "PENDIENTE";

  if (cargando) {
    return <p className="py-24 text-center text-sm text-[#6B7280]">Cargando compra...</p>;
  }

  if (sinPermiso || noEditable) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        <Alert variant="warning" title="No se puede editar esta compra">
          {sinPermiso
            ? "Solo el comprador o un administrador pueden modificar esta compra."
            : "Solo se pueden modificar las compras en estado Pendiente."}
        </Alert>
        <Button className="mt-4" variant="outline" onClick={() => navigate("/compras")}>
          Volver a mis compras
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8">
        <Breadcrumb
          items={[
            { label: "Compras", to: "/compras" },
            { label: editando ? "Editar compra" : "Carrito" },
          ]}
        />
        <h1 className="mt-2 text-3xl font-bold text-[#111827]">
          {editando ? "Editar compra" : "Mi carrito"}
        </h1>
        {!editando && (
          <p className="mt-1 text-sm text-[#6B7280]">
            Los productos que agregás desde el catálogo se conservan {HORAS_DE_VIGENCIA} horas desde el último cambio.
          </p>
        )}
      </div>

      {aviso && (
        <Alert variant="warning" className="mb-4" onClose={() => setAviso("")}>
          {aviso}
        </Alert>
      )}

      {apiError && (
        <Alert variant="danger" className="mb-4" onClose={() => setApiError("")}>
          {apiError}
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate className="grid items-start gap-6 lg:grid-cols-3">
        <Card padding="lg" className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1F2937]">Productos</h2>
            <span className="text-sm text-[#6B7280]">
              {items.length} {items.length === 1 ? "ítem" : "ítems"}
            </span>
          </div>

          {items.length === 0 ? (
            <div
              className={`flex flex-col items-center gap-2 rounded-lg border border-dashed bg-[#FAFAFC] py-10 text-center text-sm text-[#6B7280] ${
                errors.items ? "border-[#EF4444]" : "border-[#D1D5DB]"
              }`}
            >
              <ShoppingCart size={28} className="text-[#9CA3AF]" />
              Tu carrito está vacío
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((i) => (
                <li
                  key={i.clave}
                  className="flex flex-wrap items-center gap-4 rounded-lg border border-[#E5E7EB] bg-white p-3"
                >
                  {i.imagen ? (
                    <img src={i.imagen} alt="" className="h-12 w-12 shrink-0 rounded-md object-cover" />
                  ) : (
                    <div className="h-12 w-12 shrink-0 rounded-md bg-[#F6F6F8]" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#1F2937]">{i.nombre}</p>
                    <p className="text-xs text-[#6B7280]">{formatearDinero(i.precioUnitario)} c/u</p>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max={i.disponible ?? undefined}
                    value={i.cantidad}
                    onChange={(e) => cambiarCantidad(i.clave, e.target.value)}
                    aria-label={`Cantidad de ${i.nombre}`}
                    className="w-20 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#1F2937] outline-none focus:border-[#5146E5] focus:ring-2 focus:ring-[#E0DEFF]"
                  />
                  <p className="w-28 text-right text-sm font-bold text-[#1F2937]">
                    {formatearDinero(i.precioUnitario * i.cantidad)}
                  </p>
                  <button
                    type="button"
                    aria-label={`Quitar ${i.nombre}`}
                    onClick={() => quitarItem(i.clave)}
                    className="rounded-md p-2 text-[#9CA3AF] hover:bg-[#FEF2F2] hover:text-[#DC2626]"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {errors.items && <p className="mt-2 text-xs font-medium text-[#DC2626]">{errors.items}</p>}

          <Button className="mt-5" variant="success" onClick={() => setModalAbierto(true)}>
            + Agregar producto
          </Button>
        </Card>

        <Card padding="lg">
          <h2 className="mb-4 text-lg font-bold text-[#1F2937]">Resumen</h2>

          <div className="space-y-4">
            <Select
              label="Método de pago"
              name="metodoPago"
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
              options={METODOS_PAGO}
            />
            {editaEnvio && (
              <Input
                label="Costo de envío (Gs.)"
                name="costoEnvio"
                type="number"
                min="0"
                value={costoEnvio}
                onChange={(e) => setCostoEnvio(e.target.value)}
                error={errors.costoEnvio}
              />
            )}
          </div>

          <dl className="mt-6 space-y-2 border-t border-[#ECEEF2] pt-4 text-sm">
            <div className="flex justify-between text-[#4B5563]">
              <dt>Subtotal</dt>
              <dd>{formatearDinero(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-[#4B5563]">
              <dt>Envío</dt>
              <dd>{envio > 0 ? formatearDinero(envio) : "A coordinar"}</dd>
            </div>
            <div className="flex justify-between text-base font-bold text-[#1F2937]">
              <dt>Total</dt>
              <dd>{formatearDinero(total)}</dd>
            </div>
          </dl>

          <div className="mt-6 space-y-3">
            <Button type="submit" fullWidth loading={guardando}>
              {editando ? "Guardar cambios" : "Confirmar compra"}
            </Button>
            <Button variant="outline" fullWidth onClick={() => navigate("/compras")}>
              Cancelar
            </Button>
          </div>
        </Card>
      </form>

      <Modal isOpen={modalAbierto} onClose={cerrarModal} title="Agregar producto">
        <div className="space-y-4">
          {errorItem && <Alert variant="danger">{errorItem}</Alert>}

          <Autocomplete
            label="Publicación"
            value={busqueda}
            onChange={(texto) => {
              setBusqueda(texto);
              if (publicacionElegida && texto !== publicacionElegida.titulo) {
                setPublicacionElegida(null);
                setNuevoItem(itemVacio);
              }
            }}
            onSelect={(opcion) => {
              setPublicacionElegida(opcion.publicacion);
              setBusqueda(opcion.publicacion.titulo);
              setNuevoItem(itemVacio);
              setErrorItem("");
            }}
            loading={cargandoPublicaciones}
            placeholder="Escribí el título de la publicación..."
            emptyMessage="No hay publicaciones activas con ese título."
            options={publicaciones.map((p) => ({
              value: String(p.id),
              label: p.titulo,
              detalle: resumenPublicacion(p),
              publicacion: p,
            }))}
          />

          <Select
            label="Producto"
            name="idProducto"
            value={nuevoItem.idProducto}
            onChange={(e) => setNuevoItem((n) => ({ ...n, idProducto: e.target.value, cantidad: "1" }))}
            placeholder="Seleccioná un producto"
            disabled={!publicacionElegida}
            options={productosDePublicacion.map((p) => ({
              value: String(p.idProducto),
              label: `${p.nombre} — ${formatearDinero(p.precioUnitario)}`,
            }))}
          />

          <Input
            label="Cantidad"
            name="cantidad"
            type="number"
            min="1"
            max={productoElegido?.disponible ?? undefined}
            value={nuevoItem.cantidad}
            onChange={(e) => setNuevoItem((n) => ({ ...n, cantidad: e.target.value }))}
            helperText={
              productoElegido?.disponible != null ? `Disponibles: ${productoElegido.disponible}` : undefined
            }
          />

          <div className="flex gap-3 pt-1">
            <Button variant="outline" fullWidth onClick={cerrarModal}>
              Cancelar
            </Button>
            <Button fullWidth onClick={agregarItem}>
              Agregar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
