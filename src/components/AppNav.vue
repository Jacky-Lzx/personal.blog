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
        <svg class="icon-moon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
        </svg>
        <svg class="icon-sun" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4"></circle>
          <path d="M12 2v2"></path>
          <path d="M12 20v2"></path>
          <path d="m4.93 4.93 1.41 1.41"></path>
          <path d="m17.66 17.66 1.41 1.41"></path>
          <path d="M2 12h2"></path>
          <path d="M20 12h2"></path>
          <path d="m6.34 17.66-1.41 1.41"></path>
          <path d="m19.07 4.93-1.41 1.41"></path>
        </svg>
      </button>
    </div>
  </nav>
</template>
