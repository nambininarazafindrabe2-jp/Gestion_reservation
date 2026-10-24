interface PaginationProps {
  page: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
  onPageSize: (n: number) => void;
}

const pageRange = (page: number, pages: number): (number | '…')[] => {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const out: (number | '…')[] = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(pages - 1, page + 1);
  if (from > 2) out.push('…');
  for (let i = from; i <= to; i++) out.push(i);
  if (to < pages - 1) out.push('…');
  out.push(pages);
  return out;
};

export function Pagination({ page, total, pageSize, onPage, onPageSize }: PaginationProps) {
  if (total === 0) return null;

  const pages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="pagination">
      <div className="pg-info">
        <span><strong>{start}–{end}</strong> sur <strong>{total}</strong></span>
        <label className="pg-size">
          Lignes par page
          <select value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))}>
            {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>

      <div className="pg-controls">
        <button className="pg-btn pg-text" onClick={() => onPage(page - 1)} disabled={page === 1}>
          Précédent
        </button>

        {pageRange(page, pages).map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className="pg-dots">…</span>
          ) : (
            <button key={p} className={`pg-btn ${p === page ? 'active' : ''}`} onClick={() => onPage(p)}>
              {p}
            </button>
          )
        )}

        <button className="pg-btn pg-text" onClick={() => onPage(page + 1)} disabled={page === pages}>
          Suivant
        </button>
      </div>
    </div>
  );
}
