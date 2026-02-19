export default function PartyDetailLoading() {
  return (
    <div className="pb-24 max-w-lg mx-auto space-y-6 animate-pulse">
      {/* Status badges */}
      <div className="flex gap-2">
        <div className="h-6 w-16 bg-gray-100 rounded-full" />
        <div className="h-6 w-24 bg-amber-50 rounded-full" />
        <div className="h-6 w-16 bg-blue-50 rounded-full" />
      </div>

      {/* Title */}
      <div className="h-7 w-3/4 bg-gray-100 rounded" />

      {/* GM info */}
      <div className="flex items-center gap-3 bg-amber-50/50 rounded-xl p-4">
        <div className="w-10 h-10 rounded-full bg-amber-200/50" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-24 bg-amber-100 rounded" />
          <div className="h-3 w-20 bg-amber-100/50 rounded" />
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-2">
        <div className="h-4 w-full bg-gray-100 rounded" />
        <div className="h-4 w-5/6 bg-gray-100 rounded" />
        <div className="h-4 w-2/3 bg-gray-100 rounded" />
      </div>

      {/* Details */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <div className="h-4 w-20 bg-gray-100 rounded" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-16 bg-gray-50 rounded-xl" />
          <div className="h-16 bg-gray-50 rounded-xl" />
        </div>
      </div>

      {/* Members */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <div className="h-4 w-24 bg-gray-100 rounded" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100" />
            <div className="h-4 w-20 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
