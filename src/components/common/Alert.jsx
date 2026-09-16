const variants = {
  success: {
    container: "bg-[#EDF8F0] text-[#247A38]",
    title: "text-[#206E32]",
  },

  danger: {
    container: "bg-[#FDEEEE] text-[#B83232]",
    title: "text-[#A92C2C]",
  },

  warning: {
    container: "bg-[#FFF5E5] text-[#A65D0A]",
    title: "text-[#955308]",
  },

  info: {
    container: "bg-[#F0EFFF] text-[#5146E5]",
    title: "text-[#4338CA]",
  },
};

export default function Alert({
  children,
  title,
  variant = "info",
  className = "",
  onClose,
  ...props
}) {
  const styles = variants[variant] || variants.info;

  return (
    <div
      role="alert"
      className={`
        flex
        items-start
        justify-between
        gap-4
        rounded-md
        px-4
        py-3
        text-sm
        ${styles.container}
        ${className}
      `}
      {...props}
    >
      <div>
        {title && (
          <p className={`mb-0.5 font-semibold ${styles.title}`}>
            {title}
          </p>
        )}

        <div className="leading-5">
          {children}
        </div>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar mensaje"
          className="
            shrink-0
            text-lg
            leading-none
            opacity-60
            transition-opacity
            hover:opacity-100
          "
        >
          ×
        </button>
      )}
    </div>
  );
}