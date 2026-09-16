import Button from "../common/Button";

export default function ProductCard({
  product,
  onView,
  onOffer,
  className = "",
}) {
  if (!product) {
    return null;
  }

  const {
    nombre,
    imagen,
    precio,
    categoria,
    estado,
  } = product;

  const precioFormateado =
    typeof precio === "number"
      ? `Gs. ${precio.toLocaleString("es-PY")}`
      : precio;

  return (
    <article
      className={`
        overflow-hidden
        rounded-lg
        border border-[#E5E7EB]
        bg-white
        transition-shadow
        hover:shadow-md
        ${className}
      `}
    >
      {/* IMAGEN */}

      <button
        type="button"
        onClick={() => onView?.(product)}
        className="
          block
          aspect-[4/3]
          w-full
          overflow-hidden
          bg-[#F6F6F8]
        "
      >
        {imagen ? (
          <img
            src={imagen}
            alt={nombre}
            className="
              h-full
              w-full
              object-cover
              transition-transform
              duration-300
              hover:scale-[1.02]
            "
          />
        ) : (
          <div
            className="
              flex
              h-full
              w-full
              items-center
              justify-center
              text-sm
              text-[#9CA3AF]
            "
          >
            Sin imagen
          </div>
        )}
      </button>

      {/* INFORMACIÓN */}

      <div className="p-4">
        <div className="mb-3">
          {categoria && (
            <p
              className="
                mb-1
                text-xs
                font-medium
                text-[#8B909A]
              "
            >
              {categoria}
            </p>
          )}

          <button
            type="button"
            onClick={() => onView?.(product)}
            className="
              block
              w-full
              text-left
              text-base
              font-semibold
              text-[#1F2937]
              transition-colors
              hover:text-[#5146E5]
            "
          >
            {nombre}
          </button>

          {estado && (
            <p className="mt-1 text-xs text-[#6B7280]">
              Estado: {estado}
            </p>
          )}
        </div>

        {/* PRECIO */}

        <p className="mb-4 text-base font-bold text-[#1F2937]">
          {precioFormateado}
        </p>

        {/* ACCIONES */}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            fullWidth
            onClick={() => onView?.(product)}
          >
            Ver detalle
          </Button>

          <Button
            size="sm"
            fullWidth
            onClick={() => onOffer?.(product)}
          >
            Hacer oferta
          </Button>
        </div>
      </div>
    </article>
  );
}