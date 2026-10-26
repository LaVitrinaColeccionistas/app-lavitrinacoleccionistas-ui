import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/layout/AuthLayout";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import RadioGroup from "../../components/common/RadioGroup";
import Button from "../../components/common/Button";
import Alert from "../../components/common/Alert";
import { register, ROLES } from "../../services/authService";
import { validateRegister } from "../../utils/validators";

const TIPOS = [
  { value: "COMPRADOR", label: "Comprador" },
  { value: "VENDEDOR", label: "Vendedor" },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: "", apellido: "", email: "", password: "",
    telefono: "", direccion: "", tipo: "COMPRADOR",
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validateRegister(form);
    setErrors(v);
    if (Object.keys(v).length) return;

    setLoading(true);
    setApiError("");
    try {
      const { tipo, ...datos } = form;
      await register({ ...datos, idRoles: [ROLES[tipo]] });
      navigate("/login", { state: { registrado: true } });
    } catch (err) {
      setApiError(err.message); // 409 = email ya registrado, 400 = validación
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card padding="lg" className="w-full max-w-[500px]">
        <h1 className="text-xl font-bold text-[#1F2937]">Crear Cuenta</h1>
        <p className="mb-5 mt-1 text-sm text-[#6B7280]">
          Completá tus datos para solicitar el registro en la plataforma
        </p>

        {apiError && (
          <Alert variant="danger" className="mb-4" onClose={() => setApiError("")}>
            {apiError}
          </Alert>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Nombre" name="nombre" placeholder="Martín"
              value={form.nombre} onChange={handleChange} error={errors.nombre} />
            <Input label="Apellido" name="apellido" placeholder="López"
              value={form.apellido} onChange={handleChange} error={errors.apellido} />
          </div>
          <Input label="Correo electrónico" name="email" type="email"
            placeholder="martin.lopez@gmail.com"
            value={form.email} onChange={handleChange} error={errors.email} />
          <Input label="Contraseña" name="password" type="password"
            placeholder="Crear contraseña fuerte"
            value={form.password} onChange={handleChange} error={errors.password} />
          <Input label="Teléfono" name="telefono" type="tel" placeholder="+54 9 11 ...."
            value={form.telefono} onChange={handleChange} error={errors.telefono} />
          <Input label="Dirección de envío" name="direccion"
            placeholder="Av. Corrientes 1234, CABA"
            value={form.direccion} onChange={handleChange} error={errors.direccion} />
          <RadioGroup label="Tipo de usuario" name="tipo" value={form.tipo}
            onChange={handleChange} options={TIPOS} />

          <Alert variant="info" title="Importante:">
            Tu cuenta quedará pendiente de aprobación por un administrador.
            Te notificaremos por correo cuando sea revisada.
          </Alert>

          <Button type="submit" variant="success" fullWidth loading={loading}>
            Enviar Solicitud
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-[#4B5563]">
          ¿Ya tenés cuenta?{" "}
          <Link to="/login" className="text-[#5146E5] underline">Iniciá sesión</Link>
        </p>
      </Card>
    </AuthLayout>
  );
}