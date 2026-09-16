export default function Textarea({
  label,
  name,
  value,
  onChange,
  placeholder = "",
  error = "",
  helperText = "",
  required = false,
  disabled = false,
  rows = 4,
  maxLength,
  showCount = false,
  className = "",
  ...props
}) {
  const textareaId = props.id || name;
  const currentLength = value?.length || 0;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={textareaId}
          className="mb-1.5 block text-sm font-semibold text-[#374151]"
        >
          {label}

          {required && (
            <span className="ml-1 text-[#EF4444]">*</span>
          )}
        </label>
      )}

      <textarea
        id={textareaId}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        aria-invalid={Boolean(error)}
        className={`
          w-full
          resize-y
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

      <div className="mt-1.5 flex items-start justify-between gap-4">
        <div>
          {error ? (
            <p className="text-xs font-medium text-[#DC2626]">
              {error}
            </p>
          ) : (
            helperText && (
              <p className="text-xs text-[#6B7280]">
                {helperText}
              </p>
            )
          )}
        </div>

        {showCount && maxLength && (
          <span className="shrink-0 text-xs text-[#9CA3AF]">
            {currentLength}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}