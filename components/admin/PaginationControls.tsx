import Link from "next/link";

export function PaginationControls({
  currentPage,
  totalPages,
  hrefForPage
}: {
  currentPage: number;
  totalPages: number;
  hrefForPage: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="row" style={{ gap: 8, marginTop: 16, justifyContent: "center" }}>
      {currentPage > 1 && (
        <Link href={hrefForPage(currentPage - 1)} className="button secondary sm">
          ← Prev
        </Link>
      )}
      <span className="muted" style={{ lineHeight: "32px", fontSize: 13 }}>
        Page {currentPage} of {totalPages}
      </span>
      {currentPage < totalPages && (
        <Link href={hrefForPage(currentPage + 1)} className="button secondary sm">
          Next →
        </Link>
      )}
    </div>
  );
}
