export default function QuestLoading() {
  return (
    <div className="pb-24 max-w-lg mx-auto animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="space-y-1">
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="h-3 w-16 bg-gray-100 rounded" />
        </div>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full mb-6" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-2">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex-shrink-0" />
            <div className="flex-1 bg-amber-50 rounded-2xl p-4 space-y-2">
              <div className="h-3 w-full bg-amber-100 rounded" />
              <div className="h-3 w-3/4 bg-amber-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
