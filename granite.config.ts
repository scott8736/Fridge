import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "moonlighttarot1",
  brand: {
    displayName: "냉장고 레시피",
    primaryColor: "#3FD599", // 화면에 노출될 앱의 기본 색상으로 바꿔주세요.
    icon: "https://static.toss.im/appsintoss/22039/96cafce6-74a8-4e37-9010-40d61f1103e9.png", // 콘솔 '앱 정보' 아이콘 (miniapp_get 으로 확인)
  },
  web: {
    host: "119.199.135.225", // 이 PC의 LAN IP. 아이폰이 다른 IP로 뜨면 ipconfig로 다시 확인해서 교체해주세요.
    port: 5173,
    commands: {
      dev: "vite dev --host",
      build: "vite build",
    },
  },
  permissions: [
    { name: "camera", access: "access" },
    { name: "photos", access: "read" },
  ],
  outdir: "dist",
});
