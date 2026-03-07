"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="flex items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
        <div className="max-w-sm space-y-4">
          <div className="text-5xl">😿</div>
          <h2 className="text-lg font-bold text-gray-900">
            문제가 발생했다냥...
          </h2>
          <p className="text-sm text-gray-500">
            Something went wrong. Please try again.
          </p>
          <button
            onClick={reset}
            className="px-6 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
