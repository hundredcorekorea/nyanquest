"use client";

import { useRouter } from "@/i18n/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="max-w-sm space-y-4">
        <div className="text-5xl">😿</div>
        <h2 className="text-lg font-bold text-gray-900">
          문제가 발생했다냥...
        </h2>
        <p className="text-sm text-gray-500">
          Something went wrong. Please try again.
        </p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors"
          >
            다시 시도
          </button>
          <button
            onClick={() => router.push("/")}
            className="px-5 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            홈으로
          </button>
        </div>
      </div>
    </div>
  );
}
