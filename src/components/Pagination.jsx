export default function Pagination({ currentPage, totalPages, totalCount, onPageChange }) {
  if (totalPages <= 1) return null;

  // Show a window of page numbers around the current page
  const range = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  for (let i = start; i <= end; i++) range.push(i);

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 20px",
      borderTop: "1px solid var(--border-subtle)",
      fontSize: "0.78rem",
      color: "var(--text-dim)",
    }}>
      <span>
        Showing {((currentPage - 1) * 100) + 1}–{Math.min(currentPage * 100, totalCount)} of {totalCount.toLocaleString()}
      </span>
      <div style={{ display: "flex", gap: "4px" }}>
        <button
          className="btn btn-sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          ← Prev
        </button>
        {start > 1 && <span style={{ padding: "4px 6px" }}>...</span>}
        {range.map((p) => (
          <button
            key={p}
            className={`btn btn-sm ${p === currentPage ? "btn-primary" : ""}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}
        {end < totalPages && <span style={{ padding: "4px 6px" }}>...</span>}
        <button
          className="btn btn-sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
