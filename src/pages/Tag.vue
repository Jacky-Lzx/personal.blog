<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import PostList from "../components/PostList.vue";

const route = useRoute();
// 标签页是显式静态路由（/tags/:tag 非动态参数），从路径末段取标签名
const tag = computed(
  () =>
    decodeURIComponent(
      route.params.tag || route.path.split("/").filter(Boolean).pop() || ""
    )
);
</script>

<template>
  <section class="home-hero reveal">
    <h1><span class="tag-name">#{{ tag }}</span></h1>
    <p class="hero-sub"><span class="t-comment"># 该标签下的文章</span></p>
  </section>
  <section class="reveal">
    <PostList :tag="tag" />
  </section>
</template>
