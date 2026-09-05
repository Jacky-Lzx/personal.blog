#!/usr/bin/env node
/**
 * 生成 src/assets/lang-icons/icons.js：把同目录下所有 .svg 内联为
 * { 文件名(不含扩展名): svg 源码 } 的对象并导出。
 *
 * 为什么不用 Vite 原生的 `?raw` 导入：
 *   本项目 Vite 8（rolldown 内核）下 `import x from "a.svg?raw"` 直接
 *   UNRESOLVED_IMPORT，`import.meta.glob("...*.svg?raw")` 静默返回空对象。
 *   因此改用构建前生成的 JS 模块（与 wenkai_subset.py 的产物提交模式一致）。
 *
 * 新增/删除/修改图标后重新运行：
 *   node scripts/gen_lang_icons.mjs
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "assets", "lang-icons");
const out = join(dir, "icons.js");

const icons = {};
for (const file of readdirSync(dir).filter((f) => f.endsWith(".svg")).sort()) {
  const key = file.replace(/\.svg$/, "");
  icons[key] = readFileSync(join(dir, file), "utf8").trim();
}

writeFileSync(
  out,
  `/* 本文件由 scripts/gen_lang_icons.mjs 自动生成，请勿手动编辑 */\n` +
    `export const LANG_ICON_SVGS = ${JSON.stringify(icons, null, 2)};\n`
);

console.log(`已生成 ${out}（${Object.keys(icons).length} 个图标）`);
