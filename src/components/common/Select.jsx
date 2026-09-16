export default function Select({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = "Seleccionar una opción",
  error = "",
  helperText = "",
  required = false,
  disabled = false,
  className = "",
  ...props
}) {
  const selectId = props.id || name;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="mb-1.5 block text-sm font-semibold text-[#374151]"
        >
          {label}

          {required && (
            <span className="ml-1 text-[#EF4444]">*</span>
          )}
        </label>
      )}

      <select
        id={selectId}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        className={`
          w-full
          appearance-none
          rounded-lg
          border
          bg-white
          px-3.5 py-2.5
          pr-10
          text-sm
          outline-none
          transition-all duration-200

          ${
            value
              ? "text-[#1F2937]"
              : "text-[#9CA3AF]"
          }

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
        style={{
          backgroundImage: `
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='m19 9-7 7-7-7'/%3E%3C/svg%3E")
          `,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 0.75rem center",
          backgroundSize: "1rem",
        }}
        {...props}
      >
        <option value="" disabled>
          {placeholder}
        </option>

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>

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