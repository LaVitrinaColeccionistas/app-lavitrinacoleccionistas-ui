export const esErrorCritico = (err) =>
  err?.status == null || err.status >= 500;

export const esNoEncontrado = (err) => err?.status === 404;

export function resolverError(err, navigate) {
  if (esNoEncontrado(err)) {
    navigate("/404", { replace: true });
    return true;
  }

  if (esErrorCritico(err)) {
    navigate("/error", { replace: true });
    return true;
  }

  return false;
}
