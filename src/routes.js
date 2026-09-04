import { allTags } from "./lib/posts";

const SITE = "李泽玺的博客";

export const routes = [
  {
    name: "home",
    path: "/",
    component: () => import("./pages/Home.vue"),
    meta: { title: SITE, description: "李泽玺的个人博客：电路、架构与新兴计算范式" },
  },
  // 文章用动态路由，具体路径在 main.js 导出的 includedRoutes 中声明以预渲染
  {
    name: "post",
    path: "/posts/:slug",
    component: () => import("./pages/Post.vue"),
    meta: { title: SITE },
  },
  {
    name: "tags",
    path: "/tags",
    component: () => import("./pages/Tags.vue"),
    meta: { title: `标签 · ${SITE}`, description: "博客标签索引" },
  },
  // 每个标签一个显式静态路由
  ...allTags.map((t) => ({
    name: `tag-${t.tag}`,
    path: `/tags/${encodeURIComponent(t.tag)}`,
    component: () => import("./pages/Tag.vue"),
    meta: { title: `#${t.tag} · ${SITE}`, description: `标签 ${t.tag} 下的文章` },
  })),
  // 显式 /404 路由：预渲染为 dist/404.html，GitHub Pages 对未知路径自动返回它
  {
    name: "not-found-page",
    path: "/404",
    component: () => import("./pages/NotFound.vue"),
    meta: { title: `404 · ${SITE}` },
  },
  // SPA 客户端兜底路由（不会被预渲染）
  {
    name: "not-found",
    path: "/:pathMatch(.*)*",
    component: () => import("./pages/NotFound.vue"),
    meta: { title: `404 · ${SITE}` },
  },
];
