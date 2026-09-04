# 李泽玺的个人博客

与 [personal.homepage](https://jacky-lzx.github.io) 同风格（Catppuccin 双主题 + 终端 UI）的个人博客。

## 技术栈

- **Vite + Vue 3 + vue-router**
- **vite-ssg**：构建时 SSG，每个页面预渲染为静态 HTML
- **marked + marked-highlight + highlight.js**：Markdown 渲染与代码高亮
- 无 blog 框架（非 Hexo/Hugo/Astro），站点即普通 Vue 工程

## 开发

```bash
npm install
npm run dev       # 本地预览 http://localhost:5173/blog/
npm run build     # 构建 SSG 产物到 dist/
npm run preview   # 预览构建产物
```

## 写作

在 `src/posts/` 下新建 `.md` 文件即可，frontmatter 字段：

```markdown
---
title: 文章标题
date: 2025-09-04
tags: [tag1, tag2]
description: 一句话摘要（缺省时自动取正文首段）
---
```

构建时会自动：

- 为每篇文章生成静态路由 `/posts/<文件名>`
- 为每个标签生成 `/tags/<tag>` 页面
- 生成 `dist/404.html`（GitHub Pages 自动兜底）

## 目录结构

```
src/
├── main.js          # vite-ssg 入口
├── routes.js        # 静态路由（文章/标签路由由 posts 自动生成）
├── lib/
│   ├── posts.js         # 加载 md、解析、生成 posts/allTags
│   └── frontmatter.js   # 迷你 frontmatter 解析器
├── pages/           # Home / Post / Tags / Tag / NotFound
├── components/      # AppNav / PostList / Footer
├── posts/           # 文章（*.md）
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
