export default function About() {
  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_20%_0%,rgba(99,102,241,0.25),transparent_60%),#0b1220] px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">About This Project</h1>
          <p className="mt-2 text-slate-400">
            A location-based events discovery app with a map view and grid view.
          </p>
        </div>

        {/* Main card */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur">
          <h2 className="text-xl font-semibold">What it does</h2>
          <p className="mt-3 leading-7 text-slate-200">
            This project helps users discover events happening near them. Users can
            browse events in a grid layout for quick comparison or explore them on
            an interactive map to understand what’s nearby at a glance. Each event
            card highlights key details such as the title, date, location, and cost.
          </p>

          <h2 className="mt-8 text-xl font-semibold">Why we built it</h2>
          <p className="mt-3 leading-7 text-slate-200">
            Finding relevant local events often means jumping between multiple platforms.
            Our aim was to create a simple and visual experience that makes discovery faster,
            especially for people who prefer exploring by location.
          </p>

          <h2 className="mt-8 text-xl font-semibold">Tech stack</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            <li className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="font-semibold">Frontend</p>
              <p className="mt-1 text-sm text-slate-300">React + TypeScript + Vite</p>
            </li>
            <li className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="font-semibold">Styling</p>
              <p className="mt-1 text-sm text-slate-300">Tailwind CSS (dark theme UI)</p>
            </li>
            <li className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="font-semibold">Maps</p>
              <p className="mt-1 text-sm text-slate-300">Leaflet / Map integration</p>
            </li>
            <li className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="font-semibold">Backend</p>
              <p className="mt-1 text-sm text-slate-300">Supabase (auth + data storage)</p>
            </li>
          </ul>

          <h2 className="mt-8 text-xl font-semibold">Future improvements</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-slate-200">
            <li></li>
            <li></li>
            <li></li>
            <li></li>
          </ul>
        </div>

        {/* Footer */}
        <p className="mt-6 text-sm text-slate-500">
          Built as a group project. This page summarises the purpose, approach and tools used.
        </p>
      </div>
    </div>
  );
}