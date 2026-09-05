import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import markedKatex from "marked-katex-extension";
import hljs from "highlight.js/lib/common";
import { anchorFor, transformObsidian } from "./obsidian";

/*
 * 重渲染管线（marked / katex / highlight.js 全在这里）。
 * 仅通过 lib/posts.js 的 renderMarkdown() 动态 import 加载，
 * 因此会单独成 chunk：首页/列表页不会下载，
 * 只有打开文章/画廊详情页时才按需加载。
 * 构建时（vite-ssg 预渲染）在 Node 里同样可用。
 */

/* render() 期间当前使用的 ctx（marked 渲染器回调拿不到入参，用模块级变量传递） */
let activeCtx = null;

/* 数学公式（KaTeX）：$...$ 行内、$$...$$ 块级 */
marked.use(
  markedKatex({
    throwOnError: false, // 公式写错时显示红色原文，不中断构建
    errorColor: "#f38ba8",
  })
);

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

/* 标题加锚点 id（与 obsidian.js 的 anchorFor 保持一致），供 [[note#标题]] 跳转 */
marked.use({
  renderer: {
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens);
      return `<h${depth} id="${anchorFor(text)}">${text}</h${depth}>\n`;
    },
  },
});

/* 图片 src 重写：vault 相对路径（attachments/...）→ 构建产物 URL */
marked.use({
  renderer: {
    image({ href, title, tokens }) {
      const alt = this.parser.parseInline(tokens || []).replace(/"/g, "&quot;");
      const src = (activeCtx && activeCtx.resolveAttachment(href)) || href;
      return `<img src="${src}" alt="${alt}"${title ? ` title="${title}"` : ""} loading="lazy">`;
    },
  },
});

/* 完整管线：Obsidian 语法 → Markdown → HTML（ctx.renderMarkdown 已回指这里） */
export function render(text, ctx) {
  activeCtx = ctx;
  return marked.parse(transformObsidian(text, ctx));
}
