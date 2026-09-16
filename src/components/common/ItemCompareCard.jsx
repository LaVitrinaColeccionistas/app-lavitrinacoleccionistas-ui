import Badge from "./Badge";

export default function ItemCompareCard({
  title,
  item,
  className = "",
}) {
  if (!item) {
    return null;
  }

  const {
    nombre,
    imagen,
    categoria,
    estado,
    precio,
  } = item;

  const precioFormateado =
    typeof precio === "number"
      ? `Gs. ${precio.toLocaleString("es-PY")}`
      : precio;

  return (
    <div
      className={`
        w-full
        rounded-lg
        border border-[#E5E7EB]
        bg-white
        p-4
        ${className}
      `}
    >
      {title && (
        <p
          className="
            mb-3
            text-xs
            font-semibold
            uppercase
            tracking-wide
            text-[#8B909A]
          "
        >
          {title}
        </p>
      )}

      <div className="flex gap-4">
        {/* IMAGEN */}
        <div
          className="
            h-24
            w-24
            shrink-0
            overflow-hidden
            rounded-md
            bg-[#F5F6F8]
          "
        >
          {imagen ? (
            <img
              src={imagen}
              alt={nombre || "Artículo"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="
                flex
                h-full
                w-full
                items-center
                justify-center
                px-2
                text-center
                text-xs
                text-[#9CA3AF]
              "
            >
              Sin imagen
            </div>
          )}
        </div>

        {/* INFORMACIÓN */}
        <div className="min-w-0 flex-1">
          {categoria && (
            <p className="mb-1 text-xs font-medium text-[#8B909A]">
              {categoria}
            </p>
          )}

          <h3 className="text-sm font-semibold leading-5 text-[#1F2937]">
            {nombre}
          </h3>

          {estado && (
            <div className="mt-2">
              <Badge
                variant="neutral"
                size="sm"
              >
                {estado}
              </Badge>
            </div>
          )}

          {precio !== undefined &&
            precio !== null &&
            precio !== "" && (
              <p className="mt-3 text-sm font-bold text-[#1F2937]">
                {precioFormateado}
              </p>
            )}
        </div>
      </div>
    </div>
  );
}