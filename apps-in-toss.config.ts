import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "moonlighttarot1",

  brand: {
    // 화면에 노출될 앱의 기본 색상으로 바꿔주세요.
    primaryColor: "#3FD599"
  },

  permissions: [
    { name: "camera", access: "access" },
    { name: "photos", access: "read" },
  ],

  webBundleDir: "dist"
});
