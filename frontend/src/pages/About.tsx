import LinkUpLogo from "../assets/LinkUpLogo.png";

export default function About() {
  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_20%_0%,rgba(56,189,248,0.20),transparent_60%),radial-gradient(900px_500px_at_80%_10%,rgba(99,102,241,0.18),transparent_55%),#070b14] px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-4xl">
        {/* Logo + slogan */}
        <header className="mb-8 flex flex-col items-center text-center">
          <img
            src={LinkUpLogo}
            alt="LinkUp"
            className="h-14 w-auto rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
          />
          <h1 className="mt-4 text-3xl font-bold tracking-tight">LinkUp</h1>
          <p className="mt-2 text-slate-300">
            <span className="font-semibold text-sky-200">Find events nearby.</span>{" "}
            Meet people who share your interests.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
              Map-first discovery
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
              Quick event cards
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
              Create & host
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
              Join events
            </span>
          </div>
        </header>

        {/* Main card */}
        <section className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">Discover</p>
              <p className="mt-1 text-sm text-slate-300">
                Browse events by location using the map and grid view.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">Connect</p>
              <p className="mt-1 text-sm text-slate-300">
                Find like-minded people through shared interests and tags.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">Host</p>
              <p className="mt-1 text-sm text-slate-300">
                Create events, set a location, and share with the community.
              </p>
            </div>
          </div>

          {/* Tech stack */}
          <div className="mt-6">
            <h2 className="text-base font-semibold">Built with</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold">Frontend</p>
                <p className="mt-1 text-sm text-slate-300">
                  React + TypeScript + Vite + Tailwind
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold">Maps & Data</p>
                <p className="mt-1 text-sm text-slate-300">
                  Leaflet + Supabase (auth + database)
                </p>
              </div>
            </div>
          </div>

          {/* Future improvements */}
          <div className="mt-6">
            <h2 className="text-base font-semibold">Next up</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 text-sm text-slate-200">
              <li className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                RSVP: Interested / Going
              </li>
              <li className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                Better search + filters
              </li>
              <li className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                Event chat / messaging
              </li>
              <li className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                Map style templates
              </li>
            </ul>
          </div>
        </section>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Built as a group project for LeedsHack 2026.
        </p>
      </div>
    </div>
  );
}