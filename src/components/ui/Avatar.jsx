export default function Avatar({
  src,
  name = "Usuario",
  size = "md",
  className = "",
}) {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-11 w-11 text-base",
  };

  const sizeClasses = sizes[size] || sizes.md;

  const initial = name?.trim()
    ? name.trim().charAt(0).toUpperCase()
    : "U";

  return (
    <div
      className={`
        shrink-0
        ${sizeClasses}
        ${className}
      `}
      title={name}
    >
      {src ? (
        <img
          src={src}
          alt={`Perfil de ${name}`}
          className="
            h-full
            w-full
            rounded-full
            object-cover
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
            rounded-full
            bg-[#EEECFF]
            font-semibold
            text-[#5146E5]
          "
        >
          {initial}
        </div>
      )}
    </div>
  );
}