<script setup>
import { nextTick, onMounted } from "vue";
import { useHead } from "@unhead/vue";
import { useRoute, useRouter } from "vue-router";
import AppNav from "./components/AppNav.vue";
import Footer from "./components/Footer.vue";

const route = useRoute();
const router = useRouter();

/* 每页 title / description */
useHead(() => ({
  title: route.meta.title || "李泽玺的博客",
  meta: [{ name: "description", content: route.meta.description || "" }],
}));

/* 滚动进入视口渐显（同 personal.homepage 的 reveal.js） */
function applyReveal() {
  const els = document.querySelectorAll(".reveal:not(.visible)");
  if (!els.length) return;
  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("visible"));
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
    { threshold: 0.12 },
  );
  els.forEach((el) => observer.observe(el));
}

onMounted(applyReveal);
/* 路由切换后需等 DOM 更新完成再扫描 .reveal，否则新页面元素尚未挂载 */
router.afterEach(() => {
  nextTick(applyReveal);
});
</script>

<template>
  <div class="layout">
    <AppNav />
    <main class="main">
      <div class="container">
        <router-view />
      </div>
    </main>
    <Footer />
  </div>
</template>
