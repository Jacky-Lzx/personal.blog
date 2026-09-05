---
id: blog-tour
aliases:
  - 博客功能展示
tags:
  - misc
date: 2025-09-01
description: "博客功能展示：Markdown、代码高亮、公式、Obsidian 语法与双向链接。"
---

博客的渲染管线是 **marked + highlight.js + KaTeX**，外加一层 Obsidian 风味语法的构建时转换。这篇把支持的功能逐一演示一遍，兼作渲染测试页。

## 基础 Markdown

**粗体**、_斜体_、~~删除线~~、`行内代码`、[外部链接](https://example.com)。

> 引用块：简单是终极的复杂。

有序列表：

1. 在 Obsidian 里写文章
2. `npm run build` 生成静态页
3. push 到 GitHub Pages

任务列表：

- [x] Markdown 渲染
- [x] 公式渲染
- [ ] 全文搜索

## 代码高亮

常用语言子集（highlight.js），主题跟随亮/暗切换：

```js
// 构建时把顶层笔记渲染成静态文章
const posts = notes
  .filter((n) => n.slug)
  .sort((a, b) => b.date.localeCompare(a.date));
```

```python
def anchor_for(heading: str) -> str:
    """标题 -> 锚点 id（前后端保持一致）"""
    return heading.strip().lower().replace(" ", "-")
```

```bash
#!/usr/bin/env bash
# 本地开发：起 Vite dev server
set -euo pipefail

PORT="${PORT:-5173}"
npm run dev -- --port "$PORT"
```

## 表格

|   功能   | 实现                            |            状态             |
| :------: | ------------------------------- | :-------------------------: |
| 代码高亮 | marked-highlight + highlight.js | <span class="t-ok">✓</span> |
|   公式   | marked-katex-extension（KaTeX） | <span class="t-ok">✓</span> |
| 双向链接 | 构建时解析 `[[...]]`            | <span class="t-ok">✓</span> |

## 公式（KaTeX）

行内公式：比如随机计算里单个 `AND` 门实现乘法，输出密度是 $P_{\text{out}} = p\,q$。

块级公式：

$$
  P_{\text{out}} = P(X=1)\,P(Y=1) = p\,q
$$

> [!tip] 公式和 callout 可以嵌套
> callout 内部也能写行内公式，比如精度随序列长度 $n$ 以 $O(1/\sqrt{n})$ 收敛。

## Obsidian 语法

- 双向链接：`[[hello-blog|你好，这是新的博客]]` 这种写法渲染成 → [[hello-blog|你好，这是新的博客]]；目标文章底部的 backlinks 面板会反过来列出本文
- 标题锚点：[[blog-tour#表格|跳转到「表格」小节]]（标题悬停可见 ¶）
- 图片嵌入：`![[catppuccin-swatch.svg]]`

![[catppuccin-swatch.svg]]

- 笔记嵌入：`![[hello-blog]]` 渲染成内嵌卡片

![[hello-blog]]

callout 支持 note / tip / info / question / warning / danger / success / example / quote / bug / todo 等类型：

> [!warning]- 折叠的 callout
> 以 `-` 结尾的 callout 渲染成可折叠的 `<details>`，点击标题展开。

正文行内标签可点击：#misc

## 细节

- 代码块与行内代码里的 `$`、`[[...]]`、`#tag` 都不会被转换
- 子文件夹里的笔记（草稿）不发布，但可以被 `[[链接]]` 解析（显示为「未发布」）
- 图片画廊是独立功能，见导航栏的「画廊」
