import React from "react";

const roles = [
  {
    name: "Anchor",
    subtitle: "Most connected",
    color: "text-[#EF9F27]",
    entries: [
      { rank: 1, initials: "PJ", name: "Pieter Janssen", company: "ING Group", score: 24 },
      { rank: 2, initials: "AK", name: "Anna Karlsson", company: "Volvo", score: 21 },
      { rank: 3, initials: "MS", name: "Maria Svensson", company: "SEB", score: 18 },
    ],
  },
  {
    name: "Connector",
    subtitle: "Cross-sector bridges",
    color: "text-[#1D9E75]",
    entries: [
      { rank: 1, initials: "EL", name: "Eva Lind", company: "KTH", score: 14 },
      { rank: 2, initials: "DT", name: "Daan Teunissen", company: "Philips", score: 12 },
      { rank: 3, initials: "MN", name: "Mika Nilsson", company: "Epiroc", score: 10 },
    ],
  },
  {
    name: "Explorer",
    subtitle: "Most sectors reached",
    color: "text-[#7F77DD]",
    entries: [
      { rank: 1, initials: "JB", name: "Johan Berg", company: "Northvolt", score: 5 },
      { rank: 2, initials: "LS", name: "Lisa Smit", company: "ASML", score: 5 },
      { rank: 3, initials: "NK", name: "Noor Khan", company: "Vattenfall", score: 4 },
    ],
  },
  {
    name: "Catalyst",
    subtitle: "Fastest movers",
    color: "text-[#D85A30]",
    entries: [
      { rank: 1, initials: "TR", name: "Tom Roos", company: "NLMTD", score: 16 },
      { rank: 2, initials: "KL", name: "Karin Lund", company: "CCS", score: 15 },
      { rank: 3, initials: "OH", name: "Oscar Holm", company: "Erasmus MC", score: 13 },
    ],
  },
  {
    name: "Builder",
    subtitle: "Consistent connectors",
    color: "text-[#378ADD]",
    entries: [
      { rank: 1, initials: "SA", name: "Sara Andersson", company: "Scania", score: 9 },
      { rank: 2, initials: "MV", name: "Milan Visser", company: "Rabobank", score: 8 },
      { rank: 3, initials: "IH", name: "Ines Holm", company: "Region Stockholm", score: 7 },
    ],
  },
];

const rankStyles = {
  1: "bg-yellow-400 text-black",
  2: "bg-zinc-300 text-black",
  3: "bg-orange-500 text-black",
};

export default function LeaderboardPage() {
  return (
    <main className="min-h-screen bg-[#0e0e0c] text-white p-8 flex flex-col">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-5xl font-semibold tracking-tight">
            Building Ecosystems
          </h1>
          <p className="mt-2 text-xl text-zinc-400">
            Top connectors · Live
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">
            CCS x NLMTD
          </p>
          <p className="mt-2 text-2xl font-medium text-[#1D9E75]">
            Live leaderboard
          </p>
        </div>
      </header>

      <section className="grid flex-1 grid-cols-5 gap-5">
        {roles.map((role) => (
          <div
            key={role.name}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl"
          >
            <div className="mb-6">
              <h2 className={`text-3xl font-semibold ${role.color}`}>
                {role.name}
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                {role.subtitle}
              </p>
            </div>

            <div className="space-y-4">
              {role.entries.map((entry) => (
                <div
                  key={entry.rank}
                  className="rounded-2xl border border-white/10 bg-black/30 p-4"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                        rankStyles[entry.rank]
                      }`}
                    >
                      {entry.rank}
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">
                      {entry.initials}
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold leading-tight">
                    {entry.name}
                  </h3>

                  <p className="mt-1 text-sm text-zinc-400">
                    {entry.company}
                  </p>

                  <div className="mt-4 flex items-end justify-between">
                    <span className="text-xs uppercase tracking-widest text-zinc-500">
                      Score
                    </span>
                    <span className="text-3xl font-semibold">
                      {entry.score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <footer className="mt-8 grid grid-cols-3 items-center rounded-3xl border border-white/10 bg-white/[0.04] px-8 py-5">
        <div>
          <p className="text-sm text-zinc-500">Total connections</p>
          <p className="text-3xl font-semibold">186</p>
        </div>

        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">
            ANBI pool
          </p>
          <p className="text-5xl font-bold text-[#1D9E75]">€186</p>
        </div>

        <div className="text-right">
          <p className="text-sm text-zinc-500">Cross-sector connections</p>
          <p className="text-3xl font-semibold">74</p>
        </div>
      </footer>
    </main>
  );
}