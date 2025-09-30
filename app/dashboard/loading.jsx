export default function Loading() {
  return (
    <div className="min-h-screen bg-stone-50">
      <main className="p-8">
        <div>
          {/* Header skeleton */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <div className="h-9 bg-stone-200 rounded w-64 mb-2 animate-pulse"></div>
              <div className="h-5 bg-stone-200 rounded w-80 animate-pulse"></div>
            </div>
            <div className="h-10 bg-stone-200 rounded w-40 animate-pulse"></div>
          </div>

          {/* Stats skeleton */}
          <div className="mt-8 pb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white p-4 rounded-lg border border-stone-200/60"
              >
                <div className="h-8 bg-stone-200 rounded w-12 mb-2 animate-pulse"></div>
                <div className="h-4 bg-stone-200 rounded w-20 animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* Tests list skeleton */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-lg border border-stone-200/60 animate-pulse"
              >
                <div className="h-6 bg-stone-200 rounded w-1/3 mb-3"></div>
                <div className="h-4 bg-stone-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-stone-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
