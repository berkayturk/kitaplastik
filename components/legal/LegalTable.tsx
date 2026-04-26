interface LegalTableProps {
  caption?: string;
  cols: Record<string, string>;
  rows: Record<string, string>[];
}

export function LegalTable({ caption, cols, rows }: LegalTableProps) {
  const colKeys = Object.keys(cols);
  if (process.env.NODE_ENV !== "production" && rows.length > 0) {
    const rowKeys = Object.keys(rows[0]);
    const missing = colKeys.filter((k) => !rowKeys.includes(k));
    if (missing.length > 0) {
      console.error("LegalTable: row missing keys", missing);
    }
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full border-collapse text-[14px]">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b-2 border-[var(--color-border-default)]">
            {colKeys.map((k) => (
              <th
                key={k}
                scope="col"
                className="text-text-primary px-3 py-2.5 text-start font-semibold"
              >
                {cols[k]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-[var(--color-border-hairline)] last:border-b-0">
              {colKeys.map((k) => (
                <td
                  key={k}
                  className="text-text-secondary px-3 py-3 align-top text-[14px] leading-[1.6]"
                >
                  {row[k] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
