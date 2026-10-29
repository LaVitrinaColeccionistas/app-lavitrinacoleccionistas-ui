import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import Alert from "../../components/common/Alert";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Pagination from "../../components/common/Pagination";
import Table from "../../components/common/Table";
import Textarea from "../../components/common/Textarea";
import { useAuth } from "../../context/AuthContext";
import useNombres from "../../hooks/useNombres";
import {
  crearOferta,
  obtenerOfertas,
  obtenerPublicacion,
} from "../../services/catalogoService";
import {
  formatearDinero,
  formatearFecha,
  imagenDePublicacion,
} from "../vendedor/opciones";

const POR_PAGINA = 8;

const ESTADOS = {
  PENDIENTE: { label: "Pendiente", variant: "warning" },
  ACEPTADA: { label: "Oferta aceptada", variant: "success" },
  RECHAZADA: { label: "Oferta rechazada", variant: "danger" },
  EXPIRADA: { label: "Expirada", variant: "neutral" },
};

const filtrosVacios = { precioMin: "", precioMax: "", fechaMin: "", fechaMax: "" };

const soloDigitos = (v) => v.replace(/\D/g, "");
const dia = (f) => (f ? String(f).slice(0, 10) : "");

function precioActual(pub) {
  const precios = (pub?.detalles ?? [])
    .map((d) => Number(d.precioUnitario))
    .filter((n) => !Number.isNaN(n));

  if (!precios.length) return null;

  const min = Math.min(...precios);
  return precios.length > 1
    ? `Desde ${formatearDinero(min)}`
    : formatearDinero(min);
}

function Miniatura({ src }) {
  return src ? (
    <img src={src} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover" />
  ) : (
    <div className="h-10 w-10 shrink-0 rounded-md bg-[#F6F6F8]" />
  );
}

export default function OfertasPage() {
  const { usuarioId } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const idPublicacion = searchParams.get("publicacion");

  // Formulario
  const [pub, setPub] = useState(null);
  const [monto, setMonto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [errorForm, setErrorForm] = useState("");
  const [exito, setExito] = useState("");

  // Lista de ofertas enviadas
  const [ofertas, setOfertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorLista, setErrorLista] = useState("");
  const [filtros, setFiltros] = useState(filtrosVacios);
  const [pagina, setPagina] = useState(0);

  const nombreDe = useNombres(ofertas.map((o) => o.idVendedor));

  useEffect(() => {
    if (!idPublicacion) return undefined;

    let cancelado = false;
    obtenerPublicacion(idPublicacion)
      .then((data) => !cancelado && setPub(data))
      .catch(
        (err) =>
          !cancelado &&
          setErrorForm(err.message || "No se pudo cargar la publicación.")
      );

    return () => {
      cancelado = true;
    };
  }, [idPublicacion]);

  const pubVisible = idPublicacion ? pub : null;

  /* Ofertas enviadas por el comprador + datos de cada publicación */
  const cargarOfertas = useCallback(async () => {
    if (!usuarioId) return;

    try {
      setCargando(true);
      setErrorLista("");

      const data = await obtenerOfertas({ idComprador: usuarioId, size: 100 });
      const lista = data?.content ?? [];

      const ids = [...new Set(lista.map((o) => o.idPublicacion))];
      const pubs = await Promise.all(
        ids.map((id) => obtenerPublicacion(id).catch(() => null))
      );
      const porId = Object.fromEntries(
        pubs.filter(Boolean).map((p) => [p.id, p])
      );

      setOfertas(
        lista
          .map((o) => ({
            ...o,
            idVendedor: porId[o.idPublicacion]?.idVendedor,
            titulo: porId[o.idPublicacion]?.titulo ?? `Publicación #${o.idPublicacion}`,
            imagen: imagenDePublicacion(porId[o.idPublicacion]),
          }))
          .sort((a, b) => new Date(b.fechaOferta) - new Date(a.fechaOferta))
      );
    } catch (err) {
      console.error(err);
      setErrorLista(err.message || "No fue posible cargar tus ofertas.");
    } finally {
      setCargando(false);
    }
  }, [usuarioId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { cargarOfertas(); }, [cargarOfertas]);

  /* Filtros (se aplican en el navegador: el backend no los ofrece) */
  const filtradas = useMemo(
    () =>
      ofertas.filter((o) => {
        const valor = Number(o.montoOfertado);
        const fecha = dia(o.fechaOferta);

        if (filtros.precioMin !== "" && valor < Number(filtros.precioMin)) return false;
        if (filtros.precioMax !== "" && valor > Number(filtros.precioMax)) return false;
        if (filtros.fechaMin && fecha < filtros.fechaMin) return false;
        if (filtros.fechaMax && fecha > filtros.fechaMax) return false;
        return true;
      }),
    [ofertas, filtros]
  );

  const cambiarFiltro = (e) => {
    setFiltros((f) => ({ ...f, [e.target.name]: e.target.value }));
    setPagina(0);
  };

  const totalPaginas = Math.ceil(filtradas.length / POR_PAGINA);
  const visibles = filtradas.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA);

  /* Envío de la oferta */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorForm("");
    setExito("");

    if (!pubVisible) {
      return setErrorForm("Elegí una publicación del catálogo para hacer tu oferta.");
    }
    if (pubVisible.estadoPublicacion !== "ACTIVA") {
      return setErrorForm("Esta publicación ya no está disponible.");
    }
    if (pubVisible.idVendedor === usuarioId) {
      return setErrorForm("No podés ofertar en tu propia publicación.");
    }

    const valor = Number(monto);
    if (!valor || valor <= 0) {
      return setErrorForm("Ingresá un monto mayor a cero.");
    }

    try {
      setEnviando(true);

      await crearOferta({
        idPublicacion: pubVisible.id,
        idComprador: usuarioId,
        montoOfertado: valor,
        ...(mensaje.trim() && { mensaje: mensaje.trim() }),
      });

      setExito("Oferta enviada. El vendedor la evaluará.");
      setMonto("");
      setMensaje("");
      setPub(null);
      setSearchParams({}, { replace: true });
      await cargarOfertas();
    } catch (err) {
      setErrorForm(err.message || "No fue posible enviar la oferta.");
    } finally {
      setEnviando(false);
    }
  };

  const columnas = [
    { key: "articulo", label: "Artículo" },
    { key: "vendedor", label: "Vendedor" },
    { key: "oferta", label: "Tu Oferta" },
    { key: "estado", label: "Estado" },
    { key: "fecha", label: "Fecha" },
  ];

  const precio = precioActual(pubVisible);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="grid items-start gap-6 lg:grid-cols-[380px_1fr]">
        {/* ───────── HACER UNA OFERTA ───────── */}
        <Card
          title="Hacer una Oferta"
          subtitle="Proponé un precio inferior. El vendedor evaluará tu propuesta."
        >
          {exito && (
            <Alert variant="success" className="mb-4" onClose={() => setExito("")}>
              {exito}
            </Alert>
          )}
          {errorForm && (
            <Alert variant="danger" className="mb-4" onClose={() => setErrorForm("")}>
              {errorForm}
            </Alert>
          )}

          {pubVisible ? (
            <div className="mb-5 flex items-center gap-3 rounded-lg bg-[#F6F6F8] p-3">
              <Miniatura src={imagenDePublicacion(pubVisible)} />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#1F2937]">
                  {pubVisible.titulo}
                </p>
                {precio && (
                  <p className="text-xs text-[#6B7280]">Precio actual: {precio}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="mb-5 rounded-lg bg-[#F6F6F8] p-3 text-sm text-[#6B7280]">
              Elegí un artículo desde el{" "}
              <Link to="/catalogo" className="font-semibold text-[#5146E5] underline">
                catálogo
              </Link>{" "}
              y presioná &ldquo;Hacer oferta&rdquo;.
            </p>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Input
              label="Monto Ofrecido (Gs.)"
              name="monto"
              inputMode="numeric"
              placeholder="0"
              value={monto ? Number(monto).toLocaleString("es-PY") : ""}
              onChange={(e) => setMonto(soloDigitos(e.target.value))}
              disabled={!pubVisible}
            />

            <Textarea
              label="Mensaje Opcional para el vendedor"
              name="mensaje"
              rows={4}
              maxLength={500}
              placeholder="Ej.: Hola, me interesa mucho. ¿Podemos coordinar para esta semana?"
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              disabled={!pubVisible}
            />

            <Button type="submit" fullWidth loading={enviando} disabled={!pubVisible}>
              Enviar Oferta y Confirmar
            </Button>
          </form>
        </Card>

        {/* ───────── MIS OFERTAS ENVIADAS ───────── */}
        <Card title="Mis Ofertas Enviadas">
          {errorLista && (
            <Alert variant="danger" className="mb-4" onClose={() => setErrorLista("")}>
              {errorLista}
            </Alert>
          )}

          <div className="mb-5 grid gap-4 rounded-lg border border-[#E5E7EB] p-4 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase text-[#4B5563]">
                Rango de precio
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Input name="precioMin" type="number" min="0" placeholder="Min"
                  value={filtros.precioMin} onChange={cambiarFiltro} />
                <Input name="precioMax" type="number" min="0" placeholder="Max"
                  value={filtros.precioMax} onChange={cambiarFiltro} />
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase text-[#4B5563]">
                Rango de fecha
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Input name="fechaMin" type="date"
                  value={filtros.fechaMin} onChange={cambiarFiltro} />
                <Input name="fechaMax" type="date"
                  value={filtros.fechaMax} onChange={cambiarFiltro} />
              </div>
            </div>
          </div>

          {cargando ? (
            <p className="py-12 text-center text-sm text-[#6B7280]">Cargando...</p>
          ) : (
            <Table
              columns={columnas}
              data={visibles}
              emptyMessage={
                ofertas.length ? "Ninguna oferta coincide con los filtros." : "Todavía no enviaste ofertas."
              }
              renderRow={(o) => (
                <>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <Miniatura src={o.imagen} />
                      <span className="font-semibold text-[#1F2937]">{o.titulo}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-[#4B5563]">
                    {o.idVendedor != null ? nombreDe(o.idVendedor, `Vendedor #${o.idVendedor}`) : "-"}
                  </td>
                  <td className="px-4 py-4 font-bold text-[#1F2937]">
                    {formatearDinero(o.montoOfertado)}
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant={ESTADOS[o.estadoOferta]?.variant ?? "neutral"}>
                      {ESTADOS[o.estadoOferta]?.label ?? o.estadoOferta}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-[#6B7280]">
                    {formatearFecha(o.fechaOferta)}
                  </td>
                </>
              )}
            />
          )}

          <div className="mt-5">
            <Pagination
              currentPage={pagina + 1}
              totalPages={totalPaginas}
              onPageChange={(p) => setPagina(p - 1)}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}