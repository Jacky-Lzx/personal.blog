import { ViteSSG } from "vite-ssg";
import App from "./App.vue";
import { routes } from "./routes";
import { posts } from "./lib/posts";
import "./styles/variables.css";
import "./styles/base.css";
import "./styles/blog.css";

export const createApp = ViteSSG(
  App,
  { routes, base: "/" }, // 独立域名/仓库；子路径部署时改为 "/blog/"（需与 vite.config.js 一致）
  ({ app, router, isClient }) => {
    if (isClient) {
      // 快捷键 t 切换主题（与 personal.homepage 一致）
      window.addEventListener("keydown", (e) => {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        const t = e.target;
        if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
        if (e.key === "t" || e.key === "T") {
          e.preventDefault();
          const root = document.documentElement;
          root.dataset.theme = root.dataset.theme === "latte" ? "mocha" : "latte";
          try {
            localStorage.setItem("theme", root.dataset.theme);
          } catch (err) {}
        }
      });
    }
  }
);

/* 构建时预渲染每篇文章的静态页面（vite-ssg 约定：可从 server 入口导出 includedRoutes）
   注意：自定义后需自行排除带参数/通配的路径（vite-ssg 默认会排除） */
export function includedRoutes(paths) {
  return [
    ...paths.filter((p) => !p.includes(":") && !p.includes("*")),
    ...posts.map((p) => `/posts/${p.slug}`),
  ];
}
