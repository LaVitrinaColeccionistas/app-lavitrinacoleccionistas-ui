const variants = {
  primary: `
    bg-[#5146E5] text-white
    hover:bg-[#4338CA]
    shadow-sm hover:shadow-md
    focus:ring-[#C7D2FE]
  `,

  success: `
    bg-[#2FAF4A] text-white
    hover:bg-[#26963D]
    shadow-sm hover:shadow-md
    focus:ring-[#BBF7D0]
  `,

  danger: `
    bg-[#EF4444] text-white
    hover:bg-[#DC2626]
    shadow-sm hover:shadow-md
    focus:ring-[#FECACA]
  `,

  warning: `
    bg-[#E8890C] text-white
    hover:bg-[#D97706]
    shadow-sm hover:shadow-md
    focus:ring-[#FDE68A]
  `,

  outline: `
    border border-[#5146E5]
    bg-white text-[#5146E5]
    hover:bg-[#F5F3FF]
    focus:ring-[#DDD6FE]
  `,

  outlineSuccess: `
    border border-[#25B878]
    bg-white text-[#15945E]
    hover:bg-[#ECFDF5]
    focus:ring-[#A7F3D0]
  `,

  outlineDanger: `
    border border-[#EF4444]
    bg-white text-[#DC2626]
    hover:bg-[#FEF2F2]
    focus:ring-[#FECACA]
  `,

  ghost: `
    bg-transparent text-[#5146E5]
    hover:bg-[#F5F3FF]
    focus:ring-[#DDD6FE]
  `,
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-base",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  fullWidth = false,
  disabled = false,
  loading = false,
  className = "",
  onClick,
  ...props
}) {
  const variantClasses = variants[variant] || variants.primary;
  const sizeClasses = sizes[size] || sizes.md;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2
        rounded-lg
        font-semibold
        transition-all duration-200 ease-out
        focus:outline-none focus:ring-2 focus:ring-offset-1
        active:scale-[0.98]
        disabled:cursor-not-allowed
        disabled:opacity-50
        disabled:shadow-none
        disabled:active:scale-100
        ${variantClasses}
        ${sizeClasses}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <span
          className="
            h-4 w-4
            animate-spin
            rounded-full
            border-2
            border-current
            border-t-transparent
          "
          aria-hidden="true"
        />
      )}

      {children}
    </button>
  );
}