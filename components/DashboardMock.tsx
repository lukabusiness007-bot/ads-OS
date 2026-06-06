// Dekorativni CSS mock dashboarda — ne sadrži prave podatke.
// Koristi isti `.browserBar` vizuelni jezik koji postoji u globals.css.

export function DashboardMock() {
  return (
    <div className="w-full rounded-xl border border-zinc-200 shadow-2xl overflow-hidden bg-white">
      {/* Browser / app bar */}
      <div className="flex items-center gap-2 bg-zinc-900 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        <div className="ml-3 flex-1 h-5 rounded-md bg-zinc-700/60 max-w-[220px]" />
      </div>

      {/* Top metric strip */}
      <div className="grid grid-cols-3 gap-3 p-4 border-b border-zinc-100 bg-zinc-50/60">
        {[
          { label: "Page views", value: "1,248" },
          { label: "AR clicks", value: "312" },
          { label: "Store clicks", value: "189" },
        ].map((m) => (
          <div key={m.label} className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">{m.label}</p>
            <p className="text-lg font-bold text-zinc-900 leading-none">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Product rows */}
      <div className="p-4 space-y-2.5">
        {[
          { name: "Arc Oak Dining Chair", status: "Live", bar: 82 },
          { name: "Como Linen Sofa 3-seat", status: "Live", bar: 65 },
          { name: "Murano Side Table", status: "Review", bar: 0 },
        ].map((p) => (
          <div key={p.name} className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-white px-3 py-2.5">
            {/* Thumbnail placeholder */}
            <div className="h-8 w-8 rounded-md bg-emerald-50 border border-emerald-100 shrink-0 flex items-center justify-center">
              <span className="text-[8px] font-bold text-emerald-600">3D</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-zinc-800 truncate">{p.name}</p>
              {p.bar > 0 && (
                <div className="mt-1 h-1 rounded-full bg-zinc-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${p.bar}%` }}
                  />
                </div>
              )}
            </div>
            <span
              className={`shrink-0 text-[10px] font-bold rounded-full px-2 py-0.5 ${
                p.status === "Live"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              {p.status}
            </span>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="px-4 pb-4">
        <div className="h-8 rounded-lg bg-emerald-900 flex items-center justify-center">
          <span className="text-[11px] font-bold text-emerald-100 tracking-wide">+ Add product</span>
        </div>
      </div>
    </div>
  )
}
