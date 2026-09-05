import { parseFrontmatter } from "./frontmatter";
import { anchorFor } from "./obsidian";
import postDates from "virtual:post-dates";

/*
 * 文章源 = Obsidian vault（src/posts/）。
 * - 顶层 *.md 发布为博客文章（/posts/<文件名>）
 * - 子文件夹中的 *.md 只参与 [[链接]] 解析（草稿），不发布
 * - attachments/ 下的文件可作为 ![[...]] 嵌入或普通 Markdown 图片引用
 */

/* 取正文第一个非空段落作为摘要 */
function excerptOf(body) {
  const line = body
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l && !/^#/.test(l) && !/^-{3,}$/.test(l) && !/^```/.test(l) && !/^>\s*\[!/.test(l));
  if (!line) return "";
  return line
    .replace(/!\[\[[^\]]*\]\]/g, "")
    .replace(/\[\[([^\]|]*)(?:\|([^\]]*))?\]\]/g, (_, a, b) => b || a)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*`>#]/g, "")
    .trim()
    .slice(0, 140);
}

/* 粗略阅读时长（按中文每分钟 ~400 字估算） */
export function readingTimeOf(body) {
  const chars = body.replace(/[#*`>\[\]()!|-]/g, "").length;
  return Math.max(1, Math.round(chars / 400));
}

/* 附件索引：attachments/ 下的文件 → 构建产物 URL */
const attachmentFiles = import.meta.glob("../posts/attachments/**/*", {
  query: "?url",
  import: "default",
  eager: true,
});
const attachments = {};
for (const [p, url] of Object.entries(attachmentFiles)) {
  const rel = p.replace("../posts/", "");
  const base = rel.split("/").pop();
  if (base.startsWith(".")) continue;
  if (!(rel in attachments)) attachments[rel] = url;
  if (!(base in attachments)) attachments[base] = url;
}

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|avif|bmp|ico)$/i;
const isImage = (name) => IMAGE_EXT.test(name);
const resolveAttachment = (name) => {
  const n = name.replace(/^\.\//, "").replace(/^attachments\//, "attachments/");
  return (
    attachments[n] ||
    attachments[n.replace(/^attachments\//, "")] ||
    attachments[n.split("/").pop()] ||
    null
  );
};

/* 先解析所有笔记（含子文件夹草稿），建立 [[链接]] 索引 */
const allNotes = import.meta.glob("../posts/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

/* 显示标题：优先 title（旧格式），其次 aliases 第一项（Obsidian 惯例：
   id 与文件名一致，标题写在 aliases 里），最后回退到文件名 */
const titleOf = (meta, file) =>
  (typeof meta.title === "string" && meta.title) ||
  (Array.isArray(meta.aliases) && typeof meta.aliases[0] === "string" && meta.aliases[0]) ||
  file.replace(/\.md$/, "");

const notes = Object.entries(allNotes).map(([path, raw]) => {
  const file = path.split("/").pop();
  const isTopLevel = !path.slice("../posts/".length).includes("/");
  const { meta, body } = parseFrontmatter(raw);
  const created =
    meta.date != null && meta.date !== "" ? String(meta.date) : "1970-01-01";
  return {
    slug: isTopLevel ? file.replace(/\.md$/, "") : null,
    raw,
    body,
    id: typeof meta.id === "string" && meta.id ? meta.id : null,
    title: titleOf(meta, file),
    date: created,
    // 最后修改日期：构建时从 git 提交历史（回退 mtime）取；未改过则等于创建日期
    updated: (isTopLevel && postDates[file.replace(/\.md$/, "")] && postDates[file.replace(/\.md$/, "")] >= created) ? postDates[file.replace(/\.md$/, "")] : created,
    tags: normalizeList(meta.tags),
    aliases: normalizeList(meta.aliases),
    description: typeof meta.description === "string" ? meta.description : "",
  };
});

function normalizeList(v) {
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === "string" && v) return v.split(/[,，]/).map((s) => s.trim()).filter(Boolean);
  return [];
}

/* [[链接]] 按 id / 文件名 / 标题 / aliases 解析（不区分大小写） */
const noteIndex = new Map();
const indexNote = (key, note) => {
  const k = String(key).trim().toLowerCase();
  if (k && !noteIndex.has(k)) noteIndex.set(k, note);
};
for (const n of notes) {
  if (n.slug) indexNote(n.slug, n);
  if (n.id) indexNote(n.id, n);
  indexNote(n.title, n);
  n.aliases.forEach((a) => indexNote(a, n));
}
const resolveNote = (name) => noteIndex.get(String(name).trim().toLowerCase()) || null;

const noteHref = (note, hash) =>
  `/posts/${note.slug}` + (hash && !hash.includes("^") ? `#${anchorFor(hash)}` : "");

/* Obsidian 语法转换上下文 */
let mdMod = null; // 懒加载的重渲染管线（./markdown，含 marked/katex/highlight.js）
const ctx = {
  resolveNote,
  noteHref,
  isImage,
  resolveAttachment,
  // obsidian.js 的 callout 等块会递归调用它；执行时 mdMod 必已加载
  renderMarkdown: (text) => mdMod.render(text, ctx),
};

/* 供其他模块（如画廊注释）复用的完整渲染管线。
   动态 import：重依赖单独成 chunk，首页/列表页不下载，
   仅文章/画廊详情页（客户端 SPA 导航）或构建预渲染时加载 */
export async function renderMarkdown(text) {
  mdMod = mdMod ?? (await import("./markdown"));
  return ctx.renderMarkdown(text);
}

/* 渲染发布的文章（顶层笔记） */
export const posts = notes
  .filter((n) => n.slug)
  .map((n) => ({
    slug: n.slug,
    title: n.title,
    date: n.date,
    updated: n.updated,
    tags: n.tags,
    description: n.description || excerptOf(n.body),
    excerpt: excerptOf(n.body),
    body: n.body, // 正文原文；html 由 Post.vue 按需调用 renderMarkdown 渲染
    readingTime: readingTimeOf(n.body),
    backlinks: [],
  }))
  .sort((a, b) => b.date.localeCompare(a.date));

/* 反向链接：扫描其他文章正文中指向本文的 [[链接]] */
const bySlug = new Map(posts.map((p) => [p.slug, p]));
for (const n of notes) {
  if (!n.slug) continue;
  const fromPost = bySlug.get(n.slug);
  for (const m of n.body.matchAll(/\[\[([^\[\]\n]+?)\]\]/g)) {
    const name = m[1].split("|")[0].split("#")[0].trim();
    const hit = resolveNote(name);
    // hit 是 n 链接指向的文章；把 n 记为 hit 的反向链接
    const hitPost = hit && hit.slug ? bySlug.get(hit.slug) : null;
    if (hitPost && hitPost.slug !== n.slug && !hitPost.backlinks.includes(fromPost)) {
      hitPost.backlinks.push(fromPost);
    }
  }
}

export const postBySlug = (slug) => posts.find((p) => p.slug === slug);

export const allTags = [
  ...new Set(posts.flatMap((p) => p.tags)),
].map((tag) => ({
  tag,
  count: posts.filter((p) => p.tags.includes(tag)).length,
}));
