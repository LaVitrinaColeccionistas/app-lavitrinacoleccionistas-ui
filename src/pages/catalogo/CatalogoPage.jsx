import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import ProductCard from "../../components/product/ProductCard";
import Pagination from "../../components/common/Pagination";
import Alert from "../../components/common/Alert";
import { obtenerPublicaciones } from "../../services/catalogoService";
const TAMANO_PAGINA = 9;

const formatearPrecio = (valor) =>
  `Gs. ${Number(valor).toLocaleString("es-PY")}`;

/**
 * Convierte una Publicacion (con sus detalles/productos) al formato
 * que espera <ProductCard />.
 * Es tolerante con los nombres de campos del DTO: ajusta aquí si difieren.
 */
function publicacionACard(pub) {
  const detalles =
    pub.detalles ?? pub.detallePublicacion ?? pub.detallesPublicacion ?? [];
  const primero = detalles[0];
  const producto = primero?.producto ?? primero ?? {};

  const precios = detalles
    .map((d) => Number(d.precioUnitario))
    .filter((n) => !Number.isNaN(n));

  let precio = "-";
  if (precios.length === 1) precio = precios[0];
  else if (precios.length > 1) precio = `Desde ${formatearPrecio(Math.min(...precios))}`;

  return {
    id: pub.id,
    nombre: pub.titulo,
    categoria: producto.categoria,
    estado: producto.estadoConservacion,
    imagen: producto.urlImagen,
    precio,
    idVendedor: pub.idVendedor,
  };
}

export default function CatalogoPage() {
  const [publicaciones, setPublicaciones] = useState([]);
  const [pagina, setPagina] = useState(0); // el backend es 0-based
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [busquedaAplicada, setBusquedaAplicada] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Debounce del buscador: espera 400 ms y vuelve a la primera página
  useEffect(() => {
    const t = setTimeout(() => {
      setBusquedaAplicada(busqueda);
      setPagina(0);
    }, 400);
    return () => clearTimeout(t);
  }, [busqueda]);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      try {
        setCargando(true);
        setError("");
        const data = await obtenerPublicaciones({
          page: pagina,
          size: TAMANO_PAGINA,
          busqueda: busquedaAplicada,
        });
        if (cancelado) return;
        setPublicaciones((data?.content ?? []).map(publicacionACard));
        setTotalPaginas(data?.totalPages ?? 0);
      } catch (err) {
        if (cancelado) return;
        console.error(err);
        setError(err.message || "No fue posible cargar el catálogo.");
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, [pagina, busquedaAplicada]);

  const handleVerProducto = (card) => {
    // TODO: navegar al detalle cuando exista la ruta (p. ej. /catalogo/:id)
    console.log("Ver publicación:", card.id);
  };

  const handleHacerOferta = (card) => {
    // TODO: abrir modal y llamar POST /api/ofertas (OfertaCreateDTO)
    console.log("Hacer oferta a publicación:", card.id);
  };

  return (
    <>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1F2937]">Catálogo</h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Explora artículos publicados por otros coleccionistas.
          </p>
        </div>

        <div className="relative mb-6">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
          />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar cartas, consolas, cómics vintage..."
            className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2.5 pl-10 pr-3.5 text-sm text-[#1F2937] outline-none transition-all placeholder:text-[#9CA3AF] focus:border-[#5146E5] focus:ring-2 focus:ring-[#E0DEFF]"
          />
        </div>

        {error && (
          <Alert variant="danger" className="mb-6" onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {cargando ? (
          <p className="py-16 text-center text-sm text-[#6B7280]">
            Cargando publicaciones...
          </p>
        ) : publicaciones.length === 0 && !error ? (
          <p className="py-16 text-center text-sm text-[#6B7280]">
            No se encontraron publicaciones.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {publicaciones.map((card) => (
              <ProductCard
                key={card.id}
                product={card}
                onView={handleVerProducto}
                onOffer={handleHacerOferta}
              />
            ))}
          </div>
        )}

        <div className="mt-8">
          <Pagination
            currentPage={pagina + 1}
            totalPages={totalPaginas}
            onPageChange={(p) => setPagina(p - 1)}
          />
        </div>
      </div>
    </>
  );
}