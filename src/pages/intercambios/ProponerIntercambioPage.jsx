import { useEffect, useState } from "react";
import { ArrowLeftRight, Trash2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import MultiSelect from "../../components/common/MultiSelect";
import NuevoProductoPage from "../vendedor/NuevoProductoPage";

import {
  ORIGEN_RESERVA,
  reservarStock,
  obtenerPublicacion,
  obtenerProductos,
} from "../../services/catalogoService";
import { cambiarEstadoIntercambio, crearIntercambio } from "../../services/intercambiosService";

function dinero(valor) {
  if (valor == null) return "Sin precio";
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(Number(valor));
}

export default function ProponerIntercambioPage({ usuarioId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const idPublicacion = location.state?.idPublicacion;

  const [publicacion, setPublicacion] = useState(null);
  const [misProductos, setMisProductos] = useState([]);
  const [ofrecidos, setOfrecidos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [diferenciaDinero, setDiferenciaDinero] = useState("");
  const [cargando, setCargando] = useState(Boolean(idPublicacion));
  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [pagadorDiferencia, setPagadorDiferencia] = useState("PROPONENTE");
  const [modalNuevoProducto, setModalNuevoProducto] = useState(false);
  const [recargaProductos, setRecargaProductos] = useState(0);

  useEffect(() => {
    if (!idPublicacion) return;

    let activo = true;

    obtenerPublicacion(idPublicacion)
      .then((datos) => {
        if (activo) setPublicacion(datos);
      })
      .catch((err) => {
        if (activo) {
          console.error(err);
          setError("No se pudo cargar la publicación.");
        }
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [idPublicacion]);

  useEffect(() => {
    if (!usuarioId) return;

    let activo = true;

    obtenerProductos({
      page: pagina,
      size: 10,
      idVendedor: usuarioId,
      nombre: busqueda,
    })
      .then((datos) => {
        if (!activo) return;
        setMisProductos(
          (datos.content ?? []).filter(
            (producto) =>
              Number(producto.idVendedor) === Number(usuarioId) &&
              producto.activo !== false
          )
        );
        setTotalPaginas(datos.totalPages ?? 0);
      })
      .catch((err) => {
        if (activo) {
          console.error(err);
          setError("No se pudieron cargar tus productos.");
        }
      })
      .finally(() => {
        if (activo) setBuscando(false);
      });

    return () => {
      activo = false;
    };
  }, [usuarioId, pagina, busqueda, recargaProductos]);

  // Lo que se pide de la publicación: cantidad editable (hasta lo disponible) y se puede quitar.
  // Disponible = publicado - reservado por órdenes, ofertas u otros intercambios.
  const [cantidadesSolicitadas, setCantidadesSolicitadas] = useState({});
  const [excluidos, setExcluidos] = useState([]);

  const detallesPublicacion = publicacion?.detalles ?? [];
  const disponibleDe = (detalle) =>
    Math.max(0, Number(detalle.cantidadDisponible ?? detalle.cantidadPublicada ?? 0));

  const solicitados = detallesPublicacion
    .filter((detalle) => disponibleDe(detalle) > 0 && !excluidos.includes(detalle.id))
    .map((detalle) => ({
      ...detalle,
      cantidad: cantidadesSolicitadas[detalle.id] ?? disponibleDe(detalle),
    }));
  const agotados = detallesPublicacion.filter((detalle) => disponibleDe(detalle) === 0);

  function cambiarCantidadSolicitada(idDetalle, cantidad) {
    setCantidadesSolicitadas((actuales) => ({ ...actuales, [idDetalle]: cantidad }));
  }

  function quitarSolicitado(idDetalle) {
    setExcluidos((actuales) => [...actuales, idDetalle]);
  }

  function cambiarBusqueda(valor) {
    setBuscando(true);
    setBusqueda(valor);
    setPagina(0);
  }

  function alternarProducto(producto) {
    setOfrecidos((actuales) => {
      if (actuales.some((item) => item.id === producto.id)) {
        return actuales.filter((item) => item.id !== producto.id);
      }

      if (Number(producto.stock) < 1) return actuales;

      return [...actuales, { ...producto, cantidad: 1 }];
    });
  }

  function cambiarCantidad(id, cantidad) {
    setOfrecidos((actuales) =>
      actuales.map((item) =>
        item.id === id ? { ...item, cantidad } : item
      )
    );
  }

  async function enviar(event) {
    event.preventDefault();
    setError("");

    if (!usuarioId || !publicacion) {
      setError("No se pudo identificar la sesión o la publicación.");
      return;
    }

    if (Number(publicacion.idVendedor) === Number(usuarioId)) {
      setError("No podés proponer un intercambio con vos mismo.");
      return;
    }

    if (publicacion.estadoPublicacion !== "ACTIVA") {
      setError("La publicación no está activa.");
      return;
    }

    if (solicitados.length === 0) {
      setError(
        agotados.length === detallesPublicacion.length
          ? "La publicación no tiene unidades disponibles en este momento."
          : "Seleccioná al menos un producto de la publicación."
      );
      return;
    }

    if (
      solicitados.some(
        (detalle) =>
          !detalle.producto?.id ||
          !Number.isInteger(Number(detalle.cantidad)) ||
          Number(detalle.cantidad) < 1 ||
          Number(detalle.cantidad) > disponibleDe(detalle)
      )
    ) {
      setError("Revisá las cantidades solicitadas: no pueden superar lo disponible.");
      return;
    }

    if (ofrecidos.length === 0) {
      setError("Seleccioná al menos un producto propio.");
      return;
    }

    if (
      ofrecidos.some(
        (producto) =>
          !Number.isInteger(Number(producto.cantidad)) ||
          Number(producto.cantidad) < 1 ||
          Number(producto.cantidad) > Number(producto.stock)
      )
    ) {
      setError("Revisá las cantidades de tus productos.");
      return;
    }

    const diferencia = Number(diferenciaDinero || 0);

    if (!Number.isFinite(diferencia) || diferencia < 0) {
      setError("Ingresá una compensación económica válida.");
      return;
    }

    const datos = {
      idUsuarioProponente: Number(usuarioId),
      idUsuarioReceptor: Number(publicacion.idVendedor),
      idPublicacion: Number(publicacion.id),
      tituloPublicacionSnapshot: publicacion.titulo,
      diferenciaDinero: diferencia,
      usuarioPagaDiferencia:
        diferencia === 0
          ? null
          : pagadorDiferencia === "PROPONENTE"
            ? Number(usuarioId)
            : Number(publicacion.idVendedor),
      detalles: [
        ...solicitados.map((detalle) => ({
          idProducto: Number(detalle.producto.id),
          cantidad: Number(detalle.cantidad),
          tipoMovimiento: "SOLICITADO",
        })),
        ...ofrecidos.map((producto) => ({
          idProducto: Number(producto.id),
          cantidad: Number(producto.cantidad),
          tipoMovimiento: "OFRECIDO",
        })),
      ],
    };

    try {
      setGuardando(true);
      const creado = await crearIntercambio(datos);

      // Aparta lo que ofrezco para que no lo venda mientras el receptor responde.
      // Si no hay stock libre, la propuesta se cancela para no dejarla sin respaldo.
      try {
        await reservarStock(
          ORIGEN_RESERVA.INTERCAMBIO,
          creado.id,
          ofrecidos.map((producto) => ({
            idProducto: Number(producto.id),
            cantidad: Number(producto.cantidad),
            idUsuarioDestino: Number(publicacion.idVendedor),
          }))
        );
      } catch (err) {
        await cambiarEstadoIntercambio(creado.id, "CANCELADO").catch(() => {});
        throw err;
      }

      navigate("/intercambios");
    } catch (err) {
      console.error(err);
      setError(
        err?.status === 409 || err?.status === 400 || err?.status === 403
          ? err.message
          : "No fue posible crear la propuesta."
      );
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <p className="py-10 text-center text-sm text-[#6B7280]">
        Cargando publicación...
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F0EFFF]">
          <ArrowLeftRight size={20} className="text-[#5146E5]" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">
            Proponer nuevo intercambio
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Seleccioná los productos que querés ofrecer.
          </p>
        </div>
      </div>

      {!idPublicacion && (
        <Alert variant="danger" className="mb-5">
          Ingresá desde una publicación del catálogo.
        </Alert>
      )}

      {error && (
        <Alert
          variant="danger"
          className="mb-5"
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      <form onSubmit={enviar} className="space-y-5">
        <Card
          title="Productos solicitados"
          subtitle={publicacion?.titulo ?? "Productos de la publicación"}
        >
          {detallesPublicacion.length === 0 ? (
            <p className="text-sm text-[#6B7280]">
              No hay productos en esta publicación.
            </p>
          ) : (
            <>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#374151]">
                  Productos seleccionados ({solicitados.length})
                </h3>
                {excluidos.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setExcluidos([])}
                    className="text-xs font-medium text-[#4F46E5] hover:underline"
                  >
                    Restablecer
                  </button>
                )}
              </div>

              {solicitados.length > 0 ? (
                <div className="divide-y divide-[#E5E7EB] rounded-lg border border-[#E5E7EB] px-3">
                  {solicitados.map((detalle) => (
                    <div
                      key={detalle.id}
                      className="flex flex-wrap items-center gap-3 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[#1F2937]">
                          {detalle.producto?.nombre ?? "Producto"}
                        </p>
                        <p className="text-xs text-[#6B7280]">
                          {dinero(detalle.precioUnitario)}
                          {" · "}
                          Disponible: {disponibleDe(detalle)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <label
                          htmlFor={`solicitado-${detalle.id}`}
                          className="text-xs text-[#6B7280]"
                        >
                          Cant.
                        </label>

                        <input
                          id={`solicitado-${detalle.id}`}
                          type="number"
                          min="1"
                          max={disponibleDe(detalle)}
                          required
                          value={detalle.cantidad}
                          onChange={(event) =>
                            cambiarCantidadSolicitada(detalle.id, event.target.value)
                          }
                          className="w-16 rounded-md border border-[#D1D5DB] px-2 py-1.5 text-center text-sm"
                        />

                        <Button
                          type="button"
                          variant="outlineDanger"
                          size="sm"
                          onClick={() => quitarSolicitado(detalle.id)}
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-[#D1D5DB] bg-[#FAFAFC] py-4 text-center text-sm text-[#6B7280]">
                  {agotados.length === detallesPublicacion.length
                    ? "No hay unidades disponibles: están reservadas por otras operaciones."
                    : "Quitaste todos los productos."}
                </div>
              )}

              {agotados.length > 0 && (
                <p className="mt-2 text-xs text-[#9CA3AF]">
                  Sin unidades disponibles (reservadas):{" "}
                  {agotados.map((detalle) => detalle.producto?.nombre ?? "Producto").join(", ")}
                </p>
              )}

              {solicitados.length > 0 && (
                <div className="mt-4 flex justify-between gap-4 border-t border-[#E5E7EB] pt-4 text-sm">
                  <span className="font-semibold text-[#374151]">Total de referencia solicitado</span>
                  <strong className="text-[#1F2937]">
                    {solicitados.some((detalle) => detalle.precioUnitario == null)
                      ? "No disponible"
                      : dinero(
                          solicitados.reduce(
                            (total, detalle) =>
                              total + Number(detalle.precioUnitario) * Number(detalle.cantidad || 0),
                            0
                          )
                        )}
                  </strong>
                </div>
              )}
            </>
          )}
        </Card>

        <Card
          title="Tus productos ofrecidos"
          subtitle="Seleccioná uno o varios de tus productos."
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="min-w-0 flex-1">
              <MultiSelect
                items={misProductos.map((producto) => ({
                  ...producto,
                  descripcion: `${dinero(producto.precioReferencia)} · Stock: ${producto.stock ?? 0}`,
                }))}
                selectedIds={ofrecidos.map((producto) => producto.id)}
                onToggle={alternarProducto}
                search={busqueda}
                onSearchChange={cambiarBusqueda}
                loading={buscando}
                placeholder="Buscar y seleccionar mis productos..."
                footer={
                  totalPaginas > 1 ? (
                    <div className="flex items-center justify-between gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pagina === 0}
                        onClick={() => {
                          setBuscando(true);
                          setPagina((actual) => actual - 1);
                        }}
                      >
                        Anterior
                      </Button>

                      <span className="text-xs text-[#6B7280]">
                        {pagina + 1} de {totalPaginas}
                      </span>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pagina + 1 >= totalPaginas}
                        onClick={() => {
                          setBuscando(true);
                          setPagina((actual) => actual + 1);
                        }}
                      >
                        Siguiente
                      </Button>
                    </div>
                  ) : null
                }
              />
            </div>

            <div className="shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalNuevoProducto(true)}
              >
                + Nuevo Producto
              </Button>
            </div>
          </div>

          {ofrecidos.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-semibold text-[#374151]">
                Productos seleccionados ({ofrecidos.length})
              </h3>

              <div className="divide-y divide-[#E5E7EB] rounded-lg border border-[#E5E7EB] px-3">
                {ofrecidos.map((producto) => (
                  <div
                    key={producto.id}
                    className="flex flex-wrap items-center gap-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#1F2937]">
                        {producto.nombre}
                      </p>
                      <p className="text-xs text-[#6B7280]">
                        {dinero(producto.precioReferencia)}
                        {" · "}
                        Stock: {producto.stock}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <label
                        htmlFor={`cantidad-${producto.id}`}
                        className="text-xs text-[#6B7280]"
                      >
                        Cant.
                      </label>

                      <input
                        id={`cantidad-${producto.id}`}
                        type="number"
                        min="1"
                        max={producto.stock}
                        required
                        value={producto.cantidad}
                        onChange={(event) =>
                          cambiarCantidad(
                            producto.id,
                            event.target.value
                          )
                        }
                        className="w-16 rounded-md border border-[#D1D5DB] px-2 py-1.5 text-center text-sm"
                      />

                      <Button
                        type="button"
                        variant="outlineDanger"
                        size="sm"
                        onClick={() => alternarProducto(producto)}
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-between gap-4 text-sm">
                <span className="font-semibold text-[#374151]">Total de referencia ofrecido</span>
                <strong className="text-[#1F2937]">
                  {ofrecidos.some((producto) => producto.precioReferencia == null)
                    ? "No disponible"
                    : dinero(
                        ofrecidos.reduce(
                          (total, producto) =>
                            total + Number(producto.precioReferencia) * Number(producto.cantidad ?? 0),
                          0
                        )
                      )}
                </strong>
              </div>
            </div>
          )}
        </Card>

        <Card
          title="Compensación económica"
          subtitle="Indicá una diferencia solamente si corresponde."
        >
          <Input
            label="Diferencia en guaraníes"
            name="diferenciaDinero"
            type="number"
            min="0"
            value={diferenciaDinero}
            onChange={(event) =>
              setDiferenciaDinero(event.target.value)
            }
            placeholder="0"
          />

          {Number(diferenciaDinero) > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-[#374151]">
                ¿Quién paga la diferencia?
              </p>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="pagadorDiferencia"
                    value="PROPONENTE"
                    checked={pagadorDiferencia === "PROPONENTE"}
                    onChange={() => setPagadorDiferencia("PROPONENTE")}
                  />
                  Yo, quien propone el intercambio
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="pagadorDiferencia"
                    value="RECEPTOR"
                    checked={pagadorDiferencia === "RECEPTOR"}
                    onChange={() => setPagadorDiferencia("RECEPTOR")}
                  />
                  El propietario de la publicación
                </label>
              </div>
            </div>
          )}
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/intercambios")}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            loading={guardando}
            disabled={
              !publicacion ||
              ofrecidos.length === 0 ||
              guardando
            }
          >
            Proponer intercambio
          </Button>
        </div>
      </form>

      {modalNuevoProducto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
            <button
              type="button"
              aria-label="Cerrar"
              onClick={() => setModalNuevoProducto(false)}
              className="absolute right-4 top-4 z-10 text-xl text-gray-500 hover:text-gray-800"
            >
              ×
            </button>
            <NuevoProductoPage
              onCancel={() => setModalNuevoProducto(false)}
              onCreated={() => {
                setModalNuevoProducto(false);
                setBusqueda("");
                setPagina(0);
                setBuscando(true);
                setRecargaProductos((actual) => actual + 1);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}