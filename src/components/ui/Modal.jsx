import { X } from "lucide-react";

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-black/40
        px-4
      "
    >
      <div
        className="
          relative
          w-full
          max-w-md
          rounded-lg
          border
          border-[#E5E7EB]
          bg-white
          p-6
          shadow-lg
        "
      >
        <div
          className="
            mb-4
            flex
            items-center
            justify-between
            gap-4
          "
        >
          {title && (
            <h2 className="text-lg font-semibold text-[#1F2937]">
              {title}
            </h2>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="
              ml-auto
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-md
              text-[#9CA3AF]
              transition-colors
              hover:bg-[#F5F3FF]
              hover:text-[#5146E5]
            "
          >
            <X
              size={18}
              strokeWidth={2}
              aria-hidden="true"
            />
          </button>
        </div>

        <div>
          {children}
        </div>
      </div>
    </div>
  );
}