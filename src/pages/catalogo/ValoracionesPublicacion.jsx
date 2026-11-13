import { useEffect, useState } from "react";

import Avatar from "../../components/ui/Avatar";
import Card from "../../components/common/Card";
import Estrellas from "../../components/common/Estrellas";
import Pagination from "../../components/common/Pagination";
import useNombres from "../../hooks/useNombres";
import {
  obtenerResumenValoraciones,
  obtenerValoracionesPublicacion,
  paginaDe,
} from "../../services/comprasService";
import { formatearFecha } from "../compras/opciones";

const POR_PAGINA = 5;

export default function ValoracionesPublicacion({ idPublicacion }) {
  const [resumen, setResumen] = useState({ promedio: 0, total: 0 });
  const [resenas, setResenas] = useState([]);
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [fallo, setFallo] = useState(false);

  const nombreDe = useNombres(resenas.map((r) => r.idComprador));

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      try {
        setCargando(true);
        setFallo(false);
        const [datos, cabecera] = await Promise.all([
          obtenerValoracionesPublicacion(idPublicacion, { page: pagina, size: POR_PAGINA }),
          obtenerResumenValoraciones(idPublicacion),
        ]);
        if (cancelado) return;
        const { items, totalPaginas: paginas } = paginaDe(datos);
        setResenas(items);
        setTotalPaginas(paginas);
        setResumen(cabecera ?? { promedio: 0, total: 0 });
      } catch {
        if (!cancelado) setFallo(true);
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, [idPublicacion, pagina]);

  return (
    <section className="mt-12" aria-labelledby="titulo-resenas">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h2 id="titulo-resenas" className="text-xl font-bold text-[#1F2937]">
          Reseñas de compradores
        </h2>
        {resumen.total > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-[#1F2937]">{Number(resumen.promedio).toFixed(1)}</span>
            <Estrellas valor={resumen.promedio} />
            <span className="text-sm text-[#6B7280]">
              ({resumen.total} {resumen.total === 1 ? "reseña" : "reseñas"})
            </span>
          </div>
        )}
      </div>

      <Card padding="lg">
        {cargando ? (
          <p className="py-6 text-center text-sm text-[#6B7280]">Cargando reseñas...</p>
        ) : fallo ? (
          <p className="py-6 text-center text-sm text-[#6B7280]">No fue posible cargar las reseñas.</p>
        ) : resenas.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#6B7280]">
            Todavía nadie dejó una reseña de esta publicación.
          </p>
        ) : (
          <ul className="divide-y divide-[#ECEEF2]">
            {resenas.map((r) => (
              <li key={r.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                <Avatar name={nombreDe(r.idComprador, "Comprador")} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="text-sm font-bold text-[#1F2937]">{nombreDe(r.idComprador, "Comprador")}</p>
                    <Estrellas valor={r.puntuacion} size={15} />
                    <span className="text-xs text-[#9CA3AF]">{formatearFecha(r.fechaCreacion)}</span>
                  </div>
                  {r.comentario && (
                    <p className="mt-1 whitespace-pre-line break-words text-sm text-[#4B5563]">{r.comentario}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {totalPaginas > 1 && (
        <div className="mt-4">
          <Pagination currentPage={pagina + 1} totalPages={totalPaginas} onPageChange={(p) => setPagina(p - 1)} />
        </div>
      )}
    </section>
  );
}
