/**
 * Obsidian 风味 Markdown 预处理器。
 * 在 marked 解析前把 Obsidian 特有语法转成标准 HTML/Markdown：
 *   [[note]] / [[note|alias]] / [[note#heading]]      → 站内链接
 *   ![[note]]                                         → 笔记内嵌卡片
 *   ![[image.png]]                                    → <img>
 *   > [!type] title  (Obsidian callout)               → 提示框
 *   正文中的 #tag                                      → 标签链接
 * 代码块（``` / ~~~）与行内代码 `...` 内的内容原样保留。
 */

/* 与 posts.js 中 heading 渲染器共用：标题 → 锚点
   兼容 [[note#**粗体** 标题]]：去掉 markdown 强调符与 HTML 标签 */
export function anchorFor(headingText) {
  return headingText
    .replace(/<[^>]*>/g, "")
    .replace(/[*_`~]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

const CALLOUT_TYPES = {
  note: { icon: "📝" },
  tip: { icon: "💡" },
  info: { icon: "ℹ️" },
  question: { icon: "❓" },
  warning: { icon: "⚠️" },
  danger: { icon: "🚨" },
  failure: { icon: "❌" },
  success: { icon: "✅" },
  todo: { icon: "☑️" },
  example: { icon: "📚" },
  quote: { icon: "❝" },
  bug: { icon: "🐛" },
};

export function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* 按 ```/~~~ 围栏切分，只对非代码段应用 fn */
function mapOutsideCode(text, fn) {
  const lines = text.split("\n");
  const out = [];
  let buf = [];
  let fence = null;
  const flush = () => {
    if (buf.length) {
      out.push({ code: fence !== null, text: buf.join("\n") });
      buf = [];
    }
  };
  for (const line of lines) {
    const m = line.match(/^\s*(`{3,}|~{3,})/);
    if (fence) {
      buf.push(line);
      if (m && m[1][0] === fence) {
        flush(); // 此时 fence 仍非空 → 正确标记为代码段
        fence = null;
      }
    } else if (m) {
      flush();
      fence = m[1][0];
      buf.push(line);
    } else {
      buf.push(line);
    }
  }
  flush();
  return out.map((s) => (s.code ? s.text : fn(s.text))).join("\n");
}

/* 临时藏起代码内容，避免 `[[x]]` / `#tag` 出现在代码里被误转换。
   同时保护两种形态：
   - markdown 阶段的行内代码 `...`
   - callout 内层渲染后产生的 <code>/<pre> HTML
   占位符带每次调用唯一的 uid，递归管线不会互相误吃 */
let protectUid = 0;
function withProtected(text, fn) {
  const uid = ++protectUid;
  const stash = [];
  const put = (m) => {
    stash.push(m);
    return `\u0000${uid}\u0000${stash.length - 1}\u0000`;
  };
  const hidden = text
    .replace(/<pre[\s\S]*?<\/pre>|<code>\s*[^]*?<\/code>/g, put)
    .replace(/`[^`\n]+`/g, put);
  const out = fn(hidden);
  return out.replace(new RegExp(`\\u0000${uid}\\u0000(\\d+)\\u0000`, "g"), (_, i) => stash[+i]);
}

/* 正文行内标签：#tag / #a/b → 标签页链接（前一个字符必须是非单词字符） */
function transformTags(text) {
  return text.replace(
    /(^|[^\p{L}\p{N}_/])#([\p{L}\p{N}_/-][\p{L}\p{N}_/-]*)/gu,
    (m, pre, tag) => `${pre}<a class="chip hl-mauve inline-tag" href="/tags/${encodeURIComponent(tag)}">#${tag}</a>`
  );
}

/* 双向链接：[[...]] 与嵌入 ![[...]] */
function transformWikilinks(text, ctx) {
  let out = text.replace(/(!?)\[\[([^\[\]\n]+?)\]\]/g, (m, bang, raw) => {
    const pipe = raw.indexOf("|");
    const targetPart = (pipe === -1 ? raw : raw.slice(0, pipe)).trim();
    const alias = pipe === -1 ? "" : raw.slice(pipe + 1).trim();
    const hashIdx = targetPart.indexOf("#");
    const name = (hashIdx === -1 ? targetPart : targetPart.slice(0, hashIdx)).trim();
    const hash = hashIdx === -1 ? "" : targetPart.slice(hashIdx + 1);
    const note = ctx.resolveNote(name);

    if (bang) {
      if (name && ctx.isImage(name)) {
        const url = ctx.resolveAttachment(name);
        if (url) {
          // Obsidian 尺寸语法：![[img|300]] / ![[img|300x200]]（纯数字才当尺寸，否则仍为 alias）
          // invert 配置（暗色主题下是否翻转颜色）：![[img|300|no-invert]] / ![[img|no-invert]]
          const sizeM = alias.match(/^(\d+(?:\.\d+)?(?:x\d+(?:\.\d+)?)?)(?:px)?(?:\|(invert|no-invert))?$/);
          const flagOnly = /^(invert|no-invert)$/.test(alias);
          let style = "";
          let invertCls = "";
          if (sizeM) {
            const [w, h] = sizeM[1].split("x");
            style = ` style="width:${w}px${h ? `;height:${h}px` : ""}"`;
            if (sizeM[2]) invertCls = ` ${sizeM[2]}`;
          } else if (flagOnly) {
            invertCls = ` ${alias}`;
          }
          const altText = sizeM || flagOnly ? name : alias;
          return `<img class="embed-image${invertCls}" src="${url}" alt="${escapeHtml(altText)}"${style} loading="lazy">`;
        }
        return `<span class="wikilink dangling" title="找不到附件 ${escapeHtml(name)}">![[${escapeHtml(raw)}]]</span>`;
      }
      if (note && note.slug) {
        const href = ctx.noteHref(note, hash);
        return `<div class="note-embed"><a class="note-embed-title" href="${href}">📄 ${escapeHtml(note.title)}</a><p class="note-embed-excerpt">${escapeHtml(note.excerpt || "")}</p></div>`;
      }
      return `<span class="wikilink dangling" title="没有匹配的笔记">![[${escapeHtml(raw)}]]</span>`;
    }

    if (!note) {
      const label = alias || targetPart;
      return `<span class="wikilink dangling" title="没有匹配的笔记">${escapeHtml(label)}</span>`;
    }
    if (!note.slug) {
      // 子文件夹中的草稿笔记：可解析但未发布
      const label = alias || note.title;
      return `<span class="wikilink dangling" title="未发布（不在 posts/ 顶层）">${escapeHtml(label)}</span>`;
    }
    const href = ctx.noteHref(note, hash);
    const label = alias || note.title;
    return `<a class="wikilink" href="${href}">${escapeHtml(label)}</a>`;
  });
  // 独立行的图片嵌入包进 <p>：与 ![](...) 的 DOM 一致（卡片衬底套段落，invert 滤镜不会翻转它）；
  // 行内（与文字同行）的嵌入保持裸 <img>
  out = out.replace(/^<img class="embed-image[^\n>]*>$/gm, "<p>$&</p>");
  return out;
}

/* 压掉空行（marked 的 HTML block 遇到空行会断开），但保留 <pre> 内的换行 */
function squashOutsidePre(html) {
  let out = "";
  let last = 0;
  for (const m of html.matchAll(/<pre[\s\S]*?<\/pre>/g)) {
    out += html.slice(last, m.index).replace(/\n+/g, "");
    out += m[0];
    last = m.index + m[0].length;
  }
  return out + html.slice(last).replace(/\n+/g, "");
}

/* Obsidian callout：> [!type] title（支持 [!type]- 折叠） */
function transformCallouts(text, ctx) {
  const lines = text.split("\n");
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const m = lines[i].match(/^\s*>\s*\[!(\w+)\]\s*(-)?\s*(.*)$/);
    if (!m) {
      out.push(lines[i]);
      i++;
      continue;
    }
    const type = m[1].toLowerCase();
    const collapsed = m[2] === "-";
    const title = m[3].trim();
    const inner = [];
    i++;
    while (i < lines.length && /^\s*>/.test(lines[i])) {
      inner.push(lines[i].replace(/^\s*>\s?/, ""));
      i++;
    }
    const innerHtml = ctx.renderMarkdown(inner.join("\n"));
    const { icon } = CALLOUT_TYPES[type] || { icon: "📌" };
    const cls = `callout callout-${CALLOUT_TYPES[type] ? type : "custom"}`;
    const titleHtml = transformTags(transformWikilinks(escapeHtml(title), ctx), ctx);
    const body = `<div class="callout-content">${squashOutsidePre(innerHtml)}</div>`;
    const html = collapsed
      ? `<details class="${cls} is-collapsed"><summary class="callout-title">${icon}<span>${titleHtml}</span></summary>${body}</details>`
      : `<div class="${cls}"><div class="callout-title">${icon}<span>${titleHtml}</span></div>${body}</div>`;
    // 整块不含空行，保证 marked 当作单一 HTML block 原样透传
    out.push("", html, "");
  }
  return out.join("\n");
}

/**
 * 主入口。ctx 需要提供：
 *   resolveNote(name)      → note | null   { slug?, title, excerpt }
 *   noteHref(note, hash)   → "/posts/slug[#anchor]"
 *   isImage(name)          → bool
 *   resolveAttachment(name)→ url | null
 *   renderMarkdown(text)   → html（递归走完整管线 + marked）
 *
 * 顺序：
 * 1. 围栏代码块原样保留（mapOutsideCode）
 * 2. callout 先行：内层文本递归走完整管线后渲染成 HTML，
 *    内层自己的行内代码由内层管线闭环处理，不跨 marked 边界
 * 3. wikilink → 行内 #tag：全程保护行内代码与 <code>/<pre>
 */
export function transformObsidian(text, ctx) {
  return mapOutsideCode(text, (t) =>
    withProtected(transformCallouts(t, ctx), (s) =>
      transformTags(transformWikilinks(s, ctx))
    )
  );
}
