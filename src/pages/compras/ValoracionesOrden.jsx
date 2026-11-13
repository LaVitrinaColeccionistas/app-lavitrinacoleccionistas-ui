import { useEffect, useMemo, useState } from "react";

import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import Estrellas from "../../components/common/Estrellas";
import Textarea from "../../components/common/Textarea";
import { crearValoracion, obtenerValoracionesOrden } from "../../services/comprasService";

const LIMITE_COMENTARIO = 500;

function FormularioResena({ titulo, onEnviar }) {
  const [puntuacion, setPuntuacion] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const enviar = async () => {
    if (puntuacion < 1) {
      setError("Elegí una puntuación de 1 a 5 estrellas.");
      return;
    }
    try {
      setEnviando(true);
      setError("");
      await onEnviar({ puntuacion, comentario: comentario.trim() });
    } catch (err) {
      setError(err.message || "No fue posible guardar la reseña.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="rounded-lg border border-[#E5E7EB] p-4">
      <p className="text-sm font-semibold text-[#1F2937]">{titulo}</p>
      <Estrellas className="mt-2" valor={puntuacion} onChange={setPuntuacion} size={26} />

      <Textarea
        className="mt-3"
        name={`comentario-${titulo}`}
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        rows={2}
        maxLength={LIMITE_COMENTARIO}
        showCount
        placeholder="Contá brevemente cómo fue tu experiencia (opcional)"
      />

      {error && (
        <Alert variant="danger" className="mt-3">
          {error}
        </Alert>
      )}

      <div className="mt-3 flex justify-end">
        <Button size="sm" loading={enviando} onClick={enviar}>
          Publicar reseña
        </Button>
      </div>
    </div>
  );
}

export default function ValoracionesOrden({ orden, usuarioId }) {
  const [hechas, setHechas] = useState(null);
  const [fallo, setFallo] = useState(false);

  const publicaciones = useMemo(() => {
    const porId = new Map();
    (orden.detalles ?? []).forEach((d) => {
      const actual = porId.get(d.idPublicacion) ?? [];
      actual.push(d.nombreProductoSnapshot);
      porId.set(d.idPublicacion, actual);
    });
    return [...porId.entries()].map(([id, nombres]) => ({ id, titulo: nombres.join(", ") }));
  }, [orden]);

  useEffect(() => {
    let cancelado = false;
    obtenerValoracionesOrden(orden.id)
      .then((lista) => {
        if (!cancelado) setHechas(lista ?? []);
      })
      .catch(() => {
        if (!cancelado) setFallo(true);
      });
    return () => {
      cancelado = true;
    };
  }, [orden.id]);

  const guardar = async (idPublicacion, datos) => {
    const nueva = await crearValoracion(orden.id, { idPublicacion, idComprador: usuarioId, ...datos });
    setHechas((previas) => [...(previas ?? []), nueva]);
  };

  if (fallo) return null;
  if (hechas === null) return <p className="mt-6 text-sm text-[#6B7280]">Cargando reseñas...</p>;

  return (
    <div className="mt-6 space-y-3 border-t border-[#ECEEF2] pt-5">
      <h3 className="text-sm font-bold text-[#1F2937]">Tu opinión sobre la compra</h3>
      {publicaciones.map((p) => {
        const hecha = hechas.find((h) => h.idPublicacion === p.id);
        return hecha ? (
          <div key={p.id} className="rounded-lg bg-[#F9FAFB] p-4">
            <p className="text-sm font-semibold text-[#1F2937]">{p.titulo}</p>
            <Estrellas className="mt-1" valor={hecha.puntuacion} size={18} />
            {hecha.comentario && <p className="mt-1 text-sm text-[#4B5563]">{hecha.comentario}</p>}
            <p className="mt-1 text-xs text-[#6B7280]">Ya dejaste tu reseña. ¡Gracias!</p>
          </div>
        ) : (
          <FormularioResena key={p.id} titulo={p.titulo} onEnviar={(datos) => guardar(p.id, datos)} />
        );
      })}
    </div>
  );
}
