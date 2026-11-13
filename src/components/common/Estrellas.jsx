import { Star } from "lucide-react";

const MAXIMO = 5;

export default function Estrellas({ valor = 0, onChange, size = 18, className = "" }) {
  const editable = typeof onChange === "function";

  return (
    <div
      className={`inline-flex items-center gap-0.5 ${className}`}
      role={editable ? "radiogroup" : "img"}
      aria-label={editable ? "Puntuación" : `${valor} de ${MAXIMO} estrellas`}
    >
      {Array.from({ length: MAXIMO }, (_, i) => {
        const numero = i + 1;
        const llena = numero <= Math.round(valor);
        const icono = (
          <Star
            size={size}
            className={llena ? "fill-[#F59E0B] text-[#F59E0B]" : "fill-transparent text-[#D1D5DB]"}
          />
        );

        if (!editable) return <span key={numero}>{icono}</span>;

        return (
          <button
            key={numero}
            type="button"
            role="radio"
            aria-checked={numero === valor}
            aria-label={`${numero} ${numero === 1 ? "estrella" : "estrellas"}`}
            onClick={() => onChange(numero)}
            className="rounded p-0.5 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E0DEFF]"
          >
            {icono}
          </button>
        );
      })}
    </div>
  );
}
