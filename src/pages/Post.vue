<script setup>
import { computed, nextTick, ref, watch } from "vue";
import { useHead } from "@unhead/vue";
import { useRoute, useRouter } from "vue-router";
import { posts } from "../lib/posts";
import NotFound from "./NotFound.vue";

const route = useRoute();
const router = useRouter();
const bodyRef = ref(null);

const post = computed(() => posts.find((p) => p.slug === route.params.slug));
const idx = computed(() => posts.findIndex((p) => p.slug === route.params.slug));

/* 文章页独立标题/描述（动态路由，无法在静态 routes 里写死） */
useHead(() =>
  post.value
    ? {
        title: `${post.value.title} · 李泽玺的博客`,
        meta: [{ name: "description", content: post.value.description }],
      }
    : {}
);
/* 列表按日期倒序：prev = 更新的，next = 更旧的 */
const newer = computed(() => posts[idx.value - 1]);
const older = computed(() => posts[idx.value + 1]);

/* v-html 中的站内链接（wikilink / 标签 / 嵌入卡片）走 SPA 路由，避免整页刷新 */
function onBodyClick(e) {
  const a = e.target.closest("a");
  if (!a) return;
  const href = a.getAttribute("href") || "";
  if (href.startsWith("#")) {
    // 标题锚点：同页跳转 + 更新 hash
    e.preventDefault();
    const el = document.getElementById(href.slice(1));
    if (el) {
      el.scrollIntoView();
      history.replaceState(null, "", href);
    }
    return;
  }
  if (!href.startsWith("/")) return; // 外链/协议链接交给浏览器
  e.preventDefault();
  const [path, hash] = href.split("#");
  router.push(path).then(() => {
    if (hash) {
      nextTick(() => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView();
      });
    }
  });
}

/* 给 h2/h3 追加锚点链接（客户端增强，SSG 产物中不出现）；
   文章间 SPA 导航时 post 变化，需重新注入 */
watch(
  () => post.value && post.value.slug,
  (slug) => {
    if (!slug) return;
    nextTick(() => {
      const body = bodyRef.value;
      if (!body) return;
      body.querySelectorAll("h2[id], h3[id]").forEach((h) => {
        if (h.querySelector(":scope > .anchor-link")) return;
        const a = document.createElement("a");
        a.className = "anchor-link";
        a.href = `#${h.id}`;
        a.textContent = "¶";
        a.setAttribute("aria-label", "跳转到本节");
        h.appendChild(a);
      });
    });
  },
  { immediate: true }
);
</script>

<template>
  <article v-if="post" class="post">
    <header class="post-head reveal">
      <h1 class="post-title-h1">{{ post.title }}</h1>
      <p class="post-meta">
        <span class="t-prompt">❯</span>
        <span class="t-cmd">stat</span> <span class="t-val">posts/{{ post.slug }}.md</span>
        <span class="t-comment">#</span>
        <span class="meta-item">date: <span class="t-key">{{ post.date }}</span></span>
        <span class="meta-item">read: <span class="t-key">~{{ post.readingTime }} min</span></span>
        <span v-if="post.tags.length" class="post-tags meta-item">
          <RouterLink
            v-for="t in post.tags"
            :key="t"
            :to="`/tags/${encodeURIComponent(t)}`"
            class="chip hl-mauve"
          >#{{ t }}</RouterLink>
        </span>
      </p>
    </header>

    <div class="terminal reveal">
      <div class="terminal-bar">
        <span class="dot red"></span>
        <span class="dot yellow"></span>
        <span class="dot green"></span>
        <span class="terminal-title">cat posts/{{ post.slug }}.md</span>
      </div>
      <div
        class="terminal-body post-body"
        ref="bodyRef"
        v-html="post.html"
        @click="onBodyClick"
      ></div>
    </div>

    <section
      v-if="post.backlinks.length"
      class="terminal backlinks reveal"
      aria-label="反向链接"
    >
      <div class="terminal-bar">
        <span class="dot red"></span>
        <span class="dot yellow"></span>
        <span class="dot green"></span>
        <span class="terminal-title">backlinks</span>
      </div>
      <div class="terminal-body">
        <p class="cmd-line">
          <span class="t-prompt">❯</span> <span class="t-cmd">grep</span> <span class="t-key">-rl</span> <span class="t-val">"[[{{ post.slug }}]]"</span> posts/ <span class="t-comment"># {{ post.backlinks.length }} references</span>
        </p>
        <ul class="backlink-list">
          <li v-for="b in post.backlinks" :key="b.slug" class="backlink-row">
            <RouterLink :to="`/posts/${b.slug}`" class="backlink-title">{{
              b.title
            }}</RouterLink>
            <span class="t-comment"># {{ b.date }}</span>
          </li>
        </ul>
      </div>
    </section>

    <nav class="post-nav reveal" aria-label="文章导航">
      <RouterLink v-if="newer" :to="`/posts/${newer.slug}`" class="post-nav-link">
        <span class="t-prompt">❯</span> <span class="t-key">cd</span> ../{{ newer.slug }}
        <span class="post-nav-title">{{ newer.title }}</span>
      </RouterLink>
      <span v-else></span>
      <RouterLink v-if="older" :to="`/posts/${older.slug}`" class="post-nav-link next">
        <span class="t-prompt">❯</span> <span class="t-key">cd</span> ../{{ older.slug }}
        <span class="post-nav-title">{{ older.title }}</span>
      </RouterLink>
    </nav>
  </article>

  <NotFound v-else />
</template>
