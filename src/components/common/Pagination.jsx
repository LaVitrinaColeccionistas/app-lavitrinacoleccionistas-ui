export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className = "",
}) {
  if (totalPages <= 1) {
    return null;
  }

  const getPages = () => {
    const pages = [];

    if (totalPages <= 5) {
      for (let page = 1; page <= totalPages; page++) {
        pages.push(page);
      }

      return pages;
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, "...", totalPages];
    }

    if (currentPage >= totalPages - 2) {
      return [
        1,
        "...",
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  };

  const pages = getPages();

  const handlePageChange = (page) => {
    if (
      page < 1 ||
      page > totalPages ||
      page === currentPage
    ) {
      return;
    }

    onPageChange?.(page);
  };

  return (
    <nav
      aria-label="Paginación"
      className={`
        flex
        flex-wrap
        items-center
        justify-center
        gap-1
        ${className}
      `}
    >
      <button
        type="button"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="
          flex h-9 items-center justify-center
          rounded-md px-3
          text-sm font-medium text-[#4B5563]
          transition-colors
          hover:bg-[#F0EFFF]
          hover:text-[#5146E5]
          disabled:cursor-not-allowed
          disabled:opacity-35
          disabled:hover:bg-transparent
          disabled:hover:text-[#4B5563]
        "
      >
        Anterior
      </button>

      {pages.map((page, index) => {
        if (page === "...") {
          return (
            <span
              key={`ellipsis-${index}`}
              className="
                flex h-9 min-w-9
                items-center justify-center
                text-sm text-[#9CA3AF]
              "
            >
              ...
            </span>
          );
        }

        const isActive = page === currentPage;

        return (
          <button
            key={page}
            type="button"
            onClick={() => handlePageChange(page)}
            aria-current={isActive ? "page" : undefined}
            className={`
              flex h-9 min-w-9
              items-center justify-center
              rounded-md px-2
              text-sm font-medium
              transition-colors

              ${
                isActive
                  ? "bg-[#5146E5] text-white"
                  : `
                    text-[#4B5563]
                    hover:bg-[#F0EFFF]
                    hover:text-[#5146E5]
                  `
              }
            `}
          >
            {page}
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="
          flex h-9 items-center justify-center
          rounded-md px-3
          text-sm font-medium text-[#4B5563]
          transition-colors
          hover:bg-[#F0EFFF]
          hover:text-[#5146E5]
          disabled:cursor-not-allowed
          disabled:opacity-35
          disabled:hover:bg-transparent
          disabled:hover:text-[#4B5563]
        "
      >
        Siguiente
      </button>
    </nav>
  );
}