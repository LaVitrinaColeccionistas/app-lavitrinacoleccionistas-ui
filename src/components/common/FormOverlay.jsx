import { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Capa oscura semitransparente con el formulario centrado encima.
 * Se cierra con la X, haciendo clic en el fondo o con Esc.
 */
// Overlays abiertos (el último es el de arriba): Esc solo cierra el superior
const abiertos = [];

export default function FormOverlay({ onClose, children, maxWidth = "max-w-3xl" }) {
  useEffect(() => {
    const token = {};
    abiertos.push(token);
    const onKey = (e) =>
      e.key === "Escape" && abiertos[abiertos.length - 1] === token && onClose?.();
    document.addEventListener("keydown", onKey);

    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // evita scroll del fondo

    return () => {
      abiertos.splice(abiertos.indexOf(token), 1);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previo;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Fondo oscuro (separado del contenido: backdrop-filter rompería los modales internos) */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="pointer-events-none relative flex min-h-full items-start justify-center px-4 py-10">
        <div className={`pointer-events-auto relative w-full ${maxWidth}`}>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar formulario"
            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-md text-[#9CA3AF] transition-colors hover:bg-[#F5F3FF] hover:text-[#5146E5]"
          >
            <X size={18} strokeWidth={2} aria-hidden="true" />
          </button>
          {children}
        </div>
      </div>
    </div>
  );
}