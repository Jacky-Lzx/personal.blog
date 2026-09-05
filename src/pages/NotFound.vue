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
      <span class="terminal-title">lzx@blog</span>
    </div>
    <div class="terminal-body">
      <p>
        <span class="t-prompt">❯</span>
        <span class="t-cmd">cat </span><span class="t-error">{{ route.path }}</span>
      </p>
      <p class="t-error">zsh: no such file or directory: {{ route.path }}</p>
      <p>
        <span class="t-prompt">❯</span>
        <RouterLink to="/"><span class="t-cmd">cd </span><span class="t-val">~/blog</span>&nbsp;<span class="t-comment"># 回博客首页</span></RouterLink>
      </p>
    </div>
  </div>
</template>
