<script setup>
import { useRoute } from "vue-router";
const route = useRoute();
</script>

<template>
  <div class="terminal reveal not-found">
    <div class="terminal-bar">
      <span class="dot red"></span>
      <span class="dot yellow"></span>
      <span class="dot green"></span>
      <span class="terminal-title">lzx@sjtu: ~/blog</span>
    </div>
    <div class="terminal-body">
      <p>
        <span class="t-prompt">❯</span> <span class="t-cmd">{{ route.path }}</span>
      </p>
      <p class="t-error">zsh: no such file or directory: {{ route.path }}</p>
      <p>
        <span class="t-prompt">❯</span>
        <RouterLink to="/" class="t-cmd">cd</RouterLink> <span class="t-val">~/blog</span>
        <span class="t-comment"># 回博客首页</span>
      </p>
    </div>
  </div>
</template>
