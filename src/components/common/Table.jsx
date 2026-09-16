export default function Table({
  columns = [],
  data = [],
  renderRow,
  emptyMessage = "Sin resultados",
  className = "",
}) {
  return (
    <div
      className={`
        w-full
        overflow-hidden
        rounded-md
        bg-white
        ${className}
      `}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#F6F6F8]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`
                    whitespace-nowrap
                    px-4 py-3
                    text-xs
                    font-semibold
                    text-[#6B7280]
                    ${column.className || ""}
                  `}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#ECEEF2]">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="
                    px-4
                    py-10
                    text-center
                    text-sm
                    text-[#9CA3AF]
                  "
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={row.id ?? index}
                  className="
                    transition-colors
                    hover:bg-[#FAFAFC]
                  "
                >
                  {renderRow(row, index)}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}