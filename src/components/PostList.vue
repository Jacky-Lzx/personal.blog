<script setup>
import { posts } from "../lib/posts";

const props = defineProps({
  /* 传入 tag 时只列出该标签下的文章 */
  tag: { type: String, default: null },
});

const list = props.tag
  ? posts.filter((p) => p.tags.includes(props.tag))
  : posts;
</script>

<template>
  <div class="terminal">
    <div class="terminal-bar">
      <span class="dot red"></span>
      <span class="dot yellow"></span>
      <span class="dot green"></span>
      <span class="terminal-title">lzx@blog</span>
    </div>
    <div class="terminal-body">
      <p class="cmd-line">
        <span class="t-prompt">❯</span>
        <span class="t-cmd">ls</span> <span class="t-key">-lt</span>
        <template v-if="tag">
          <span class="t-key">--tag</span> <span class="t-val">{{ tag }}</span>
        </template>
        <template v-else> posts/ </template>
        <span class="t-comment"># {{ list.length }} articles</span>
      </p>
      <ul class="post-list">
        <li v-for="p in list" :key="p.slug" class="post-row">
          <RouterLink :to="`/posts/${p.slug}`" class="post-date">{{
            p.date
          }}</RouterLink>
          <RouterLink :to="`/posts/${p.slug}`" class="post-title">{{
            p.title
          }}</RouterLink>
          <span class="post-tags">
            <RouterLink
              v-for="t in p.tags"
              :key="t"
              :to="`/tags/${encodeURIComponent(t)}`"
              class="chip hl-mauve post-tag"
              >#{{ t }}</RouterLink
            >
          </span>
        </li>
      </ul>
      <p v-if="!list.length" class="t-comment">-- no articles found --</p>
      <p class="t-comment end-mark">-- end of list --</p>
    </div>
  </div>
</template>
