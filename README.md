# 李泽玺的个人博客

与 [personal.homepage](https://jacky-lzx.github.io) 同风格（Catppuccin 双主题 + 终端 UI）的个人博客。

## 技术栈

- **Vite + Vue 3 + vue-router**
- **vite-ssg**：构建时 SSG，每个页面预渲染为静态 HTML
- **marked + marked-highlight + highlight.js**：Markdown 渲染与代码高亮
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
title: 文章标题
date: 2025-09-04
tags: [tag1, tag2]
description: 一句话摘要（缺省时自动取正文首段）
aliases: [别名1, 别名2]   # 可选，参与 [[链接]] 解析
---
```

### 发布规则

- `src/posts/` **顶层**的 `.md` 文件发布为文章 → `/posts/<文件名>`
- 子文件夹（如 `Inbox/`）中的笔记不发布，但可被 `[[链接]]` 解析（显示为「未发布」）
- 附件放 `src/posts/attachments/`（已写入 vault 配置，Obsidian 会自动存到这里）

### 支持的 Obsidian 语法（构建时转换为 HTML）

| 语法 | 效果 |
| --- | --- |
| `[[笔记名]]` / `[[文件名]]` / `[[别名]]` | 站内链接 `/posts/<slug>`，未命中显示为悬空链接 |
| `[[笔记\|显示文字]]` | 自定义链接文字 |
| `[[笔记#标题]]` | 跳转到目标文章的小节（标题悬停可见 ¶ 锚点） |
| `![[笔记]]` | 内嵌笔记卡片（标题 + 摘要） |
| `![[图片.png]]` | 嵌入 `attachments/` 中的图片 |
| `> [!note] 标题`（tip/info/warning/danger/question/example/quote/todo/bug/success/failure，`-` 结尾可折叠） | 提示框（callout） |
| 正文中的 `#标签` | 链接到 `/tags/<标签>` |

文章页底部有 **backlinks** 面板，自动列出引用了当前文章的其他文章（双向链接）。

代码块与行内代码内的 `[[...]]`、`#tag` 不会被转换。

### 构建时会自动：

- 为每篇顶层笔记生成静态路由 `/posts/<文件名>`
- 为每个标签生成 `/tags/<tag>` 页面
- 生成 `dist/404.html`（GitHub Pages 自动兜底）

## 目录结构

```
src/
├── main.js          # vite-ssg 入口
├── routes.js        # 静态路由（文章/标签路由由 posts 自动生成）
├── lib/
│   ├── posts.js         # 加载 md、解析、生成 posts/allTags/backlinks
│   ├── frontmatter.js   # 迷你 YAML frontmatter 解析器
│   └── obsidian.js      # Obsidian 语法预处理（wikilink/嵌入/callout/#tag）
├── pages/           # Home / Post / Tags / Tag / NotFound
├── components/      # AppNav / PostList / Footer
├── posts/           # Obsidian vault：顶层 *.md 发布，attachments/ 存附件
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
