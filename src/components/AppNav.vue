<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const isLatte = ref(false);

function syncIcon() {
  isLatte.value = document.documentElement.dataset.theme === "latte";
}

function toggleTheme() {
  const root = document.documentElement;
  root.dataset.theme = root.dataset.theme === "latte" ? "mocha" : "latte";
  try {
    localStorage.setItem("theme", root.dataset.theme);
  } catch (e) {}
  syncIcon();
}

onMounted(syncIcon);
onBeforeUnmount(syncIcon);

const link = (path) => {
  if (!path) return false;
  if (path === "/") return route.path === "/";
  return route.path.startsWith(path);
};
</script>

<template>
  <nav class="nav">
    <div class="container nav-inner">
      <RouterLink to="/" class="logo" title="回到博客首页">
        <span class="prompt">❯</span> lzx@blog
      </RouterLink>
      <div class="nav-links">
        <RouterLink to="/" class="nav-link" :class="{ active: link('/') }">
          <span class="nav-ind"><span class="nav-num">1</span></span>文章
        </RouterLink>
        <RouterLink to="/tags" class="nav-link" :class="{ active: link('/tags') }">
          <span class="nav-ind"><span class="nav-num">2</span></span>标签
        </RouterLink>
        <a
          href="https://jacky-lzx.github.io"
          class="nav-link"
          target="_blank"
          rel="noopener"
        >
          <span class="nav-ind"><span class="nav-num">3</span></span>主页
          <span class="nav-ext" aria-hidden="true">↗</span>
        </a>
      </div>
      <button
        class="theme-toggle"
        :title="`切换主题（快捷键 t）：当前 ${isLatte ? 'Latte' : 'Mocha'}`"
        @click="toggleTheme"
      >
        <span v-if="isLatte">🥛</span><span v-else>☕</span>
      </button>
    </div>
  </nav>
</template>
