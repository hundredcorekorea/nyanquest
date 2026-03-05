/**
 * Build a minimal redirect shell for Toss .ait package.
 *
 * NyanQuest is SSR (Next.js on Vercel) — Toss only supports CSR/SSG in .ait.
 * This creates a tiny index.html that redirects to the hosted app.
 */
const fs = require("fs");
const path = require("path");

const HOSTED_URL = "https://nyanquest.com/ko";
const outDir = path.join(__dirname, "..", "dist", "web");

fs.mkdirSync(outDir, { recursive: true });

const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>냥퀘스트</title>
  <style>
    body{margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:#FFF7ED;font-family:-apple-system,sans-serif}
    .l{text-align:center}.l .e{font-size:48px;animation:b .6s infinite alternate}.l p{color:#92400E;font-size:14px;margin-top:12px}
    @keyframes b{to{transform:translateY(-8px)}}
  </style>
</head>
<body>
  <div class="l"><div class="e">🐱</div><p>냥퀘스트 로딩 중...</p></div>
  <script>window.location.replace('${HOSTED_URL}');</script>
</body>
</html>`;

fs.writeFileSync(path.join(outDir, "index.html"), html);
console.log("✅ .ait shell created → dist/web/index.html");
