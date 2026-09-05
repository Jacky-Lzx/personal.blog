import { parseFrontmatter } from "./frontmatter";

/*
 * 画廊数据源（src/gallery/）：
 * - 任意图片文件（png/jpg/svg/webp/...），支持子文件夹
 * - 同名同目录的 <文件名含扩展名>.md 为可选的「注释」笔记
 *   （Obsidian 惯例：sunset.svg 的注释写在 sunset.svg.md）：
 *     frontmatter: title / tags / date / description
 *     正文：对该图片的注释（走与文章一致的 Obsidian → Markdown 管线）
 * - 没有注释笔记的图片归入默认标签「未分类」
 */

const imageFiles = import.meta.glob(
  "../gallery/**/*.{png,jpg,jpeg,gif,webp,svg,avif,bmp}",
  { query: "?url", import: "default", eager: true }
);
const noteFiles = import.meta.glob("../gallery/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

function normalizeList(v) {
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === "string" && v)
    return v.split(/[,，]/).map((s) => s.trim()).filter(Boolean);
  return [];
}

export const galleryItems = Object.entries(imageFiles)
  .map(([p, url]) => {
    const rel = p.slice("../gallery/".length); // "a/b.svg"
    const slash = rel.lastIndexOf("/");
    const dir = slash === -1 ? "" : rel.slice(0, slash + 1);
    const file = rel.slice(slash + 1);
    const dot = file.lastIndexOf(".");
    const stem = file.slice(0, dot);
    const id = rel.slice(0, rel.length - (file.length - stem.length));

    const raw = noteFiles[`../gallery/${dir}${file}.md`];
    let meta = {};
    let body = "";
    if (raw != null) {
      const r = parseFrontmatter(raw);
      meta = r.meta;
      body = r.body;
    }

    const hasAnnotation = body.trim().length > 0;
    return {
      id,
      url,
      file,
      title:
        (typeof meta.title === "string" && meta.title) ||
        (Array.isArray(meta.aliases) &&
          typeof meta.aliases[0] === "string" &&
          meta.aliases[0]) ||
        stem,
      tags: normalizeList(meta.tags),
      date:
        meta.date != null && meta.date !== "" ? String(meta.date) : "",
      description:
        typeof meta.description === "string" ? meta.description : "",
      hasAnnotation,
      annotation: hasAnnotation ? body : "", // 注释正文原文；html 由 GalleryItem.vue 按需渲染
    };
  })
  .sort(
    (a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id)
  );

export const allGalleryTags = [
  ...new Set(galleryItems.flatMap((i) => i.tags)),
].map((tag) => ({
  tag,
  count: galleryItems.filter((i) => i.tags.includes(tag)).length,
}));

export const galleryByTag = (tag) =>
  galleryItems.filter((i) => i.tags.includes(tag));

export const galleryItemById = (id) =>
  galleryItems.find((i) => i.id === id) || null;
