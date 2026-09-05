---
title: 随机计算的一点笔记
date: 2025-09-01
tags: [research, stochastic-computing]
description: 随机计算的基本思想：用脉冲流的密度表示数值。
---

一篇占位文章，用来测试 Markdown 渲染效果，之后会替换成正式内容。

## 基本概念

随机计算（Stochastic Computing）用**脉冲流的概率密度**来表示数值：一个周期内信号为 1 的比例就是它代表的数。

```text
数值 0.75  <->  脉冲流 1 1 0 1 1 0 1 1 ...（密度 3/4）
```

这样一来，算术运算可以映射到廉价的逻辑门：

| 运算 | 电路 |
| :---: | :---: |
| 乘法 | 单个 `AND` 门 |
| 加法 | `MUX`（按权重选择） |
| 减法 | `MUX` + 反相 |

## 待展开

- [ ] 精度与序列长度的关系
- [ ] 在神经网络加速器中的映射方式
- [ ] 与近似计算（Approximate Computing）的对比

```python
def random_bit_stream(value: float, n: int = 1024):
    """生成表示 value 的随机比特流（占位示例）"""
    import random
    return [1 if random.random() < value else 0 for _ in range(n)]
```

## Obsidian 语法演示

这篇仓库里的文章本身就是一个 Obsidian vault，以下语法在博客里都会生效：

> [!tip] 双向链接
> 在 Obsidian 里写 `[[你好，这是新的博客]]`，博客构建后就会变成真正的站内链接，
> 并且那篇笔记底部的 backlinks 面板会反过来列出本文。

- 双向链接：见 [[hello-blog|博客上线笔记]]
- 标题锚点：见 [[on-stochastic-circuits#基本概念|本文的「基本概念」小节]]
- 正文标签：#stochastic-computing

> [!warning]- 折叠的 callout
> 以 `-` 结尾的 callout 会渲染成可折叠的 `<details>`。
