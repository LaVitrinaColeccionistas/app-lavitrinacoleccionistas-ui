import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import Alert from "../../components/common/Alert";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/common/Badge";
import Breadcrumb from "../../components/layout/Breadcrumb";
import Button from "../../components/common/Button";
import { useAuth } from "../../context/AuthContext";
import { obtenerPublicacion } from "../../services/catalogoService";
import { agregarAlCarrito, entradasDePublicacion } from "../../utils/carrito";
import { formatearDinero } from "../vendedor/opciones";
import { esOfertable, precioPrincipal, precioTotal } from "../../utils/precios";
import useNombres from "../../hooks/useNombres";

const COLOR_RAREZA = {
  "Ultra Raro": "danger",
  Raro: "warning",
  "Poco Común": "info",
  Común: "neutral",
};

// Solo estados que el back puede devolver en GET /publicaciones/{id} (ELIMINADA responde 404)
const ESTADO_PUB = {
  PAUSADA: "Esta publicación está pausada.",
  VENDIDA: "Esta publicación ya fue vendida.",
};

export default function DetallePublicacionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuarioId, autenticado, tieneRol } = useAuth();

  const [pub, setPub] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [indiceImg, setIndiceImg] = useState(0);
  const [avisoCarrito, setAvisoCarrito] = useState(null);

  useEffect(() => {
    let cancelado = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCargando(true);
    setError("");
    setIndiceImg(0);

    obtenerPublicacion(id)
      .then((data) => !cancelado && setPub(data))
      .catch(
        (err) =>
          !cancelado &&
          setError(
            err.status === 404
              ? "La publicación no existe."
              : err.message || "No se pudo cargar la publicación."
          )
      )
      .finally(() => !cancelado && setCargando(false));

    return () => {
      cancelado = true;
    };
  }, [id]);

  const detalles = useMemo(() => pub?.detalles ?? [], [pub]);
  const principal = detalles[0]?.producto ?? {};

  const nombreDe = useNombres([pub?.idVendedor]);
  const nombreVendedor = nombreDe(pub?.idVendedor, `Vendedor #${pub?.idVendedor}`);

  // Una imagen por producto de la publicación (el backend solo guarda urlImagen por producto)
  const imagenes = useMemo(
    () =>
      detalles
        .map((d) => d.producto?.urlImagen)
        .filter((u, i, arr) => u && arr.indexOf(u) === i),
    [detalles]
  );

  const { valor: valorPrincipal, etiqueta: etiquetaPrecio } = precioPrincipal(pub);
  const precio = valorPrincipal != null ? formatearDinero(valorPrincipal) : "-";
  const total = precioTotal(pub);
  const esLote = pub?.tipoVenta === "OFERTA_LIBRE" && detalles.length > 1;
  // Un solo producto con varias unidades publicadas: aclarar que el precio es por unidad
  const esPorUnidad = detalles.length === 1 && Number(detalles[0]?.cantidadPublicada ?? 0) > 1;
  const ofertable = esOfertable(pub);

  // Unidades que se pueden comprar ahora: lo publicado menos lo reservado por otras operaciones
  const stock = detalles.reduce((s, d) => s + (d.cantidadDisponible ?? d.cantidadPublicada ?? 0), 0);

  const esPropia = Boolean(pub) && pub.idVendedor === usuarioId;
  const activa = pub?.estadoPublicacion === "ACTIVA";
  // Sin unidades libres (todo reservado) no se puede comprar, ofertar ni intercambiar
  const puedeActuar = activa && !esPropia && stock > 0;
  // Una oferta reserva el lote completo: con alguna unidad reservada no se podría aceptar
  const puedeOfertar = activa && !esPropia && ofertable;

  // Las rutas destino son protegidas. Si no hay sesión, se vuelve a este detalle tras el login
  // (ProtectedRoute no conserva location.state, por eso no se delega en él).
  const requerirSesion = (accion) => {
    if (!autenticado) {
      navigate("/login", { state: { from: `/catalogo/${id}` } });
      return;
    }
    accion();
  };

  const puedeComprar = !autenticado || tieneRol("COMPRADOR") || tieneRol("ADMIN");

  const agregarCarrito = () =>
    requerirSesion(() => {
      const agregados = agregarAlCarrito(usuarioId, entradasDePublicacion(pub));
      setAvisoCarrito(
        agregados > 0
          ? { variant: "success", texto: "Se agregó a tu carrito." }
          : { variant: "info", texto: "Ya tenés el máximo disponible de esta publicación en tu carrito." }
      );
    });

  const comprarAhora = () =>
    requerirSesion(() => {
      agregarAlCarrito(usuarioId, entradasDePublicacion(pub));
      navigate("/carrito");
    });

  const hacerOferta = () =>
    requerirSesion(() => navigate(`/ofertas?publicacion=${pub.id}`));

  // ProponerIntercambioPage envía producto.id como idProducto: debe ser el id del PRODUCTO
  /*const proponerIntercambio = () =>
    requerirSesion(() =>
      navigate("/intercambios/nuevo", {
        state: {
          producto: {
            id: principal.id,
            nombre: principal.nombre ?? pub.titulo,
            imagen: principal.urlImagen,
            estado: principal.estadoConservacion,
            idVendedor: pub.idVendedor,
          },
        },
      })
    );*/

    const proponerIntercambio = () =>
    requerirSesion(() =>
      navigate("/intercambios/nuevo", {
        state: {
          idPublicacion: pub.id,
        },
      })
    );

  if (cargando) {
    return <p className="py-24 text-center text-sm text-[#6B7280]">Cargando publicación...</p>;
  }

  if (error || !pub) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Alert variant="danger">{error || "Publicación no disponible."}</Alert>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/catalogo")}>
          Volver al catálogo
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <Breadcrumb
        className="mb-6"
        items={[
          { label: "Catálogo", to: "/catalogo" },
          ...(principal.categoria ? [{ label: principal.categoria }] : []),
          { label: pub.titulo },
        ]}
      />

      <div className="grid items-start gap-10 lg:grid-cols-2">
        {/* ───────── GALERÍA ───────── */}
        <div>
          <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-[#E5E7EB]">
            {imagenes[indiceImg] ? (
              <img
                src={imagenes[indiceImg]}
                alt={pub.titulo}
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="text-sm text-[#9CA3AF]">Sin imagen</span>
            )}
          </div>

          {imagenes.length > 1 && (
            <div className="mt-3 flex gap-3">
              {imagenes.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setIndiceImg(i)}
                  aria-label={`Ver imagen ${i + 1}`}
                  className={`h-16 w-16 overflow-hidden rounded-lg border-2 bg-white ${
                    i === indiceImg ? "border-[#5146E5]" : "border-transparent"
                  }`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ───────── INFORMACIÓN ───────── */}
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            {principal.rareza && (
              <Badge variant={COLOR_RAREZA[principal.rareza] ?? "neutral"}>
                {principal.rareza}
              </Badge>
            )}
            {principal.estadoConservacion && (
              <Badge variant="success">{principal.estadoConservacion}</Badge>
            )}
            <Badge variant="neutral">
              Stock: {stock} {stock === 1 ? "unidad" : "unidades"}
            </Badge>
          </div>

          <h1 className="text-3xl font-bold leading-tight text-[#1F2937]">{pub.titulo}</h1>
          <div className="mt-3">
            {etiquetaPrecio && (
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                {etiquetaPrecio === "Lote" ? "Valor de referencia del lote" : "Desde"}
              </p>
            )}
            <p className="text-3xl font-bold text-[#5146E5]">{precio}</p>
            {esPorUnidad && (
              <p className="mt-1 text-sm text-[#6B7280]">por unidad</p>
            )}
          </div>

          {detalles.length > 1 && (
            <div className="mt-4 rounded-lg border border-[#E5E7EB]">
              <ul className="divide-y divide-[#E5E7EB] text-sm">
                {detalles.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="min-w-0 truncate text-[#374151]">
                      {d.producto?.nombre}
                      <span className="text-[#9CA3AF]">
                        {" · "}
                        {esLote
                          ? `${d.cantidadPublicada} u.`
                          : `Disponible: ${d.cantidadDisponible ?? d.cantidadPublicada}`}
                      </span>
                    </span>
                    <span className="shrink-0 font-medium text-[#1F2937]">
                      {formatearDinero(d.precioUnitario)}
                    </span>
                  </li>
                ))}
              </ul>
              {total != null && (
                <div className="flex justify-between border-t border-[#E5E7EB] bg-[#FAFAFC] px-3 py-2 text-sm">
                  <span className="font-semibold text-[#374151]">
                    {esLote ? "Total del lote" : "Total si comprás todo"}
                  </span>
                  <strong className="text-[#1F2937]">{formatearDinero(total)}</strong>
                </div>
              )}
            </div>
          )}

          <hr className="my-6 border-[#E5E7EB]" />

          {pub.descripcion && (
            <>
              <h2 className="text-sm font-bold text-[#1F2937]">Descripción del coleccionable</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#6B7280]">
                {pub.descripcion}
              </p>
            </>
          )}

          <div className="mt-6 flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4">
            <Avatar name={nombreVendedor} size="lg" />
            <div>
              <p className="text-sm font-bold text-[#1F2937]">{nombreVendedor}</p>
              {esPropia && <p className="text-xs text-[#6B7280]">Es tu publicación</p>}
            </div>
          </div>

          {/* ───────── ACCIONES ───────── */}
          <div className="mt-6 space-y-3">
            {!activa && (
              <Alert variant="warning">
                {ESTADO_PUB[pub.estadoPublicacion] ?? "Publicación no disponible."}
              </Alert>
            )}
            {esPropia && activa && (
              <Alert variant="info">No podés ofertar ni comprar en tu propia publicación.</Alert>
            )}

            {avisoCarrito && (
              <Alert variant={avisoCarrito.variant} onClose={() => setAvisoCarrito(null)}>
                {avisoCarrito.texto}{" "}
                {avisoCarrito.variant === "success" && (
                  <Link to="/carrito" className="font-semibold underline">
                    Ver carrito
                  </Link>
                )}
              </Alert>
            )}

            {pub.tipoVenta === "PRECIO_FIJO" && (
              <>
                <Button
                  size="lg"
                  fullWidth
                  disabled={!puedeActuar || !puedeComprar}
                  onClick={comprarAhora}
                >
                  Comprar ahora (Coordinar pago)
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  fullWidth
                  disabled={!puedeActuar || !puedeComprar}
                  onClick={agregarCarrito}
                >
                  Agregar al carrito
                </Button>
              </>
            )}

            <Button
              variant="outline"
              size="lg"
              fullWidth
              disabled={!puedeOfertar}
              onClick={hacerOferta}
            >
              {pub?.tipoVenta === "OFERTA_LIBRE" ? "Ofertar en subasta" : "Hacer una oferta monetaria"}
            </Button>
            {activa && !esPropia && !ofertable && (
              <p className="-mt-1 text-xs text-[#6B7280]">
                No se puede ofertar ahora: hay unidades reservadas por otra operación y la
                oferta es por el lote completo.
              </p>
            )}

            <Button
              variant="outlineSuccess"
              size="lg"
              fullWidth
              disabled={!puedeActuar || !principal.id}
              onClick={proponerIntercambio}
            >
              Proponer intercambio
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}