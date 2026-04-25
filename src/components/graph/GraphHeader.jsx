function GraphHeader({ stats }) {
  return (
    <header className="mb-5 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-white/50">
          Live Ecosystem Network
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          Connections forming in real time
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
        <StatCard label="Attendees" value={stats.attendeeCount} />
        <StatCard label="Connections" value={stats.connectionCount} />
        <StatCard label="Cross-sector" value={stats.crossSectorCount} />
        <StatCard label="ANBI pool" value={`€${stats.anbiPool}`} />
      </div>
    </header>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl bg-black/30 px-4 py-3">
      <div className="text-xs uppercase tracking-widest text-white/40">
        {label}
      </div>

      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

export default GraphHeader;