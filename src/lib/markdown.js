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

/* 常见语言别名 → 显示名（未收录的回退到原始语言名） */
const LANG_NAMES = {
  js: "JavaScript", javascript: "JavaScript", mjs: "JavaScript", cjs: "JavaScript",
  ts: "TypeScript", typescript: "TypeScript",
  py: "Python", python: "Python",
  sh: "Bash", bash: "Bash", shell: "Bash", zsh: "Zsh",
  md: "Markdown", markdown: "Markdown",
  html: "HTML", xml: "XML", vue: "Vue",
  css: "CSS", scss: "SCSS", less: "Less",
  json: "JSON", yaml: "YAML", yml: "YAML", toml: "TOML",
  sql: "SQL", go: "Go", golang: "Go", rust: "Rust",
  rs: "Rust", java: "Java", c: "C", cpp: "C++", "c++": "C++",
  cs: "C#", "c#": "C#", rb: "Ruby", ruby: "Ruby",
  php: "PHP", swift: "Swift", kt: "Kotlin", kotlin: "Kotlin",
  dockerfile: "Dockerfile", docker: "Dockerfile",
  diff: "Diff", patch: "Patch", txt: "Plain Text", text: "Plain Text",
};

function langName(lang) {
  const key = (lang || "").toLowerCase();
  return LANG_NAMES[key] || (lang ? lang[0].toUpperCase() + lang.slice(1) : null);
}

/* 语言图标（devicon 单色版，已统一替换为 currentColor 跟随主题）。
   svg 内容由 scripts/gen_lang_icons.mjs 生成（Vite 8/rolldown 下 `?raw` 不可用） */
import { LANG_ICON_SVGS } from "../assets/lang-icons/icons.js";
const ICONS = {};
for (const [key, svg] of Object.entries(LANG_ICON_SVGS)) {
  ICONS[key] = svg.replace(/<svg /, '<svg class="code-block__icon" ');
}

/* 围栏语言别名 → 图标文件名（与 LANG_NAMES 的 key 对齐，没有图标的语言不收录） */
const LANG_ICONS = {
  js: "javascript", javascript: "javascript", mjs: "javascript", cjs: "javascript",
  ts: "typescript", typescript: "typescript",
  py: "python", python: "python",
  sh: "bash", bash: "bash", shell: "bash", zsh: "zsh",
  md: "markdown", markdown: "markdown",
  html: "html5", xml: "xml", vue: "vuejs",
  css: "css3", scss: "sass", sass: "sass",
  json: "json", yaml: "yaml", yml: "yaml",
  go: "golang", golang: "golang", rust: "rust", rs: "rust",
  java: "java", c: "c", cpp: "cplusplus", "c++": "cplusplus",
  cs: "csharp", "c#": "csharp", rb: "ruby", ruby: "ruby",
  php: "php", swift: "swift", kt: "kotlin", kotlin: "kotlin",
  dockerfile: "docker", docker: "docker",
};

/* 代码块：外层包一个容器，顶部显示语言名（无语言标注时不显示） */
marked.use({
  renderer: {
    code({ text, lang }) {
      const firstWord = (lang || "").match(/\S*/)[0]; // 取 info string 第一个词
      const name = langName(firstWord);
      const code = `<pre><code class="hljs language-${firstWord || "plaintext"}">${text}</code></pre>`;
      if (!name) return code + "\n";
      const icon = ICONS[LANG_ICONS[firstWord.toLowerCase()] || ""] || "";
      return `<div class="code-block">
<div class="code-block__lang" title="${name}">${icon}${name}</div>
${code}
</div>\n`;
    },
  },
});

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
      let alt = this.parser.parseInline(tokens || []).replace(/"/g, "&quot;");
      const src = (activeCtx && activeCtx.resolveAttachment(href)) || href;
      // Obsidian 尺寸语法：![alt|300](src) / ![alt|300x200](src)（与 ![[img|300]] 一致）
      // invert 配置（暗色主题下是否翻转颜色）：![alt|300|no-invert](src) / ![alt|no-invert](src)，或 title：![alt](src "no-invert")
      let style = "";
      let invertFlag = "";
      const flagM = alt.match(/^(.*?)(?:px)?\|(invert|no-invert)$/);
      if (flagM) {
        invertFlag = flagM[2];
        alt = flagM[1];
      }
      const sizeM = alt.match(/^(.*?)\|(\d+(?:\.\d+)?(?:x\d+(?:\.\d+)?)?)(?:px)?$/);
      if (sizeM) {
        const [w, h] = sizeM[2].split("x");
        style = ` style="width:${w}px${h ? `;height:${h}px` : ""}"`;
        alt = sizeM[1];
      }
      if (!invertFlag && /^(invert|no-invert)$/.test((title || "").trim())) {
        invertFlag = title.trim();
        title = "";
      }
      return `<img${invertFlag ? ` class="${invertFlag}"` : ""} src="${src}" alt="${alt}"${title ? ` title="${title}"` : ""}${style} loading="lazy">`;
    },
  },
});

/* 完整管线：Obsidian 语法 → Markdown → HTML（ctx.renderMarkdown 已回指这里） */
export function render(text, ctx) {
  activeCtx = ctx;
  return marked.parse(transformObsidian(text, ctx));
}
