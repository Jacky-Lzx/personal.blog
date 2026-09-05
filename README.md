# 李泽玺的个人博客

与 [personal.homepage](https://jacky-lzx.github.io) 同风格（Catppuccin 双主题 + 终端 UI）的个人博客。

## 技术栈

- **Vite + Vue 3 + vue-router**
- **vite-ssg**：构建时 SSG，每个页面预渲染为静态 HTML
- **marked + marked-highlight + highlight.js**：Markdown 渲染与代码高亮
- **KaTeX**（marked-katex-extension）：公式渲染，构建时转成 HTML，字体随站点打包、无 CDN
- 文章源是 Obsidian vault（`src/posts/`），构建时把 wikilink/嵌入/callout 等 Obsidian 语法转为 HTML
- 无 blog 框架（非 Hexo/Hugo/Astro），站点即普通 Vue 工程

## 开发

```bash
npm install
npm run dev       # 本地预览 http://localhost:5173/blog/
npm run build     # 构建 SSG 产物到 dist/
npm run preview   # 预览构建产物
```

## 中文字体（霞鹜文楷）

正文中文使用 [LXGW WenKai（霞鹜文楷）](https://github.com/lxgw/LxgwWenKai)（SIL OFL 1.1，可商用）。
字体经 `scripts/wenkai_subset.py` 子集化并按 `unicode-range` 切成 28 片 woff2
（站点当前用到的字符在前，其余按语料频率排序），浏览器只按需加载用到的片，
现有页面仅下载约 190KB。

**新增/修改文章后**，若出现字体回退（个别字变宋体/黑体），重新生成子集：

```bash
pip install fonttools brotli   # 如未安装
python3 scripts/wenkai_subset.py
npm run build
```

字体文件与许可证见 `public/fonts/wenkai/`（含 OFL.txt）。

## 写作

`src/posts/` 就是一个 [Obsidian vault](https://obsidian.md)，直接用 Obsidian 打开该目录写作即可。
frontmatter 字段：

```markdown
---
id: post-name             # 与文件名一致
aliases:
  - 文章标题              # 第一项作为文章显示标题
  - 别名2                 # 其余为别名，参与 [[链接]] 解析
tags:
  - tag1
  - tag2
date: 2025-09-04
description: 一句话摘要（缺省时自动取正文首段）
---
```

（兼容旧格式：`title:` 字段仍可用，优先级高于 `aliases` 第一项；`tags` 也可写行内 `[tag1, tag2]`）

### 发布规则

- `src/posts/` **顶层**的 `.md` 文件发布为文章 → `/posts/<文件名>`
- 子文件夹（如 `Inbox/`）中的笔记不发布，但可被 `[[链接]]` 解析（显示为「未发布」）
- 附件放 `src/posts/attachments/`（已写入 vault 配置，Obsidian 会自动存到这里）

### 支持的 Obsidian 语法（构建时转换为 HTML）

| 语法 | 效果 |
| --- | --- |
| `[[id]]` / `[[文件名]]` / `[[标题]]` / `[[别名]]` | 站内链接 `/posts/<slug>`，未命中显示为悬空链接 |
| `[[笔记\|显示文字]]` | 自定义链接文字 |
| `[[笔记#标题]]` | 跳转到目标文章的小节（标题悬停可见 ¶ 锚点） |
| `![[笔记]]` | 内嵌笔记卡片（标题 + 摘要） |
| `![[图片.png]]` | 嵌入 `attachments/` 中的图片 |
| `> [!note] 标题`（tip/info/warning/danger/question/example/quote/todo/bug/success/failure，`-` 结尾可折叠） | 提示框（callout） |
| 正文中的 `#标签` | 链接到 `/tags/<标签>` |
| `$...$` / `$$...$$` | KaTeX 公式（行内 / 块级），callout 内同样生效，代码块内不解析 |

文章页底部有 **backlinks** 面板，自动列出引用了当前文章的其他文章（双向链接）。

代码块与行内代码内的 `[[...]]`、`#tag` 不会被转换。

### 构建时会自动：

- 为每篇顶层笔记生成静态路由 `/posts/<文件名>`
- 为每个标签生成 `/tags/<tag>` 页面
- 生成 `dist/404.html`（GitHub Pages 自动兜底）

## 画廊

`src/gallery/` 放图片，构建时生成 `/gallery` 页面（导航栏「3 画廊」）：

- 图片支持 `png/jpg/jpeg/gif/webp/svg/avif/bmp`，可放子文件夹
- 每张图可配一份**注释笔记**：与图片同目录、同名的 `.md` 文件（Obsidian 惯例，
  `sunset.svg` 的注释写在 `sunset.svg.md`），支持 frontmatter + 与文章相同的
  Obsidian 语法（wikilink/callout/`#tag`）：

  ```markdown
  ---
  title: 像素日落
  tags:
    - 风景
  date: 2026-06-12
  description: 一句话描述（用于图片页 SEO）
  ---

  对这张图片的注释……
  ```

- 没有注释笔记的图片仍然会出现在画廊里（显示「暂无注释」），标签缺省为无
- 页面结构：`/gallery`（全部）→ `/gallery/<标签>`（按标签筛选）→ `/gallery/image/<图片>`（大图 + 注释 + 上一张/下一张），全部预渲染为静态 HTML

## 目录结构

```
src/
├── main.js          # vite-ssg 入口
├── routes.js        # 静态路由（文章/标签/画廊路由由数据自动生成）
├── lib/
│   ├── posts.js         # 加载 md、解析、生成 posts/allTags/backlinks
│   ├── frontmatter.js   # 迷你 YAML frontmatter 解析器
│   ├── obsidian.js      # Obsidian 语法预处理（wikilink/嵌入/callout/#tag）
│   └── gallery.js       # 画廊：图片 + 同名 .md 注释笔记 → galleryItems/allGalleryTags
├── pages/           # Home / Post / Tags / Tag / Gallery / GalleryItem / NotFound
├── components/      # AppNav / PostList / Footer
├── posts/           # Obsidian vault：顶层 *.md 发布，attachments/ 存附件
├── gallery/         # 画廊图片 + <文件名>.md 注释笔记（可选）
└── styles/          # variables/base 移植自 homepage + blog.css
```

## 部署（GitHub Pages，独立仓库/域名）

当前 `vite.config.js` 与 `src/main.js` 中 `base: "/"`，按独立仓库部署：

1. 新建仓库（如 `Jacky-Lzx/blog`），把本项目推上去
2. 仓库 Settings → Pages → Build and deployment → Source 选 **GitHub Actions**
3. push 后 `.github/workflows/deploy.yml` 会自动构建并发布
4. `dist/404.html` 会被 GitHub Pages 用于未知路径的兜底

默认地址为 `https://<用户名>.github.io/<仓库名>/`。若绑定自定义域名：

- Settings → Pages → Custom domain 填入域名（如 `blog.example.com`），并按提示添加 DNS
- Settings → Pages 勾选 **Enforce HTTPS**
- 项目里的 `base` 保持 `/` 不用改；主页（jacky-lzx.github.io）导航里加一个链接即可

### 回退到主页子路径部署

若想改回 `jacky-lzx.github.io/blog/`：把 `vite.config.js` 和 `src/main.js` 中的 `base` 都改为 `/"/blog/"`，并把 `dist/` 同步到 `Jacky-Lzx.github.io/blog/` 目录。
