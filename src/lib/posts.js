import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js/lib/common";
import { parseFrontmatter } from "./frontmatter";

/* 代码高亮（highlight.js 常用语言子集，控制包体积） */
marked.use(
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return code;
    },
  })
);

/* 取正文第一个非空段落作为摘要 */
function excerptOf(body) {
  const line = body
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l && !/^#/.test(l) && !/^-{3,}$/.test(l) && !/^```/.test(l));
  if (!line) return "";
  return line
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*`>#]/g, "")
    .slice(0, 140);
}

/* 粗略阅读时长（按中文每分钟 ~400 字估算） */
export function readingTimeOf(body) {
  const chars = body.replace(/[#*`>\[\]()!|-]/g, "").length;
  return Math.max(1, Math.round(chars / 400));
}

const rawModules = import.meta.glob("../posts/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

export const posts = Object.entries(rawModules)
  .map(([path, raw]) => {
    const slug = path.split("/").pop().replace(/\.md$/, "");
    const { meta, body } = parseFrontmatter(raw);
    return {
      slug,
      title: meta.title || slug,
      date: meta.date || "1970-01-01",
      tags: Array.isArray(meta.tags) ? meta.tags : meta.tags ? [meta.tags] : [],
      description: meta.description || excerptOf(body),
      html: marked.parse(body),
      readingTime: readingTimeOf(body),
    };
  })
  .sort((a, b) => b.date.localeCompare(a.date));

export const postBySlug = (slug) => posts.find((p) => p.slug === slug);

export const allTags = [
  ...new Set(posts.flatMap((p) => p.tags)),
].map((tag) => ({
  tag,
  count: posts.filter((p) => p.tags.includes(tag)).length,
}));
