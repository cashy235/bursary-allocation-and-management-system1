/**
 * Visible tagline for the secure cloud-based bursary platform (all authenticated views).
 */
export default function PlatformBanner() {
  return (
    <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-slate-50 border-b border-indigo-100/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-3 text-sm">
        <span className="font-semibold text-slate-800">
          Secure cloud-based bursary allocation &amp; management
        </span>
        <span className="text-slate-500 hidden sm:inline" aria-hidden>
          —
        </span>
        <span className="text-slate-600">
          <span className="font-medium text-indigo-700">Frontend:</span> React (Vite)
          <span className="mx-1.5 text-slate-300">|</span>
          <span className="font-medium text-indigo-700">Backend:</span> FastAPI
        </span>
      </div>
    </div>
  );
}
