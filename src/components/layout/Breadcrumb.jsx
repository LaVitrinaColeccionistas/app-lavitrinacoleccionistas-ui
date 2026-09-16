import { Link } from "react-router-dom";

export default function Breadcrumb({
  items = [],
  className = "",
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={`
        flex
        flex-wrap
        items-center
        gap-1
        text-xs
        font-medium
        uppercase
        tracking-wide
        text-[#8B909A]
        ${className}
      `}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span
            key={`${item.label}-${index}`}
            className="flex items-center gap-1"
          >
            {item.to && !isLast ? (
              <Link
                to={item.to}
                className="
                  transition-colors
                  hover:text-[#5146E5]
                "
              >
                {item.label}
              </Link>
            ) : (
              <span>
                {item.label}
              </span>
            )}

            {!isLast && (
              <span
                aria-hidden="true"
                className="text-[#B0B4BC]"
              >
                /
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}