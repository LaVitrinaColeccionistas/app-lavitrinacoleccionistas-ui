import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Trash2 } from "lucide-react";

import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import FormOverlay from "../../components/common/FormOverlay";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Textarea from "../../components/common/Textarea";
import Modal from "../../components/ui/Modal";
import NuevoProductoPage from "./NuevoProductoPage";
import {
  actualizarEstadoPublicacion,
  actualizarPublicacion,
  crearPublicacion,
  obtenerProductos,
  obtenerPublicacion,
} from "../../services/catalogoService";
import { getUserId } from "../../utils/session";
import { ESTADOS_PUBLICACION, TIPOS_VENTA, formatearDinero } from "./opciones";

const itemVacio = { idProducto: "", precioUnitario: "", cantidadPublicada: "1" };

export default function NuevaPublicacionPage() {
  const navigate = useNavigate();
  const idVendedor = getUserId();
  const { id } = useParams(); // presente en /vendedor/publicaciones/:id/editar
  const editando = Boolean(id);
  const [estadoOriginal, setEstadoOriginal] = useState(null);
  const [cargandoPub, setCargandoPub] = useState(editando);

  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    tipoVenta: "PRECIO_FIJO",
    estadoPublicacion: "ACTIVA",
  });
  const [items, setItems] = useState([]); // { producto, precioUnitario, cantidadPublicada }
  const [misProductos, setMisProductos] = useState([]);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  // Modal "agregar producto"
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nuevoItem, setNuevoItem] = useState(itemVacio);
  const [errorItem, setErrorItem] = useState("");

  const [recarga, setRecarga] = useState(0);
  const [productoNuevoOpen, setProductoNuevoOpen] = useState(false);

  // Solo los productos del vendedor logueado (el filtro también se aplica en el cliente por seguridad)
  useEffect(() => {
    if (!idVendedor) return;
    obtenerProductos({ idVendedor, size: 100 })
      .then((d) =>
        setMisProductos((d?.content ?? []).filter((p) => String(p.idVendedor) === String(idVendedor)))
      )
      .catch(() => setApiError("No se pudieron cargar tus productos."));
  }, [idVendedor, recarga]);

  // Modo edición: precargar la publicación
  useEffect(() => {
    if (!editando) return;
    let cancelado = false;
    obtenerPublicacion(id)
      .then((pub) => {
        if (cancelado) return;
        if (String(pub.idVendedor) !== String(idVendedor)) {
          setApiError("Esta publicación no te pertenece.");
          return;
        }
        setEstadoOriginal(pub.estadoPublicacion);
        setForm({
          titulo: pub.titulo ?? "",
          descripcion: pub.descripcion ?? "",
          tipoVenta: pub.tipoVenta,
          estadoPublicacion: pub.estadoPublicacion,
        });
        setItems(
          (pub.detalles ?? []).map((d) => ({
            producto: d.producto,
            precioUnitario: Number(d.precioUnitario),
            cantidadPublicada: d.cantidadPublicada,
          }))
        );
      })
      .catch((err) => !cancelado && setApiError(err.message))
      .finally(() => !cancelado && setCargandoPub(false));
    return () => {
      cancelado = true;
    };
  }, [editando, id, idVendedor]);

  // VENDIDA no admite cambios (el back responde 409)
  const soloLectura = estadoOriginal === "VENDIDA";

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const disponibles = misProductos.filter(
    (p) => !items.some((i) => i.producto.id === p.id)
  );
  const productoSeleccionado = misProductos.find(
    (p) => String(p.id) === String(nuevoItem.idProducto)
  );

  const elegirProducto = (e) => {
    const p = misProductos.find((x) => String(x.id) === e.target.value);
    setNuevoItem({
      idProducto: e.target.value,
      precioUnitario: p?.precioReferencia ?? "",
      // Por defecto se publica todo el stock: la publicación pasa a VENDIDA cuando
      // se venden todas las unidades PUBLICADAS, no las del producto
      cantidadPublicada: String(Math.max(1, p?.stock ?? 1)),
    });
  };

  const agregarItem = () => {
    if (!productoSeleccionado) return setErrorItem("Seleccioná un producto");
    const precio = Number(nuevoItem.precioUnitario);
    const cant = Number(nuevoItem.cantidadPublicada);
    if (nuevoItem.precioUnitario === "" || precio < 0) return setErrorItem("Ingresá un precio válido");
    if (!Number.isInteger(cant) || cant < 1) return setErrorItem("La cantidad mínima es 1");
    if (productoSeleccionado.stock != null && cant > productoSeleccionado.stock)
      return setErrorItem(`Stock disponible: ${productoSeleccionado.stock}`);

    setItems((prev) => [
      ...prev,
      { producto: productoSeleccionado, precioUnitario: precio, cantidadPublicada: cant },
    ]);
    cerrarModal();
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setNuevoItem(itemVacio);
    setErrorItem("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = {};
    if (!form.titulo.trim()) v.titulo = "El título es obligatorio";
    else if (form.titulo.length > 255) v.titulo = "Máximo 255 caracteres";
    if (items.length === 0) v.items = "Agregá al menos un producto";
    setErrors(v);
    if (Object.keys(v).length) return;

    if (!idVendedor) {
      setApiError("No se pudo identificar al vendedor. Volvé a iniciar sesión.");
      return;
    }

    setLoading(true);
    setApiError("");
    try {
      const datos = {
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim() || (editando ? "" : undefined),
        tipoVenta: form.tipoVenta,
        detalles: items.map((i) => ({
          idProducto: i.producto.id,
          precioUnitario: i.precioUnitario,
          cantidadPublicada: i.cantidadPublicada,
        })),
      };

      // PUT no recibe idVendedor ni estado; el estado va por PATCH /estado
      const guardada = editando
        ? await actualizarPublicacion(id, datos)
        : await crearPublicacion({ idVendedor, ...datos });

      if (guardada?.estadoPublicacion !== form.estadoPublicacion) {
        await actualizarEstadoPublicacion(guardada.id, form.estadoPublicacion);
      }

      navigate("/vendedor", {
        state: {
          tab: "publicaciones",
          mensaje: editando ? "Publicación actualizada correctamente." : "Publicación creada correctamente.",
        },
      });
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (cargandoPub) {
    return <p className="py-12 text-center text-sm text-[#6B7280]">Cargando publicación...</p>;
  }

  return (
    <div className="w-full">
      <Card padding="lg">
        <h1 className="mb-5 text-lg font-bold text-[#1F2937]">
          {editando ? "Editar Publicación" : "Nueva Publicación"}
        </h1>

        {soloLectura && (
          <Alert variant="warning" className="mb-4">
            Esta publicación está vendida y no admite modificaciones.
          </Alert>
        )}

        {apiError && (
          <Alert variant="danger" className="mb-4" onClose={() => setApiError("")}>
            {apiError}
          </Alert>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <fieldset disabled={soloLectura} className="space-y-5">
          <Input label="Título" name="titulo" value={form.titulo} onChange={handleChange}
            error={errors.titulo} required maxLength={255} />

          <Textarea label="Descripción" name="descripcion" value={form.descripcion}
            onChange={handleChange} rows={5} />

          <div className="grid gap-5 sm:grid-cols-2">
            <Select label="Tipo de precio" name="tipoVenta" value={form.tipoVenta}
              onChange={handleChange} options={TIPOS_VENTA} />
            <Select label="Estado" name="estadoPublicacion" value={form.estadoPublicacion}
              onChange={handleChange} options={ESTADOS_PUBLICACION} />
          </div>

          {/* PRODUCTOS INCLUIDOS */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-[#374151]">Productos incluidos</p>
              <span className="text-sm text-[#6B7280]">{items.length} Items</span>
            </div>

            {items.length === 0 ? (
              <div className={`rounded-lg border border-dashed bg-[#FAFAFC] py-4 text-center text-sm text-[#6B7280]
                ${errors.items ? "border-[#EF4444]" : "border-[#D1D5DB]"}`}>
                Todavía no agregados
              </div>
            ) : (
              <ul className="space-y-2">
                {items.map((i) => (
                  <li key={i.producto.id}
                    className="flex items-center gap-3 rounded-lg border border-[#E5E7EB] bg-white p-3">
                    {i.producto.urlImagen ? (
                      <img src={i.producto.urlImagen} alt="" className="h-10 w-10 rounded-md object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-[#F6F6F8]" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#1F2937]">{i.producto.nombre}</p>
                      <p className="text-xs text-[#6B7280]">
                        {i.cantidadPublicada} × {formatearDinero(i.precioUnitario)}
                      </p>
                    </div>
                    <button type="button" aria-label="Quitar producto"
                      onClick={() => setItems((prev) => prev.filter((x) => x.producto.id !== i.producto.id))}
                      className="rounded-md p-2 text-[#9CA3AF] hover:bg-[#FEF2F2] hover:text-[#DC2626]">
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {errors.items && <p className="mt-1.5 text-xs font-medium text-[#DC2626]">{errors.items}</p>}
          </div>

          <div className="space-y-3">
            <Button variant="success" fullWidth onClick={() => setModalAbierto(true)}>
              + Agregar Producto
            </Button>
            <Button type="submit" fullWidth loading={loading} disabled={soloLectura}>
              {editando ? "Guardar cambios" : "Guardar Publicación"}
            </Button>
          </div>
          </fieldset>
        </form>
      </Card>

      {/* MODAL AGREGAR PRODUCTO */}
      <Modal isOpen={modalAbierto} onClose={cerrarModal} title="Agregar producto">
        {misProductos.length === 0 ? (
          <div className="space-y-3 text-sm text-[#4B5563]">
            <p>Todavía no tenés productos cargados.</p>
            <Button fullWidth onClick={() => { cerrarModal(); setProductoNuevoOpen(true); }}>
              + Nuevo Producto
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {errorItem && <Alert variant="danger">{errorItem}</Alert>}

            <Select label="Producto" name="idProducto" value={nuevoItem.idProducto}
              onChange={elegirProducto} placeholder="Seleccioná un producto"
              options={disponibles.map((p) => ({
                value: String(p.id),
                label: `${p.nombre} (stock: ${p.stock ?? 0})`,
              }))}
              helperText={disponibles.length === 0 ? "Ya agregaste todos tus productos." : undefined}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input label="Precio unitario (Gs.)" name="precioUnitario" type="number" min="0"
                value={nuevoItem.precioUnitario}
                onChange={(e) => setNuevoItem((n) => ({ ...n, precioUnitario: e.target.value }))} />
              <Input label="Cantidad" name="cantidadPublicada" type="number" min="1"
                max={productoSeleccionado?.stock ?? undefined}
                helperText={productoSeleccionado ? `Unidades a la venta (stock: ${productoSeleccionado.stock ?? 0})` : undefined}
                value={nuevoItem.cantidadPublicada}
                onChange={(e) => setNuevoItem((n) => ({ ...n, cantidadPublicada: e.target.value }))} />
            </div>

            <Button variant="outlineSuccess" fullWidth
              onClick={() => { cerrarModal(); setProductoNuevoOpen(true); }}>
              + Nuevo Producto (alta rápida)
            </Button>

            <div className="flex gap-3 pt-1">
              <Button variant="outline" fullWidth onClick={cerrarModal}>Cancelar</Button>
              <Button fullWidth onClick={agregarItem}>Agregar</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ALTA RÁPIDA DE PRODUCTO: mismo overlay y ancho que el alta desde el panel */}
      {productoNuevoOpen && (
        <FormOverlay onClose={() => setProductoNuevoOpen(false)} maxWidth="max-w-2xl">
          <NuevoProductoPage
            onCancel={() => setProductoNuevoOpen(false)}
            onCreated={() => {
              setProductoNuevoOpen(false);
              setRecarga((n) => n + 1);
              setModalAbierto(true);
            }}
          />
        </FormOverlay>
      )}
    </div>
  );
}