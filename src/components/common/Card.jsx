export default function Card({
  children,
  title,
  subtitle,
  padding = "md",
  hover = false,
  className = "",
  headerAction,
  ...props
}) {
  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={`
        rounded-xl
        border border-[#E5E7EB]
        bg-white
        shadow-[0_1px_3px_rgba(15,23,42,0.04)]
        transition-all duration-200

        ${
          hover
            ? "hover:-translate-y-0.5 hover:border-[#D9D6FE] hover:shadow-[0_8px_24px_rgba(79,70,229,0.08)]"
            : ""
        }

        ${paddings[padding] || paddings.md}
        ${className}
      `}
      {...props}
    >
      {(title || subtitle || headerAction) && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-lg font-bold text-[#1F2937]">
                {title}
              </h2>
            )}

            {subtitle && (
              <p className="mt-1 text-sm leading-6 text-[#6B7280]">
                {subtitle}
              </p>
            )}
          </div>

          {headerAction && (
            <div className="shrink-0">
              {headerAction}
            </div>
          )}
        </div>
      )}

      {children}
    </div>
  );
}