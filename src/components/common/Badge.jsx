const variants = {
  primary: `
    bg-[#EEECFF]
    text-[#5146E5]
  `,

  success: `
    bg-[#EAF8EE]
    text-[#238A3B]
  `,

  warning: `
    bg-[#FFF3DD]
    text-[#C56A08]
  `,

  danger: `
    bg-[#FDECEC]
    text-[#D83B3B]
  `,

  info: `
    bg-[#EAF2FF]
    text-[#3972C9]
  `,

  neutral: `
    bg-[#F0F1F3]
    text-[#626976]
  `,
};

const sizes = {
  sm: "px-2 py-1 text-[11px]",
  md: "px-2.5 py-1.5 text-xs",
};

export default function Badge({
  children,
  variant = "neutral",
  size = "md",
  className = "",
  ...props
}) {
  const variantClasses =
    variants[variant] || variants.neutral;

  const sizeClasses =
    sizes[size] || sizes.md;

  return (
    <span
      className={`
        inline-flex
        w-fit
        items-center
        justify-center
        rounded-md
        font-medium
        leading-none
        ${variantClasses}
        ${sizeClasses}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
}