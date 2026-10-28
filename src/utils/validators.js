const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin({ email, password }) {
  const e = {};
  if (!EMAIL.test(email)) e.email = "Ingresá un correo válido";
  if (!password) e.password = "Ingresá tu contraseña";
  return e;
}

export function validateRegister(f) {
  const e = {};

  if (!f.nombre.trim()) e.nombre = "Requerido";
  else if (f.nombre.length > 100) e.nombre = "Máximo 100 caracteres";

  if (!f.apellido.trim()) e.apellido = "Requerido";
  else if (f.apellido.length > 100) e.apellido = "Máximo 100 caracteres";

  if (!EMAIL.test(f.email)) e.email = "Ingresá un correo válido";
  else if (f.email.length > 150) e.email = "Máximo 150 caracteres";

  if (f.password.length < 8) e.password = "Mínimo 8 caracteres";
  else if (f.password.length > 72) e.password = "Máximo 72 caracteres";

  if (!f.telefono.trim()) e.telefono = "Requerido";
  else if (f.telefono.length > 20) e.telefono = "Máximo 20 caracteres";

  if (!f.direccionEnvio.trim()) e.direccionEnvio = "Requerido";
  else if (f.direccionEnvio.length > 255) e.direccionEnvio = "Máximo 255 caracteres";

  return e;
}