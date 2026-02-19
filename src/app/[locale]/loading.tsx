export default function Loading() {
  return (
    <div className="space-y-6 pb-20">
      {/* Mascot skeleton */}
      <div className="h-16 bg-amber-50/50 rounded-xl animate-pulse" />

      {/* Filters skeleton */}
      <div className="flex gap-2">
        <div className="h-10 w-28 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-10 flex-1 bg-gray-100 rounded-xl animate-pulse" />
      </div>

      {/* Party cards skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-amber-100/50 p-5 space-y-3"
          >
            <div className="flex gap-2">
              <div className="h-5 w-14 bg-gray-100 rounded-full animate-pulse" />
              <div className="h-5 w-14 bg-gray-100 rounded-full animate-pulse" />
            </div>
            <div className="h-5 w-3/4 bg-gray-100 rounded animate-pulse" />
            <div className="flex gap-2">
              <div className="h-6 w-24 bg-amber-50 rounded-lg animate-pulse" />
              <div className="h-6 w-20 bg-gray-50 rounded-lg animate-pulse" />
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
              <div className="w-6 h-6 rounded-full bg-gray-100 animate-pulse" />
              <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
