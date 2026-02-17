import Link from "next/link";

export default function NotFound() {
  return (
    <div className="text-center py-20 pb-24">
      <div className="text-6xl mb-4">😿</div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">
        길을 잃었다냥...
      </h1>
      <p className="text-sm text-gray-400 mb-6">
        찾으시는 페이지가 존재하지 않습니다.
      </p>
      <Link
        href="/"
        className="inline-block px-6 py-3 bg-amber-500 text-white rounded-xl font-medium text-sm hover:bg-amber-600 transition-colors"
      >
        모험 광장으로 돌아가기
      </Link>
    </div>
  );
}
