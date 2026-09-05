<script setup>
import { allTags } from "../lib/posts";
</script>

<template>
  <div class="terminal reveal">
    <div class="terminal-bar">
      <span class="dot red"></span>
      <span class="dot yellow"></span>
      <span class="dot green"></span>
      <span class="terminal-title">lzx@blog</span>
    </div>
    <div class="terminal-body">
      <p class="cmd-line">
        <span class="t-prompt">❯</span>
        <span class="t-cmd">tag</span> <span class="t-key">-l</span>
        <span class="t-comment"> # {{ allTags.length }} tags</span>
      </p>
      <ul class="tag-list">
        <li v-for="t in allTags" :key="t.tag">
          <RouterLink
            :to="`/tags/${encodeURIComponent(t.tag)}`"
            class="tag-link"
          >
            <span class="tag-name">#{{ t.tag }}</span>
            <span class="tag-count">× {{ t.count }}</span>
          </RouterLink>
        </li>
      </ul>
      <p class="t-comment end-mark">-- end of list --</p>
    </div>
  </div>
</template>
