import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import AuthLayout from "../../components/layout/AuthLayout";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import Alert from "../../components/common/Alert";

import { login } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import { getUserRole } from "../../utils/session";
import { validateLogin } from "../../utils/validators";

export default function LoginPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { iniciarSesion } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({
      ...f,
      [e.target.name]: e.target.value,
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    const v = validateLogin(form);
    setErrors(v);

    if (Object.keys(v).length) return;

    setLoading(true);
    setApiError("");

    try {
      const { accessToken } = await login(form);

      iniciarSesion(accessToken);

      // Vuelve a donde estaba (si venía redirigido) o va al inicio según el rol
      navigate(
        state?.from ||
          (getUserRole() === "VENDEDOR" ? "/vendedor" : "/catalogo"),
        { replace: true }
      );
    } catch (err) {
      setApiError(
        err.status === 401
          ? "Credenciales inválidas o cuenta pendiente de aprobación."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card padding="lg" className="w-full max-w-[360px]">
        <h1 className="text-xl font-bold text-[#1F2937]">
          Iniciar Sesión
        </h1>

        <p className="mb-5 mt-1 text-sm text-[#6B7280]">
          Ingresá tus credenciales para acceder a tu vitrina
        </p>

        {state?.registrado && (
          <Alert variant="success" className="mb-4">
            Solicitud enviada. Te notificaremos por correo cuando sea revisada.
          </Alert>
        )}

        {apiError && (
          <Alert
            variant="danger"
            className="mb-4"
            onClose={() => setApiError("")}
          >
            {apiError}
          </Alert>
        )}

        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-4"
        >
          <Input
            label="Correo electrónico"
            name="email"
            type="email"
            placeholder="ejemplo@correo.com"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
          />

          <Input
            label="Contraseña"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
          />

          <Button
            type="submit"
            variant="success"
            fullWidth
            loading={loading}
          >
            Iniciar Sesión
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-[#4B5563]">
          ¿No tenés cuenta?{" "}
          <Link
            to="/registro"
            className="text-[#5146E5] underline"
          >
            Registrate aquí
          </Link>
        </p>
      </Card>
    </AuthLayout>
  );
}