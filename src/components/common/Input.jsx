export default function Input({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder = "",
  error = "",
  helperText = "",
  required = false,
  disabled = false,
  className = "",
  ...props
}) {
  const inputId = props.id || name;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-semibold text-[#374151]"
        >
          {label}

          {required && (
            <span className="ml-1 text-[#EF4444]">*</span>
          )}
        </label>
      )}

      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        className={`
          w-full
          rounded-lg
          border
          bg-white
          px-3.5 py-2.5
          text-sm text-[#1F2937]
          outline-none
          transition-all duration-200

          placeholder:text-[#9CA3AF]

          ${
            error
              ? `
                border-[#EF4444]
                focus:border-[#EF4444]
                focus:ring-2
                focus:ring-[#FECACA]
              `
              : `
                border-[#D1D5DB]
                hover:border-[#A5A9B4]
                focus:border-[#5146E5]
                focus:ring-2
                focus:ring-[#E0E7FF]
              `
          }

          disabled:cursor-not-allowed
          disabled:bg-[#F3F4F6]
          disabled:text-[#9CA3AF]
        `}
        {...props}
      />

      {error ? (
        <p className="mt-1.5 text-xs font-medium text-[#DC2626]">
          {error}
        </p>
      ) : (
        helperText && (
          <p className="mt-1.5 text-xs text-[#6B7280]">
            {helperText}
          </p>
        )
      )}
    </div>
  );
}