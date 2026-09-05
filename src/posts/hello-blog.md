---
title: 你好，这是新的博客
date: 2025-09-04
tags: [misc, engineering]
description: 博客上线：技术选型、目录结构与写作工作流。
---

新博客上线了。之前所有的东西都挤在一个单页 homepage 里，现在把「持续更新的内容」拆出来，放到这里。

## 为什么是这个技术栈

- 前端框架：Vite + Vue 3
- 静态生成：vite-ssg
  - 构建时把每个页面预渲染成纯静态 HTML，SEO 友好、首屏快，部署到 GitHub Pages 零配置
- Markdown 渲染和代码高亮：marked + highlight.js
  - 轻量成熟，不引入额外框架依赖
- 零 blog 框架

## 写作工作流

```bash
# 1. 在 src/posts/ 下新建一个 .md 文件，写好 frontmatter
# 2. 本地预览
npm run dev

# 3. 构建（产物在 dist/，每篇文章一个静态 HTML）
npm run build
```

frontmatter 支持 `title` / `date` / `tags` / `description` 四个字段，解析器是手写的 20 行脚本（见 `src/lib/frontmatter.js`）。

## 设计

和主页保持一致：Catppuccin Mocha / Latte 双主题（快捷键 `t` 切换）、终端风格 UI。文章页就是一个 `cat` 命令的输出：

> `❯ cat posts/hello-blog.md`

后续可能加：RSS、代码块复制按钮、全文搜索。
