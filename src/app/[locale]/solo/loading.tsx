export default function SoloLoading() {
  return (
    <div className="pb-24 max-w-lg mx-auto space-y-6 animate-pulse">
      <div className="text-center space-y-2">
        <div className="h-10 w-10 bg-amber-100 rounded-full mx-auto" />
        <div className="h-6 w-48 bg-gray-200 rounded mx-auto" />
        <div className="h-4 w-64 bg-gray-100 rounded mx-auto" />
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3"
        >
          <div className="flex gap-4">
            <div className="h-8 w-8 bg-gray-200 rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-3 w-full bg-gray-100 rounded" />
            </div>
          </div>
          <div className="h-10 bg-gray-100 rounded-xl" />
        </div>
      ))}
    </div>
  );
}
