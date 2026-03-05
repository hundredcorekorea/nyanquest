import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "nyanquest",
  brand: {
    displayName: "냥퀘스트",
    primaryColor: "#6366f1", // indigo-500 (NyanQuest brand color)
    icon: "./public/icons/icon-512.png",
  },
  permissions: [
    { name: "clipboard", access: "write" }, // 결과 카드 복사
  ],
  navigationBar: {
    withBackButton: true,
    withHomeButton: true,
  },
  // toss-app: Vite SPA → CSR static build → .ait package
  // Backend API stays on nyanquest.com (Vercel)
  outdir: "toss-app/dist",
  web: {
    port: 5173,
    commands: {
      dev: "cd toss-app && npm run dev",
      build: "node scripts/build-toss-app.js",
    },
  },
  webViewProps: {
    type: "partner",
    bounces: false,
    pullToRefreshEnabled: false,
    allowsBackForwardNavigationGestures: true,
  },
});
