import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

/*
 * vite-ssg 内部依赖 @unhead/vue，且 node_modules 里存在嵌套副本。
 * 若应用代码解析到与 vite-ssg 不同的物理副本，useHead 注册的 head
 * 与 vite-ssg 构建时渲染的 head 不是同一实例，<title>/meta 不会生效。
 * 这里用 alias 强制所有 @unhead/vue（含子路径）统一解析到顶层实例。
 */
const unheadVue = fileURLToPath(
  new URL("./node_modules/@unhead/vue/dist", import.meta.url)
);

/* 独立域名/仓库部署：base 为 "/"。
   若改回主页子路径部署（jacky-lzx.github.io/blog/），
   把这里和 src/main.js 中 router 的 base 同步改为 "/blog/" */
export default defineConfig({
  base: "/",
  plugins: [vue()],
  resolve: {
    alias: [
      { find: "@unhead/vue/client", replacement: `${unheadVue}/client.mjs` },
      { find: "@unhead/vue/server", replacement: `${unheadVue}/server.mjs` },
      { find: "@unhead/vue", replacement: `${unheadVue}/index.mjs` },
    ],
  },
  ssgOptions: {
    // 产物为扁平结构：/posts/foo -> dist/posts/foo.html（GitHub Pages 友好）
    dirStyle: "flat",
    script: "async",
  },
});
