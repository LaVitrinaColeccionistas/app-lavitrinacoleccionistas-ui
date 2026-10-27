
import { useState } from "react";
import { Link } from "react-router-dom";
import { Headphones, Send } from "lucide-react";

import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Textarea from "../../components/common/Textarea";
import { getToken } from "../../utils/session";

import { crearTicketSoporte } from "../../services/ticketsSoporteService";

const formularioInicial = {
  nombre: "",
  email: "",
  asunto: "",
  mensaje: "",
};

export default function SoportePage() {
  const [formulario, setFormulario] = useState(formularioInicial);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [requiereLogin, setRequiereLogin] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setFormulario((actual) => ({
      ...actual,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMensajeExito("");
    setRequiereLogin(false);

    if (!getToken()) {
      setError("Debes iniciar sesión para enviar una solicitud.");
      setRequiereLogin(true);
      return;
    }

    const datos = {
      nombre: formulario.nombre.trim(),
      email: formulario.email.trim(),
      asunto: formulario.asunto.trim(),
      mensaje: formulario.mensaje.trim(),
    };

    if (
      !datos.nombre ||
      !datos.email ||
      !datos.asunto ||
      !datos.mensaje
    ) {
      setError("Completa todos los campos.");
      return;
    }

    try {
      setEnviando(true);

      await crearTicketSoporte(datos);

      setFormulario(formularioInicial);

      setMensajeExito(
        "Tu solicitud fue enviada correctamente."
      );
    } catch (err) {
      console.error(err);

      if (err.status === 401 || err.status === 403) {
        setError(
          "Tu sesión no es válida o no tienes permiso. Inicia sesión nuevamente."
        );
        setRequiereLogin(true);
      } else {
        setError(
          "No fue posible enviar la solicitud. Intenta nuevamente."
        );
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">

      {/* ENCABEZADO */}

      <div className="mb-7 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F0EFFF]">
          <Headphones
            size={20}
            className="text-[#5146E5]"
          />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">
            Soporte
          </h1>

          <p className="mt-1 text-sm text-[#6B7280]">
            ¿Necesitas ayuda? Envíanos tu consulta o
            reporta un problema.
          </p>
        </div>
      </div>

      {/* MENSAJES */}

      {error && (
        <Alert
          variant="danger"
          className="mb-5"
          onClose={() => {
            setError("");
            setRequiereLogin(false);
          }}
        >
          {error}

          {requiereLogin && (
            <div className="mt-2">
              <Link
                to="/login"
                className="font-medium underline"
              >
                Iniciar sesión
              </Link>
            </div>
          )}
        </Alert>
      )}

      {mensajeExito && (
        <Alert
          variant="success"
          className="mb-5"
          onClose={() => setMensajeExito("")}
        >
          {mensajeExito}
        </Alert>
      )}

      {/* FORMULARIO */}

      <Card
        title="Contactar con soporte"
        subtitle="Completa el formulario y cuéntanos cómo podemos ayudarte."
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div className="grid gap-5 md:grid-cols-2">

            <Input
              label="Nombre y Apellido"
              name="nombre"
              value={formulario.nombre}
              onChange={handleChange}
              placeholder="Tu nombre y apellido"
              required
            />

            <Input
              label="Correo electrónico"
              name="email"
              type="email"
              value={formulario.email}
              onChange={handleChange}
              placeholder="correo@ejemplo.com"
              required
            />

          </div>

          <Input
            label="Asunto"
            name="asunto"
            value={formulario.asunto}
            onChange={handleChange}
            placeholder="Describe brevemente tu consulta"
            required
          />

          <Textarea
            label="Mensaje"
            name="mensaje"
            value={formulario.mensaje}
            onChange={handleChange}
            placeholder="Cuéntanos qué ocurrió..."
            rows={6}
            required
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              loading={enviando}
            >
              <Send size={16} />
              Enviar solicitud
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
