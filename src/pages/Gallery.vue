<script setup>
import { computed } from "vue";
import { useHead } from "@unhead/vue";
import { useRoute } from "vue-router";
import { galleryItems, allGalleryTags, galleryByTag } from "../lib/gallery";

const route = useRoute();

/* 标签页是显式静态路由（/gallery/<tag>），从路径第二段取标签名 */
const tag = computed(() => {
  const seg = route.path.split("/").filter(Boolean);
  return seg.length === 2 ? decodeURIComponent(seg[1]) : null;
});

const items = computed(() =>
  tag.value ? galleryByTag(tag.value) : galleryItems
);

useHead(() => ({
  title: tag.value
    ? `画廊 #${tag.value} · 李泽玺的博客`
    : `画廊 · 李泽玺的博客`,
}));
</script>

<template>
  <section class="home-hero reveal">
    <!-- 注意：模板里跨行的「纯空白行」会被 Vue 编译器删除，
         需要空格的相邻 span 把空格写在 span 内部（如 " ls" / " #"） -->
    <p class="hero-line">
      <span class="t-prompt">❯</span>
      <span class="t-cmd">ls </span>
      <span class="t-key">gallery/</span>
      <span v-if="tag">
        <span class="t-key"> --tag</span> <span class="t-val">{{ tag }}</span>
      </span>
    </p>
    <h1>画廊</h1>
    <p class="hero-sub">
      图片 · 注释<span class="t-comment"> # 共 {{ items.length }} 张</span>
    </p>
  </section>

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
        <span class="t-cmd">ls</span>
        <span class="t-key"> -lt</span>
        <span> gallery/</span><span class="t-comment"> # {{ allGalleryTags.length }} tags</span>
      </p>
      <div class="chips gallery-chips">
        <RouterLink
          to="/gallery"
          class="chip hl-green"
          :class="{ active: !tag }"
        >
          all
        </RouterLink>
        <RouterLink
          v-for="t in allGalleryTags"
          :key="t.tag"
          :to="`/gallery/${encodeURIComponent(t.tag)}`"
          class="chip hl-mauve"
          :class="{ active: tag === t.tag }"
        >
          #{{ t.tag }} × {{ t.count }}
        </RouterLink>
      </div>

      <ul class="gallery-grid">
        <li v-for="i in items" :key="i.id" class="gallery-card">
          <RouterLink
            :to="`/gallery/image/${encodeURIComponent(i.id)}`"
            class="gallery-card-link"
          >
            <img :src="i.url" :alt="i.title" loading="lazy" />
            <span class="gallery-card-body">
              <span class="gallery-card-title">{{ i.title }}</span>
              <span class="gallery-card-meta">
                <span v-if="i.date" class="t-comment">{{ i.date }}</span>
                <span v-if="i.hasAnnotation" class="t-val" title="有注释"
                  >✎</span
                >
              </span>
            </span>
          </RouterLink>
        </li>
      </ul>
      <p v-if="!items.length" class="t-comment">-- no images found --</p>
      <p class="t-comment end-mark">-- end of list --</p>
    </div>
  </div>
</template>
