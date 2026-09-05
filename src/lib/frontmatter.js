/**
 * 迷你 YAML frontmatter 解析器（零依赖，覆盖 Obsidian 常用子集）。
 * 支持：
 *   key: value            标量（日期/数字/布尔/引号字符串）
 *   key: [a, b, c]        行内数组
 *   key:                  块级列表
 *     - a                   - item（可缩进多行）
 *     - b
 *   key:                  块级嵌套 map（一层，标量值）
 *     sub: value
 */

function parseScalar(v) {
  v = v.trim();
  if (!v) return "";
  if (
    (v.startsWith('"') && v.endsWith('"') && v.length >= 2) ||
    (v.startsWith("'") && v.endsWith("'") && v.length >= 2)
  ) {
    return v.slice(1, -1);
  }
  if (v === "true") return true;
  if (v === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v; // 日期（2025-09-04）等保持字符串
}

export function parseYamlSubset(text) {
  const meta = {};
  const lines = text.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      i++;
      continue;
    }
    const m = line.match(/^([^\s:#][^:]*):(.*)$/);
    if (!m) {
      i++;
      continue;
    }
    const key = m[1].trim();
    let rest = m[2].trim();
    // 行内注释（非引号字符串内）
    if (!/^["']/.test(rest)) rest = rest.replace(/\s+#.*$/, "").trim();

    if (rest === "") {
      // 块级列表 / 嵌套 map
      const items = [];
      const obj = {};
      let mode = null;
      let j = i + 1;
      while (j < lines.length) {
        const l = lines[j];
        if (!l.trim()) {
          j++;
          continue;
        }
        if (!/^\s/.test(l)) break; // 回到顶层，块结束
        if (l.trim().startsWith("- ")) {
          mode = "list";
          items.push(parseScalar(l.trim().slice(2)));
        } else {
          const km = l.trim().match(/^([^\s:#][^:]*):(.*)$/);
          if (km) {
            mode = "map";
            obj[km[1].trim()] = parseScalar(km[2].trim());
          }
        }
        j++;
      }
      meta[key] = mode === "list" ? items : mode === "map" ? obj : "";
      i = j;
    } else if (rest.startsWith("[") && rest.endsWith("]")) {
      meta[key] = rest
        .slice(1, -1)
        .split(",")
        .map((s) => parseScalar(s))
        .filter((s) => s !== "");
      i++;
    } else {
      meta[key] = parseScalar(rest);
      i++;
    }
  }
  return meta;
}

export function parseFrontmatter(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?/);
  if (!m) return { meta: {}, body: src };
  return { meta: parseYamlSubset(m[1]), body: src.slice(m[0].length) };
}
