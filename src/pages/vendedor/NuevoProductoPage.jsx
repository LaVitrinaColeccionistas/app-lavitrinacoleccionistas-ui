import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import { actualizarProducto, crearProducto } from "../../services/catalogoService";
import { getUserId } from "../../utils/session";
import { CATEGORIAS, ESTADOS_CONSERVACION, RAREZAS } from "./opciones";

const inicial = {
  nombre: "",
  categoria: CATEGORIAS[0].value,
  estadoConservacion: ESTADOS_CONSERVACION[0].value,
  rareza: RAREZAS[0].value,
  stock: "1",
  precioReferencia: "",
  urlImagen: "",
};

function validar(f) {
  const e = {};
  if (!f.nombre.trim()) e.nombre = "El nombre es obligatorio";
  else if (f.nombre.length > 150) e.nombre = "Máximo 150 caracteres";

  if (f.stock === "" || !Number.isInteger(Number(f.stock)) || Number(f.stock) < 0)
    e.stock = "Ingresá un entero mayor o igual a 0";

  if (f.precioReferencia === "" || Number(f.precioReferencia) < 0)
    e.precioReferencia = "Ingresá un precio válido";

  if (f.urlImagen.length > 500) e.urlImagen = "Máximo 500 caracteres";
  return e;
}

// Convierte un ProductoDTO a los valores del formulario (inputs trabajan con strings)
const desdeProducto = (p) => ({
  nombre: p.nombre ?? "",
  categoria: p.categoria ?? CATEGORIAS[0].value,
  estadoConservacion: p.estadoConservacion ?? ESTADOS_CONSERVACION[0].value,
  rareza: p.rareza ?? RAREZAS[0].value,
  stock: String(p.stock ?? 0),
  precioReferencia: String(p.precioReferencia ?? ""),
  urlImagen: p.urlImagen ?? "",
});

// Sin `producto` = alta. Con `producto` (ProductoDTO) = edición vía PUT /api/productos/{id}
export default function NuevoProductoPage({ producto, onCancel, onCreated }) {
  const navigate = useNavigate();
  const idVendedor = getUserId();
  const editando = Boolean(producto?.id);

  const [form, setForm] = useState(() => (editando ? desdeProducto(producto) : inicial));
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validar(form);
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
        nombre: form.nombre.trim(),
        categoria: form.categoria,
        estadoConservacion: form.estadoConservacion,
        rareza: form.rareza,
        stock: Number(form.stock),
        precioReferencia: Number(form.precioReferencia),
        // En edición se manda "" para poder borrar la imagen (el mapper ignora null)
        urlImagen: form.urlImagen.trim() || (editando ? "" : undefined),
      };
      // ProductoUpdateDTO no lleva idVendedor
      const guardado = editando
        ? await actualizarProducto(producto.id, datos)
        : await crearProducto({ idVendedor, ...datos });

      const texto = editando ? "Producto actualizado correctamente." : "Producto creado correctamente.";
      if (onCreated) onCreated(guardado, texto);
      else navigate("/vendedor", { state: { tab: "productos", mensaje: texto } });
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Card padding="lg">
        <h1 className="mb-5 text-lg font-bold text-[#1F2937]">
          {editando ? "Editar Producto" : "Nuevo Producto"}
        </h1>

        {apiError && (
          <Alert variant="danger" className="mb-4" onClose={() => setApiError("")}>
            {apiError}
          </Alert>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <Input label="Nombre" name="nombre" value={form.nombre} onChange={handleChange}
            error={errors.nombre} required maxLength={150} />

          <div className="grid gap-5 sm:grid-cols-2">
            <Select label="Categoría" name="categoria" value={form.categoria}
              onChange={handleChange} options={CATEGORIAS} />
            <Select label="Estado de conservación" name="estadoConservacion" value={form.estadoConservacion}
              onChange={handleChange} options={ESTADOS_CONSERVACION} />
            <Select label="Rareza" name="rareza" value={form.rareza}
              onChange={handleChange} options={RAREZAS} />
            <Input label="Stock" name="stock" type="number" min="0" step="1"
              value={form.stock} onChange={handleChange} error={errors.stock} />
          </div>

          <Input label="Precio de referencia (Gs.)" name="precioReferencia" type="number" min="0"
            placeholder="0" value={form.precioReferencia} onChange={handleChange}
            error={errors.precioReferencia} required />

          <Input label="URL de la imagen" name="urlImagen" type="url" placeholder="https://..."
            value={form.urlImagen} onChange={handleChange} error={errors.urlImagen}
            helperText="Opcional. Se muestra en el catálogo." />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" fullWidth onClick={() => onCancel ? onCancel() : navigate("/vendedor")}>
              Cancelar
            </Button>
            <Button type="submit" fullWidth loading={loading}>
              {editando ? "Guardar cambios" : "Guardar Producto"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}