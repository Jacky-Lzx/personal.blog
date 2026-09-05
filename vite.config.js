import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
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

/*
 * virtual:post-dates —— 每篇文章的最后修改日期（YYYY-MM-DD）。
 * 优先取该文件最后一次 git 提交日期（与 GitHub Pages 上展示的时间一致），
 * 无 git 信息时回退到文件 mtime。构建时打包进产物，客户端 SPA 导航同样可用。
 */
const postDatesModule = "virtual:post-dates";
function gitLastCommitDate(file) {
  try {
    return execFileSync("git", ["log", "-1", "--format=%cs", "--", file], {
      cwd: fileURLToPath(new URL(".", import.meta.url)),
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return "";
  }
}
function collectPostDates() {
  const dir = fileURLToPath(new URL("./src/posts", import.meta.url));
  const out = {};
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".md") || f.startsWith(".")) continue;
    const stat = statSync(`${dir}/${f}`);
    const gitDate = gitLastCommitDate(`src/posts/${f}`);
    const date =
      gitDate ||
      new Date(stat.mtime).toISOString().slice(0, 10);
    out[f.replace(/\.md$/, "")] = date;
  }
  return out;
}
const postDatesPlugin = {
  name: "post-dates",
  resolveId(id) {
    if (id === postDatesModule) return "\0" + postDatesModule;
  },
  load(id) {
    if (id !== "\0" + postDatesModule) return;
    // dev 下监听各 md 文件，改动后重新计算
    const dir = fileURLToPath(new URL("./src/posts", import.meta.url));
    for (const f of readdirSync(dir)) {
      if (f.endsWith(".md") && !f.startsWith("."))
        this.addWatchFile(`${dir}/${f}`);
    }
    return `export default ${JSON.stringify(collectPostDates())};`;
  },
};

/* 项目站点部署：jacky-lzx.github.io/personal.blog/，
   base 为 "/personal.blog/"，须与 src/main.js 中 router 的 base 一致。
   若改回独立域名/用户站点部署，两处同步改回 "/" */
export default defineConfig({
  base: "/personal.blog/",
  plugins: [vue(), postDatesPlugin],
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
