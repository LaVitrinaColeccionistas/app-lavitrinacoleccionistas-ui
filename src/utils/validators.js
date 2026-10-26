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
  if (!f.apellido.trim()) e.apellido = "Requerido";
  if (!EMAIL.test(f.email)) e.email = "Ingresá un correo válido";
  if (f.password.length < 8) e.password = "Mínimo 8 caracteres"; // ajustar a las reglas reales del DTO
  if (!f.telefono.trim()) e.telefono = "Requerido";
  if (!f.direccion.trim()) e.direccion = "Requerido";
  return e;
}