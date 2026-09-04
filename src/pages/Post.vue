<script setup>
import { computed } from "vue";
import { useHead } from "@unhead/vue";
import { useRoute } from "vue-router";
import { posts } from "../lib/posts";
import NotFound from "./NotFound.vue";

const route = useRoute();
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
      <div class="terminal-body post-body" v-html="post.html"></div>
    </div>

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
