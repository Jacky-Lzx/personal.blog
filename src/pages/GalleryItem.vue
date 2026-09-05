<script setup>
import { computed } from "vue";
import { useHead } from "@unhead/vue";
import { useRoute } from "vue-router";
import { galleryItems, galleryItemById } from "../lib/gallery";
import NotFound from "./NotFound.vue";

const route = useRoute();
const item = computed(() =>
  galleryItemById(decodeURIComponent(route.params.id))
);
const idx = computed(() =>
  item.value ? galleryItems.findIndex((i) => i.id === item.value.id) : -1
);
/* 列表按日期倒序：prev = 更新的，next = 更旧的（与文章页一致） */
const prev = computed(() => galleryItems[idx.value - 1]);
const next = computed(() => galleryItems[idx.value + 1]);

useHead(() =>
  item.value
    ? {
        title: `${item.value.title} · 画廊 · 李泽玺的博客`,
        meta: [
          { name: "description", content: item.value.description || "" },
        ],
      }
    : {}
);
</script>

<template>
  <article v-if="item">
    <header class="post-head reveal">
      <h1 class="post-title-h1">{{ item.title }}</h1>
      <p class="post-meta">
        <span class="t-prompt">❯</span>
        <span class="t-cmd"> cat</span>
        <span class="t-val"> gallery/{{ item.file }}</span>
        <template v-if="item.date || item.tags.length">
          <span class="t-comment"> #</span>
          <span v-if="item.date" class="meta-item">
            date: <span class="t-key">{{ item.date }}</span>
          </span>
        </template>
        <span v-if="item.tags.length" class="post-tags meta-item">
          <RouterLink
            v-for="t in item.tags"
            :key="t"
            :to="`/gallery/${encodeURIComponent(t)}`"
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
        <span class="terminal-title">gallery/{{ item.file }}</span>
      </div>
      <div class="terminal-body">
        <img class="gallery-full" :src="item.url" :alt="item.title" />
      </div>
    </div>

    <section
      v-if="item.hasAnnotation"
      class="terminal reveal"
      aria-label="图片注释"
    >
      <div class="terminal-bar">
        <span class="dot red"></span>
        <span class="dot yellow"></span>
        <span class="dot green"></span>
        <span class="terminal-title">annotation · {{ item.id }}.md</span>
      </div>
      <div class="terminal-body post-body" v-html="item.annotationHtml"></div>
    </section>
    <p v-else class="t-comment reveal" style="margin-top: 14px">
      # 暂无注释
    </p>

    <nav class="post-nav reveal" aria-label="图片导航">
      <RouterLink
        v-if="prev"
        :to="`/gallery/image/${encodeURIComponent(prev.id)}`"
        class="post-nav-link"
      >
        <span class="t-prompt">❯</span> <span class="t-key">cd</span> ../{{
          prev.file
        }}
        <span class="post-nav-title">{{ prev.title }}</span>
      </RouterLink>
      <span v-else></span>
      <RouterLink
        v-if="next"
        :to="`/gallery/image/${encodeURIComponent(next.id)}`"
        class="post-nav-link next"
      >
        <span class="t-prompt">❯</span> <span class="t-key">cd</span> ../{{
          next.file
        }}
        <span class="post-nav-title">{{ next.title }}</span>
      </RouterLink>
    </nav>
  </article>

  <NotFound v-else />
</template>
