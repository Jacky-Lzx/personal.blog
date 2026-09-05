<script setup>
import { onMounted } from "vue";
import { useHead } from "@unhead/vue";
import { useRoute } from "vue-router";
import AppNav from "./components/AppNav.vue";
import Footer from "./components/Footer.vue";

const route = useRoute();

/* 每页 title / description */
useHead(() => ({
  title: route.meta.title || "李泽玺的博客",
  meta: [{ name: "description", content: route.meta.description || "" }],
}));

/* 滚动进入视口渐显（同 personal.homepage 的 reveal.js）。
   必须是常驻监听：文章/画廊页正文经 Suspense 异步挂载（等待 markdown chunk），
   路由切换时的一次性扫描抓不到晚挂载的元素，它们会永远停在 opacity:0 */
function initReveal() {
  const revealAll = () =>
    document.querySelectorAll(".reveal:not(.visible)").forEach((el) => el.classList.add("visible"));

  const watchNew = (onNew) =>
    new MutationObserver(onNew).observe(document.body, { childList: true, subtree: true });

  if (!("IntersectionObserver" in window)) {
    revealAll();
    watchNew(revealAll);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    /* threshold 必须为 0：threshold 是相对元素自身高度的可见比例，
       长文的 .terminal 总高超过视口的 1/threshold 倍后就永远达不到阈值，
       会停在 opacity:0。0 = 任意像素进入视口即触发 */
    { threshold: 0 },
  );
  const observeAll = () =>
    document.querySelectorAll(".reveal:not(.visible)").forEach((el) => observer.observe(el));

  observeAll();
  /* 补抓晚挂载的 .reveal（Suspense 异步内容、路由切换） */
  watchNew(observeAll);
}

onMounted(initReveal);
</script>

<template>
  <div class="layout">
    <AppNav />
    <main class="main">
      <div class="container">
        <!-- 文章/画廊页的 setup 是 async（正文按需渲染），
             Vue 要求 async setup 组件必须位于 <Suspense> 内才会渲染；
             导航时 Suspense 还保留旧页内容直到新页就绪，避免白屏 -->
        <router-view v-slot="{ Component }">
          <Suspense>
            <component :is="Component" />
          </Suspense>
        </router-view>
      </div>
    </main>
    <Footer />
  </div>
</template>
