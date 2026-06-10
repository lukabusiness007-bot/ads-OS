export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Učitavanje"
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#dce2d5] border-t-[#1f6f5b]" />
        <span className="text-sm text-[#697266]">Učitavanje…</span>
      </div>
    </div>
  )
}
