export default function GlobalNotFound() {
  return (
    <html lang="ko">
      <body className="flex items-center justify-center min-h-screen bg-amber-50/30">
        <div className="text-center space-y-4">
          <p className="text-6xl">🐱</p>
          <h1 className="text-xl font-bold text-gray-900">
            Page not found
          </h1>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors"
          >
            Go Home
          </a>
        </div>
      </body>
    </html>
  );
}
