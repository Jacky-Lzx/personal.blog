---
id: lazy-pipeline-bench
aliases:
  - 博客懒加载渲染管线的性能基准测试
tags:
  - web
  - performance
date: 2026-09-05
description: "博客懒加载渲染管线重构的性能基准测试：git worktree 搭建对照组，静态包体积、直载、SPA 导航三层指标，本地与模拟 4G 双环境。"
---

近期的重构将博客的渲染管线（marked / KaTeX / highlight.js）从「每个页面均加载」改为「仅在文章与画廊详情页按需加载」。
动机是 `npm run build` 的chunk 体积警告：

```text
dist/assets/app-9mMVRbQ2.js                           613.99 kB │ gzip: 203.13 kB

✓ built in 132ms
[plugin builtin:vite-reporter]
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rolldownOptions.output.codeSplitting to improve chunking: https://rolldown.rs/reference/OutputOptions.codeSplitting
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
```

整个应用被打包为单个 **614 kB** 的 chunk，列表页、标签页等轻页面也必须下载完整的 KaTeX 字体与公式引擎。

本篇文章量化该重构的性能影响，记录一次完整的 before/after 基准测试：对照组的搭建方式、指标体系、测量实现中排除的干扰因素，以及最终结果。

## 实验设计

### 对照组：git worktree

为保证两个版本的可比性，需要将重构前的代码按原样重建。使用 `git worktree` 将重构前的 commit 检出到独立目录，复用同一份 `node_modules` 与构建工具链：

```bash
# 将重构前的 commit 检出到独立工作树
git worktree add /tmp/blog-bench-before <before-sha>
ln -s "$PWD/node_modules" /tmp/blog-bench-before/node_modules
cd /tmp/blog-bench-before && npm run build   # before 版
cd - && npm run build                        # after 版
```

两个版本的构建产物分别由 `vite preview` 在独立端口提供服务，全部测量针对实际部署的静态产物，排除 dev server 行为的干扰。

本次对比使用的 commit（仓库：[Jacky-Lzx/personal.blog](https://github.com/Jacky-Lzx/personal.blog)）：

|  版本  | commit                                                                                                  | 说明                                  |
| :----: | ------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| before | [`3dba602`](https://github.com/Jacky-Lzx/personal.blog/commit/3dba60224b0a6e342b810ec0fa42167dbe1479b4) | 单 chunk 打包，即重构前的最后一次提交 |
| after  | [`fe65a12`](https://github.com/Jacky-Lzx/personal.blog/commit/fe65a12d59cc865152f2dd1e017bc0ea334e5683) | 懒加载重构，即基准测试的实测版本      |

### 指标体系

| 层         | 指标                                   | 方法                                         |
| ---------- | -------------------------------------- | -------------------------------------------- |
| 静态包体积 | raw / gzip 大小                        | 直接读取构建产物                             |
| 浏览器     | 直载页的 LCP、DCL、总传输字节、JS 字节 | headless Chrome + CDP，冷缓存，多轮取中位数  |
| 浏览器     | SPA 导航「点击→就绪」耗时、增量字节    | CDP 触发真实点击，requestAnimationFrame 轮询 |

### 网络环境

本地直连环境下网络传输耗时接近于零，两个版本的传输量差异被完全掩盖（首页 LCP 均为 ~685 ms）。
因此增设一组**模拟 4G** 环境：150 ms RTT、4 Mbps 下行。
传输量的差异只有在慢速网络上才会体现为时间差异。

## 测量实现（CDP）

浏览器指标基于 Chrome DevTools Protocol 采集，关键测量点如下：

- **冷缓存**：每次直载前调用 `Network.setCacheDisabled(true)` 并清除浏览器缓存，确保测量的是首次加载；SPA 场景保留缓存，模拟真实用户路径（入口页已加载，相关 chunk 已驻留内存）。
- **LCP**：通过 `Page.addScriptToEvaluateOnNewDocument` 在文档创建前注入 `PerformanceObserver`，记录 `largest-contentful-paint` 条目；相比事后读取 `performance.getEntries()`，该方式不会丢失早期条目。
- **SPA「点击→就绪」**：触发真实的 `<a>` 点击事件，随后逐帧轮询，直到同时满足「URL 已切换至目标路由 + 新内容已渲染 + reveal 动画已触发」。

> [!warning] 测量中需要排除的三类干扰
>
> 1. **缓存污染**：若 Chrome 用户数据目录未隔离，页面可能从 disk cache 加载（`deliveryType: cache`），DCL 降至个位数 ms、LCP 为 0，该轮数据整体无效。每轮测量必须使用全新的用户 profile。
> 2. **渐显动画计入耗时**：`.reveal` 元素带有 600 ms 的 opacity 过渡。若以 `getComputedStyle().opacity === '1'` 作为就绪判断，会把纯动画时长计入。改为以 `.visible` class 的添加时刻（动画起点）作为就绪信号。
> 3. **Vue 原地 patch**：文章之间的导航属于同组件类型的两个路由，Vue 复用同一 DOM 元素原地更新，基于元素身份的判定恒不成立。改用页面 h1 的文本作为内容签名，确认内容确实发生切换。

轮询核心逻辑：

```js
const oldSig = document.querySelector("h1")?.textContent || "";
const t0 = performance.now();
link.click();
while (performance.now() - t0 < 25000) {
  await new Promise((r) => requestAnimationFrame(r));
  if (location.pathname !== target) continue;
  const sig = document.querySelector("h1")?.textContent || "";
  if (sig === oldSig) continue; // 内容尚未切换
  const r = document.querySelector("main .reveal");
  if (r?.classList.contains("visible")) break; // 就绪
}
```

## 结果

### 包体积

|                        | before                          | after                                          |
| ---------------------- | ------------------------------- | ---------------------------------------------- |
| 关键 chunk（每页必载） | `app` **614 kB**（gzip 203 kB） | `app` **159 kB**（gzip 59 kB）                 |
| 懒加载 chunk           | —                               | `markdown` 460 kB（gzip 144 kB），仅详情页按需 |
| 总量                   | 614 kB                          | 619 kB（持平，但拆分后可独立缓存）             |

### 直载页面（中位数）

|    场景    |  网络  |      before      |     after      |   变化   |
| :--------: | :----: | :--------------: | :------------: | :------: |
|  首页 LCP  |  本地  |      704 ms      |     684 ms     |  ≈ 持平  |
|  首页 LCP  | **4G** |   **1432 ms**    |   **600 ms**   | **−58%** |
|  首页传输  |   —    | 231 KB（JS 197） | 92 KB（JS 58） | **−60%** |
| 文章页 LCP |   4G   |     1680 ms      |    1724 ms     |  ≈ 持平  |

### SPA 导航（点击→就绪，4G）

| 场景        | before |       after       | 说明                                        |
| ----------- | :----: | :---------------: | ------------------------------------------- |
| 首页→文章   | 197 ms | 621 ms（+143 KB） | 会话内**首次**进入文章需下载 markdown chunk |
| 文章→下一篇 |  4 ms  |       7 ms        | chunk 已缓存，无差异                        |
| 画廊→图片   | 196 ms | 629 ms（+142 KB） | 同文章页                                    |

构建耗时基本持平（635 ms vs 639 ms）。

## 结论与取舍

- **收益集中在入口页**：站点的主要流量位于首页与各列表页，这类页面在 4G 环境下 LCP 由 1.4 s 降至 0.6 s，传输量减少 60%。
- **代价是会话内首次进入详情页增加 ~400 ms**（需下载 144 kB 的 markdown chunk）；同一会话内的后续导航无额外开销。文章页直载的总传输量与重构前基本持平。
- **附加收益**：`markdown` chunk 按内容哈希命名，可被浏览器长期缓存。后续更新文章时只需重新传输 159 kB 的 app chunk，marked / KaTeX / highlight.js 代码不再随文章变更而重新分发。

> [!tip] 进一步优化的方向
> 若要求首次进入文章的延迟也不劣化，可为 markdown chunk 添加 `<link rel="modulepreload">`，由入口页提前并行下载。代价是入口页增加一个 144 kB 的并行请求。当前维持入口页体积最小的策略，未启用。

上述测量方法可推广到其他涉及包结构或加载策略的重构：先以 `git worktree` 搭建对照组，再按静态产物、直载页面、站内导航三层采集指标，最后在模拟慢速网络上完整复测一轮。
